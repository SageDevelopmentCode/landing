import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import {
  HomeTheme,
  homeCardSurface,
} from "@/components/home/homeTheme";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { FontFamilies } from "@/constants/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type StaffUpcomingCalendarEvent = {
  id: string;
  title: string;
  event_date: string;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  color: string;
  category: string | null;
  description: string | null;
  location: string | null;
  attachment_links: string[] | null;
};

function fmt12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function formatEventTime(evt: StaffUpcomingCalendarEvent): string {
  if (evt.is_all_day) return "All day";
  if (evt.start_time && evt.end_time)
    return `${fmt12(evt.start_time)} – ${fmt12(evt.end_time)}`;
  if (evt.start_time) return fmt12(evt.start_time);
  return "All day";
}

export function formatShortDate(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatFullDate(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

type Props = {
  events: StaffUpcomingCalendarEvent[];
  loading: boolean;
  onEventPress: (event: StaffUpcomingCalendarEvent) => void;
  onViewAll: () => void;
};

function SkeletonRows() {
  return (
    <View style={styles.loadingStack}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 14,
            ...homeCardSurface,
          }}
        >
          <SkeletonBox width={3} height={40} borderRadius={9999} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonBox width="65%" height={14} borderRadius={4} />
            <SkeletonBox width="45%" height={12} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function StaffUpcomingEventsSection({
  events,
  loading,
  onEventPress,
  onViewAll,
}: Props) {
  return (
    <View style={styles.section}>
      <HomeSectionHeader
        title="Upcoming events"
        onViewAll={loading ? undefined : onViewAll}
      />

      {loading ? (
        <SkeletonRows />
      ) : events.length === 0 ? (
        <Text style={styles.emptyText}>No upcoming events</Text>
      ) : (
        <View style={styles.rowStack}>
          {events.map((evt) => (
            <Pressable
              key={evt.id}
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
              onPress={() => onEventPress(evt)}
            >
              <View style={styles.row}>
                <View
                  style={[styles.accent, { backgroundColor: evt.color }]}
                />
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {evt.title}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {formatShortDate(evt.event_date)}
                    {"  ·  "}
                    {formatEventTime(evt)}
                  </Text>
                </View>
                {evt.category ? (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: evt.color + "22" },
                    ]}
                  >
                    <Text style={[styles.badgeTxt, { color: evt.color }]}>
                      {evt.category}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: HomeTheme.sectionGap,
    marginHorizontal: HomeTheme.horizontalInset,
    marginBottom: 4,
    gap: 10,
  },
  loadingStack: {
    gap: 8,
  },
  emptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: HomeTheme.meta,
  },
  rowStack: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    ...homeCardSurface,
  },
  accent: {
    width: 3,
    height: 40,
    borderRadius: 9999,
    flexShrink: 0,
  },
  rowBody: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  rowTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: HomeTheme.authorName,
  },
  rowMeta: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: HomeTheme.meta,
  },
  badge: {
    alignSelf: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  badgeTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
  },
});
