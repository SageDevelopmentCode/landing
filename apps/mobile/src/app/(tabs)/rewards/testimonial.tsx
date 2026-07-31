import { Brand, BottomTabInset, FontFamilies } from "@/constants/theme";
import { notifyDiscord, notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TestimonialScreen() {
  const router = useRouter();
  const { userId, effectiveParentId } = useAuth();
  const [testimonialText, setTestimonialText] = useState("");
  const [testimonialSubmitting, setTestimonialSubmitting] = useState(false);
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("your child");
  const [fullName, setFullName] = useState("");
  const [firstChildName, setFirstChildName] = useState("");

  useEffect(() => {
    if (!userId || !effectiveParentId) return;

    async function load() {
      try {
        const [userResult, studentsResult, testimonialResult] =
          await Promise.all([
            supabase
              .schema("admin")
              .from("users")
              .select("full_name")
              .eq("id", userId)
              .single(),
            supabase
              .schema("admin")
              .from("students")
              .select("child_legal_name")
              .eq("parent_id", effectiveParentId)
              .eq("is_deleted", false)
              .limit(1),
            supabase
              .schema("marketing")
              .from("testimonials")
              .select("id")
              .eq("parent_id", userId)
              .limit(1),
          ]);

        if (userResult.data?.full_name) {
          setFullName(userResult.data.full_name);
          setFirstName(userResult.data.full_name.split(" ")[0]);
        }
        const firstChild = studentsResult.data?.[0];
        if (firstChild?.child_legal_name) {
          setFirstChildName(firstChild.child_legal_name.split(" ")[0]);
        }
        if ((testimonialResult.data?.length ?? 0) > 0) {
          setTestimonialSubmitted(true);
        }
      } catch (e) {
        notifyError("rewards-testimonial-load", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId, effectiveParentId]);

  async function handleSubmitTestimonial() {
    const trimmed = testimonialText.trim();
    if (!trimmed) return;
    setTestimonialSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      const { error } = await supabase
        .schema("marketing")
        .from("testimonials")
        .insert({
          parent_id: userId,
          parent_name: fullName || firstName,
          parent_email: session?.user?.email ?? "",
          child_name: firstChildName,
          testimonial: trimmed,
        });

      if (error) throw error;

      setTestimonialSubmitted(true);
      setTestimonialText("");

      notifyDiscord({
        type: "testimonial_submitted",
        data: {
          parentName: fullName || firstName,
          parentEmail: session?.user?.email ?? "",
          childName: firstChildName,
          testimonial: trimmed,
        },
      });
    } catch (e) {
      notifyError("rewards-testimonial-submit", e);
    } finally {
      setTestimonialSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#1f2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Share Your Experience</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: BottomTabInset + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!loading && testimonialSubmitted ? (
            <View style={styles.successWrap}>
              <View style={styles.successIcon}>
                <Text style={{ fontSize: 28 }}>☕</Text>
              </View>
              <Text style={styles.successTitle}>Thank you so much!</Text>
              <Text style={styles.successBody}>
                We'll be in touch about your gift card soon.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.closeBtn,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => router.back()}
              >
                <Text style={styles.closeBtnTxt}>Go back</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.sheetHeader}>
                <Text style={{ fontSize: 32 }}>☕</Text>
                <Text style={styles.sheetTitle}>Share Your Experience</Text>
                <Text style={styles.sheetSubtitle}>
                  $15 Starbucks gift card — coffee on us
                </Text>
              </View>

              <Text style={styles.sheetIntro}>
                A few honest sentences from the heart is more than enough. Here
                are some prompts:
              </Text>

              <View style={styles.prompts}>
                {[
                  `What has ${firstChildName || "your child"} enjoyed most at Sage Field?`,
                  "How has the program impacted them or your family?",
                  "Is there a specific moment or experience that stood out?",
                  "Would you recommend Sage Field to another family, and why?",
                ].map((p, i) => (
                  <View key={i} style={styles.promptRow}>
                    <Text style={styles.promptBullet}>•</Text>
                    <Text style={styles.promptTxt}>{p}</Text>
                  </View>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Share your experience here…"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                value={testimonialText}
                onChangeText={setTestimonialText}
                textAlignVertical="top"
              />

              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  (!testimonialText.trim() || testimonialSubmitting) &&
                    styles.submitBtnDisabled,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={handleSubmitTestimonial}
                disabled={!testimonialText.trim() || testimonialSubmitting}
              >
                <Text style={styles.submitBtnTxt}>
                  {testimonialSubmitting
                    ? "Submitting…"
                    : "☕  Submit testimonial"}
                </Text>
              </Pressable>

              <Pressable
                style={{ alignItems: "center", marginTop: 4 }}
                onPress={() => router.back()}
              >
                <Text style={styles.maybeLater}>Maybe later</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#1f2937",
  },
  content: {
    padding: 20,
    gap: 16,
  },
  successWrap: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 60,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f5ede0",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 22,
    color: "#78350f",
  },
  successBody: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#92400e",
    textAlign: "center",
    lineHeight: 22,
  },
  closeBtn: {
    backgroundColor: "#f5ede0",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: "center",
    marginTop: 8,
  },
  closeBtnTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#a0784a",
  },
  sheetHeader: {
    alignItems: "center",
    gap: 4,
    paddingTop: 8,
  },
  sheetTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 20,
    color: "#78350f",
    marginTop: 8,
  },
  sheetSubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#92400e",
  },
  sheetIntro: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 20,
  },
  prompts: {
    gap: 6,
    backgroundColor: "#fdf8f3",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0e0cc",
    padding: 14,
  },
  promptRow: {
    flexDirection: "row",
    gap: 6,
  },
  promptBullet: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#a0784a",
    marginTop: 1,
  },
  promptTxt: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
    flex: 1,
    lineHeight: 19,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d6c9b8",
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#1f2937",
    backgroundColor: "#fff",
  },
  submitBtn: {
    backgroundColor: "#a0784a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#fff",
  },
  maybeLater: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
  },
});
