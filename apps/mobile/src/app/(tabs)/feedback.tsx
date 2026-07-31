import { BottomTabInset, Brand } from "@/constants/theme";
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const CATEGORIES = [
  "Home & Dashboard",
  "My Children",
  "Tuition & Billing",
  "Messages",
  "Calendar",
  "News Feed",
  "Enrollment",
  "Forms & Documents",
  "Volunteer",
  "Emergency Contacts",
  "Navigation & Layout",
  "Other",
];

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export default function FeedbackScreen() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [allowFollowUp, setAllowFollowUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  async function handleSubmit() {
    if (rating === 0 || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired — please log in again.");

      const { data: feedback, error: insertError } = await supabase
        .schema("admin")
        .from("parent_feedback")
        .insert({
          parent_id: session.user.id,
          rating,
          categories,
          message: message.trim() || null,
          allow_follow_up: allowFollowUp,
        })
        .select("id")
        .single();

      if (insertError || !feedback) {
        throw new Error(insertError?.message ?? "Failed to save feedback.");
      }

      const { data: profile } = await supabase
        .schema("admin")
        .from("users")
        .select("full_name, email")
        .eq("id", session.user.id)
        .single();

      try {
        await fetch("https://sagefield.co/api/notify/discord", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            type: "parent_feedback",
            data: {
              parentName: profile?.full_name ?? "Unknown",
              parentEmail: profile?.email ?? session.user.email ?? "Unknown",
              rating,
              categories,
              message: message.trim() || null,
              allowFollowUp,
              feedbackId: feedback.id,
            },
          }),
        });
      } catch {
        // Non-fatal
      }

      setIsSuccess(true);
    } catch (err) {
      notifyError("parent-feedback-submit", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={56} color={Brand.sage700} />
        <Text style={styles.successTitle}>Thank you!</Text>
        <Text style={styles.successBody}>
          Your feedback means a lot to us. We'll use it to keep making Sage
          Field better for every family.
        </Text>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => router.back()}
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
        <Text style={styles.heading}>Share Your Feedback</Text>

        <View style={styles.blurb}>
          <Text style={styles.blurbText}>
            Sage Field is still growing, and your experience matters to us. A
            few minutes of honest feedback helps us build something every family
            loves.
          </Text>
        </View>

        {/* Star rating */}
        <Text style={styles.label}>
          Overall, how's your experience so far?
        </Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)} hitSlop={4}>
              <Text style={[styles.star, n <= rating && styles.starActive]}>
                ★
              </Text>
            </Pressable>
          ))}
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
          )}
        </View>

        {/* Category pills */}
        <Text style={[styles.label, { marginTop: 20 }]}>
          What area does your feedback relate to?{" "}
          <Text style={styles.optional}>(optional)</Text>
        </Text>
        <View style={styles.pills}>
          {CATEGORIES.map((cat) => {
            const active = categories.includes(cat);
            return (
              <Pressable
                key={cat}
                onPress={() => toggleCategory(cat)}
                disabled={isSubmitting}
                style={[styles.pill, active && styles.pillActive]}
              >
                <Text
                  style={[styles.pillText, active && styles.pillTextActive]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Message */}
        <Text style={[styles.label, { marginTop: 20 }]}>
          Tell us more <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          placeholder="What's working well? What could be better?"
          placeholderTextColor="#9ca3af"
          maxLength={2000}
          editable={!isSubmitting}
          style={styles.textInput}
        />

        {/* Follow-up toggle */}
        <Pressable
          onPress={() => setAllowFollowUp((v) => !v)}
          disabled={isSubmitting}
          style={styles.followUpRow}
        >
          <View
            style={[styles.checkbox, allowFollowUp && styles.checkboxActive]}
          >
            {allowFollowUp && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.followUpText}>
            You're welcome to follow up with me about my feedback
          </Text>
        </Pressable>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          style={[
            styles.submitButton,
            (rating === 0 || isSubmitting) && styles.submitButtonDisabled,
          ]}
        >
          {isSubmitting && <ActivityIndicator size="small" color="#fff" />}
          <Text style={styles.submitButtonText}>
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.laterButton}
        >
          <Text style={styles.laterText}>Maybe Later</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 24,
    paddingTop: 80,
    paddingBottom: BottomTabInset + 32,
  },
  heading: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 22,
    color: "#1f2937",
    marginBottom: 16,
  },
  blurb: {
    backgroundColor: `${Brand.sage700}14`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  blurbText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Brand.sage700,
    lineHeight: 20,
  },
  label: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#374151",
    marginBottom: 10,
  },
  optional: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#9ca3af",
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  star: {
    fontSize: 34,
    color: "#d1d5db",
  },
  starActive: {
    color: Brand.sage700,
  },
  ratingLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#9ca3af",
    marginLeft: 4,
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "transparent",
  },
  pillActive: {
    backgroundColor: Brand.sage700,
    borderColor: Brand.sage700,
  },
  pillText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#4b5563",
  },
  pillTextActive: {
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
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
    marginBottom: 20,
  },
  followUpRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 28,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#d1d5db",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxActive: {
    borderColor: Brand.sage700,
    backgroundColor: Brand.sage700,
  },
  checkmark: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },
  followUpText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    color: "#dc2626",
    fontSize: 13,
    marginBottom: 12,
    marginTop: 4,
  },
  submitButton: {
    paddingVertical: 14,
    backgroundColor: Brand.sage700,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  laterButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  laterText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#9ca3af",
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
    lineHeight: 22,
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
    color: "#fff",
  },
});
