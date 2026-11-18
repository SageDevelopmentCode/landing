// Welcome intro slideshow (moved verbatim from (tabs)/home.tsx)
import { Brand, FontFamilies } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState, type RefObject } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const previewStyles = StyleSheet.create({
  checkinWrap: { flex: 1, backgroundColor: "#EEF5EF", padding: 16, gap: 12 },
  checkinSectionLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#4b5563",
  },
  checkinRow: { flexDirection: "row", gap: 10 },
  checkinCard: {
    width: 120,
    borderRadius: 14,
    backgroundColor: "#D6EAD8",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 10,
    gap: 3,
  },
  checkinCardInactive: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  checkinAvatarRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: Brand.sage700,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  checkinAvatarRingInactive: { borderColor: "transparent" },
  checkinAvatarInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkinAvatarInnerActive: { backgroundColor: "#EEF5EF" },
  checkinInitials: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
  },
  checkinName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#1a3320",
  },
  checkinGrade: {
    fontFamily: FontFamilies.body,
    fontSize: 9,
    color: "#5a7a61",
  },
  checkinTime: {
    fontFamily: FontFamilies.body,
    fontSize: 9,
    color: Brand.sage700,
  },
  checkinBtn: {
    marginTop: 6,
    width: "100%",
    paddingVertical: 6,
    borderRadius: 7,
    alignItems: "center",
    backgroundColor: Brand.sage700,
  },
  checkinBtnPickup: { backgroundColor: "rgba(255,255,255,0.6)" },
  checkinBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#fff",
  },
  checkinBtnPickupText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: Brand.sage700,
  },

  calendarWrap: { flex: 1, backgroundColor: "#fff", paddingTop: 14 },
  calWeekStrip: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  calWeekCol: { flex: 1, alignItems: "center", gap: 4 },
  calWeekLetter: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 9,
    color: "#9ca3af",
    letterSpacing: 0.3,
  },
  calDayNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  calDayNumActive: { backgroundColor: Brand.sage700 },
  calDayTxt: { fontFamily: FontFamilies.body, fontSize: 12, color: "#374151" },
  calDayTxtActive: { fontFamily: FontFamilies.bodySemiBold, color: "#fff" },
  calDot: { width: 4, height: 4, borderRadius: 2 },
  calEventsArea: { padding: 14, gap: 8 },
  calEventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 10,
  },
  calEventAccent: { width: 3, height: 30, borderRadius: 9999, flexShrink: 0 },
  calEventTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#1f2937",
  },
  calEventTime: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: "#6b7280",
  },

  messagesWrap: { flex: 1, backgroundColor: "#fff" },
  msgRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  msgAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  msgAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: Brand.sage700,
  },
  msgBody: { flex: 1, gap: 2 },
  msgTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  msgName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#1f2937",
  },
  msgTime: { fontFamily: FontFamilies.body, fontSize: 10, color: "#9ca3af" },
  msgPreview: { fontFamily: FontFamilies.body, fontSize: 11, color: "#6b7280" },
  msgUnread: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.sage700,
    flexShrink: 0,
  },

  feedWrap: { flex: 1, backgroundColor: "#f9fafb", padding: 12 },
  feedPost: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    gap: 10,
  },
  feedHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  feedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
  },
  feedAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: Brand.sage700,
  },
  feedTeacher: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#1f2937",
  },
  feedMeta: { fontFamily: FontFamilies.body, fontSize: 10, color: "#9ca3af" },
  feedText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#374151",
    lineHeight: 18,
  },
  feedReactions: { flexDirection: "row", gap: 8 },
  feedReaction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  feedReactionCount: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#374151",
  },

  feedCommentSection: { marginTop: 4, gap: 6 },
  feedCommentLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#6b7280",
  },
  feedCommentRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  feedCommentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  feedCommentAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 8,
    color: Brand.sage700,
  },
  feedCommentBubble: {
    flex: 1,
    backgroundColor: "#EEF4EF",
    borderRadius: 12,
    borderTopLeftRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  feedCommentAuthor: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#4b5563",
  },
  feedCommentText: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#1f2937",
    lineHeight: 16,
  },
  feedCommentTime: {
    fontFamily: FontFamilies.body,
    fontSize: 9,
    color: "#9ca3af",
    marginTop: 2,
  },

  tuitionWrap: { flex: 1, backgroundColor: "#fff", padding: 14, gap: 10 },
  tuitionCardRow: { flexDirection: "row", gap: 8 },
  tuitionCard: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },
  tuitionCardBanner: { height: 80, justifyContent: "flex-end", padding: 8 },
  tuitionCardBannerLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 8,
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 0.4,
  },
  tuitionCardBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tuitionCardBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 8,
    color: "#374151",
  },
  tuitionCardBody: { padding: 8, gap: 3 },
  tuitionCardTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#111827",
    lineHeight: 15,
  },
  tuitionCardStatus: {
    fontFamily: FontFamilies.body,
    fontSize: 9,
    color: "#9CA3AF",
  },
  tuitionHistorySection: { gap: 6 },
  tuitionHistoryLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 9,
    color: "#9CA3AF",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  tuitionTxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 10,
  },
  tuitionTxAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E8F0EA",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tuitionTxAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: Brand.sage800,
  },
  tuitionTxBody: { flex: 1, gap: 2 },
  tuitionTxDesc: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#111827",
  },
  tuitionTxMeta: {
    fontFamily: FontFamilies.body,
    fontSize: 9,
    color: "#9CA3AF",
  },
  tuitionTxRight: { alignItems: "flex-end", gap: 3 },
  tuitionTxAmount: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#111827",
  },
  tuitionPaidBadge: {
    backgroundColor: "#dcfce7",
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tuitionPaidBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 9,
    color: "#15803d",
  },
});

function CheckinPreview() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(progress, {
          toValue: 1,
          duration: 700,
          useNativeDriver: false,
        }),
        Animated.delay(2000),
        Animated.timing(progress, {
          toValue: 0,
          duration: 700,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, []);

  const animCardBg = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["#ffffff", "#D6EAD8"],
  });
  const animCardBorder = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["#e5e7eb", "#D6EAD8"],
  });
  const animRingBorder = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", Brand.sage700],
  });
  const animCheckinOpacity = progress.interpolate({
    inputRange: [0, 0.45, 0.55, 1],
    outputRange: [1, 0, 0, 0],
  });
  const animPickupOpacity = progress.interpolate({
    inputRange: [0, 0.45, 0.55, 1],
    outputRange: [0, 0, 1, 1],
  });
  const animTimeOpacity = progress.interpolate({
    inputRange: [0, 0.45, 0.55, 1],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <View style={previewStyles.checkinWrap}>
      <Text style={previewStyles.checkinSectionLabel}>
        Ready to start the day?
      </Text>
      <View style={previewStyles.checkinRow}>
        {/* Emma — animates between unchecked and checked */}
        <Animated.View
          style={[
            previewStyles.checkinCard,
            previewStyles.checkinCardInactive,
            {
              backgroundColor: animCardBg as any,
              borderColor: animCardBorder as any,
            },
          ]}
        >
          <Animated.View
            style={[
              previewStyles.checkinAvatarRing,
              { borderColor: animRingBorder as any },
            ]}
          >
            <View style={previewStyles.checkinAvatarInner}>
              <Text style={previewStyles.checkinInitials}>EJ</Text>
            </View>
          </Animated.View>
          <Text style={previewStyles.checkinName}>Emma</Text>
          <Text style={previewStyles.checkinGrade}>2nd Grade</Text>
          <Animated.View style={{ opacity: animTimeOpacity }}>
            <Text style={previewStyles.checkinTime}>since 2m ago</Text>
          </Animated.View>
          <View style={{ width: "100%", height: 28, marginTop: 6 }}>
            <Animated.View
              style={[
                previewStyles.checkinBtn,
                {
                  position: "absolute",
                  top: 0,
                  width: "100%",
                  marginTop: 0,
                  opacity: animCheckinOpacity,
                },
              ]}
            >
              <Text style={previewStyles.checkinBtnText}>Check in</Text>
            </Animated.View>
            <Animated.View
              style={[
                previewStyles.checkinBtn,
                previewStyles.checkinBtnPickup,
                {
                  position: "absolute",
                  top: 0,
                  width: "100%",
                  marginTop: 0,
                  opacity: animPickupOpacity,
                },
              ]}
            >
              <Text style={previewStyles.checkinBtnPickupText}>Pick up</Text>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Liam — static (always checked in) */}
        <View style={previewStyles.checkinCard}>
          <View style={previewStyles.checkinAvatarRing}>
            <View
              style={[
                previewStyles.checkinAvatarInner,
                previewStyles.checkinAvatarInnerActive,
              ]}
            >
              <Text style={previewStyles.checkinInitials}>LM</Text>
            </View>
          </View>
          <Text style={previewStyles.checkinName}>Liam</Text>
          <Text style={previewStyles.checkinGrade}>4th Grade</Text>
          <Text style={previewStyles.checkinTime}>since 2m ago</Text>
          <View
            style={[previewStyles.checkinBtn, previewStyles.checkinBtnPickup]}
          >
            <Text style={previewStyles.checkinBtnPickupText}>Pick up</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const CAL_DAYS_EVENTS = [
  [{ title: "Library Day", time: "9:00 AM", color: "#7c3aed" }],
  [
    { title: "Spring Showcase", time: "10:00 AM", color: "#3b82f6" },
    { title: "Lunch Special: Pizza", time: "All day", color: "#f59e0b" },
  ],
  [{ title: "Parent–Teacher Conf.", time: "All day", color: "#10b981" }],
  [{ title: "Yoga Class", time: "1:30 PM", color: "#f97316" }],
  [
    { title: "Field Trip", time: "8:30 AM", color: "#ef4444" },
    { title: "Early Dismissal", time: "1:00 PM", color: "#8b5cf6" },
  ],
];

function CalendarPreview() {
  const [activeDay, setActiveDay] = useState(1); // drives week strip (immediate)
  const [displayDay, setDisplayDay] = useState(1); // drives events (delayed by fade-out)
  const eventsOpacity = useRef(new Animated.Value(1)).current;
  const highlightOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const id = setInterval(() => setActiveDay((d) => (d + 1) % 5), 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const FADE_OUT = 200;
    highlightOpacity.setValue(0);

    Animated.sequence([
      Animated.timing(eventsOpacity, {
        toValue: 0,
        duration: FADE_OUT,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(eventsOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(highlightOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const t = setTimeout(() => setDisplayDay(activeDay), FADE_OUT);
    return () => clearTimeout(t);
  }, [activeDay]);

  const days = [
    { letter: "M", num: 13, dot: false },
    { letter: "T", num: 14, dot: true },
    { letter: "W", num: 15, dot: true },
    { letter: "T", num: 16, dot: false },
    { letter: "F", num: 17, dot: false },
  ];

  return (
    <View style={previewStyles.calendarWrap}>
      <View style={previewStyles.calWeekStrip}>
        {days.map((d, i) => {
          const isActive = i === activeDay;
          return (
            <View key={i} style={previewStyles.calWeekCol}>
              <Text style={previewStyles.calWeekLetter}>{d.letter}</Text>
              {isActive ? (
                <Animated.View
                  style={[
                    previewStyles.calDayNum,
                    previewStyles.calDayNumActive,
                    { opacity: highlightOpacity },
                  ]}
                >
                  <Text
                    style={[
                      previewStyles.calDayTxt,
                      previewStyles.calDayTxtActive,
                    ]}
                  >
                    {d.num}
                  </Text>
                </Animated.View>
              ) : (
                <View style={previewStyles.calDayNum}>
                  <Text style={previewStyles.calDayTxt}>{d.num}</Text>
                </View>
              )}
              <View
                style={[
                  previewStyles.calDot,
                  {
                    backgroundColor: d.dot
                      ? isActive
                        ? "#fff"
                        : "#3b82f6"
                      : "transparent",
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
      <Animated.View
        style={[previewStyles.calEventsArea, { opacity: eventsOpacity }]}
      >
        {CAL_DAYS_EVENTS[displayDay].map((evt, i) => (
          <View key={i} style={previewStyles.calEventRow}>
            <View
              style={[
                previewStyles.calEventAccent,
                { backgroundColor: evt.color },
              ]}
            />
            <View>
              <Text style={previewStyles.calEventTitle}>{evt.title}</Text>
              <Text style={previewStyles.calEventTime}>{evt.time}</Text>
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

function MessagesPreview() {
  const dotScale = useRef(new Animated.Value(1)).current;
  const slideY = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(dotScale, {
          toValue: 1.7,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(dotScale, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
      ]),
    ).start();

    let mounted = true;
    const animateSlide = () => {
      Animated.sequence([
        Animated.delay(2500),
        Animated.timing(slideY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(2200),
        Animated.timing(slideY, {
          toValue: -60,
          duration: 320,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (mounted && finished) animateSlide();
      });
    };
    animateSlide();

    return () => {
      mounted = false;
    };
  }, []);

  const threads = [
    {
      initials: "SO",
      name: "Ms. Sabrina",
      preview: "Emma did great in reading group today!",
      time: "2m ago",
      unread: true,
    },
    {
      initials: "ZM",
      name: "Ms. Zelinda",
      preview: "Reminder: Show and tell is on Friday",
      time: "1h ago",
      unread: false,
    },
    {
      initials: "PW",
      name: "Ms. Paige",
      preview: "Thanks for the update on Liam's allergy",
      time: "Yesterday",
      unread: false,
    },
  ];

  return (
    <View style={previewStyles.messagesWrap}>
      {/* Incoming message slides down from top (clipped by card's overflow:hidden) */}
      <Animated.View
        style={[
          previewStyles.msgRow,
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            backgroundColor: "#fff",
            transform: [{ translateY: slideY }],
          },
        ]}
      >
        <View style={previewStyles.msgAvatar}>
          <Text style={previewStyles.msgAvatarText}>MC</Text>
        </View>
        <View style={previewStyles.msgBody}>
          <View style={previewStyles.msgTopRow}>
            <Text style={previewStyles.msgName}>Ms. Clara</Text>
            <Text style={previewStyles.msgTime}>now</Text>
          </View>
          <Text style={previewStyles.msgPreview} numberOfLines={1}>
            Liam was so helpful today! ☀️
          </Text>
        </View>
        <View style={previewStyles.msgUnread} />
      </Animated.View>

      {/* Existing threads — padded down to leave a slot for the sliding row */}
      <View style={{ paddingTop: 60 }}>
        {threads.map((t, i) => (
          <View key={i} style={previewStyles.msgRow}>
            <View style={previewStyles.msgAvatar}>
              <Text style={previewStyles.msgAvatarText}>{t.initials}</Text>
            </View>
            <View style={previewStyles.msgBody}>
              <View style={previewStyles.msgTopRow}>
                <Text style={previewStyles.msgName}>{t.name}</Text>
                <Text style={previewStyles.msgTime}>{t.time}</Text>
              </View>
              <Text style={previewStyles.msgPreview} numberOfLines={1}>
                {t.preview}
              </Text>
            </View>
            {t.unread && (
              <Animated.View
                style={[
                  previewStyles.msgUnread,
                  { transform: [{ scale: dotScale }] },
                ]}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function FeedPreview() {
  const c1Opacity = useRef(new Animated.Value(0)).current;
  const c1Y = useRef(new Animated.Value(8)).current;
  const c2Opacity = useRef(new Animated.Value(0)).current;
  const c2Y = useRef(new Animated.Value(8)).current;
  const c3Opacity = useRef(new Animated.Value(0)).current;
  const c3Y = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    let mounted = true;
    const animateComments = () => {
      [c1Opacity, c2Opacity, c3Opacity].forEach((v) => v.setValue(0));
      [c1Y, c2Y, c3Y].forEach((v) => v.setValue(8));
      Animated.sequence([
        Animated.delay(600),
        Animated.parallel([
          Animated.timing(c1Opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(c1Y, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(700),
        Animated.parallel([
          Animated.timing(c2Opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(c2Y, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(700),
        Animated.parallel([
          Animated.timing(c3Opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(c3Y, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(2000),
        Animated.parallel([
          Animated.timing(c1Opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(c2Opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(c3Opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(({ finished }) => {
        if (mounted && finished) animateComments();
      });
    };
    animateComments();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={previewStyles.feedWrap}>
      <View style={previewStyles.feedPost}>
        <View style={previewStyles.feedHeader}>
          <View style={previewStyles.feedAvatar}>
            <Text style={previewStyles.feedAvatarText}>SB</Text>
          </View>
          <View>
            <Text style={previewStyles.feedTeacher}>Ms. Sabrina</Text>
            <Text style={previewStyles.feedMeta}>Classroom · 2h ago</Text>
          </View>
        </View>
        <Text style={previewStyles.feedText}>
          We had a wonderful time learning about ecosystems today! 🌿 The kids
          built their own mini terrariums.
        </Text>
        <View style={previewStyles.feedReactions}>
          {[
            ["❤️", "12"],
            ["🎉", "8"],
            ["👏", "5"],
          ].map(([emoji, count]) => (
            <View key={emoji} style={previewStyles.feedReaction}>
              <Text>{emoji}</Text>
              <Text style={previewStyles.feedReactionCount}>{count}</Text>
            </View>
          ))}
        </View>
        <View style={previewStyles.feedCommentSection}>
          <Text style={previewStyles.feedCommentLabel}>Comments</Text>
          <Animated.View
            style={[
              previewStyles.feedCommentRow,
              { opacity: c1Opacity, transform: [{ translateY: c1Y }] },
            ]}
          >
            <View style={previewStyles.feedCommentAvatar}>
              <Text style={previewStyles.feedCommentAvatarText}>MJ</Text>
            </View>
            <View style={previewStyles.feedCommentBubble}>
              <Text style={previewStyles.feedCommentAuthor}>Maria J.</Text>
              <Text style={previewStyles.feedCommentText}>
                So sweet! My son came home talking about it 🌿
              </Text>
              <Text style={previewStyles.feedCommentTime}>2h ago</Text>
            </View>
          </Animated.View>
          <Animated.View
            style={[
              previewStyles.feedCommentRow,
              { opacity: c2Opacity, transform: [{ translateY: c2Y }] },
            ]}
          >
            <View style={previewStyles.feedCommentAvatar}>
              <Text style={previewStyles.feedCommentAvatarText}>TR</Text>
            </View>
            <View style={previewStyles.feedCommentBubble}>
              <Text style={previewStyles.feedCommentAuthor}>Tom R.</Text>
              <Text style={previewStyles.feedCommentText}>
                Emma loved it too! Great idea Ms. Sabrina ❤️
              </Text>
              <Text style={previewStyles.feedCommentTime}>1h ago</Text>
            </View>
          </Animated.View>
          <Animated.View
            style={[
              previewStyles.feedCommentRow,
              { opacity: c3Opacity, transform: [{ translateY: c3Y }] },
            ]}
          >
            <View style={previewStyles.feedCommentAvatar}>
              <Text style={previewStyles.feedCommentAvatarText}>KL</Text>
            </View>
            <View style={previewStyles.feedCommentBubble}>
              <Text style={previewStyles.feedCommentAuthor}>Kim L.</Text>
              <Text style={previewStyles.feedCommentText}>
                Can we get the terrarium instructions? 😊
              </Text>
              <Text style={previewStyles.feedCommentTime}>just now</Text>
            </View>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

function TuitionPreview() {
  const r1Opacity = useRef(new Animated.Value(0)).current;
  const r1Y = useRef(new Animated.Value(8)).current;
  const r2Opacity = useRef(new Animated.Value(0)).current;
  const r2Y = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    let mounted = true;
    const animate = () => {
      [r1Opacity, r2Opacity].forEach((v) => v.setValue(0));
      [r1Y, r2Y].forEach((v) => v.setValue(8));
      Animated.sequence([
        Animated.delay(600),
        Animated.parallel([
          Animated.timing(r1Opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(r1Y, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(700),
        Animated.parallel([
          Animated.timing(r2Opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(r2Y, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(2000),
        Animated.parallel([
          Animated.timing(r1Opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(r2Opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(({ finished }) => {
        if (mounted && finished) animate();
      });
    };
    animate();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={previewStyles.tuitionWrap}>
      <View style={previewStyles.tuitionCardRow}>
        <View style={previewStyles.tuitionCard}>
          <View style={previewStyles.tuitionCardBanner}>
            <Image
              source={require("../../../assets/images/stock/Stock2.webp")}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.54)"]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={previewStyles.tuitionCardBannerLabel}>
              SCHOOL YEAR 26–27
            </Text>
            <View style={previewStyles.tuitionCardBadge}>
              <Text style={previewStyles.tuitionCardBadgeText}>$300</Text>
            </View>
          </View>
          <View style={previewStyles.tuitionCardBody}>
            <Text style={previewStyles.tuitionCardTitle} numberOfLines={2}>
              Annual Supply Fee
            </Text>
            <Text style={previewStyles.tuitionCardStatus}>Pay now</Text>
          </View>
        </View>
        <View style={previewStyles.tuitionCard}>
          <View style={previewStyles.tuitionCardBanner}>
            <Image
              source={require("../../../assets/images/stock/Stock1.webp")}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.54)"]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={previewStyles.tuitionCardBannerLabel}>
              SCHOOL YEAR 26–27
            </Text>
            <View style={previewStyles.tuitionCardBadge}>
              <Text style={previewStyles.tuitionCardBadgeText}>3 mo. paid</Text>
            </View>
          </View>
          <View style={previewStyles.tuitionCardBody}>
            <Text style={previewStyles.tuitionCardTitle} numberOfLines={2}>
              School Year Tuition
            </Text>
            <Text style={previewStyles.tuitionCardStatus}>Pay tuition</Text>
          </View>
        </View>
      </View>

      <View style={previewStyles.tuitionHistorySection}>
        <Text style={previewStyles.tuitionHistoryLabel}>Payment History</Text>
        <Animated.View
          style={[
            previewStyles.tuitionTxRow,
            { opacity: r1Opacity, transform: [{ translateY: r1Y }] },
          ]}
        >
          <View style={previewStyles.tuitionTxAvatar}>
            <Text style={previewStyles.tuitionTxAvatarText}>EJ</Text>
          </View>
          <View style={previewStyles.tuitionTxBody}>
            <Text style={previewStyles.tuitionTxDesc} numberOfLines={1}>
              Annual Supply Fee
            </Text>
            <Text style={previewStyles.tuitionTxMeta}>Emma J. · Aug 1</Text>
          </View>
          <View style={previewStyles.tuitionTxRight}>
            <Text style={previewStyles.tuitionTxAmount}>$300</Text>
            <View style={previewStyles.tuitionPaidBadge}>
              <Text style={previewStyles.tuitionPaidBadgeText}>Paid</Text>
            </View>
          </View>
        </Animated.View>
        <Animated.View
          style={[
            previewStyles.tuitionTxRow,
            { opacity: r2Opacity, transform: [{ translateY: r2Y }] },
          ]}
        >
          <View style={previewStyles.tuitionTxAvatar}>
            <Text style={previewStyles.tuitionTxAvatarText}>LM</Text>
          </View>
          <View style={previewStyles.tuitionTxBody}>
            <Text style={previewStyles.tuitionTxDesc} numberOfLines={1}>
              School Year Tuition
            </Text>
            <Text style={previewStyles.tuitionTxMeta}>Liam M. · Sep 1</Text>
          </View>
          <View style={previewStyles.tuitionTxRight}>
            <Text style={previewStyles.tuitionTxAmount}>$1,450</Text>
            <View style={previewStyles.tuitionPaidBadge}>
              <Text style={previewStyles.tuitionPaidBadgeText}>Paid</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

export type IntroSlide = {
  key: string;
  headline: string;
  body: string;
  PreviewComponent: React.ComponentType;
};

export const INTRO_SLIDES: IntroSlide[] = [
  {
    key: "welcome",
    headline: "Welcome to Sage Field",
    body: "Your family's home base for everything school — all in one place.",
    PreviewComponent: CheckinPreview,
  },
  {
    key: "calendar",
    headline: "School Calendar",
    body: "Browse upcoming events, field trips, and important dates.",
    PreviewComponent: CalendarPreview,
  },
  {
    key: "messages",
    headline: "Message Teachers",
    body: "Send a message directly to your child's teacher, anytime.",
    PreviewComponent: MessagesPreview,
  },
  {
    key: "tuition",
    headline: "Tuition & Billing",
    body: "Pay tuition, track payments, and view your billing history — all from the app.",
    PreviewComponent: TuitionPreview,
  },
  {
    key: "ready",
    headline: "You're All Set",
    body: "Let's finish setting up your account so you get the most out of Sage Field.",
    PreviewComponent: FeedPreview,
  },
];

export const SLIDE_BACKGROUNDS = [
  "#ffffff",
  "#FFF9F5",
  "#EEF5EF",
  "#F0F5F2",
  "#FFF9F5",
] as const;

function renderIntroSlide({ item }: { item: IntroSlide }) {
  return (
    <View
      style={[
        styles.introSlide,
        { backgroundColor: SLIDE_BACKGROUNDS[INTRO_SLIDES.indexOf(item)] },
      ]}
    >
      <View style={styles.introPreviewCard}>
        <item.PreviewComponent />
      </View>
      <View style={styles.introTextArea}>
        <Text style={styles.introHeadline}>{item.headline}</Text>
        <Text style={styles.introBody}>{item.body}</Text>
      </View>
    </View>
  );
}

type IntroSlideshowProps = {
  introVisible: boolean;
  introIndex: number;
  setIntroIndex: (index: number) => void;
  introListRef: RefObject<FlatList<IntroSlide> | null>;
  handleIntroNext: () => void;
  handleIntroBack: () => void;
  handleIntroSkip: () => void;
};

export function IntroSlideshow({
  introVisible,
  introIndex,
  setIntroIndex,
  introListRef,
  handleIntroNext,
  handleIntroBack,
  handleIntroSkip,
}: IntroSlideshowProps) {
  return (
    <Modal
      visible={introVisible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleIntroSkip}
    >
      <SafeAreaView
        style={[
          styles.introContainer,
          { backgroundColor: SLIDE_BACKGROUNDS[introIndex] },
        ]}
        edges={["top", "bottom"]}
      >
        {/* Top bar — back button */}
        <View style={styles.introTopBar}>
          {introIndex > 0 && (
            <Pressable
              onPress={handleIntroBack}
              hitSlop={12}
              style={({ pressed }) => [pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="arrow-back" size={22} color="#6b7280" />
            </Pressable>
          )}
        </View>

        {/* Slides */}
        <FlatList
          ref={introListRef}
          data={INTRO_SLIDES}
          keyExtractor={(s) => s.key}
          renderItem={renderIntroSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(
              e.nativeEvent.contentOffset.x / Dimensions.get("window").width,
            );
            setIntroIndex(idx);
          }}
          style={{ flex: 1 }}
        />

        {/* Footer: dots + button + skip */}
        <View style={styles.introFooter}>
          <View style={styles.introDots}>
            {INTRO_SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.introDot,
                  i === introIndex && styles.introDotActive,
                ]}
              />
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.introBtn,
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleIntroNext}
          >
            <Text style={styles.introBtnText}>
              {introIndex === INTRO_SLIDES.length - 1
                ? "Get started"
                : "Next"}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </Pressable>
          <Pressable
            onPress={handleIntroSkip}
            hitSlop={10}
            style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.introSkipText}>Skip</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Intro slideshow
  introContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  introSkipText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
  },
  introSlide: {
    width: Dimensions.get("window").width,
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 20,
    justifyContent: "center",
  },
  introPreviewCard: {
    height: 290,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  introTextArea: {
    gap: 8,
    paddingHorizontal: 4,
  },
  introHeadline: {
    fontFamily: FontFamilies.heading,
    fontSize: 24,
    color: "#1f2937",
    textAlign: "center",
    lineHeight: 32,
  },
  introBody: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
  },
  introFooter: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
    alignItems: "center",
  },
  introDots: {
    flexDirection: "row",
    gap: 6,
  },
  introDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#e5e7eb",
  },
  introDotActive: {
    width: 20,
    backgroundColor: Brand.sage700,
  },
  introTopBar: {
    height: 44,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  introBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Brand.sage700,
    paddingVertical: 15,
    borderRadius: 14,
    width: "100%",
  },
  introBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#fff",
  },
});
