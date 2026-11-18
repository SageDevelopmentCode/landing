// Garden detail sheet for one attendance day: who recorded it and who picked up.
import {
  Display,
  Garden,
  GardenAvatar,
  GardenButton,
  GardenFonts,
  GardenTints,
  gardenSheetChrome,
} from "@/components/garden";
import { getAttendanceStatus, PROGRAM_CONFIG, type UserMap } from "@/lib/parent-student-attendance";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { StudentAttendance } from "../useStudentAttendance";
import { PROGRAM_TINT, StatusPill } from "./AttendanceBits";

function longDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StaffChip({ userId, userMap }: { userId: string | null; userMap: UserMap }) {
  const user = userId ? userMap[userId] : null;
  return (
    <View style={s.staff}>
      <GardenAvatar name={user?.full_name ?? null} uri={user?.profile_image_url} size={34} />
      {user ? (
        <Text style={s.staffName} numberOfLines={1} maxFontSizeMultiplier={1.3}>
          {user.full_name.split(" ")[0]}
        </Text>
      ) : null}
    </View>
  );
}

export function AttendanceDetailSheet({ att }: { att: StudentAttendance }) {
  const insets = useSafeAreaInsets();
  const record = att.selected;
  const cfg = record ? PROGRAM_CONFIG[record.program] : null;
  const tint = record ? GardenTints[PROGRAM_TINT[record.program]] : null;
  const status = record ? getAttendanceStatus(record) : null;

  return (
    <BottomSheetModal
      ref={att.detailSheetRef}
      {...gardenSheetChrome}
      enableDynamicSizing
      onDismiss={() => att.setSelected(null)}
    >
      <BottomSheetView style={[s.wrap, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        {record && cfg && tint && status ? (
          <>
            <View style={{ alignItems: "center", gap: 8 }}>
              <Display size={24} style={{ textAlign: "center" }}>
                {longDate(record.date)}
              </Display>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                <View style={[s.program, { backgroundColor: tint.bg }]}>
                  <Ionicons name={cfg.icon as never} size={13} color={tint.fg} />
                  <Text style={[s.programText, { color: tint.fg }]}>{cfg.label}</Text>
                </View>
                <StatusPill status={status} />
              </View>
            </View>

            <View style={s.card}>
              {status === "absent" ? (
                <View style={s.row}>
                  <View style={[s.icon, { backgroundColor: GardenTints.butter.bg }]}>
                    <Ionicons name="moon-outline" size={17} color={GardenTints.butter.fg} />
                  </View>
                  <Text style={s.primary}>Marked absent</Text>
                </View>
              ) : (
                <>
                  <View style={s.row}>
                    <View style={[s.icon, { backgroundColor: GardenTints.sage.bg }]}>
                      <Ionicons name="checkmark-done" size={17} color={GardenTints.sage.fg} />
                    </View>
                    <Text style={[s.primary, { flex: 1 }]}>Recorded by</Text>
                    <StaffChip userId={record.recorded_by} userMap={att.userMap} />
                  </View>
                  {record.picked_up_by_name ? (
                    <>
                      <View style={s.divider} />
                      <View style={s.row}>
                        <View style={[s.icon, { backgroundColor: GardenTints.mint.bg }]}>
                          <Ionicons name="car-outline" size={17} color={GardenTints.mint.fg} />
                        </View>
                        <View style={{ flex: 1, gap: 1 }}>
                          <Text style={s.primary}>Picked Up</Text>
                          <Text style={s.sub}>
                            {record.picked_up_by_name}
                            {record.picked_up_by_relationship ? ` · ${record.picked_up_by_relationship}` : ""}
                          </Text>
                        </View>
                        {record.pickup_recorded_by ? (
                          <StaffChip userId={record.pickup_recorded_by} userMap={att.userMap} />
                        ) : null}
                      </View>
                    </>
                  ) : null}
                </>
              )}
            </View>

            <GardenButton
              label="Close"
              tone="outline"
              fullWidth
              onPress={() => att.detailSheetRef.current?.dismiss()}
            />
          </>
        ) : null}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 22, paddingTop: 6, gap: 18 },
  program: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  programText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12 },
  card: {
    backgroundColor: Garden.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Garden.line,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  primary: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.ink },
  sub: { fontFamily: GardenFonts.bodySemi, fontSize: 13, color: Garden.soft },
  divider: { height: 1, backgroundColor: Garden.line, marginLeft: 50 },
  staff: { alignItems: "center", gap: 3, maxWidth: 70 },
  staffName: { fontFamily: GardenFonts.bodyBold, fontSize: 11.5, color: Garden.soft, textAlign: "center" },
});
