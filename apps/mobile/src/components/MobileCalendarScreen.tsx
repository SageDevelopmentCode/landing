import { Brand, BottomTabInset, FontFamilies } from "@/constants/theme";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { isFieldFridayCalendarEvent } from "@/lib/calendar";
import { supabase } from "@/lib/supabase";
import { notifyError } from "@/lib/discord";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOW_LETTER = ["M", "T", "W", "T", "F"];

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
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

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

function EventRow({
  event,
  onPress,
}: {
  event: CalendarEvent;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.eventRow}
      onPress={onPress}
      activeOpacity={0.7}
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

function EventDetail({
  event,
  showRegisterCta,
  onRegister,
}: {
  event: CalendarEvent;
  showRegisterCta: boolean;
  onRegister: () => void;
}) {
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

      {showRegisterCta && isFieldFridayCalendarEvent(event) ? (
        <TouchableOpacity
          style={styles.registerBtn}
          onPress={onRegister}
          activeOpacity={0.85}
        >
          <Text style={styles.registerBtnTxt}>Register now!</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

type Props = {
  fetchErrorTag: string;
  showRegisterCta?: boolean;
};

export function MobileCalendarScreen({
  fetchErrorTag,
  showRegisterCta = false,
}: Props) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<"monthly" | "weekly">("weekly");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const currentDateRef = useRef(currentDate);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { selectDate } = useLocalSearchParams<{ selectDate?: string }>();

  const fetchEvents = useCallback(
    async (date: Date) => {
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
            "id,title,event_date,is_all_day,start_time,end_time,color,category,shared_with,programs,description,location,attachment_links",
          )
          .gte("event_date", `${y}-${mm}-01`)
          .lte("event_date", `${y}-${mm}-${String(lastDay).padStart(2, "0")}`)
          .order("event_date", { ascending: true });

        setEvents(data ?? []);
      } catch (e) {
        notifyError(fetchErrorTag, e);
      } finally {
        setLoading(false);
      }
    },
    [fetchErrorTag],
  );

  useFocusEffect(
    useCallback(() => {
      fetchEvents(currentDateRef.current);
    }, [fetchEvents]),
  );

  useEffect(() => {
    if (!selectDate) return;
    const [y, mo] = selectDate.split("-").map(Number);
    const targetDate = new Date(y, mo - 1, 1);
    const cur = currentDateRef.current;
    if (
      targetDate.getFullYear() !== cur.getFullYear() ||
      targetDate.getMonth() !== cur.getMonth()
    ) {
      currentDateRef.current = targetDate;
      setCurrentDate(targetDate);
      fetchEvents(targetDate);
    }
    setSelectedDate(selectDate);
  }, [selectDate, fetchEvents]);

  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>(
    (acc, e) => {
      if (!acc[e.event_date]) acc[e.event_date] = [];
      acc[e.event_date].push(e);
      return acc;
    },
    {},
  );

  const todayYMD = toYMD(new Date());

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

  function handleEventPress(event: CalendarEvent) {
    setSelectedEvent(event);
    bottomSheetRef.current?.present();
  }

  function handleRegister() {
    bottomSheetRef.current?.dismiss();
    router.push("/(tabs)/tuition");
  }

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

  const swipeGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-20, 20])
    .onEnd((e) => {
      if (Math.abs(e.translationX) > Math.abs(e.translationY * 1.5)) {
        if (e.translationX < -40) navigate(1);
        else if (e.translationX > 40) navigate(-1);
      }
    });

  return (
    <SafeAreaView style={styles.container}>
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
        contentContainerStyle={{ paddingBottom: BottomTabInset + 24 }}
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
                          onPress={() => handleEventPress(evt)}
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

        {!loading && (
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
                    onPress={() => handleEventPress(evt)}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={["60%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
        onDismiss={() => setSelectedEvent(null)}
      >
        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {selectedEvent && (
            <EventDetail
              event={selectedEvent}
              showRegisterCta={showRegisterCta}
              onRegister={handleRegister}
            />
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
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
  registerBtn: {
    marginTop: 8,
    backgroundColor: Brand.sage700,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  registerBtnTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#ffffff",
  },
});
