import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { supabase } from "@/lib/supabase";
import { notifyDiscord, notifyError } from "@/lib/discord";
import { Brand, BottomTabInset, FontFamilies } from "@/constants/theme";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import {
  buildDisplayNameMap,
  getStudentDisplayName,
} from "@/lib/student-display-name";

// ─── Types ────────────────────────────────────────────────────────────────────

type CareActivity = "sunscreen" | "bug_spray";

type CareLogEntry = {
  id: string;
  activity: CareActivity;
  logged_at: string;
  notes: string | null;
};

type CareLogStudentRow = {
  student_id: string;
  name: string | null;
  grade: string | null;
  profile_image_url: string | null;
  entries: CareLogEntry[];
};

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  "#c2714f",
  "#8b6f47",
  "#a07850",
  "#7a9e7e",
  "#c4846b",
  "#b08d57",
  "#5E7C68",
  "#c27c47",
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColor(studentId: string): string {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = studentId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getInitialWeekday(): string {
  const d = new Date();
  const dow = d.getDay();
  if (dow === 6) d.setDate(d.getDate() - 1);
  if (dow === 0) d.setDate(d.getDate() + 1);
  return toYMD(d);
}

function isToday(dateStr: string): boolean {
  return dateStr === toYMD(new Date());
}

function prevWeekday(dateStr: string): string {
  const [y, m, day] = dateStr.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  d.setDate(d.getDate() - 1);
  if (d.getDay() === 0) d.setDate(d.getDate() - 2);
  if (d.getDay() === 6) d.setDate(d.getDate() - 1);
  return toYMD(d);
}

function nextWeekday(dateStr: string): string {
  const [y, m, day] = dateStr.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  d.setDate(d.getDate() + 1);
  if (d.getDay() === 6) d.setDate(d.getDate() + 2);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return toYMD(d);
}

function formatDateLabel(dateStr: string): string {
  const [y, m, day] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function buildMonthCells(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: lastDay }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatTime12h(isoStr: string): string {
  const d = new Date(isoStr);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m} ${ampm}`;
}

const DOW_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchCareLogData(date: string): Promise<CareLogStudentRow[]> {
  const [studentsRes, appsRes, entriesRes] = await Promise.all([
    supabase
      .schema("admin")
      .from("students")
      .select("id, child_legal_name, child_grade, profile_image_url")
      .eq("is_deleted", false)
      .order("child_legal_name", { ascending: true }),
    supabase
      .schema("parent_app")
      .from("applications")
      .select("student_id, admin_tags, preferred_name, child_legal_name")
      .eq("status", "enrolled"),
    supabase
      .schema("care_log")
      .from("entries")
      .select("id, student_id, activity, logged_at, notes")
      .eq("date", date)
      .order("logged_at", { ascending: true }),
  ]);

  type StudentRaw = { id: string; child_legal_name: string | null; child_grade: string | null; profile_image_url: string | null };
  type AppRaw = {
    student_id: string;
    admin_tags: string[] | null;
    preferred_name: string | null;
    child_legal_name: string | null;
  };
  type EntryRaw = { id: string; student_id: string; activity: string; logged_at: string; notes: string | null };

  const appsData = (appsRes.data ?? []) as AppRaw[];
  const displayNameMap = buildDisplayNameMap(appsData);
  const enrolledIds = new Set(
    appsData
      .filter((a) => !(a.admin_tags ?? []).includes("Don't Include"))
      .map((a) => a.student_id)
  );

  const entriesByStudent = new Map<string, CareLogEntry[]>();
  for (const e of (entriesRes.data ?? []) as EntryRaw[]) {
    const bucket = entriesByStudent.get(e.student_id) ?? [];
    bucket.push({ id: e.id, activity: e.activity as CareActivity, logged_at: e.logged_at, notes: e.notes });
    entriesByStudent.set(e.student_id, bucket);
  }

  return ((studentsRes.data ?? []) as StudentRaw[])
    .filter((s) => enrolledIds.has(s.id))
    .map((s) => ({
      student_id: s.id,
      name:
        displayNameMap.get(s.id) ??
        getStudentDisplayName(null, s.child_legal_name),
      grade: s.child_grade,
      profile_image_url: s.profile_image_url,
      entries: entriesByStudent.get(s.id) ?? [],
    }));
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CareLogScreen() {
  const [date, setDate] = useState<string>(getInitialWeekday);
  const [mode, setMode] = useState<"batch" | "individual">("batch");
  const [students, setStudents] = useState<CareLogStudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivities, setSelectedActivities] = useState<Set<CareActivity>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [savingBatch, setSavingBatch] = useState(false);
  const [savingIndividual, setSavingIndividual] = useState<Record<string, CareActivity | null>>({});
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [teacherName, setTeacherName] = useState<string | null>(null);

  const calendarSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase
        .schema("admin")
        .from("users")
        .select("full_name")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data) setTeacherName((data as { full_name: string | null }).full_name);
        });
    });
  }, []);

  const loadDate = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const rows = await fetchCareLogData(d);
      setStudents(rows);
    } catch (err) {
      notifyError("care_log_fetch", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDate(date);
    }, [date, loadDate])
  );

  const changeDate = (newDate: string) => {
    setDate(newDate);
    setSelectedActivities(new Set());
    setSelectedIds(new Set());
    setExpandedId(null);
    setSearch("");
  };

  const switchMode = (m: "batch" | "individual") => {
    setMode(m);
    setSelectedActivities(new Set());
    setSelectedIds(new Set());
    setExpandedId(null);
  };

  const toggleActivity = (act: CareActivity) => {
    setSelectedActivities((prev) => {
      const next = new Set(prev);
      next.has(act) ? next.delete(act) : next.add(act);
      return next;
    });
  };

  const toggleStudent = (id: string) => {
    if (selectedActivities.size === 0) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filtered.map((s) => s.student_id)));
  };

  const clearAll = () => setSelectedIds(new Set());

  const handleBatchSubmit = async () => {
    if (selectedActivities.size === 0 || selectedIds.size === 0) return;
    setSavingBatch(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const rows = [...selectedIds].flatMap((sid) =>
        [...selectedActivities].map((act) => ({
          student_id: sid,
          activity: act,
          date,
          logged_by: session.user.id,
          notes: null,
        }))
      );
      const { data, error } = await supabase
        .schema("care_log")
        .from("entries")
        .insert(rows)
        .select("id, student_id, activity, logged_at, notes");
      if (error) throw error;

      type InsertedEntry = { id: string; student_id: string; activity: string; logged_at: string; notes: string | null };
      const inserted = (data ?? []) as InsertedEntry[];
      setStudents((prev) =>
        prev.map((s) => {
          const newEntries = inserted
            .filter((e) => e.student_id === s.student_id)
            .map((e) => ({ id: e.id, activity: e.activity as CareActivity, logged_at: e.logged_at, notes: e.notes }));
          return newEntries.length > 0 ? { ...s, entries: [...s.entries, ...newEntries] } : s;
        })
      );

      const studentNames = students
        .filter((s) => selectedIds.has(s.student_id))
        .map((s) => s.name ?? "Unknown");
      for (const act of selectedActivities) {
        notifyDiscord({
          type: "care_log_activity",
          data: { teacherName, studentNames, activity: act, date },
        });
      }

      setSelectedIds(new Set());
      setSelectedActivities(new Set());
    } catch (err) {
      notifyError("care_log_batch", err);
    } finally {
      setSavingBatch(false);
    }
  };

  const handleIndividualLog = async (studentId: string, activity: CareActivity) => {
    setSavingIndividual((prev) => ({ ...prev, [studentId]: activity }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data, error } = await supabase
        .schema("care_log")
        .from("entries")
        .insert({ student_id: studentId, activity, date, logged_by: session.user.id, notes: null })
        .select("id, activity, logged_at, notes")
        .single();
      if (error) throw error;

      type NewEntry = { id: string; activity: string; logged_at: string; notes: string | null };
      const e = data as NewEntry;
      const newEntry: CareLogEntry = { id: e.id, activity: e.activity as CareActivity, logged_at: e.logged_at, notes: e.notes };
      setStudents((prev) =>
        prev.map((s) =>
          s.student_id === studentId ? { ...s, entries: [...s.entries, newEntry] } : s
        )
      );

      const studentName = students.find((s) => s.student_id === studentId)?.name ?? "Unknown";
      notifyDiscord({
        type: "care_log_activity",
        data: { teacherName, studentNames: [studentName], activity, date },
      });
    } catch (err) {
      notifyError("care_log_individual", err);
    } finally {
      setSavingIndividual((prev) => ({ ...prev, [studentId]: null }));
    }
  };

  const openCalendar = () => {
    const [y, m] = date.split("-").map(Number);
    setCalendarYear(y);
    setCalendarMonth(m - 1);
    calendarSheetRef.current?.present();
  };

  const selectCalendarDay = (day: number) => {
    const dow = new Date(calendarYear, calendarMonth, day).getDay();
    if (dow === 0 || dow === 6) return;
    const selected = toYMD(new Date(calendarYear, calendarMonth, day));
    calendarSheetRef.current?.dismiss();
    changeDate(selected);
  };

  const totalEntries = students.reduce((sum, s) => sum + s.entries.length, 0);

  const filtered = students.filter((s) => {
    if (!search) return true;
    return (s.name ?? "").toLowerCase().includes(search.toLowerCase());
  });

  // ─── Student card (batch mode) ───────────────────────────────────────────

  const renderBatchCard = ({ item: s }: { item: CareLogStudentRow }) => {
    const selected = selectedIds.has(s.student_id);
    return (
      <TouchableOpacity
        style={[styles.card, styles.cardRow, selected && styles.cardSelected]}
        activeOpacity={0.75}
        onPress={() => toggleStudent(s.student_id)}
        disabled={selectedActivities.size === 0}
      >
        <View style={styles.cardLeft}>
          {s.profile_image_url ? (
            <Image source={{ uri: s.profile_image_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: avatarColor(s.student_id) }]}>
              <Text style={styles.avatarText}>{s.name ? getInitials(s.name) : "?"}</Text>
            </View>
          )}
          <View style={styles.cardInfo}>
            <Text style={styles.studentName}>{s.name ?? "—"}</Text>
            {s.grade ? <Text style={styles.studentGrade}>{s.grade}</Text> : null}
          </View>
        </View>
        <View style={styles.cardRight}>
          {s.entries.length > 0 && (
            <View style={styles.entryBadge}>
              <Text style={styles.entryBadgeText}>{s.entries.length}×</Text>
            </View>
          )}
          <View
            style={[
              styles.checkbox,
              selected && styles.checkboxSelected,
              selectedActivities.size === 0 && styles.checkboxDisabled,
            ]}
          >
            {selected && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Student card (individual mode) ──────────────────────────────────────

  const renderIndividualCard = ({ item: s }: { item: CareLogStudentRow }) => {
    const expanded = expandedId === s.student_id;
    const saving = savingIndividual[s.student_id];
    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardRow}
          activeOpacity={0.75}
          onPress={() => setExpandedId(expanded ? null : s.student_id)}
        >
          <View style={styles.cardLeft}>
            {s.profile_image_url ? (
              <Image source={{ uri: s.profile_image_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: avatarColor(s.student_id) }]}>
                <Text style={styles.avatarText}>{s.name ? getInitials(s.name) : "?"}</Text>
              </View>
            )}
            <View style={styles.cardInfo}>
              <Text style={styles.studentName}>{s.name ?? "—"}</Text>
              {s.grade ? <Text style={styles.studentGrade}>{s.grade}</Text> : null}
            </View>
          </View>
          <View style={styles.cardRight}>
            {s.entries.length > 0 && (
              <View style={styles.entryBadge}>
                <Text style={styles.entryBadgeText}>{s.entries.length}×</Text>
              </View>
            )}
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={18}
              color="#9ca3af"
            />
          </View>
        </TouchableOpacity>

        {expanded && (
          <View style={styles.expandedPanel}>
            {s.entries.length === 0 ? (
              <Text style={styles.emptyEntries}>No entries logged for this date yet.</Text>
            ) : (
              s.entries.map((e) => (
                <View key={e.id} style={styles.entryRow}>
                  <Text style={styles.entryIcon}>{e.activity === "sunscreen" ? "🧴" : "🦟"}</Text>
                  <Text style={styles.entryLabel}>
                    {e.activity === "sunscreen" ? "Sunscreen" : "Bug Spray"}
                  </Text>
                  <Text style={styles.entryTime}>{formatTime12h(e.logged_at)}</Text>
                </View>
              ))
            )}
            <View style={styles.quickLogRow}>
              <TouchableOpacity
                style={[styles.quickLogBtn, saving === "sunscreen" && styles.quickLogBtnDisabled]}
                activeOpacity={0.75}
                disabled={!!saving}
                onPress={() => handleIndividualLog(s.student_id, "sunscreen")}
              >
                {saving === "sunscreen" ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.quickLogBtnText}>🧴 Sunscreen</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickLogBtn, saving === "bug_spray" && styles.quickLogBtnDisabled]}
                activeOpacity={0.75}
                disabled={!!saving}
                onPress={() => handleIndividualLog(s.student_id, "bug_spray")}
              >
                {saving === "bug_spray" ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.quickLogBtnText}>🦟 Bug Spray</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  // ─── Calendar cells ───────────────────────────────────────────────────────

  const calendarCells = buildMonthCells(calendarYear, calendarMonth);
  const [selY, selM, selD] = date.split("-").map(Number);
  const todayYMD = toYMD(new Date());
  const [todY, todM, todD] = todayYMD.split("-").map(Number);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <FlatList
        data={filtered}
        keyExtractor={(s) => s.student_id}
        renderItem={mode === "batch" ? renderBatchCard : renderIndividualCard}
        contentContainerStyle={{ paddingBottom: BottomTabInset + (mode === "batch" && selectedIds.size > 0 ? 120 : 0) + 16 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Care Log</Text>
              <Text style={styles.headerSub}>
                {totalEntries} {totalEntries === 1 ? "application" : "applications"} logged today
              </Text>
            </View>

            {/* Date navigation */}
            <View style={styles.dateNav}>
              <TouchableOpacity style={styles.dateArrow} onPress={() => changeDate(prevWeekday(date))}>
                <Ionicons name="chevron-back" size={22} color={Brand.sage700} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateLabelWrap} onPress={openCalendar}>
                <Text style={styles.dateLabel}>{formatDateLabel(date)}</Text>
                {isToday(date) && (
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>Today</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateArrow} onPress={() => changeDate(nextWeekday(date))}>
                <Ionicons name="chevron-forward" size={22} color={Brand.sage700} />
              </TouchableOpacity>
            </View>
            {!isToday(date) && (
              <TouchableOpacity style={styles.jumpToday} onPress={() => changeDate(getInitialWeekday())}>
                <Text style={styles.jumpTodayText}>Jump to Today</Text>
              </TouchableOpacity>
            )}

            {/* Search */}
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={16} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search students…"
                placeholderTextColor="#9ca3af"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={16} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            {/* Mode toggle */}
            <View style={styles.modeToggle}>
              {(["batch", "individual"] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                  onPress={() => switchMode(m)}
                >
                  <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
                    {m === "batch" ? "Batch Log" : "Individual"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Batch: activity selector */}
            {mode === "batch" && (
              <View>
                <View style={styles.activityRow}>
                  {(["sunscreen", "bug_spray"] as const).map((act) => (
                    <TouchableOpacity
                      key={act}
                      style={[styles.activityBtn, selectedActivities.has(act) && styles.activityBtnActive]}
                      onPress={() => toggleActivity(act)}
                    >
                      <Text style={styles.activityBtnIcon}>{act === "sunscreen" ? "🧴" : "🦟"}</Text>
                      <Text style={[styles.activityBtnText, selectedActivities.has(act) && styles.activityBtnTextActive]}>
                        {act === "sunscreen" ? "Sunscreen" : "Bug Spray"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {selectedActivities.size > 0 && (
                  <View style={styles.selectAllRow}>
                    <TouchableOpacity onPress={selectAll}>
                      <Text style={styles.selectAllText}>Select all</Text>
                    </TouchableOpacity>
                    <Text style={styles.selectSep}>·</Text>
                    <TouchableOpacity onPress={clearAll}>
                      <Text style={styles.selectAllText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Skeleton */}
            {loading && (
              <View style={styles.skeletonWrap}>
                {[...Array(5)].map((_, i) => (
                  <SkeletonBox key={i} width="100%" height={68} borderRadius={12} />
                ))}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No students found.</Text>
            </View>
          ) : null
        }
      />

      {/* Sticky batch submit button */}
      {mode === "batch" && selectedActivities.size > 0 && selectedIds.size > 0 && (
        <TouchableOpacity
          style={[styles.submitBtn, savingBatch && styles.submitBtnDisabled]}
          activeOpacity={0.8}
          disabled={savingBatch}
          onPress={handleBatchSubmit}
        >
          {savingBatch ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>
              Log {
                selectedActivities.has("sunscreen") && selectedActivities.has("bug_spray")
                  ? "Both"
                  : selectedActivities.has("sunscreen") ? "Sunscreen" : "Bug Spray"
              } for {selectedIds.size}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Calendar bottom sheet */}
      <BottomSheetModal
        ref={calendarSheetRef}
        snapPoints={["55%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
        )}
      >
        <BottomSheetView style={styles.calSheet}>
          <View style={styles.calHeader}>
            <TouchableOpacity
              onPress={() => {
                if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear((y) => y - 1); }
                else setCalendarMonth((m) => m - 1);
              }}
            >
              <Ionicons name="chevron-back" size={22} color={Brand.sage700} />
            </TouchableOpacity>
            <Text style={styles.calMonthLabel}>
              {MONTH_NAMES[calendarMonth]} {calendarYear}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear((y) => y + 1); }
                else setCalendarMonth((m) => m + 1);
              }}
            >
              <Ionicons name="chevron-forward" size={22} color={Brand.sage700} />
            </TouchableOpacity>
          </View>

          {/* Day-of-week headers */}
          <View style={styles.calDowRow}>
            {DOW_LABELS.map((d, i) => (
              <Text key={i} style={[styles.calDowLabel, (i === 0 || i === 6) && styles.calDowWeekend]}>
                {d}
              </Text>
            ))}
          </View>

          {/* Day cells */}
          <View style={styles.calGrid}>
            {calendarCells.map((day, idx) => {
              if (!day) return <View key={idx} style={styles.calCell} />;
              const dow = new Date(calendarYear, calendarMonth, day).getDay();
              const isWeekend = dow === 0 || dow === 6;
              const isSelected =
                calendarYear === selY && calendarMonth === selM - 1 && day === selD;
              const isTodayCell =
                calendarYear === todY && calendarMonth === todM - 1 && day === todD;
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.calCell}
                  disabled={isWeekend}
                  onPress={() => selectCalendarDay(day)}
                >
                  <View
                    style={[
                      styles.calDayInner,
                      isSelected && styles.calDaySelected,
                      isTodayCell && !isSelected && styles.calDayToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calDayText,
                        isWeekend && styles.calDayWeekend,
                        isSelected && styles.calDayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                  {isTodayCell && !isSelected && <View style={styles.calTodayDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },

  // Header
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  headerTitle: { fontFamily: FontFamilies.heading, fontSize: 24, color: Brand.sage700 },
  headerSub: { fontFamily: FontFamilies.body, fontSize: 13, color: "#6b7280", marginTop: 2 },

  // Date nav
  dateNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8, paddingVertical: 12 },
  dateArrow: { padding: 8 },
  dateLabelWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  dateLabel: { fontFamily: FontFamilies.bodySemiBold, fontSize: 15, color: "#1f2937" },
  todayBadge: { backgroundColor: Brand.sage700 + "20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  todayBadgeText: { fontFamily: FontFamilies.body, fontSize: 11, color: Brand.sage700 },
  jumpToday: { alignItems: "center", marginBottom: 4 },
  jumpTodayText: { fontFamily: FontFamilies.body, fontSize: 12, color: Brand.sage700 },

  // Search
  searchWrap: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 12, backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontFamily: FontFamilies.body, fontSize: 14, color: "#1f2937" },

  // Mode toggle
  modeToggle: { flexDirection: "row", marginHorizontal: 16, marginBottom: 12, borderRadius: 10, backgroundColor: "#f3f4f6", padding: 4 },
  modeBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  modeBtnActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  modeBtnText: { fontFamily: FontFamilies.body, fontSize: 13, color: "#6b7280" },
  modeBtnTextActive: { fontFamily: FontFamilies.bodySemiBold, color: Brand.sage700 },

  // Activity pills
  activityRow: { flexDirection: "row", marginHorizontal: 16, gap: 10, marginBottom: 8 },
  activityBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: "#d1d5db", borderRadius: 12, paddingVertical: 12 },
  activityBtnActive: { backgroundColor: Brand.sage700, borderColor: Brand.sage700 },
  activityBtnIcon: { fontSize: 18 },
  activityBtnText: { fontFamily: FontFamilies.bodySemiBold, fontSize: 14, color: "#374151" },
  activityBtnTextActive: { color: "#fff" },
  selectAllRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 8 },
  selectAllText: { fontFamily: FontFamilies.body, fontSize: 12, color: Brand.sage700 },
  selectSep: { color: "#9ca3af", fontSize: 12 },

  // Skeleton
  skeletonWrap: { paddingHorizontal: 16, gap: 8, marginTop: 8 },

  // Cards
  card: { marginHorizontal: 16, marginBottom: 8, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", overflow: "hidden" },
  cardSelected: { borderColor: Brand.sage700, backgroundColor: Brand.sage700 + "08" },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12 },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  cardRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardInfo: { flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: FontFamilies.bodySemiBold, fontSize: 14, color: "#fff" },
  studentName: { fontFamily: FontFamilies.bodySemiBold, fontSize: 14, color: "#1f2937" },
  studentGrade: { fontFamily: FontFamilies.body, fontSize: 12, color: "#6b7280", marginTop: 1 },
  entryBadge: { backgroundColor: Brand.sage700 + "20", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  entryBadgeText: { fontFamily: FontFamilies.bodySemiBold, fontSize: 11, color: Brand.sage700 },

  // Checkbox
  checkbox: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: "#d1d5db", alignItems: "center", justifyContent: "center" },
  checkboxSelected: { backgroundColor: Brand.sage700, borderColor: Brand.sage700 },
  checkboxDisabled: { opacity: 0.35 },

  // Expanded panel
  expandedPanel: { backgroundColor: "#f9fafb", borderTopWidth: 1, borderTopColor: "#e5e7eb", padding: 12, gap: 6 },
  emptyEntries: { fontFamily: FontFamilies.body, fontSize: 13, color: "#9ca3af", textAlign: "center", paddingVertical: 4 },
  entryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  entryIcon: { fontSize: 16 },
  entryLabel: { fontFamily: FontFamilies.body, fontSize: 13, color: "#374151", flex: 1 },
  entryTime: { fontFamily: FontFamilies.body, fontSize: 12, color: "#9ca3af" },
  quickLogRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  quickLogBtn: { flex: 1, backgroundColor: Brand.sage700, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  quickLogBtnDisabled: { opacity: 0.6 },
  quickLogBtnText: { fontFamily: FontFamilies.bodySemiBold, fontSize: 13, color: "#fff" },

  // Submit button
  submitBtn: { position: "absolute", bottom: BottomTabInset + 12, left: 16, right: 16, backgroundColor: Brand.sage700, borderRadius: 16, paddingVertical: 16, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontFamily: FontFamilies.bodySemiBold, fontSize: 15, color: "#fff" },

  // Empty state
  emptyState: { alignItems: "center", paddingTop: 40 },
  emptyStateText: { fontFamily: FontFamilies.body, fontSize: 14, color: "#9ca3af" },

  // Calendar sheet
  calSheet: { flex: 1, paddingHorizontal: 16, paddingBottom: 24 },
  calHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16, marginTop: 4 },
  calMonthLabel: { fontFamily: FontFamilies.bodySemiBold, fontSize: 16, color: "#1f2937" },
  calDowRow: { flexDirection: "row", marginBottom: 8 },
  calDowLabel: { flex: 1, textAlign: "center", fontFamily: FontFamilies.body, fontSize: 12, color: "#6b7280" },
  calDowWeekend: { color: "#d1d5db" },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  calDayInner: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  calDaySelected: { backgroundColor: Brand.sage700 },
  calDayToday: { borderWidth: 1.5, borderColor: Brand.sage700 },
  calDayText: { fontFamily: FontFamilies.body, fontSize: 14, color: "#1f2937" },
  calDayWeekend: { color: "#d1d5db" },
  calDayTextSelected: { color: "#fff", fontFamily: FontFamilies.bodySemiBold },
  calTodayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Brand.sage700, marginTop: 1 },
});
