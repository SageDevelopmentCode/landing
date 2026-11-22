// Garden versions of the Home's own sheets (profile, event detail, checklist,
// notifications). Same refs, data and navigation as the classic Home.
import {
  Display,
  Garden,
  GardenButton,
  GardenEmpty,
  GardenFonts,
  GardenRadii,
  GardenSkeleton,
  HandNote,
  PressableScale,
  SeedProgress,
  gardenLayout,
  haptic,
} from "@/components/garden";
import { isFieldFridayCalendarEvent } from "@/lib/calendar";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  CHECKLIST_TASKS,
  TOTAL_TASKS,
  formatEventTime,
  formatFullDate,
  timeAgo,
} from "../constants";
import type { ParentHome } from "../useParentHome";
import type { GardenFeedback } from "./useGardenFeedback";

function Backdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      pressBehavior="close"
      opacity={0.35}
    />
  );
}

const sheetChrome = {
  backgroundStyle: { backgroundColor: Garden.cream, borderRadius: GardenRadii.panel },
  handleIndicatorStyle: { backgroundColor: "rgba(43,42,38,0.25)", width: 44 },
  backdropComponent: Backdrop,
  enablePanDownToClose: true,
};

export function GardenHomeSheets({ h, fb }: { h: ParentHome; fb: GardenFeedback }) {
  const nextTask = CHECKLIST_TASKS.find((t) => !h.onboardingCompleted.has(t.id));

  return (
    <>
      {/* ── Profile ─────────────────────────────────────────── */}
      <BottomSheetModal ref={h.profileSheetRef} {...sheetChrome} enableDynamicSizing>
        <BottomSheetView style={s.profile}>
          <PressableScale
            onPress={() => void fb.pickPhoto()}
            disabled={h.uploadingParentImage}
            accessibilityLabel="Change your profile photo"
            style={s.profileAvatarWrap}
          >
            <View style={s.profileAvatar}>
              {h.parentImageUrl ? (
                <Image source={{ uri: h.parentImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <Text style={s.profileInitials}>{h.initials}</Text>
              )}
            </View>
            <View style={s.profileCamera}>
              <Ionicons
                name={h.uploadingParentImage ? "hourglass-outline" : "camera"}
                size={13}
                color={Garden.white}
              />
            </View>
          </PressableScale>
          <Display size={24}>{h.firstName}</Display>
          <HandNote size={17}>tap your photo to change it</HandNote>
          <GardenButton
            label="Sign out"
            tone="outline"
            icon="log-out-outline"
            fullWidth
            style={{ marginTop: 18 }}
            onPress={() =>
              Alert.alert("Sign out?", "You'll need to sign in again to see your family's updates.", [
                { text: "Cancel", style: "cancel" },
                { text: "Sign out", style: "destructive", onPress: () => void h.signOut() },
              ])
            }
          />
        </BottomSheetView>
      </BottomSheetModal>

      {/* ── Event detail ────────────────────────────────────── */}
      <BottomSheetModal
        ref={h.eventSheetRef}
        {...sheetChrome}
        snapPoints={["62%", "90%"]}
        onDismiss={() => h.setSelectedEvent(null)}
      >
        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {h.selectedEvent && (
            <View style={s.event}>
              <View style={[s.eventStripe, { backgroundColor: h.selectedEvent.color }]} />
              <Display size={26}>{h.selectedEvent.title}</Display>
              {h.selectedEvent.category ? (
                <View style={[s.eventCat, { backgroundColor: h.selectedEvent.color + "22" }]}>
                  <Text style={[s.eventCatText, { color: h.selectedEvent.color }]}>
                    {h.selectedEvent.category}
                  </Text>
                </View>
              ) : null}

              <View style={s.eventRow}>
                <View style={[s.eventIcon, { backgroundColor: Garden.sky }]}>
                  <Ionicons name="calendar-outline" size={17} color="#2f5f8a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.eventPrimary}>{formatFullDate(h.selectedEvent.event_date)}</Text>
                  <Text style={s.eventSub}>{formatEventTime(h.selectedEvent)}</Text>
                </View>
              </View>

              {h.selectedEvent.location ? (
                <Pressable
                  style={s.eventRow}
                  accessibilityRole="link"
                  accessibilityHint="Opens in Maps"
                  onPress={() => {
                    const q = encodeURIComponent(h.selectedEvent!.location!);
                    void Linking.openURL(
                      Platform.OS === "ios"
                        ? `https://maps.apple.com/?q=${q}`
                        : `https://www.google.com/maps/search/?api=1&query=${q}`,
                    );
                  }}
                >
                  <View style={[s.eventIcon, { backgroundColor: Garden.peach }]}>
                    <Ionicons name="location-outline" size={17} color="#a2522a" />
                  </View>
                  <Text style={[s.eventPrimary, { flex: 1 }]}>{h.selectedEvent.location}</Text>
                  <Ionicons name="open-outline" size={14} color={Garden.muted} />
                </Pressable>
              ) : null}

              {h.selectedEvent.description ? (
                <View style={s.eventBlock}>
                  <Text style={s.blockLabel}>Details</Text>
                  <Text style={s.eventDesc}>{h.selectedEvent.description}</Text>
                </View>
              ) : null}

              {(h.selectedEvent.attachment_links ?? []).length > 0 ? (
                <View style={s.eventBlock}>
                  <Text style={s.blockLabel}>Attachments</Text>
                  {(h.selectedEvent.attachment_links ?? []).map((url, i) => (
                    <PressableScale
                      key={i}
                      style={s.attachment}
                      onPress={() => Linking.openURL(url)}
                      accessibilityRole="link"
                    >
                      <Ionicons name="attach-outline" size={16} color={Garden.sageDeep} />
                      <Text style={s.attachmentText} numberOfLines={1}>
                        {url.split("/").pop() ?? `Attachment ${i + 1}`}
                      </Text>
                      <Ionicons name="open-outline" size={14} color={Garden.muted} />
                    </PressableScale>
                  ))}
                </View>
              ) : null}

              <View style={{ gap: 12, marginTop: 22 }}>
                {isFieldFridayCalendarEvent(h.selectedEvent) ? (
                  <GardenButton
                    label="Register now!"
                    tone="coral"
                    fullWidth
                    iconRight="arrow-forward"
                    onPress={() => {
                      h.eventSheetRef.current?.dismiss();
                      h.router.push("/(tabs)/tuition");
                    }}
                  />
                ) : null}
                <GardenButton
                  label="See in calendar"
                  tone="outline"
                  icon="calendar-outline"
                  fullWidth
                  onPress={() => {
                    const date = h.selectedEvent!.event_date;
                    h.eventSheetRef.current?.dismiss();
                    h.router.push({ pathname: "/(tabs)/calendar", params: { selectDate: date } });
                  }}
                />
              </View>
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* ── Get started checklist ───────────────────────────── */}
      <BottomSheetModal
        ref={h.checklistSheetRef}
        {...sheetChrome}
        snapPoints={["70%", "92%"]}
        onDismiss={h.handleChecklistDismiss}
      >
        <BottomSheetScrollView contentContainerStyle={s.checklist}>
          <View style={{ gap: 6 }}>
            <Display size={28}>
              {h.completedTaskCount === TOTAL_TASKS ? "All done!" : "Get Started"}
            </Display>
            <Text style={s.checkSub}>
              {h.completedTaskCount} of {TOTAL_TASKS} completed
            </Text>
            <SeedProgress
              done={h.completedTaskCount}
              total={TOTAL_TASKS}
              doneFlags={CHECKLIST_TASKS.map((t) => h.onboardingCompleted.has(t.id))}
            />
          </View>

          {h.completedTaskCount === TOTAL_TASKS ? (
            <GardenEmpty emoji="🎉" title="All done! Great job getting set up." tint="mint" />
          ) : nextTask ? (
            <View style={s.nextUp}>
              <HandNote size={17} color="#7a5a00">next up →</HandNote>
              <Text style={s.nextUpTitle}>{nextTask.label}</Text>
              <Text style={s.nextUpDesc}>{nextTask.desc}</Text>
              <GardenButton
                label="Let's do it"
                tone="coral"
                size="sm"
                iconRight="arrow-forward"
                style={{ marginTop: 10 }}
                onPress={() => h.navigateChecklist(nextTask.id)}
              />
            </View>
          ) : null}

          {h.onboardingLoading ? (
            <View style={{ gap: 12 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <GardenSkeleton key={i} width="100%" height={56} radius={18} />
              ))}
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {CHECKLIST_TASKS.map((task, i) => {
                const done = h.onboardingCompleted.has(task.id);
                return (
                  <Animated.View
                    key={task.id}
                    layout={gardenLayout()}
                    style={[s.task, done && s.taskDone]}
                  >
                    <Text style={[s.taskStep, done && { color: Garden.sageDeep }]}>{i + 1}</Text>
                    <Pressable
                      style={{ flex: 1, paddingVertical: 4 }}
                      onPress={() => h.navigateChecklist(task.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`${task.label}. ${task.desc}`}
                      accessibilityHint="Opens the screen for this step"
                    >
                      <Text style={[s.taskLabel, done && s.taskLabelDone]}>{task.label}</Text>
                      <Text style={s.taskDesc}>{task.desc}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void fb.toggleTask(task.id)}
                      hitSlop={10}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: done }}
                      accessibilityLabel={`Mark “${task.label}” ${done ? "not done" : "done"}`}
                      style={[s.check, done && s.checkDone]}
                    >
                      {done ? (
                        <Animated.View entering={FadeIn.duration(150)}>
                          <Ionicons name="checkmark" size={15} color={Garden.white} />
                        </Animated.View>
                      ) : null}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          )}
          <HandNote size={15} color={Garden.muted} style={{ textAlign: "center" }}>
            tap a step to go there · tap the circle to check it off
          </HandNote>
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* ── Notifications ───────────────────────────────────── */}
      <BottomSheetModal ref={h.notifSheetRef} {...sheetChrome} snapPoints={["58%", "90%"]}>
        <BottomSheetScrollView contentContainerStyle={s.notif}>
          <Display size={26}>Notifications</Display>
          {h.notifLoading ? (
            <View style={{ gap: 10, marginTop: 8 }}>
              {[0, 1, 2].map((i) => (
                <GardenSkeleton key={i} width="100%" height={60} radius={18} />
              ))}
            </View>
          ) : h.notifItems.length === 0 ? (
            <GardenEmpty
              emoji="🌤️"
              title="No new notifications"
              body="You're all caught up."
              tint="sky"
              style={{ marginTop: 8 }}
            />
          ) : (
            <View style={{ gap: 8, marginTop: 8 }}>
              {h.notifItems.map((item) => (
                <PressableScale
                  key={item.id}
                  style={s.notifRow}
                  accessibilityLabel={`${item.name}, ${item.unreadCount} unread. ${item.preview}`}
                  onPress={() => {
                    h.notifSheetRef.current?.dismiss();
                    if (item.kind === "direct") {
                      h.router.push({
                        pathname: "/(tabs)/messages/[id]",
                        params: {
                          id: item.conversationId!,
                          otherUserName: item.otherUserName!,
                          otherUserAvatar: item.otherUserAvatar ?? "",
                          otherUserId: item.otherUserId!,
                        },
                      });
                    } else {
                      h.router.push({
                        pathname: "/(tabs)/messages/channel/[channelId]",
                        params: {
                          channelId: item.channelId!,
                          channelName: item.channelName!,
                          isMember: item.isMember ? "true" : "false",
                          isDefault: item.isDefault ? "true" : "false",
                          memberCount: String(item.memberCount ?? 0),
                        },
                      });
                    }
                  }}
                >
                  <View
                    style={[
                      s.notifIcon,
                      { backgroundColor: item.kind === "direct" ? Garden.mint : Garden.lav },
                    ]}
                  >
                    <Ionicons
                      name={item.kind === "direct" ? "chatbubble-outline" : "people-outline"}
                      size={17}
                      color={Garden.sageDeep}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={s.notifTop}>
                      <Text style={s.notifName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={s.notifTime}>{timeAgo(item.timestamp)}</Text>
                    </View>
                    <Text style={s.notifPreview} numberOfLines={1}>
                      {item.preview}
                    </Text>
                  </View>
                  <View style={s.unread}>
                    <Text style={s.unreadText}>{item.unreadCount > 9 ? "9+" : item.unreadCount}</Text>
                  </View>
                </PressableScale>
              ))}
            </View>
          )}
          <GardenButton
            label="View all messages"
            tone="outline"
            iconRight="arrow-forward"
            fullWidth
            style={{ marginTop: 18 }}
            onPress={() => {
              haptic.tap();
              h.notifSheetRef.current?.dismiss();
              h.router.push("/(tabs)/messages" as any);
            }}
          />
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  );
}

const s = StyleSheet.create({
  profile: { alignItems: "center", paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40, gap: 4 },
  profileAvatarWrap: { width: 92, height: 92, marginBottom: 10 },
  profileAvatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    overflow: "hidden",
    backgroundColor: Garden.mint,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: Garden.white,
  },
  profileInitials: { fontFamily: GardenFonts.display, fontSize: 32, color: Garden.sageDeep },
  profileCamera: {
    position: "absolute",
    right: 0,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Garden.coralDeep,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Garden.cream,
  },
  event: { paddingHorizontal: 22, paddingTop: 6, gap: 10 },
  eventStripe: { width: 44, height: 6, borderRadius: 3 },
  eventCat: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  eventCatText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12 },
  eventRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8, minHeight: 44 },
  eventIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  eventPrimary: { fontFamily: GardenFonts.bodyBold, fontSize: 15, color: Garden.ink },
  eventSub: { fontFamily: GardenFonts.body, fontSize: 13, color: Garden.soft },
  eventBlock: { marginTop: 12, gap: 6 },
  blockLabel: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Garden.muted,
  },
  eventDesc: { fontFamily: GardenFonts.body, fontSize: 15, lineHeight: 22, color: Garden.soft },
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
  checklist: { paddingHorizontal: 20, paddingBottom: 48, gap: 16 },
  checkSub: { fontFamily: GardenFonts.bodySemi, fontSize: 14, color: Garden.soft },
  nextUp: {
    backgroundColor: "#fff3c4",
    borderRadius: 20,
    padding: 16,
    transform: [{ rotate: "-0.6deg" }],
  },
  nextUpTitle: { fontFamily: GardenFonts.display, fontSize: 19, color: Garden.ink, marginTop: 2 },
  nextUpDesc: { fontFamily: GardenFonts.body, fontSize: 14, color: Garden.soft, marginTop: 2 },
  task: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Garden.white,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Garden.line,
  },
  taskDone: { backgroundColor: "#f3faf4", borderColor: "#d7ecdb" },
  taskStep: { width: 22, textAlign: "center", fontFamily: GardenFonts.hand, fontSize: 20, color: Garden.muted },
  taskLabel: { fontFamily: GardenFonts.bodyBold, fontSize: 15, color: Garden.ink },
  taskLabelDone: { color: Garden.muted, textDecorationLine: "line-through" },
  taskDesc: { fontFamily: GardenFonts.body, fontSize: 12.5, color: Garden.soft, marginTop: 1 },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(43,42,38,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkDone: { backgroundColor: Garden.sage, borderColor: Garden.sage },
  notif: { paddingHorizontal: 20, paddingBottom: 44 },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Garden.white,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: Garden.line,
  },
  notifIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  notifTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  notifName: { flex: 1, fontFamily: GardenFonts.bodyBold, fontSize: 14.5, color: Garden.ink },
  notifTime: { fontFamily: GardenFonts.body, fontSize: 12, color: Garden.muted },
  notifPreview: { fontFamily: GardenFonts.body, fontSize: 13, color: Garden.soft },
  unread: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    backgroundColor: Garden.coralDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11, color: Garden.white },
});
