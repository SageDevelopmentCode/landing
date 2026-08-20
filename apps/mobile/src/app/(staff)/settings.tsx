import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { notifyError } from "@/lib/discord";
import { getAppUpdateInfo } from "@/lib/app-update-info";
import { Brand } from "@/constants/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const updateInfo = getAppUpdateInfo();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  function handleDeleteAccount() {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account. Your employment and school records will be retained by the school for compliance purposes.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Continue", style: "destructive", onPress: confirmDelete },
      ]
    );
  }

  function confirmDelete() {
    Alert.alert(
      "Are you sure?",
      "This action cannot be undone. You will be signed out immediately and will not be able to log back in.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: executeDelete,
        },
      ]
    );
  }

  async function executeDelete() {
    setDeleting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("No active session");

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Failed to delete account");
      }

      await supabase.auth.signOut();
      router.replace("/");
    } catch (err: any) {
      notifyError('staff-delete-account', err);
      setDeleting(false);
      Alert.alert(
        "Something went wrong",
        err.message ?? "Please try again or contact support.",
        [{ text: "OK" }]
      );
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color="#1f2937" />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>

        <Pressable
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          onPress={handleSignOut}
        >
          <View style={styles.rowIconWrap}>
            <Ionicons name="log-out-outline" size={20} color={Brand.sage700} />
          </View>
          <Text style={styles.rowLabel}>Sign Out</Text>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          onPress={handleDeleteAccount}
          disabled={deleting}
        >
          <View style={[styles.rowIconWrap, styles.rowIconDanger]}>
            {deleting ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <Ionicons name="trash-outline" size={20} color="#dc2626" />
            )}
          </View>
          <Text style={[styles.rowLabel, styles.rowLabelDanger]}>
            {deleting ? "Deleting account…" : "Delete Account"}
          </Text>
          {!deleting && (
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          )}
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>App Info</Text>
        <View style={styles.infoBlock}>
          <InfoRow label="App version" value={updateInfo.nativeAppVersion ?? "—"} />
          <InfoRow label="Build" value={updateInfo.nativeBuildVersion ?? "—"} />
          <InfoRow label="Runtime" value={String(updateInfo.runtimeVersion ?? "—")} />
          <InfoRow label="Update channel" value={updateInfo.channel ?? "—"} />
          <InfoRow
            label="OTA update ID"
            value={updateInfo.updateId ? updateInfo.updateId.slice(0, 8) + "…" : "embedded"}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 17,
    color: "#1f2937",
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
  },
  sectionLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#F2F7F3",
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconDanger: {
    backgroundColor: "#fef2f2",
  },
  rowLabel: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: "#1f2937",
  },
  rowLabelDanger: {
    color: "#dc2626",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e7eb",
    marginLeft: 62,
  },
  infoBlock: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  infoLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#6b7280",
  },
  infoValue: {
    flexShrink: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#1f2937",
    textAlign: "right",
  },
});
