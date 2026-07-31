import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { BottomTabInset, Brand, FontFamilies } from "@/constants/theme";
import {
  type ClockSession,
  type SessionsByDay,
  getDayTotalHours,
  getWeekDays,
  getWeekTotalHours,
  groupSessionsByDay,
  parseISO,
  toDateKey,
  formatDurationMs,
} from "@/lib/clock-utils";

import { supabase } from "@/lib/supabase";
import { notifyError } from "@/lib/discord";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type View = "day" | "week" | "month" | "summary";

const WEEKLY_GOAL = 40;

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatTime12h(ts: string): string {
  const d = parseISO(ts);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m} ${ampm}`;
}

function formatDuration(startIso: string, endIso?: string | null): string {
  const start = parseISO(startIso).getTime();
  const end = endIso ? parseISO(endIso).getTime() : Date.now();
  return formatDurationMs(end - start);
}

function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const dayOfWeek = first.getDay(); // 0=Sun
  const startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon-based
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    const row = cells.slice(i, i + 7);
    while (row.length < 7) row.push(null);
    rows.push(row);
  }
  return rows;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isFuture(date: Date): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d > now;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getMondayOfCurrentWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getDefaultSelectedDate(): Date {
  const now = new Date();
  const day = now.getDay();
  if (day === 0) {
    // Sunday → last Friday
    const d = new Date(now);
    d.setDate(now.getDate() - 2);
    return d;
  }
  if (day === 6) {
    // Saturday → last Friday
    const d = new Date(now);
    d.setDate(now.getDate() - 1);
    return d;
  }
  return now;
}

// ─── ElapsedTimer ─────────────────────────────────────────────────────────────

function ElapsedTimer({ clockInAt, style }: { clockInAt: string; style?: object }) {
  const [elapsed, setElapsed] = useState(
    Date.now() - parseISO(clockInAt).getTime(),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Date.now() - parseISO(clockInAt).getTime());
    }, 1000);
    return () => clearInterval(id);
  }, [clockInAt]);

  const totalSeconds = Math.floor(elapsed / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const label = `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;

  return <Text style={[styles.elapsedText, style]}>{label}</Text>;
}

// ─── SessionRow ───────────────────────────────────────────────────────────────

function SessionRow({
  session,
  onUpdateNote,
  onDelete,
}: {
  session: ClockSession;
  onUpdateNote: (id: string, note: string) => void;
  onDelete: (id: string) => void;
}) {
  const [note, setNote] = useState(session.note);
  const isActive = session.clockOutAt === null;

  function handleLongPress() {
    Alert.alert("Delete Session", "Remove this session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete(session.id),
      },
    ]);
  }

  return (
    <TouchableOpacity
      style={styles.sessionRow}
      activeOpacity={0.85}
      onLongPress={handleLongPress}
    >
      <View style={styles.sessionTimes}>
        <View style={styles.sessionTimePair}>
          <Text style={styles.sessionTimeLabel}>In</Text>
          <Text style={styles.sessionTimeValue}>
            {formatTime12h(session.clockInAt)}
          </Text>
        </View>
        <View style={styles.sessionDivider} />
        <View style={styles.sessionTimePair}>
          <Text style={styles.sessionTimeLabel}>Out</Text>
          <Text
            style={[styles.sessionTimeValue, isActive && styles.activeText]}
          >
            {session.clockOutAt ? formatTime12h(session.clockOutAt) : "Active"}
          </Text>
        </View>
        <View style={styles.sessionDurationBadge}>
          <Text style={styles.sessionDurationText}>
            {formatDuration(session.clockInAt, session.clockOutAt)}
          </Text>
        </View>
      </View>
      <TextInput
        style={styles.noteInput}
        value={note}
        onChangeText={setNote}
        onBlur={() => {
          if (note !== session.note) onUpdateNote(session.id, note);
        }}
        placeholder="Add a note…"
        placeholderTextColor="#9ca3af"
        multiline={false}
        returnKeyType="done"
      />
    </TouchableOpacity>
  );
}

// ─── DayView ──────────────────────────────────────────────────────────────────

function DayView({
  selectedDate,
  sessions,
  onUpdateNote,
  onDeleteSession,
  onNavigatePrev,
  onNavigateNext,
  canGoNext,
}: {
  selectedDate: Date;
  sessions: ClockSession[];
  onUpdateNote: (id: string, note: string) => void;
  onDeleteSession: (id: string) => void;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  canGoNext: boolean;
}) {
  const todayFlag = isToday(selectedDate);
  const dayHours = getDayTotalHours(sessions);
  const dayLabel = dayHours > 0 ? `${dayHours.toFixed(1)}h` : null;

  return (
    <View style={styles.dayViewContainer}>
      {/* Day header with inline navigation */}
      <View style={styles.dayHeader}>
        <TouchableOpacity
          onPress={onNavigatePrev}
          style={styles.navArrow}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={Brand.sage700} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.dayDateLabel}>
            {formatDateLabel(selectedDate)}
          </Text>
          {dayLabel && (
            <Text style={styles.dayTotalLabel}>{dayLabel} logged</Text>
          )}
        </View>
        {todayFlag ? (
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>Today</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={onNavigateNext}
            style={[styles.navArrow, !canGoNext && styles.navArrowDisabled]}
            activeOpacity={0.7}
            disabled={!canGoNext}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={canGoNext ? Brand.sage700 : "#d1d5db"}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Session list */}
      <Text style={styles.sessionsSectionHeading}>Sessions</Text>
      {sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No entries yet</Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {[...sessions].reverse().map((s) => (
            <SessionRow
              key={s.id}
              session={s}
              onUpdateNote={onUpdateNote}
              onDelete={onDeleteSession}
            />
          ))}
        </View>
      )}

      {sessions.length > 0 && (
        <Text style={styles.longPressHint}>Long-press a session to delete</Text>
      )}
    </View>
  );
}

// ─── WeekView ─────────────────────────────────────────────────────────────────

type DayStatus = "active" | "logged" | "today" | "not_logged" | "upcoming";

function getDayStatus(date: Date, sessions: ClockSession[]): DayStatus {
  const future = isFuture(date);
  const today = isToday(date);
  const hasActive = sessions.some((s) => s.clockOutAt === null);
  const hasLogged = sessions.some((s) => s.clockOutAt !== null);

  if (hasActive) return "active";
  if (today) return "today";
  if (future) return "upcoming";
  if (hasLogged || sessions.length > 0) return "logged";
  return "not_logged";
}

function WeekView({
  weekOffset,
  setWeekOffset,
  sessionsByDay,
  onSelectDay,
}: {
  weekOffset: number;
  setWeekOffset: (v: number) => void;
  sessionsByDay: SessionsByDay;
  onSelectDay: (date: Date) => void;
}) {
  const weekDays = getWeekDays(weekOffset);
  const weekTotal = getWeekTotalHours(sessionsByDay, weekDays);
  const weekLabel =
    weekOffset === 0
      ? "This Week"
      : weekOffset === -1
        ? "Last Week"
        : `Week of ${formatShortDate(weekDays[0])}`;

  return (
    <View style={styles.weekContainer}>
      {/* Week nav */}
      <View style={styles.weekNavRow}>
        <TouchableOpacity
          onPress={() => setWeekOffset(weekOffset - 1)}
          style={styles.navArrow}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={Brand.sage700} />
        </TouchableOpacity>
        <Text style={styles.weekNavLabel}>{weekLabel}</Text>
        <TouchableOpacity
          onPress={() => setWeekOffset(weekOffset + 1)}
          style={[styles.navArrow, weekOffset >= 0 && styles.navArrowDisabled]}
          activeOpacity={0.7}
          disabled={weekOffset >= 0}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={weekOffset >= 0 ? "#d1d5db" : Brand.sage700}
          />
        </TouchableOpacity>
      </View>

      {/* Day rows */}
      <View style={{ gap: 6 }}>
        {weekDays.map((date) => {
          const key = toDateKey(date);
          const sessions = sessionsByDay[key] ?? [];
          const status = getDayStatus(date, sessions);
          const hours = getDayTotalHours(sessions);
          const dayName = date.toLocaleDateString("en-US", {
            weekday: "short",
          });
          const dayNum = date.getDate();

          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.weekDayRow,
                status === "today" && styles.weekDayRowToday,
              ]}
              activeOpacity={0.75}
              onPress={() => onSelectDay(date)}
            >
              <View style={styles.weekDayLeft}>
                <Text style={styles.weekDayName}>{dayName}</Text>
                <Text style={styles.weekDayNum}>{dayNum}</Text>
              </View>
              <View style={styles.weekDayMiddle}>
                {status === "active" && (
                  <View style={styles.statusBadgeActive}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusTextActive}>Active</Text>
                  </View>
                )}
                {status === "logged" && (
                  <View style={styles.statusBadgeLogged}>
                    <Text style={styles.statusTextLogged}>Logged</Text>
                  </View>
                )}
                {status === "today" && sessions.length === 0 && (
                  <View style={styles.statusBadgeToday}>
                    <Text style={styles.statusTextToday}>Today</Text>
                  </View>
                )}
                {status === "not_logged" && (
                  <Text style={styles.statusTextMuted}>Not logged</Text>
                )}
                {status === "upcoming" && (
                  <Text style={styles.statusTextMuted}>Upcoming</Text>
                )}
              </View>
              <Text style={styles.weekDayHours}>
                {hours > 0 ? `${hours.toFixed(1)}h` : "—"}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Week total */}
      <View style={styles.weekTotalRow}>
        <Text style={styles.weekTotalLabel}>Week Total</Text>
        <Text style={styles.weekTotalValue}>
          {weekTotal.toFixed(1)}h / {WEEKLY_GOAL}h
        </Text>
      </View>
    </View>
  );
}

// ─── MonthView ────────────────────────────────────────────────────────────────

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function MonthView({
  monthOffset,
  setMonthOffset,
  sessionsByDay,
  onSelectDay,
}: {
  monthOffset: number;
  setMonthOffset: (v: number) => void;
  sessionsByDay: SessionsByDay;
  onSelectDay: (date: Date) => void;
}) {
  const now = new Date();
  const targetMonth = new Date(
    now.getFullYear(),
    now.getMonth() + monthOffset,
    1,
  );
  const year = targetMonth.getFullYear();
  const month = targetMonth.getMonth();
  const grid = getMonthGrid(year, month);
  const monthLabel = targetMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // stats
  let totalHours = 0;
  let daysLogged = 0;
  for (const [key, sessions] of Object.entries(sessionsByDay)) {
    const d = parseISO(key + "T00:00:00");
    if (d.getFullYear() === year && d.getMonth() === month) {
      const h = getDayTotalHours(sessions);
      if (h > 0) {
        totalHours += h;
        daysLogged++;
      }
    }
  }

  return (
    <View style={styles.monthContainer}>
      {/* Month nav */}
      <View style={styles.weekNavRow}>
        <TouchableOpacity
          onPress={() => setMonthOffset(monthOffset - 1)}
          style={styles.navArrow}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={Brand.sage700} />
        </TouchableOpacity>
        <Text style={styles.weekNavLabel}>{monthLabel}</Text>
        <TouchableOpacity
          onPress={() => setMonthOffset(monthOffset + 1)}
          style={[styles.navArrow, monthOffset >= 0 && styles.navArrowDisabled]}
          activeOpacity={0.7}
          disabled={monthOffset >= 0}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={monthOffset >= 0 ? "#d1d5db" : Brand.sage700}
          />
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={styles.monthHeaderRow}>
        {DAY_HEADERS.map((h) => (
          <View key={h} style={styles.monthHeaderCell}>
            <Text
              style={[
                styles.monthHeaderText,
                (h === "Sat" || h === "Sun") && styles.monthWeekendText,
              ]}
            >
              {h}
            </Text>
          </View>
        ))}
      </View>

      {/* Grid */}
      {grid.map((row, ri) => (
        <View key={ri} style={styles.monthRow}>
          {row.map((date, ci) => {
            const isWeekend = ci >= 5;
            if (!date) {
              return <View key={ci} style={styles.monthCell} />;
            }
            const key = toDateKey(date);
            const sessions = sessionsByDay[key] ?? [];
            const hours = getDayTotalHours(sessions);
            const todayFlag = isToday(date);
            const futureFlag = isFuture(date);

            return (
              <TouchableOpacity
                key={ci}
                style={[
                  styles.monthCell,
                  todayFlag && styles.monthCellToday,
                  isWeekend && styles.monthCellWeekend,
                ]}
                activeOpacity={isWeekend ? 1 : 0.7}
                onPress={() => !isWeekend && !futureFlag && onSelectDay(date)}
                disabled={isWeekend || futureFlag}
              >
                <Text
                  style={[
                    styles.monthCellDay,
                    todayFlag && styles.monthCellDayToday,
                    isWeekend && styles.monthCellTextMuted,
                  ]}
                >
                  {date.getDate()}
                </Text>
                {hours > 0 && (
                  <Text style={styles.monthCellHours}>{hours.toFixed(1)}h</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Month stats */}
      <View style={styles.monthStatsRow}>
        <View style={styles.monthStat}>
          <Text style={styles.monthStatValue}>{daysLogged}</Text>
          <Text style={styles.monthStatLabel}>Days logged</Text>
        </View>
        <View style={styles.monthStatDivider} />
        <View style={styles.monthStat}>
          <Text style={styles.monthStatValue}>{totalHours.toFixed(1)}h</Text>
          <Text style={styles.monthStatLabel}>Total hours</Text>
        </View>
      </View>
    </View>
  );
}

// ─── SummarySection ───────────────────────────────────────────────────────────

function SummarySection({
  sessionsByDay,
  activeSession,
  defaultOpen = false,
}: {
  sessionsByDay: SessionsByDay;
  activeSession: ClockSession | null;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const animRef = useRef(new Animated.Value(0)).current;

  const weekDays = getWeekDays(0);
  const weekHours = getWeekTotalHours(sessionsByDay, weekDays);
  const weekProgress = Math.min(weekHours / WEEKLY_GOAL, 1);
  const weekProgressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      Animated.timing(weekProgressAnim, {
        toValue: weekProgress,
        duration: 600,
        useNativeDriver: false,
      }).start();
    }
  }, [open, weekProgress]);

  const todayKey = toDateKey(new Date());
  const todaySessions = sessionsByDay[todayKey] ?? [];
  const todayHours = getDayTotalHours(todaySessions);

  const now = new Date();
  const monthYear = [now.getFullYear(), now.getMonth()] as const;
  let monthHours = 0;
  let monthDays = 0;
  for (const [key, sessions] of Object.entries(sessionsByDay)) {
    const d = parseISO(key + "T00:00:00");
    if (d.getFullYear() === monthYear[0] && d.getMonth() === monthYear[1]) {
      const h = getDayTotalHours(sessions);
      if (h > 0) {
        monthHours += h;
        monthDays++;
      }
    }
  }

  // Recent activity: last 5 days with sessions
  const recentDays = Object.entries(sessionsByDay)
    .filter(([, s]) => s.length > 0)
    .sort(([a], [b]) => (a > b ? -1 : 1))
    .slice(0, 5);

  const weekDaysLogged = weekDays.filter((d) => {
    const key = toDateKey(d);
    return (sessionsByDay[key] ?? []).length > 0;
  }).length;

  return (
    <View style={styles.summaryContainer}>
      <TouchableOpacity
        style={styles.summaryToggle}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.75}
      >
        <Text style={styles.summaryToggleText}>Summary</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={Brand.sage700}
        />
      </TouchableOpacity>

      {open && (
        <View style={styles.summaryContent}>
          {/* This week */}
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryBlockTitle}>This Week</Text>
            <View style={styles.progressBarTrack}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: weekProgressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryValue}>
                {weekHours.toFixed(1)}h / {WEEKLY_GOAL}h
              </Text>
              <Text style={styles.summaryMeta}>{weekDaysLogged}/5 days</Text>
            </View>
            <Text style={styles.summaryHint}>
              {weekHours >= WEEKLY_GOAL
                ? "Goal reached!"
                : `${(WEEKLY_GOAL - weekHours).toFixed(1)}h to go`}
            </Text>
          </View>

          {/* Today */}
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryBlockTitle}>Today</Text>
            {activeSession ? (
              <View style={styles.summaryActiveRow}>
                <View style={styles.activeDot} />
                <Text style={styles.summaryActiveText}>Clocked in</Text>
              </View>
            ) : (
              <Text style={styles.summaryValue}>
                {todayHours > 0
                  ? `${todayHours.toFixed(1)}h logged`
                  : "Not started"}
              </Text>
            )}
          </View>

          {/* Month */}
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryBlockTitle}>
              {now.toLocaleDateString("en-US", { month: "long" })}
            </Text>
            <Text style={styles.summaryValue}>
              {monthHours.toFixed(1)}h · {monthDays} days logged
            </Text>
          </View>

          {/* Recent activity */}
          {recentDays.length > 0 && (
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryBlockTitle}>Recent Activity</Text>
              <View style={{ gap: 6 }}>
                {recentDays.map(([key, sessions]) => {
                  const d = parseISO(key + "T00:00:00");
                  const h = getDayTotalHours(sessions);
                  return (
                    <View key={key} style={styles.recentRow}>
                      <Text style={styles.recentDate}>
                        {d.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                      <Text style={styles.recentMeta}>
                        {sessions.length} session
                        {sessions.length !== 1 ? "s" : ""} · {h.toFixed(1)}h
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function StaffHoursScreen() {
  const [view, setView] = useState<View>("day");
  const [selectedDate, setSelectedDate] = useState<Date>(
    getDefaultSelectedDate,
  );
  const [sessionsByDay, setSessionsByDay] = useState<SessionsByDay>({});
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSession =
    Object.values(sessionsByDay)
      .flat()
      .find((s) => s.clockOutAt === null) ?? null;

  const weekDays = getWeekDays(0);
  const weekHours = getWeekTotalHours(sessionsByDay, weekDays);
  const todaySessions = sessionsByDay[toDateKey(new Date())] ?? [];
  const todayHours = getDayTotalHours(todaySessions);

  async function fetchSessions(opts?: { silent?: boolean }) {
    if (!opts?.silent) setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated.");
      setLoading(false);
      return;
    }

    const { data, error: fetchErr } = await supabase
      .schema("teachers")
      .from("clock_sessions")
      .select("id, clock_in_at, clock_out_at, note")
      .eq("teacher_id", user.id)
      .order("clock_in_at", { ascending: true });

    if (fetchErr) {
      setError(fetchErr.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setSessionsByDay(groupSessionsByDay(data ?? []));
    setLoading(false);
    setRefreshing(false);
  }

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        setLoading(true);
        setError(null);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelled) {
            setError("Not authenticated.");
            setLoading(false);
          }
          return;
        }

        const { data, error: fetchErr } = await supabase
          .schema("teachers")
          .from("clock_sessions")
          .select("id, clock_in_at, clock_out_at, note")
          .eq("teacher_id", user.id)
          .order("clock_in_at", { ascending: true });

        if (!cancelled) {
          if (fetchErr) {
            notifyError("staff-hours-fetch", fetchErr);
            setError(fetchErr.message);
          } else {
            setSessionsByDay(groupSessionsByDay(data ?? []));
          }
          setLoading(false);
        }
      }

      load();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchSessions({ silent: true });
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

  async function updateNote(sessionId: string, note: string) {
    const { error: updateErr } = await supabase
      .schema("teachers")
      .from("clock_sessions")
      .update({ note })
      .eq("id", sessionId);

    if (updateErr) { notifyError("staff-hours-update-note", updateErr); return; }

    setSessionsByDay((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = next[key].map((s) =>
          s.id === sessionId ? { ...s, note } : s,
        );
      }
      return next;
    });
  }

  async function deleteSession(sessionId: string) {
    const { error: deleteErr } = await supabase
      .schema("teachers")
      .from("clock_sessions")
      .delete()
      .eq("id", sessionId);

    if (deleteErr) { notifyError("staff-hours-delete-session", deleteErr); return; }

    setSessionsByDay((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = next[key].filter((s) => s.id !== sessionId);
      }
      return next;
    });
  }

  // ── Day navigation ─────────────────────────────────────────────────────────

  function navigateDay(direction: 1 | -1) {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + direction);
      // Skip weekends
      while (next.getDay() === 0 || next.getDay() === 6) {
        next.setDate(next.getDate() + direction);
      }
      return next;
    });
  }

  function handleSelectDay(date: Date) {
    setSelectedDate(date);
    setView("day");
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const views: { key: View; label: string }[] = [
    { key: "day", label: "Day" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "summary", label: "Summary" },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Hours</Text>
        </View>
        <View style={styles.pillRow}>
          {views.map((v) => (
            <SkeletonBox
              key={v.key}
              width={72}
              height={34}
              borderRadius={9999}
            />
          ))}
        </View>
        <View style={{ padding: 16, gap: 12 }}>
          <SkeletonBox width="60%" height={18} borderRadius={4} />
          <SkeletonBox width="100%" height={80} borderRadius={12} />
          {[1, 2].map((i) => (
            <SkeletonBox key={i} width="100%" height={72} borderRadius={12} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Hours</Text>
        </View>
        <View style={styles.centered}>
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const selectedKey = toDateKey(selectedDate);
  const daySessions = sessionsByDay[selectedKey] ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Hours</Text>
      </View>

      {/* View switcher */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRowContent}
        style={styles.pillRowScroll}
      >
        {views.map((v) => {
          const active = v.key === view;
          return (
            <TouchableOpacity
              key={v.key}
              onPress={() => setView(v.key)}
              style={[styles.pill, active && styles.pillActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {v.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Main scrollable content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Brand.sage700}
          />
        }
      >
        {/* Clock widget — always visible */}
        <View style={styles.clockCard}>
          <View style={styles.clockStatusRow}>
            <View
              style={[
                styles.clockDot,
                { backgroundColor: activeSession ? "#16a34a" : "#9ca3af" },
              ]}
            />
            <Text style={styles.clockStatusText}>
              {activeSession ? "You're clocked in" : "You're not clocked in"}
            </Text>
          </View>
          {activeSession && (
            <View style={styles.clockTimerRow}>
              <Ionicons name="time-outline" size={15} color="#6b7280" />
              <ElapsedTimer
                clockInAt={activeSession.clockInAt}
                style={styles.clockElapsedText}
              />
            </View>
          )}
          <View style={styles.clockNotice}>
            <Ionicons name="tablet-portrait-outline" size={15} color="#6b7280" />
            <Text style={styles.clockNoticeText}>
              Clocking in and out is only available on the Sage Field School iPad
            </Text>
          </View>
          <View style={styles.clockStatsRow}>
            <View style={styles.clockStatItem}>
              <Text style={styles.clockStatValue}>{weekHours.toFixed(1)}h</Text>
              <Text style={styles.clockStatLabel}>This week</Text>
            </View>
            <View style={styles.clockStatDivider} />
            <View style={styles.clockStatItem}>
              <Text style={styles.clockStatValue}>{todayHours.toFixed(1)}h</Text>
              <Text style={styles.clockStatLabel}>Today</Text>
            </View>
          </View>
        </View>

        {view === "day" && (
          <DayView
            selectedDate={selectedDate}
            sessions={daySessions}
            onUpdateNote={updateNote}
            onDeleteSession={deleteSession}
            onNavigatePrev={() => navigateDay(-1)}
            onNavigateNext={() => navigateDay(1)}
            canGoNext={!isToday(selectedDate)}
          />
        )}
        {view === "week" && (
          <WeekView
            weekOffset={weekOffset}
            setWeekOffset={setWeekOffset}
            sessionsByDay={sessionsByDay}
            onSelectDay={handleSelectDay}
          />
        )}
        {view === "month" && (
          <MonthView
            monthOffset={monthOffset}
            setMonthOffset={setMonthOffset}
            sessionsByDay={sessionsByDay}
            onSelectDay={handleSelectDay}
          />
        )}
        {view === "summary" && (
          <SummarySection
            sessionsByDay={sessionsByDay}
            activeSession={activeSession}
            defaultOpen={true}
          />
        )}
      </ScrollView>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  pageTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 24,
    color: Brand.sage700,
  },

  // View switcher pills
  pillRowScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  pillRowContent: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  pillRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  pillActive: {
    borderColor: Brand.sage700,
    backgroundColor: "rgba(94,124,104,0.08)",
  },
  pillText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#6b7280",
  },
  pillTextActive: {
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage700,
  },

  // Nav arrows (shared)
  navArrow: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  navArrowDisabled: {
    borderColor: "#f3f4f6",
    backgroundColor: "#fafafa",
  },

  // Main scroll
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: BottomTabInset + 16,
  },

  // Error
  errorCard: {
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#ffe4e6",
    borderRadius: 12,
    padding: 16,
    width: "100%",
  },
  errorText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#be123c",
  },

  // ── Clock widget ─────────────────────────────────────────────────────────

  clockCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 20,
    gap: 14,
  },
  clockStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clockDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  clockStatusText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  clockTimerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  clockElapsedText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#6b7280",
  },
  clockNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  clockNoticeText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
    flex: 1,
  },
  clockStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 14,
  },
  clockStatItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  clockStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#e5e7eb",
  },
  clockStatValue: {
    fontFamily: FontFamilies.heading,
    fontSize: 20,
    color: "#1f2937",
  },
  clockStatLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },

  // ── DayView ──────────────────────────────────────────────────────────────

  dayViewContainer: { gap: 12 },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayDateLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
    textAlign: "center",
  },
  dayTotalLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
    textAlign: "center",
  },
  todayBadge: {
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  todayBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#d97706",
  },

  activeSessionCard: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  activeSessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16a34a",
  },
  activeSessionLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#15803d",
  },
  activeSessionTime: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#4b5563",
    marginLeft: "auto",
  },
  elapsedText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 22,
    color: "#15803d",
    textAlign: "center",
  },
  activeText: {
    color: "#16a34a",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyStateText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
  },
  sessionsSectionHeading: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#6b7280",
    // marginBottom: 4,
    marginTop: 24,
  },
  longPressHint: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#d1d5db",
    textAlign: "center",
    marginTop: 4,
  },

  // SessionRow
  sessionRow: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  sessionTimes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sessionTimePair: {
    alignItems: "center",
    gap: 2,
  },
  sessionTimeLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
    textTransform: "uppercase",
  },
  sessionTimeValue: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  sessionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 4,
  },
  sessionDurationBadge: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  sessionDurationText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#374151",
  },
  noteInput: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#fafafa",
  },

  // ── WeekView ─────────────────────────────────────────────────────────────

  weekContainer: { gap: 12 },
  weekNavRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  weekNavLabel: {
    flex: 1,
    textAlign: "center",
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
  },

  weekDayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
  },
  weekDayRowToday: {
    borderColor: "#fde68a",
    backgroundColor: "#fffbeb",
  },
  weekDayLeft: {
    width: 48,
    alignItems: "center",
  },
  weekDayName: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },
  weekDayNum: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#1f2937",
  },
  weekDayMiddle: { flex: 1 },
  weekDayHours: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
    minWidth: 36,
    textAlign: "right",
  },

  statusBadgeActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16a34a",
  },
  statusTextActive: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#15803d",
  },
  statusBadgeLogged: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    alignSelf: "flex-start",
  },
  statusTextLogged: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#15803d",
  },
  statusBadgeToday: {
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    alignSelf: "flex-start",
  },
  statusTextToday: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#d97706",
  },
  statusTextMuted: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },

  weekTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  weekTotalLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
  },
  weekTotalValue: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
  },

  // ── MonthView ────────────────────────────────────────────────────────────

  monthContainer: { gap: 8 },
  monthHeaderRow: {
    flexDirection: "row",
  },
  monthHeaderCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  monthHeaderText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#6b7280",
  },
  monthWeekendText: {
    color: "#d1d5db",
  },
  monthRow: {
    flexDirection: "row",
  },
  monthCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    margin: 1,
    borderRadius: 8,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  monthCellToday: {
    borderColor: Brand.sage700,
    backgroundColor: "rgba(94,124,104,0.06)",
  },
  monthCellWeekend: {
    backgroundColor: "#f9fafb",
    borderColor: "transparent",
  },
  monthCellDay: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#1f2937",
  },
  monthCellDayToday: {
    color: Brand.sage700,
  },
  monthCellTextMuted: {
    color: "#d1d5db",
  },
  monthCellHours: {
    fontFamily: FontFamilies.body,
    fontSize: 9,
    color: Brand.sage700,
    marginTop: 1,
  },
  monthStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  monthStat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  monthStatValue: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 18,
    color: "#1f2937",
  },
  monthStatLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },
  monthStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#e5e7eb",
  },

  // ── SummarySection ───────────────────────────────────────────────────────

  summaryContainer: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
  },
  summaryToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  summaryToggleText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  summaryContent: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    padding: 16,
    gap: 16,
  },
  summaryBlock: { gap: 6 },
  summaryBlockTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Brand.sage700,
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryValue: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  summaryMeta: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
  summaryHint: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
  summaryActiveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryActiveText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#15803d",
  },
  recentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentDate: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
  },
  recentMeta: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
});
