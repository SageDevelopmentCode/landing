// Garden event detail sheet for the parent and (view-only) staff calendars.
import {
  Display,
  Garden,
  GardenButton,
  GardenFonts,
  HandNote,
  PressableScale,
  gardenSheetChrome,
} from "@/components/garden";
import { isFieldFridayCalendarEvent } from "@/lib/calendar";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, Text, View } from "react-native";
import { attachmentName, formatEventTime, formatFullDate } from "../calendarUtils";
import type { ParentCalendar } from "../useParentCalendar";
import type { CalendarFeedback } from "./useCalendarFeedback";

export function EventDetailSheet({ c, fb }: { c: ParentCalendar; fb: CalendarFeedback }) {
  const evt = c.selectedEvent;
  const attachments = evt?.attachment_links ?? [];
  const canManage = c.canManage(evt);

  return (
    <BottomSheetModal
      ref={c.detailSheetRef}
      {...gardenSheetChrome}
      snapPoints={["62%", "90%"]}
      onDismiss={() => c.setSelectedEvent(null)}
    >
      <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        {evt ? (
          <View style={s.wrap}>
            <View style={[s.stripe, { backgroundColor: evt.color }]} />
            <Display size={26}>{evt.title}</Display>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {evt.category ? (
                <View style={[s.cat, { backgroundColor: evt.color + "22" }]}>
                  <Text style={[s.catText, { color: evt.color }]}>{evt.category}</Text>
                </View>
              ) : null}
              {canManage ? (
                <View style={[s.cat, { backgroundColor: "#e1eee3" }]}>
                  <Text style={[s.catText, { color: Garden.sageDeep }]}>🌱 You shared this</Text>
                </View>
              ) : null}
            </View>

            <View style={s.row}>
              <View style={[s.icon, { backgroundColor: Garden.sky }]}>
                <Ionicons name="calendar-outline" size={17} color="#2f5f8a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.primary}>{formatFullDate(evt.event_date)}</Text>
                <Text style={s.sub}>{formatEventTime(evt)}</Text>
              </View>
            </View>

            {evt.location ? (
              <PressableScale
                pressedScale={0.98}
                style={s.row}
                accessibilityRole="link"
                accessibilityLabel={`${evt.location}. Opens in Maps`}
                onPress={() => {
                  const q = encodeURIComponent(evt.location!);
                  void fb.openMaps(
                    Platform.OS === "ios"
                      ? `https://maps.apple.com/?q=${q}`
                      : `https://www.google.com/maps/search/?api=1&query=${q}`,
                  );
                }}
              >
                <View style={[s.icon, { backgroundColor: Garden.peach }]}>
                  <Ionicons name="location-outline" size={17} color="#a2522a" />
                </View>
                <Text style={[s.primary, { flex: 1 }]}>{evt.location}</Text>
                <Ionicons name="open-outline" size={14} color={Garden.muted} />
              </PressableScale>
            ) : null}

            {evt.description ? (
              <View style={s.block}>
                <Text style={s.label}>Details</Text>
                <Text style={s.desc} selectable>
                  {evt.description}
                </Text>
              </View>
            ) : null}

            {attachments.length > 0 ? (
              <View style={s.block}>
                <Text style={s.label}>Attachments</Text>
                {attachments.map((url, i) => (
                  <PressableScale
                    key={`${url}-${i}`}
                    pressedScale={0.98}
                    style={s.attachment}
                    accessibilityRole="link"
                    accessibilityLabel={`Open ${attachmentName(url, i)}`}
                    onPress={() => void fb.openAttachment(url)}
                  >
                    <Ionicons name="attach-outline" size={17} color={Garden.sageDeep} />
                    <Text style={s.attachmentText} numberOfLines={1}>
                      {attachmentName(url, i)}
                    </Text>
                    <Ionicons name="open-outline" size={14} color={Garden.muted} />
                  </PressableScale>
                ))}
              </View>
            ) : null}

            {c.canRegister && isFieldFridayCalendarEvent(evt) ? (
              <View style={{ marginTop: 18, gap: 6 }}>
                <HandNote size={16} style={{ textAlign: "center" }}>
                  sign up here →
                </HandNote>
                <GardenButton
                  label="Register now!"
                  tone="coral"
                  iconRight="arrow-forward"
                  fullWidth
                  onPress={c.register}
                />
              </View>
            ) : null}

            {canManage ? (
              <View style={{ gap: 12, marginTop: 20 }}>
                <GardenButton
                  label="Edit event"
                  tone="ink"
                  icon="create-outline"
                  fullWidth
                  onPress={() => fb.openEdit(evt)}
                />
                <GardenButton
                  label="Delete event"
                  tone="outline"
                  icon="trash-outline"
                  fullWidth
                  onPress={() => fb.confirmDelete(evt)}
                />
              </View>
            ) : null}
          </View>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 22, paddingTop: 6, gap: 10 },
  stripe: { width: 44, height: 6, borderRadius: 3 },
  cat: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  catText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8, minHeight: 44 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  primary: { fontFamily: GardenFonts.bodyBold, fontSize: 15, color: Garden.ink },
  sub: { fontFamily: GardenFonts.body, fontSize: 13, color: Garden.soft },
  block: { marginTop: 12, gap: 8 },
  label: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Garden.muted,
  },
  desc: { fontFamily: GardenFonts.body, fontSize: 15, lineHeight: 22, color: Garden.soft },
  attachment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Garden.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 46,
    borderWidth: 1,
    borderColor: Garden.line,
  },
  attachmentText: { flex: 1, fontFamily: GardenFonts.bodySemi, fontSize: 14, color: Garden.sageDeep },
});
