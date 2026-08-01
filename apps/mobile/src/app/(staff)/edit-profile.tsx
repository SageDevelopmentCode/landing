import { Brand, FontFamilies } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Types ─────────────────────────────────────────────────────────────────────

interface QualRow {
  id: string;
  icon: string;
  text: string;
  sort_order: number;
  _pending?: boolean; // temp rows not yet saved
}

interface ExpRow {
  id: string;
  role: string;
  place: string;
  period: string;
  is_current: boolean;
  detail: string | null;
  sort_order: number;
  _pending?: boolean;
}

// ── Icon options for qualifications ──────────────────────────────────────────

const QUAL_ICONS: Array<{ name: string; label: string }> = [
  { name: "school-outline", label: "Education" },
  { name: "medkit-outline", label: "Health" },
  { name: "leaf-outline", label: "Nature" },
  { name: "heart-outline", label: "Wellness" },
  { name: "ribbon-outline", label: "Award" },
  { name: "book-outline", label: "Training" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { teacherId } = useLocalSearchParams<{ teacherId: string }>();

  // ── State ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(""); // display-only
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [quote, setQuote] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [gradeRange, setGradeRange] = useState("");
  const [qualifications, setQualifications] = useState<QualRow[]>([]);
  const [experience, setExperience] = useState<ExpRow[]>([]);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!teacherId) return;
    async function loadProfile() {
      const [userRes, profileRes, qualsRes, expRes] = await Promise.all([
        supabase
          .schema("admin")
          .from("users")
          .select("full_name, profile_image_url")
          .eq("id", teacherId)
          .single(),
        supabase
          .schema("teachers")
          .from("teacher_profiles")
          .select("bio, quote, years_experience, grade_range")
          .eq("user_id", teacherId)
          .single(),
        supabase
          .schema("teachers")
          .from("teacher_qualifications")
          .select("id, icon, text, sort_order")
          .eq("user_id", teacherId)
          .eq("is_deleted", false)
          .order("sort_order"),
        supabase
          .schema("teachers")
          .from("teacher_experience")
          .select("id, role, place, period, is_current, detail, sort_order")
          .eq("user_id", teacherId)
          .eq("is_deleted", false)
          .order("sort_order"),
      ]);

      if (userRes.data) {
        setFullName(userRes.data.full_name ?? "");
        setProfileImageUrl(userRes.data.profile_image_url ?? null);
      }
      if (profileRes.data) {
        setBio(profileRes.data.bio ?? "");
        setQuote(profileRes.data.quote ?? "");
        setYearsExp(profileRes.data.years_experience ?? "");
        setGradeRange(profileRes.data.grade_range ?? "");
      }
      if (qualsRes.data) setQualifications(qualsRes.data);
      if (expRes.data) setExperience(expRes.data);
      setLoading(false);
    }
    loadProfile();
  }, [teacherId]);

  // ── Save bio + quote ──────────────────────────────────────────────────────
  async function handleSave() {
    if (!teacherId) return;
    setSaving(true);
    await supabase
      .schema("teachers")
      .from("teacher_profiles")
      .upsert(
        { user_id: teacherId, bio, quote, years_experience: yearsExp || null, grade_range: gradeRange || null },
        { onConflict: "user_id" }
      );
    setSaving(false);
    router.replace({
      pathname: "/(staff)/teacher/[teacherId]",
      params: { teacherId, teacherName: fullName },
    });
  }

  // ── Qualifications ────────────────────────────────────────────────────────
  function addQualification() {
    const tempId = `_new_${Date.now()}`;
    setQualifications((prev) => [
      ...prev,
      { id: tempId, icon: "school-outline", text: "", sort_order: prev.length, _pending: true },
    ]);
  }

  function updatePendingQual(id: string, field: "text" | "icon", value: string) {
    setQualifications((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  }

  async function confirmQual(q: QualRow) {
    if (!q.text.trim()) {
      setQualifications((prev) => prev.filter((x) => x.id !== q.id));
      return;
    }
    const { data } = await supabase
      .schema("teachers")
      .from("teacher_qualifications")
      .insert({ user_id: teacherId, icon: q.icon, text: q.text.trim(), sort_order: q.sort_order })
      .select("id, icon, text, sort_order")
      .single();
    if (data) {
      setQualifications((prev) => prev.map((x) => (x.id === q.id ? data : x)));
    }
  }

  async function deleteQual(q: QualRow) {
    if (q._pending) {
      setQualifications((prev) => prev.filter((x) => x.id !== q.id));
      return;
    }
    setQualifications((prev) => prev.filter((x) => x.id !== q.id));
    await supabase
      .schema("teachers")
      .from("teacher_qualifications")
      .update({ is_deleted: true })
      .eq("id", q.id);
  }

  // ── Experience ────────────────────────────────────────────────────────────
  function addExperience() {
    const tempId = `_new_${Date.now()}`;
    setExperience((prev) => [
      ...prev,
      { id: tempId, role: "", place: "", period: "", is_current: false, detail: null, sort_order: prev.length, _pending: true },
    ]);
  }

  function updatePendingExp(id: string, field: keyof ExpRow, value: string | boolean) {
    setExperience((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  }

  async function confirmExp(e: ExpRow) {
    if (!e.role.trim() || !e.place.trim() || !e.period.trim()) {
      setExperience((prev) => prev.filter((x) => x.id !== e.id));
      return;
    }
    const { data } = await supabase
      .schema("teachers")
      .from("teacher_experience")
      .insert({
        user_id: teacherId,
        role: e.role.trim(),
        place: e.place.trim(),
        period: e.period.trim(),
        is_current: e.is_current,
        detail: e.detail?.trim() || null,
        sort_order: e.sort_order,
      })
      .select("id, role, place, period, is_current, detail, sort_order")
      .single();
    if (data) {
      setExperience((prev) => prev.map((x) => (x.id === e.id ? data : x)));
    }
  }

  async function deleteExp(e: ExpRow) {
    if (e._pending) {
      setExperience((prev) => prev.filter((x) => x.id !== e.id));
      return;
    }
    setExperience((prev) => prev.filter((x) => x.id !== e.id));
    await supabase
      .schema("teachers")
      .from("teacher_experience")
      .update({ is_deleted: true })
      .eq("id", e.id);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Brand.sage700} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={20} color={Brand.sage700} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit Profile</Text>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          activeOpacity={0.8}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Avatar ──────────────────────────────────────────────────────── */}
        <View style={styles.avatarSection}>
          <TouchableOpacity activeOpacity={0.85} style={styles.avatarWrapper}>
            <View style={styles.avatarRing}>
              {profileImageUrl ? (
                <Image
                  source={{ uri: profileImageUrl }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.avatarInitials}>{getInitials(fullName) || "?"}</Text>
              )}
            </View>
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color="#ffffff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarName}>{fullName}</Text>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        {/* ── About ───────────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell families about your teaching philosophy…"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          <View style={[styles.fieldGroup, { marginTop: 16 }]}>
            <Text style={styles.fieldLabel}>Personal Quote</Text>
            <TextInput
              style={styles.textInput}
              value={quote}
              onChangeText={setQuote}
              placeholder="A quote that inspires you…"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.statsFieldRow}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Years Exp.</Text>
              <TextInput
                style={styles.textInput}
                value={yearsExp}
                onChangeText={setYearsExp}
                placeholder="e.g. 5+"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Grade Range</Text>
              <TextInput
                style={styles.textInput}
                value={gradeRange}
                onChangeText={setGradeRange}
                placeholder="e.g. K–6"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
        </View>

        {/* ── Qualifications ──────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Qualifications</Text>

          {qualifications.length > 0 && (
            <View style={styles.listContainer}>
              {qualifications.map((q) =>
                q._pending ? (
                  <View key={q.id} style={styles.pendingRow}>
                    {/* Icon picker */}
                    <View style={styles.iconPickerRow}>
                      {QUAL_ICONS.map((opt) => (
                        <TouchableOpacity
                          key={opt.name}
                          style={[
                            styles.iconOption,
                            q.icon === opt.name && styles.iconOptionActive,
                          ]}
                          onPress={() => updatePendingQual(q.id, "icon", opt.name)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={opt.name as any}
                            size={18}
                            color={q.icon === opt.name ? "#ffffff" : Brand.sage700}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextInput
                      style={styles.pendingInput}
                      value={q.text}
                      onChangeText={(v) => updatePendingQual(q.id, "text", v)}
                      placeholder="e.g. B.S. Early Childhood Education"
                      placeholderTextColor="#9ca3af"
                      autoFocus
                    />
                    <View style={styles.pendingActions}>
                      <TouchableOpacity
                        style={styles.confirmBtn}
                        onPress={() => confirmQual(q)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.confirmBtnText}>Add</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => deleteQual(q)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View key={q.id} style={styles.listRow}>
                    <View style={styles.listIconBox}>
                      <Ionicons name={q.icon as any} size={16} color={Brand.sage700} />
                    </View>
                    <Text style={styles.listItemText} numberOfLines={2}>{q.text}</Text>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => deleteQual(q)}
                      activeOpacity={0.7}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                )
              )}
            </View>
          )}

          <TouchableOpacity style={styles.addRow} onPress={addQualification} activeOpacity={0.7}>
            <Ionicons name="add-circle-outline" size={18} color={Brand.sage700} />
            <Text style={styles.addRowText}>Add Qualification</Text>
          </TouchableOpacity>
        </View>

        {/* ── Experience ──────────────────────────────────────────────────── */}
        <View style={[styles.card, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>Experience</Text>

          {experience.length > 0 && (
            <View style={styles.listContainer}>
              {experience.map((e) =>
                e._pending ? (
                  <View key={e.id} style={styles.pendingRow}>
                    <TextInput
                      style={styles.pendingInput}
                      value={e.role}
                      onChangeText={(v) => updatePendingExp(e.id, "role", v)}
                      placeholder="Role / Title"
                      placeholderTextColor="#9ca3af"
                      autoFocus
                    />
                    <TextInput
                      style={[styles.pendingInput, { marginTop: 8 }]}
                      value={e.place}
                      onChangeText={(v) => updatePendingExp(e.id, "place", v)}
                      placeholder="School / Organization"
                      placeholderTextColor="#9ca3af"
                    />
                    <TextInput
                      style={[styles.pendingInput, { marginTop: 8 }]}
                      value={e.period}
                      onChangeText={(v) => updatePendingExp(e.id, "period", v)}
                      placeholder="e.g. 2022 – Present"
                      placeholderTextColor="#9ca3af"
                    />
                    <View style={styles.currentToggleRow}>
                      <Text style={styles.currentToggleLabel}>Current position</Text>
                      <Switch
                        value={e.is_current}
                        onValueChange={(v) => updatePendingExp(e.id, "is_current", v)}
                        trackColor={{ true: Brand.sage700, false: "#e5e7eb" }}
                        thumbColor="#ffffff"
                      />
                    </View>
                    <View style={styles.pendingActions}>
                      <TouchableOpacity
                        style={styles.confirmBtn}
                        onPress={() => confirmExp(e)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.confirmBtnText}>Add</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => deleteExp(e)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View key={e.id} style={styles.expRow}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.expRole}>{e.role}</Text>
                      <Text style={styles.expPlace}>{e.place}</Text>
                      <Text style={styles.expPeriod}>{e.period}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => deleteExp(e)}
                      activeOpacity={0.7}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                )
              )}
            </View>
          )}

          <TouchableOpacity style={styles.addRow} onPress={addExperience} activeOpacity={0.7}>
            <Ionicons name="add-circle-outline" size={18} color={Brand.sage700} />
            <Text style={styles.addRowText}>Add Experience</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 17,
    color: "#1f2937",
  },
  saveBtn: {
    backgroundColor: Brand.sage700,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#ffffff",
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 16,
  },

  // ── Avatar ─────────────────────────────────────────────────────────────────
  avatarSection: {
    alignItems: "center",
    marginBottom: 8,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 8,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#E0EDE2",
    borderWidth: 4,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarInitials: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 32,
    color: Brand.sage700,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Brand.sage700,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  avatarName: {
    fontFamily: FontFamilies.heading,
    fontSize: 17,
    color: "#1f2937",
    marginBottom: 2,
  },
  avatarHint: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },

  // ── Card ───────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 18,
  },
  sectionTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 15,
    color: "#1f2937",
    marginBottom: 14,
  },

  // ── Fields ─────────────────────────────────────────────────────────────────
  statsFieldRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
  },
  textInput: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#1f2937",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    backgroundColor: "#fafafa",
  },
  textArea: {
    minHeight: 110,
    paddingTop: 11,
  },

  // ── List rows ──────────────────────────────────────────────────────────────
  listContainer: {
    gap: 10,
    marginBottom: 14,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  listIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(94,124,104,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  listItemText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  deleteBtn: {
    padding: 4,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  addRowText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
  },

  // ── Pending (add) forms ────────────────────────────────────────────────────
  pendingRow: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C8DFCB",
    padding: 12,
    gap: 0,
  },
  iconPickerRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  iconOption: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(94,124,104,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconOptionActive: {
    backgroundColor: Brand.sage700,
  },
  pendingInput: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#1f2937",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#ffffff",
  },
  currentToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  currentToggleLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#374151",
  },
  pendingActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: Brand.sage700,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  confirmBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#ffffff",
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  cancelBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#6b7280",
  },

  // ── Experience rows ────────────────────────────────────────────────────────
  expRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  expRole: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#1f2937",
  },
  expPlace: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#4b5563",
  },
  expPeriod: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
});
