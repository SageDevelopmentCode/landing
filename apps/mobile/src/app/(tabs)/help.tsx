import { Brand } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { notifyError } from "@/lib/discord";
import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const AREAS = [
  "Home",
  "Feed",
  "Children",
  "Messages",
  "Calendar",
  "Attendance",
  "Forms & Docs",
  "Volunteer",
  "Emergency",
  "Tuition",
  "Other",
];

export default function HelpScreen() {
  const router = useRouter();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePickAttachment = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setAttachments((prev) => [...prev, ...result.assets]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError("Please describe what you need help with.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired — please log in again.");

      // 1. Insert help request
      const { data: helpRequest, error: insertError } = await supabase
        .schema("admin")
        .from("help_requests")
        .insert({
          parent_id: session.user.id,
          description: description.trim(),
          page_url: selectedArea ?? null,
        })
        .select("id")
        .single();

      if (insertError || !helpRequest) {
        throw new Error(
          insertError?.message ?? "Failed to create help request.",
        );
      }

      // 2. Upload attachments (non-fatal)
      let uploadedCount = 0;
      for (const asset of attachments) {
        try {
          const timestamp = Date.now();
          const compressed = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 1280 } }],
            { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
          );
          const storagePath = `${session.user.id}/${helpRequest.id}/${timestamp}-attachment.jpg`;

          const response = await fetch(compressed.uri);
          const blob = await response.blob();

          const { error: uploadError } = await supabase.storage
            .from("help-request-attachments")
            .upload(storagePath, blob, {
              contentType: "image/jpeg",
              upsert: false,
            });

          if (!uploadError) uploadedCount += 1;
        } catch (e) {
          notifyError('parent-help-attachment-upload', e);
        }
      }

      // 3. Fetch parent profile for Discord embed
      const { data: profile } = await supabase
        .schema("admin")
        .from("users")
        .select("full_name, email")
        .eq("id", session.user.id)
        .single();

      // 4. Discord notification (non-fatal)
      try {
        await fetch("https://sagefield.co/api/notify/discord", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            type: "help_request",
            data: {
              parentName: profile?.full_name ?? "Unknown",
              parentEmail: profile?.email ?? session.user.email ?? "Unknown",
              description: description.trim(),
              helpRequestId: helpRequest.id,
              screenName: selectedArea ?? null,
              attachmentCount: uploadedCount,
            },
          }),
        });
      } catch {
        // Non-fatal
      }

      setIsSuccess(true);
    } catch (err) {
      notifyError('parent-help-form-submit', err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={56} color={Brand.sage700} />
        <Text style={styles.successTitle}>Message sent!</Text>
        <Text style={styles.successBody}>
          We'll review your request and reach out soon.
        </Text>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => {
            setIsSuccess(false);
            setDescription("");
            setSelectedArea(null);
            setAttachments([]);
            setError(null);
          }}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Need Help?</Text>
        <Text style={styles.subheading}>
          Describe your issue and we'll get back to you.
        </Text>

        {/* Area picker */}
        <Text style={styles.label}>
          Where did you run into the issue?{" "}
          <Text style={styles.optional}>(optional)</Text>
        </Text>
        <View style={styles.chips}>
          {AREAS.map((area) => {
            const selected = selectedArea === area;
            return (
              <TouchableOpacity
                key={area}
                onPress={() => setSelectedArea(selected ? null : area)}
                disabled={isSubmitting}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text
                  style={[styles.chipText, selected && styles.chipTextSelected]}
                >
                  {area}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Description */}
        <Text style={[styles.label, { marginTop: 20 }]}>
          What's the issue? <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          placeholder="Describe what you're experiencing or what you need help with..."
          placeholderTextColor="#9ca3af"
          editable={!isSubmitting}
          maxLength={2000}
          style={styles.textInput}
        />

        {/* Attachments */}
        <Text style={styles.label}>
          Attachments <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TouchableOpacity
          onPress={handlePickAttachment}
          disabled={isSubmitting}
          style={styles.attachPicker}
        >
          <Ionicons name="attach-outline" size={20} color="#6b7280" />
          <Text style={styles.attachPickerText}>Add photos or files</Text>
          <Text style={styles.attachPickerSub}>PNG, JPG, PDF supported</Text>
        </TouchableOpacity>

        {attachments.map((asset, i) => (
          <View key={i} style={styles.attachPill}>
            <Text style={styles.attachName} numberOfLines={1}>
              {asset.fileName ?? `attachment_${i + 1}`}
            </Text>
            <TouchableOpacity
              onPress={() => handleRemoveAttachment(i)}
              disabled={isSubmitting}
            >
              <Ionicons name="close-outline" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Error */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting || !description.trim()}
          style={[
            styles.submitButton,
            (isSubmitting || !description.trim()) &&
              styles.submitButtonDisabled,
          ]}
        >
          {isSubmitting && <ActivityIndicator size="small" color="#fff" />}
          <Text style={styles.submitButtonText}>
            {isSubmitting ? "Sending..." : "Send Request"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 24,
    paddingTop: 80,
    paddingBottom: 48,
  },
  heading: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 22,
    color: "#1f2937",
    marginBottom: 4,
  },
  subheading: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
  },
  label: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
  },
  optional: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#9ca3af",
  },
  required: {
    color: "#ef4444",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F2F7F3",
  },
  chipSelected: {
    backgroundColor: Brand.sage700,
  },
  chipText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#4b5563",
  },
  chipTextSelected: {
    color: "#ffffff",
  },
  textInput: {
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: "top",
    color: "#1f2937",
    marginBottom: 20,
  },
  attachPicker: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  attachPickerText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#374151",
  },
  attachPickerSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#9ca3af",
  },
  attachPill: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    marginBottom: 6,
  },
  attachName: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#374151",
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    color: "#dc2626",
    fontSize: 13,
    marginBottom: 12,
    marginTop: 4,
  },
  submitButton: {
    marginTop: 8,
    paddingVertical: 14,
    backgroundColor: Brand.sage700,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#a5b4fc",
  },
  submitButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#ffffff",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#fff",
  },
  successTitle: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 20,
    color: "#1f2937",
    marginTop: 16,
    marginBottom: 8,
  },
  successBody: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 32,
  },
  doneButton: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    backgroundColor: Brand.sage700,
    borderRadius: 8,
  },
  doneButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#ffffff",
  },
});
