import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { Brand, FontFamilies } from "@/constants/theme";

export default function StaffNotificationsScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function fetchCount() {
      const { data } = await supabase.functions.invoke("send-custom-notification", {
        body: { count_only: true },
      });
      setRecipientCount(data?.count ?? 0);
    }
    fetchCount();
  }, []);

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      Alert.alert("Missing fields", "Please enter both a title and a message.");
      return;
    }

    Alert.alert(
      "Send Notification",
      `This will send a push notification to ${recipientCount ?? "all"} parent${recipientCount !== 1 ? "s" : ""}. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          style: "destructive",
          onPress: async () => {
            setSending(true);
            const { data, error } = await supabase.functions.invoke(
              "send-custom-notification",
              { body: { title: title.trim(), body: body.trim() } },
            );
            setSending(false);
            if (error) {
              Alert.alert("Error", error.message ?? "Failed to send notification.");
              return;
            }
            Alert.alert(
              "Sent",
              `Notification delivered to ${data?.sent ?? 0} parent${(data?.sent ?? 0) !== 1 ? "s" : ""}.`,
              [{ text: "OK", onPress: () => { setTitle(""); setBody(""); } }],
            );
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Brand.sage700} />
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>

          <Text style={styles.title}>Notify Parents</Text>
          <Text style={styles.subtitle}>
            Send a push notification to all enrolled parents.
          </Text>

          <View style={styles.recipientRow}>
            <Ionicons name="people-outline" size={16} color="#6b7280" />
            <Text style={styles.recipientText}>
              {recipientCount === null
                ? "Loading recipient count…"
                : `${recipientCount} parent${recipientCount !== 1 ? "s" : ""} with notifications enabled`}
            </Text>
          </View>

          <Text style={styles.fieldLabel}>Notification Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. School Closure Tomorrow"
            placeholderTextColor="#9ca3af"
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
            maxLength={100}
          />

          <Text style={styles.fieldLabel}>Message</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Write your message here…"
            placeholderTextColor="#9ca3af"
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{body.length}/500</Text>

          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              (pressed || sending) && styles.sendButtonPressed,
            ]}
            onPress={handleSend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send-outline" size={18} color="#fff" />
                <Text style={styles.sendLabel}>Send Notification</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  back: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 2,
  },
  backLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: Brand.sage700,
  },
  title: {
    fontFamily: FontFamilies.heading,
    fontSize: 28,
    color: "#1f2937",
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },
  recipientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F2F7F3",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 28,
  },
  recipientText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#4b5563",
  },
  fieldLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: "#1f2937",
    backgroundColor: "#fafafa",
    marginBottom: 20,
  },
  inputMultiline: {
    height: 130,
    marginBottom: 4,
  },
  charCount: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "right",
    marginBottom: 28,
  },
  sendButton: {
    backgroundColor: Brand.sage700,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sendButtonPressed: { opacity: 0.75 },
  sendLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#fff",
  },
});
