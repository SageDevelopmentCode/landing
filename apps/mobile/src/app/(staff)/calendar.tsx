import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Brand, BottomTabInset, FontFamilies } from "@/constants/theme";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { supabase } from "@/lib/supabase";
import { notifyError } from "@/lib/discord";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useCallback, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CalendarEvent = {
  id: string;
  title: string;
  event_date: string;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  color: string;
  category: string | null;
  shared_with: string[];
  programs: string[];
  description: string | null;
  location: string | null;
  attachment_links: string[] | null;
  recurrence: string | null;
  recurrence_end_date: string | null;
  rsvp_enabled: boolean;
  reminder_email: boolean;
  reminder_in_app: boolean;
  reminder_timing: string | null;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOW_LETTER = ["M", "T", "W", "T", "F"];

const CATEGORIES = [
  "Academic", "Field Trip", "Holiday", "Staff Meeting",
  "Parent Event", "Deadline", "Community", "Other",
];

const COLOR_PALETTE = [
  { label: "Sage",     hex: "#5E7C68" },
  { label: "Sky",      hex: "#5B9BBF" },
  { label: "Rose",     hex: "#C2717A" },
  { label: "Marigold", hex: "#D49A3A" },
  { label: "Lavender", hex: "#8B7BAD" },
  { label: "Clay",     hex: "#C47A52" },
  { label: "Slate",    hex: "#6B7A8D" },
  { label: "Moss",     hex: "#7A9E5E" },
];

const PROGRAMS = ["Pre-K – 1st Grade", "2nd – 4th Grade", "Both"];
const SHARED_OPTIONS = ["Parents", "Staff"];
const RECURRENCE_OPTIONS = ["None", "Daily", "Weekly", "Monthly"];

const HOUR_START = 7;
const HOUR_END = 22;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
const SLOT_HEIGHT = 80; // px per hour

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fmt12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatEventTime(evt: CalendarEvent): string {
  if (evt.is_all_day) return "All day";
  if (evt.start_time && evt.end_time)
    return `${fmt12(evt.start_time)} – ${fmt12(evt.end_time)}`;
  if (evt.start_time) return fmt12(evt.start_time);
  return "All day";
}

function formatFullDate(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

function isValidYMD(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isValidHHMM(s: string): boolean {
  if (!s) return true; // optional
  return /^\d{1,2}:\d{2}$/.test(s);
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SkeletonCalendar() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 12 }}>
      <SkeletonBox width="100%" height={240} borderRadius={12} />
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <SkeletonBox width={4} height={44} borderRadius={2} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonBox width="65%" height={14} borderRadius={4} />
            <SkeletonBox width="45%" height={12} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// EventRow
// ---------------------------------------------------------------------------

function EventRow({
  event,
  onPress,
  onLongPress,
}: {
  event: CalendarEvent;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.eventRow}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      delayLongPress={400}
    >
      <View style={[styles.eventRowAccent, { backgroundColor: event.color }]} />
      <View style={styles.eventRowBody}>
        <Text style={styles.eventRowTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={styles.eventRowMeta}>
          <Text style={styles.eventRowTime}>{formatEventTime(event)}</Text>
          {event.category ? (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.eventRowCat}>{event.category}</Text>
            </>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// EventDetail (read-only display)
// ---------------------------------------------------------------------------

function EventDetail({ event }: { event: CalendarEvent }) {
  const attachments = event.attachment_links ?? [];
  return (
    <View style={styles.detailContainer}>
      <View style={[styles.detailHeader, { borderLeftColor: event.color }]}>
        <Text style={styles.detailTitle}>{event.title}</Text>
        {event.category ? (
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: event.color + "22" },
            ]}
          >
            <Text style={[styles.categoryBadgeTxt, { color: event.color }]}>
              {event.category}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="calendar-outline" size={16} color="#6b7280" />
        <View style={{ flex: 1 }}>
          <Text style={styles.detailRowPrimary}>
            {formatFullDate(event.event_date)}
          </Text>
          <Text style={styles.detailRowSub}>{formatEventTime(event)}</Text>
        </View>
      </View>

      {event.location ? (
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#6b7280" />
          <Text style={[styles.detailRowPrimary, { flex: 1 }]}>
            {event.location}
          </Text>
        </View>
      ) : null}

      {event.description ? (
        <View style={styles.detailBlock}>
          <Text style={styles.detailBlockLabel}>Details</Text>
          <Text style={styles.detailDesc}>{event.description}</Text>
        </View>
      ) : null}

      {event.shared_with?.length > 0 ? (
        <View style={styles.detailBlock}>
          <Text style={styles.detailBlockLabel}>Shared With</Text>
          <Text style={styles.detailRowPrimary}>
            {event.shared_with.join(", ")}
          </Text>
        </View>
      ) : null}

      {event.programs?.length > 0 ? (
        <View style={styles.detailBlock}>
          <Text style={styles.detailBlockLabel}>Programs</Text>
          <Text style={styles.detailRowPrimary}>
            {event.programs.join(", ")}
          </Text>
        </View>
      ) : null}

      {attachments.length > 0 ? (
        <View style={styles.detailBlock}>
          <Text style={styles.detailBlockLabel}>Attachments</Text>
          {attachments.map((url, i) => (
            <TouchableOpacity
              key={i}
              style={styles.attachmentRow}
              onPress={() => Linking.openURL(url)}
              activeOpacity={0.7}
            >
              <Ionicons name="attach-outline" size={16} color={Brand.sage700} />
              <Text style={styles.attachmentTxt} numberOfLines={1}>
                {url.split("/").pop() ?? `Attachment ${i + 1}`}
              </Text>
              <Ionicons name="open-outline" size={14} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function StaffCalendarScreen() {
  // ── View state ─────────────────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<"monthly" | "weekly">("weekly");
  const [selectedDate, setSelectedDate] = useState<string | null>(toYMD(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const currentDateRef = useRef(currentDate);

  // ── Sheet refs ─────────────────────────────────────────────────────────────
  const detailSheetRef = useRef<BottomSheetModal>(null);
  const formSheetRef = useRef<BottomSheetModal>(null);

  // ── Detail state ───────────────────────────────────────────────────────────
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formIsAllDay, setFormIsAllDay] = useState(false);
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formColor, setFormColor] = useState("#5E7C68");
  const [formPrograms, setFormPrograms] = useState<string[]>([]);
  const [formSharedWith, setFormSharedWith] = useState<string[]>([]);
  const [formRecurrence, setFormRecurrence] = useState("None");
  const [formLocation, setFormLocation] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Data fetch ─────────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const y = date.getFullYear();
      const m = date.getMonth();
      const mm = String(m + 1).padStart(2, "0");
      const lastDay = new Date(y, m + 1, 0).getDate();

      const { data } = await supabase
        .schema("calendar")
        .from("events")
        .select(
          "id,title,event_date,is_all_day,start_time,end_time,color,category,shared_with,programs,description,location,attachment_links,recurrence,recurrence_end_date,rsvp_enabled,reminder_email,reminder_in_app,reminder_timing",
        )
        .gte("event_date", `${y}-${mm}-01`)
        .lte("event_date", `${y}-${mm}-${String(lastDay).padStart(2, "0")}`)
        .order("event_date", { ascending: true });

      setEvents(data ?? []);
    } catch (e) {
      notifyError("staff-calendar-fetch", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEvents(currentDateRef.current);
    }, [fetchEvents]),
  );

  // ── Derived state ──────────────────────────────────────────────────────────

  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>(
    (acc, e) => {
      if (!acc[e.event_date]) acc[e.event_date] = [];
      acc[e.event_date].push(e);
      return acc;
    },
    {},
  );

  const todayYMD = toYMD(new Date());

  // ── Navigation ─────────────────────────────────────────────────────────────

  function navigate(dir: -1 | 1) {
    let newDate: Date;
    const crossesMonth =
      viewMode === "monthly" ||
      (() => {
        const next = new Date(currentDate);
        next.setDate(next.getDate() + dir * 7);
        return next.getMonth() !== currentDate.getMonth();
      })();

    if (viewMode === "monthly") {
      newDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + dir,
        1,
      );
    } else {
      newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + dir * 7);
    }

    currentDateRef.current = newDate;
    setCurrentDate(newDate);
    setSelectedDate(null);
    if (crossesMonth) fetchEvents(newDate);
  }

  // ── Detail handlers ────────────────────────────────────────────────────────

  function openDetail(event: CalendarEvent) {
    setSelectedEvent(event);
    detailSheetRef.current?.present();
  }

  // ── Form handlers ──────────────────────────────────────────────────────────

  function resetForm() {
    setEditingEvent(null);
    setFormTitle("");
    setFormDate(toYMD(new Date()));
    setFormIsAllDay(false);
    setFormStartTime("");
    setFormEndTime("");
    setFormCategory("");
    setFormColor("#5E7C68");
    setFormPrograms([]);
    setFormSharedWith([]);
    setFormRecurrence("None");
    setFormLocation("");
    setFormDescription("");
  }

  function openCreate(prefill?: { date?: string; startTime?: string }) {
    resetForm();
    if (prefill?.date) setFormDate(prefill.date);
    if (prefill?.startTime) {
      setFormIsAllDay(false);
      setFormStartTime(prefill.startTime);
      const [h, m] = prefill.startTime.split(":").map(Number);
      const endH = Math.min(h + 1, 22);
      setFormEndTime(`${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
    formSheetRef.current?.present();
  }

  function openEdit(event: CalendarEvent) {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDate(event.event_date);
    setFormIsAllDay(event.is_all_day);
    setFormStartTime(event.start_time ?? "");
    setFormEndTime(event.end_time ?? "");
    setFormCategory(event.category ?? "");
    setFormColor(event.color);
    setFormPrograms(event.programs ?? []);
    setFormSharedWith(event.shared_with ?? []);
    setFormRecurrence(event.recurrence ?? "None");
    setFormLocation(event.location ?? "");
    setFormDescription(event.description ?? "");
    formSheetRef.current?.present();
  }

  async function handleSave() {
    if (!formTitle.trim() || !isValidYMD(formDate)) return;
    if (!formIsAllDay && formStartTime && !isValidHHMM(formStartTime)) {
      Alert.alert("Invalid time", "Start time must be in HH:MM format.");
      return;
    }
    if (!formIsAllDay && formEndTime && !isValidHHMM(formEndTime)) {
      Alert.alert("Invalid time", "End time must be in HH:MM format.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formTitle.trim(),
        event_date: formDate,
        is_all_day: formIsAllDay,
        start_time: formIsAllDay ? null : formStartTime || null,
        end_time: formIsAllDay ? null : formEndTime || null,
        color: formColor,
        category: formCategory || null,
        shared_with: formSharedWith,
        programs: formPrograms,
        description: formDescription.trim() || null,
        location: formLocation.trim() || null,
        recurrence: formRecurrence,
      };

      if (editingEvent) {
        const { data: updated } = await supabase
          .schema("calendar")
          .from("events")
          .update(payload)
          .eq("id", editingEvent.id)
          .select(
            "id,title,event_date,is_all_day,start_time,end_time,color,category,shared_with,programs,description,location,attachment_links,recurrence,recurrence_end_date,rsvp_enabled,reminder_email,reminder_in_app,reminder_timing",
          )
          .single();

        if (updated) {
          setEvents((prev) =>
            prev.map((e) => (e.id === editingEvent.id ? updated : e)),
          );
        }
      } else {
        const { data: created } = await supabase
          .schema("calendar")
          .from("events")
          .insert(payload)
          .select(
            "id,title,event_date,is_all_day,start_time,end_time,color,category,shared_with,programs,description,location,attachment_links,recurrence,recurrence_end_date,rsvp_enabled,reminder_email,reminder_in_app,reminder_timing",
          )
          .single();

        if (created) {
          setEvents((prev) =>
            [...prev, created].sort((a, b) =>
              a.event_date.localeCompare(b.event_date),
            ),
          );
        }
      }

      formSheetRef.current?.dismiss();
    } catch (err) {
      notifyError('staff-save-calendar-event', err);
      Alert.alert("Error", "Could not save event. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: string) {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setEvents((prev) => prev.filter((e) => e.id !== id));
            detailSheetRef.current?.dismiss();
            const { error: deleteErr } = await supabase
              .schema("calendar")
              .from("events")
              .delete()
              .eq("id", id);
            if (deleteErr) notifyError("staff-calendar-delete", deleteErr);
          },
        },
      ],
    );
  }

  // ── Chip toggle helpers ────────────────────────────────────────────────────

  function toggleMulti(
    value: string,
    current: string[],
    setter: (v: string[]) => void,
  ) {
    setter(
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    );
  }

  // ── Calendar computations ──────────────────────────────────────────────────

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDow = new Date(year, month, 1).getDay();
  const lastDayNum = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from<null>({ length: firstDow }).fill(null),
    ...Array.from({ length: lastDayNum }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const sunday = new Date(currentDate);
  sunday.setDate(currentDate.getDate() - currentDate.getDay());
  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i + 1);
    return d;
  });

  const headerLabel =
    viewMode === "monthly"
      ? `${MONTH_NAMES[month]} ${year}`
      : `${weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDays[4].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  const weekYMDs = new Set(weekDays.map(toYMD));
  const listEvents = selectedDate
    ? (eventsByDate[selectedDate] ?? [])
    : viewMode === "weekly"
      ? events.filter((e) => weekYMDs.has(e.event_date))
      : events;

  const listLabel = selectedDate
    ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : viewMode === "weekly"
      ? "Events this week"
      : `All events — ${MONTH_NAMES[month]}`;

  // ── Swipe gesture ──────────────────────────────────────────────────────────

  const swipeGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-20, 20])
    .onEnd((e) => {
      if (Math.abs(e.translationX) > Math.abs(e.translationY * 1.5)) {
        if (e.translationX < -40) navigate(1);
        else if (e.translationX > 40) navigate(-1);
      }
    });

  // ── Backdrop component ─────────────────────────────────────────────────────

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    [],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigate(-1)}
          style={styles.navBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>{headerLabel}</Text>
        <TouchableOpacity
          onPress={() => navigate(1)}
          style={styles.navBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* ── View toggle ── */}
      <View style={styles.toggleWrap}>
        <View style={styles.toggleGroup}>
          {(["monthly", "weekly"] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.toggleBtn,
                viewMode === mode && styles.toggleBtnActive,
              ]}
              onPress={() => {
                setViewMode(mode);
                setSelectedDate(null);
              }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.toggleBtnTxt,
                  viewMode === mode && styles.toggleBtnTxtActive,
                ]}
              >
                {mode === "monthly" ? "Monthly" : "Weekly"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: BottomTabInset + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <SkeletonCalendar />
        ) : viewMode === "monthly" ? (
          <>
            <View style={styles.dowRow}>
              {DOW_SHORT.map((d) => (
                <Text key={d} style={styles.dowLabel}>
                  {d}
                </Text>
              ))}
            </View>
            <View style={styles.grid}>
              {cells.map((day, idx) => {
                if (day === null)
                  return <View key={`e${idx}`} style={styles.dayCell} />;

                const ymd = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday = ymd === todayYMD;
                const isSel = ymd === selectedDate;
                const dots = [
                  ...new Set((eventsByDate[ymd] ?? []).map((e) => e.color)),
                ].slice(0, 3);

                return (
                  <TouchableOpacity
                    key={ymd}
                    style={styles.dayCell}
                    activeOpacity={0.7}
                    onPress={() => setSelectedDate(isSel ? null : ymd)}
                  >
                    <View
                      style={[
                        styles.dayNum,
                        isToday && styles.dayNumToday,
                        isSel && styles.dayNumSel,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayTxt,
                          isToday && styles.dayTxtToday,
                          isSel && styles.dayTxtSel,
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                    <View style={styles.dotsRow}>
                      {dots.map((c, di) => (
                        <View
                          key={di}
                          style={[styles.dot, { backgroundColor: c }]}
                        />
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          <GestureDetector gesture={swipeGesture}>
            <View style={styles.weekStrip}>
              {weekDays.map((d, i) => {
                const ymd = toYMD(d);
                const isToday = ymd === todayYMD;
                const isSel = ymd === selectedDate;
                const dayEvts = eventsByDate[ymd] ?? [];

                return (
                  <View key={ymd} style={styles.weekCol}>
                    <Text style={styles.weekLetter}>{DOW_LETTER[i]}</Text>
                    <TouchableOpacity
                      style={[
                        styles.dayNum,
                        isToday && styles.dayNumToday,
                        isSel && styles.dayNumSel,
                      ]}
                      onPress={() => setSelectedDate(isSel ? null : ymd)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayTxt,
                          isToday && styles.dayTxtToday,
                          isSel && styles.dayTxtSel,
                        ]}
                      >
                        {d.getDate()}
                      </Text>
                    </TouchableOpacity>
                    <View style={{ gap: 4, marginTop: 8 }}>
                      {dayEvts.map((evt) => (
                        <TouchableOpacity
                          key={evt.id}
                          style={[
                            styles.weekChip,
                            { backgroundColor: evt.color + "22" },
                          ]}
                          onPress={() => openDetail(evt)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.weekChipDot,
                              { backgroundColor: evt.color },
                            ]}
                          />
                          <Text
                            style={[
                              styles.weekChipTxt,
                              { color: evt.color },
                            ]}
                            numberOfLines={2}
                          >
                            {evt.title}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </GestureDetector>
        )}

        {/* ── Day hour view (weekly + selected date) ── */}
        {!loading && viewMode === "weekly" && selectedDate ? (
          <View style={styles.hourViewContainer}>
            {/* Grid rows — each row is exactly SLOT_HEIGHT tall */}
            <View style={{ paddingTop: 10 }}>
              {HOURS.map((hour) => {
                const slotHHMM = `${String(hour).padStart(2, "0")}:00`;
                const label =
                  hour < 12
                    ? `${hour} AM`
                    : hour === 12
                      ? "12 PM"
                      : `${hour - 12} PM`;
                return (
                  <TouchableOpacity
                    key={hour}
                    style={styles.hourRow}
                    onPress={() =>
                      openCreate({ date: selectedDate, startTime: slotHHMM })
                    }
                    activeOpacity={0.4}
                  >
                    {/* Label floats just above the divider line */}
                    <Text style={styles.hourLabel}>{label}</Text>
                    {/* Divider sits at the very top of the row */}
                    <View style={styles.hourDivider} />
                  </TouchableOpacity>
                );
              })}
            </View>
            {/* Absolute event overlays */}
            {(eventsByDate[selectedDate] ?? [])
              .filter((evt) => !!evt.start_time)
              .map((evt) => {
                const [sh, sm] = evt.start_time!.split(":").map(Number);
                const topOffset = 10 + (sh - HOUR_START + sm / 60) * SLOT_HEIGHT;
                let heightPx = SLOT_HEIGHT;
                if (evt.end_time) {
                  const [eh, em] = evt.end_time.split(":").map(Number);
                  const durationH = eh + em / 60 - (sh + sm / 60);
                  heightPx = Math.max(durationH * SLOT_HEIGHT, 36);
                }
                return (
                  <TouchableOpacity
                    key={evt.id}
                    style={[
                      styles.hourEvent,
                      {
                        position: "absolute",
                        top: topOffset,
                        left: 56,
                        right: 16,
                        height: heightPx,
                        backgroundColor: evt.color + "22",
                        borderLeftColor: evt.color,
                      },
                    ]}
                    onPress={() => openDetail(evt)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[styles.hourEventTitle, { color: evt.color }]}
                      numberOfLines={1}
                    >
                      {evt.title}
                    </Text>
                    <Text style={styles.hourEventTime}>
                      {fmt12(evt.start_time!)}
                      {evt.end_time ? ` – ${fmt12(evt.end_time)}` : ""}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </View>
        ) : (
          /* ── Events list ── */
          !loading && (
            <View style={styles.eventsSection}>
              <Text style={styles.eventsLabel}>{listLabel}</Text>
              {listEvents.length === 0 ? (
                <View style={styles.empty}>
                  <Ionicons name="calendar-outline" size={32} color="#9ca3af" />
                  <Text style={styles.emptyTxt}>No events scheduled</Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {listEvents.map((evt) => (
                    <EventRow
                      key={evt.id}
                      event={evt}
                      onPress={() => openDetail(evt)}
                      onLongPress={() => openEdit(evt)}
                    />
                  ))}
                </View>
              )}
            </View>
          )
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={openCreate}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* ── Event detail sheet ── */}
      <BottomSheetModal
        ref={detailSheetRef}
        snapPoints={["55%", "80%"]}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onDismiss={() => setSelectedEvent(null)}
      >
        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {selectedEvent && (
            <>
              <EventDetail event={selectedEvent} />
              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={styles.detailEditBtn}
                  onPress={() => {
                    detailSheetRef.current?.dismiss();
                    if (selectedEvent) openEdit(selectedEvent);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="pencil-outline"
                    size={16}
                    color={Brand.sage700}
                  />
                  <Text style={styles.detailEditTxt}>Edit Event</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.detailDeleteBtn}
                  onPress={() => selectedEvent && handleDelete(selectedEvent.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color="#ef4444"
                  />
                  <Text style={styles.detailDeleteTxt}>Delete Event</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* ── Create / Edit form sheet ── */}
      <BottomSheetModal
        ref={formSheetRef}
        snapPoints={["75%", "92%"]}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onDismiss={() => setEditingEvent(null)}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.formScroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form header */}
          <Text style={styles.formTitle}>
            {editingEvent ? "Edit Event" : "New Event"}
          </Text>

          {/* ─ Title ─ */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Title *</Text>
            <BottomSheetTextInput
              style={styles.formInput}
              placeholder="Event title"
              placeholderTextColor="#9ca3af"
              value={formTitle}
              onChangeText={setFormTitle}
              returnKeyType="next"
            />
          </View>

          {/* ─ Date ─ */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Date *</Text>
            <BottomSheetTextInput
              style={styles.formInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              value={formDate}
              onChangeText={setFormDate}
              keyboardType="numeric"
            />
            {isValidYMD(formDate) ? (
              <Text style={styles.formHint}>
                {formatFullDate(formDate)}
              </Text>
            ) : null}
          </View>

          {/* ─ All Day ─ */}
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>All Day</Text>
            <Switch
              value={formIsAllDay}
              onValueChange={setFormIsAllDay}
              trackColor={{ true: Brand.sage700, false: "#e5e7eb" }}
              thumbColor="#ffffff"
            />
          </View>

          {/* ─ Time ─ */}
          {!formIsAllDay && (
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Time</Text>
              <View style={styles.timeRow}>
                <BottomSheetTextInput
                  style={[styles.formInput, { flex: 1 }]}
                  placeholder="Start HH:MM"
                  placeholderTextColor="#9ca3af"
                  value={formStartTime}
                  onChangeText={setFormStartTime}
                  keyboardType="numeric"
                />
                <Text style={styles.timeSep}>–</Text>
                <BottomSheetTextInput
                  style={[styles.formInput, { flex: 1 }]}
                  placeholder="End HH:MM"
                  placeholderTextColor="#9ca3af"
                  value={formEndTime}
                  onChangeText={setFormEndTime}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          <View style={styles.formDivider} />

          {/* ─ Category ─ */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    formCategory === cat && {
                      backgroundColor: formColor + "20",
                      borderColor: formColor,
                    },
                  ]}
                  onPress={() =>
                    setFormCategory(formCategory === cat ? "" : cat)
                  }
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.chipTxt,
                      formCategory === cat && { color: formColor },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ─ Color ─ */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Color</Text>
            <View style={styles.colorRow}>
              {COLOR_PALETTE.map(({ label, hex }) => (
                <TouchableOpacity
                  key={hex}
                  onPress={() => setFormColor(hex)}
                  activeOpacity={0.8}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: hex },
                    formColor === hex && styles.colorSwatchActive,
                  ]}
                >
                  {formColor === hex ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formDivider} />

          {/* ─ Programs ─ */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Programs</Text>
            <View style={styles.chipWrap}>
              {PROGRAMS.map((prog) => (
                <TouchableOpacity
                  key={prog}
                  style={[
                    styles.chip,
                    formPrograms.includes(prog) && styles.chipActive,
                  ]}
                  onPress={() => toggleMulti(prog, formPrograms, setFormPrograms)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.chipTxt,
                      formPrograms.includes(prog) && styles.chipTxtActive,
                    ]}
                  >
                    {prog}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ─ Shared With ─ */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Shared With</Text>
            <View style={styles.chipWrap}>
              {SHARED_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.chip,
                    formSharedWith.includes(opt) && styles.chipActive,
                  ]}
                  onPress={() =>
                    toggleMulti(opt, formSharedWith, setFormSharedWith)
                  }
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.chipTxt,
                      formSharedWith.includes(opt) && styles.chipTxtActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ─ Recurrence ─ */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Recurrence</Text>
            <View style={styles.chipWrap}>
              {RECURRENCE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.chip,
                    formRecurrence === opt && styles.chipActive,
                  ]}
                  onPress={() => setFormRecurrence(opt)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.chipTxt,
                      formRecurrence === opt && styles.chipTxtActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formDivider} />

          {/* ─ Location ─ */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Location</Text>
            <BottomSheetTextInput
              style={styles.formInput}
              placeholder="Optional location"
              placeholderTextColor="#9ca3af"
              value={formLocation}
              onChangeText={setFormLocation}
            />
          </View>

          {/* ─ Description ─ */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <BottomSheetTextInput
              style={styles.formTextarea}
              placeholder="Add details about this event..."
              placeholderTextColor="#9ca3af"
              value={formDescription}
              onChangeText={setFormDescription}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* ─ Save button ─ */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              (!formTitle.trim() || !isValidYMD(formDate) || saving) &&
                styles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={!formTitle.trim() || !isValidYMD(formDate) || saving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnTxt}>
              {saving
                ? "Saving…"
                : editingEvent
                  ? "Save Changes"
                  : "Create Event"}
            </Text>
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  headerLabel: {
    flex: 1,
    textAlign: "center",
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#1f2937",
  },

  // View toggle
  toggleWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    alignItems: "flex-start",
  },
  toggleGroup: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleBtnTxt: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
  toggleBtnTxtActive: {
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage700,
  },

  // DOW header
  dowRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 4,
  },
  dowLabel: {
    width: "14.285714%",
    textAlign: "center",
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#9ca3af",
    letterSpacing: 0.5,
  },

  // Monthly grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  dayCell: {
    width: "14.285714%",
    alignItems: "center",
    paddingVertical: 4,
    minHeight: 52,
  },

  // Shared day number circle
  dayNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumToday: {
    backgroundColor: "#FFF0EE",
  },
  dayNumSel: {
    backgroundColor: Brand.sage700,
  },
  dayTxt: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#374151",
  },
  dayTxtToday: {
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.coral,
  },
  dayTxtSel: {
    fontFamily: FontFamilies.bodySemiBold,
    color: "#ffffff",
  },

  // Event dots
  dotsRow: {
    flexDirection: "row",
    gap: 3,
    marginTop: 2,
    height: 6,
    alignItems: "center",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 9999,
  },

  // Weekly strip
  weekStrip: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 4,
  },
  weekCol: {
    flex: 1,
    alignItems: "center",
  },
  weekLetter: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  weekChip: {
    width: "100%",
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 3,
  },
  weekChipDot: {
    width: 5,
    height: 5,
    borderRadius: 9999,
    marginTop: 3,
    flexShrink: 0,
  },
  weekChipTxt: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    lineHeight: 13,
    flex: 1,
  },

  // Events section
  eventsSection: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    marginTop: 8,
  },
  eventsLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },

  // Event row card
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  eventRowAccent: {
    width: 3,
    height: 44,
    borderRadius: 9999,
    flexShrink: 0,
  },
  eventRowBody: {
    flex: 1,
    gap: 4,
  },
  eventRowTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  eventRowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eventRowTime: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
  metaDot: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },
  eventRowCat: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },

  // Empty state
  empty: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyTxt: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: BottomTabInset + 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.sage700,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },

  // Detail sheet
  detailContainer: {
    padding: 24,
    gap: 16,
  },
  detailHeader: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    gap: 8,
  },
  detailTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 20,
    color: "#1f2937",
    lineHeight: 28,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  categoryBadgeTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  detailRowPrimary: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#374151",
  },
  detailRowSub: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  detailBlock: {
    gap: 8,
  },
  detailBlockLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  detailDesc: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F2F7F3",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C8DFCB",
  },
  attachmentTxt: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: Brand.sage700,
  },
  detailActions: {
    paddingHorizontal: 24,
    paddingTop: 4,
    gap: 8,
  },
  detailEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Brand.sage700,
    backgroundColor: "#F2F7F3",
  },
  detailEditTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
  },
  detailDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
  },
  detailDeleteTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#ef4444",
  },

  // Form sheet
  formScroll: {
    padding: 20,
    paddingBottom: 40,
    gap: 0,
  },
  formTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 20,
    color: "#1f2937",
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
    gap: 6,
  },
  formRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  formLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#1f2937",
    backgroundColor: "#fafafa",
  },
  formTextarea: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#1f2937",
    backgroundColor: "#fafafa",
    minHeight: 80,
    textAlignVertical: "top",
  },
  formHint: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: Brand.sage700,
    marginTop: 2,
  },
  formDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeSep: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
  },

  // Chips
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  chipActive: {
    backgroundColor: Brand.sage700 + "15",
    borderColor: Brand.sage700,
  },
  chipTxt: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
  chipTxtActive: {
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage700,
  },

  // Color swatches
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchActive: {
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  // Hour view
  hourViewContainer: {
    marginTop: 8,
    paddingBottom: 32,
    position: "relative",
  },
  hourRow: {
    height: SLOT_HEIGHT,
    position: "relative",
  },
  hourLabel: {
    position: "absolute",
    top: -8,
    left: 0,
    width: 56,
    paddingLeft: 16,
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
  },
  hourDivider: {
    position: "absolute",
    top: 0,
    left: 56,
    right: 0,
    height: 1,
    backgroundColor: "#f3f4f6",
  },
  hourEvent: {
    position: "absolute",
    borderLeftWidth: 3,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: "hidden",
  },
  hourEventTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
  },
  hourEventTime: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#6b7280",
    marginTop: 1,
  },

  // Save button
  saveBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Brand.sage700,
    alignItems: "center",
  },
  saveBtnDisabled: {
    backgroundColor: "#d1d5db",
  },
  saveBtnTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#ffffff",
  },
});
