import { Brand } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { notifyDiscord, notifyError } from "@/lib/discord";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HELP_AREAS = [
  "Classroom assistance",
  "Outdoor building & maintenance",
  "Gardening",
  "Childcare & supervision",
  "Event planning & setup",
  "Fundraising",
  "Administrative support",
  "Other",
];

const AVAILABILITY_OPTIONS = [
  "Weekday mornings",
  "Weekday afternoons",
  "Weekends",
  "Flexible / as needed",
];

function CheckboxRow({
  label,
  checked,
  onToggle,
  disabled,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      style={styles.checkboxRow}
    >
      <Ionicons
        name={checked ? "checkbox" : "square-outline"}
        size={22}
        color={checked ? Brand.sage700 : "#9ca3af"}
      />
      <Text style={[styles.checkboxLabel, checked && styles.checkboxLabelChecked]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function VolunteerScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [skills, setSkills] = useState("");
  const [helpAreas, setHelpAreas] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toggleItem = (
    list: string[],
    setList: (v: string[]) => void,
    item: string,
  ) => {
    setList(
      list.includes(item) ? list.filter((x) => x !== item) : [...list, item],
    );
  };

  const resetForm = () => {
    setSkills("");
    setHelpAreas([]);
    setAvailability([]);
    setNotes("");
    setErrors({});
    setSubmitError(null);
    setSuccess(false);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!skills.trim()) e.skills = "Please describe your skills or experience.";
    if (helpAreas.length === 0) e.helpAreas = "Please select at least one area.";
    if (availability.length === 0) e.availability = "Please select at least one time slot.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setErrors({});

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired — please log in again.");

      const { error } = await supabase
        .schema("admin")
        .from("volunteer_interests")
        .insert({
          parent_id: session.user.id,
          skills: skills.trim(),
          help_areas: helpAreas,
          availability,
          notes: notes.trim() || null,
        });

      if (error) throw new Error(error.message);

      // Fetch parent name for Discord notification (non-fatal)
      const { data: profile } = await supabase
        .schema("admin")
        .from("users")
        .select("full_name")
        .eq("id", session.user.id)
        .single();

      notifyDiscord({
        type: "volunteer_interest",
        data: {
          parentName: profile?.full_name ?? session.user.email ?? "Unknown",
          skills: skills.trim(),
          helpAreas,
          availability,
          notes: notes.trim() || undefined,
        },
      });

      setSuccess(true);
      setTimeout(() => {
        closeModal();
      }, 2000);
    } catch (err) {
      notifyError('volunteer-form-submit', err);
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.iconBadge}>
            <Ionicons name="heart" size={28} color={Brand.sage700} />
          </View>
          <Text style={styles.cardHeading}>No openings right now</Text>
          <Text style={styles.cardBody}>
            We'll notify you as soon as a volunteer opportunity becomes
            available. Thank you for your willingness to get involved!
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="heart-outline" size={18} color="#fff" />
            <Text style={styles.ctaButtonText}>
              Express Interest in Volunteering
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Express Interest</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          {success ? (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={56} color={Brand.sage700} />
              <Text style={styles.successTitle}>Thank you!</Text>
              <Text style={styles.successBody}>
                We'll be in touch soon about volunteer opportunities.
              </Text>
            </View>
          ) : (
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <ScrollView
                contentContainerStyle={styles.formScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Global submit error */}
                {submitError && (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={16} color="#dc2626" />
                    <Text style={styles.errorBannerText}>{submitError}</Text>
                  </View>
                )}

                {/* Skills & Experience */}
                <Text style={styles.label}>
                  Skills & Experience <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  value={skills}
                  onChangeText={(v) => {
                    setSkills(v);
                    if (errors.skills) setErrors((e) => ({ ...e, skills: "" }));
                  }}
                  multiline
                  numberOfLines={4}
                  placeholder="Describe any relevant skills or experience you have"
                  placeholderTextColor="#9ca3af"
                  editable={!isSubmitting}
                  maxLength={2000}
                  style={[
                    styles.textInput,
                    !!errors.skills && styles.textInputError,
                  ]}
                />
                {!!errors.skills && (
                  <Text style={styles.fieldError}>{errors.skills}</Text>
                )}

                {/* How You'd Like to Help */}
                <Text style={[styles.label, { marginTop: 4 }]}>
                  How You'd Like to Help <Text style={styles.required}>*</Text>
                </Text>
                {HELP_AREAS.map((area) => (
                  <CheckboxRow
                    key={area}
                    label={area}
                    checked={helpAreas.includes(area)}
                    onToggle={() =>
                      toggleItem(helpAreas, setHelpAreas, area)
                    }
                    disabled={isSubmitting}
                  />
                ))}
                {!!errors.helpAreas && (
                  <Text style={styles.fieldError}>{errors.helpAreas}</Text>
                )}

                {/* Time Availability */}
                <Text style={[styles.label, { marginTop: 20 }]}>
                  Time Availability <Text style={styles.required}>*</Text>
                </Text>
                {AVAILABILITY_OPTIONS.map((option) => (
                  <CheckboxRow
                    key={option}
                    label={option}
                    checked={availability.includes(option)}
                    onToggle={() =>
                      toggleItem(availability, setAvailability, option)
                    }
                    disabled={isSubmitting}
                  />
                ))}
                {!!errors.availability && (
                  <Text style={styles.fieldError}>{errors.availability}</Text>
                )}

                {/* Additional Notes */}
                <Text style={[styles.label, { marginTop: 20 }]}>
                  Additional Notes{" "}
                  <Text style={styles.optional}>(optional)</Text>
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  placeholder="Anything else you'd like us to know?"
                  placeholderTextColor="#9ca3af"
                  editable={!isSubmitting}
                  maxLength={2000}
                  style={styles.textInput}
                />

                {/* Submit */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  style={[
                    styles.submitButton,
                    isSubmitting && styles.submitButtonDisabled,
                  ]}
                >
                  {isSubmitting && (
                    <ActivityIndicator size="small" color="#fff" />
                  )}
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? "Submitting…" : "Submit"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Brand.welcomeBg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f0faf4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  cardHeading: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 20,
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 12,
  },
  cardBody: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Brand.sage700,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
  },
  ctaButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#ffffff",
  },
  // Modal
  modalSafeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 18,
    color: "#1f2937",
  },
  closeButton: {
    padding: 4,
  },
  formScroll: {
    padding: 20,
    paddingBottom: 48,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#dc2626",
    flex: 1,
  },
  label: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
  },
  required: {
    color: "#ef4444",
  },
  optional: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#9ca3af",
  },
  textInput: {
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
    color: "#1f2937",
    marginBottom: 4,
  },
  textInputError: {
    borderColor: "#f87171",
  },
  fieldError: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#dc2626",
    marginBottom: 12,
    marginTop: 2,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  checkboxLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#4b5563",
    flex: 1,
  },
  checkboxLabelChecked: {
    color: "#1f2937",
    fontFamily: "Poppins_600SemiBold",
  },
  submitButton: {
    marginTop: 12,
    paddingVertical: 14,
    backgroundColor: Brand.sage700,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  submitButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#ffffff",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  successTitle: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 22,
    color: "#1f2937",
    marginTop: 16,
    marginBottom: 8,
  },
  successBody: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});
