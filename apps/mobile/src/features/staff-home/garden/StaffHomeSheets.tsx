// Garden sheets for the staff Home, plus StaffHomeChrome which mounts every
// sheet (ours + the shared staff sheets) and the confetti layer once.
import { ActivityPreferencesSheet } from "@/components/ActivityPreferencesSheet";
import {
  Confetti,
  Display,
  Garden,
  GardenAvatar,
  GardenButton,
  GardenEmpty,
  GardenField,
  GardenFonts,
  GardenRadii,
  GardenSkeleton,
  GardenTints,
  HandNote,
  MIN_TAP,
  Pill,
  PressableScale,
  gardenCard,
  gardenPopIn,
  gardenSheetChrome,
  type GardenTint,
} from "@/components/garden";
import { StaffAllBirthdaysSheet } from "@/components/StaffAllBirthdaysSheet";
import { StaffConferenceBookingsSheet } from "@/components/StaffConferenceBookingsSheet";
import { StaffSchoolDayFoodPrefsSheet } from "@/components/StaffSchoolDayFoodPrefsSheet";
import { StaffWeekActivityPrefsSheet } from "@/components/StaffWeekActivityPrefsSheet";
import type { SchoolYearTodayStudent } from "@/lib/school-year-today-students";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { ActivityIndicator, Linking, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  formatEventTime,
  formatFullDate,
  getStudentDayStatus,
  isStudentCheckedIn,
  roleLabel,
  shortName,
} from "../staffHomeUtils";
import type { StaffHome } from "../useStaffHome";
import { StatusPill, StudentAvatar, UnpaidPill } from "./StaffHomeParts";
import type { StaffHomeFeedback } from "./useStaffHomeFeedback";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

// ─────────────────────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────────────────────
function ProfileSheet({ h, fb }: { h: StaffHome; fb: StaffHomeFeedback }) {
  return (
    <BottomSheetModal ref={h.avatarSheetRef} {...gardenSheetChrome} enableDynamicSizing>
      <BottomSheetView style={sh.wrap}>
        <View style={{ alignItems: "center", gap: 8 }}>
          <PressableScale
            onPress={() => void fb.pickPhoto()}
            disabled={h.uploadingImage}
            accessibilityLabel={h.uploadingImage ? "Uploading your photo" : "Change your profile photo"}
            style={pf.avatarWrap}
          >
            <View style={pf.avatar}>
              {h.profileImageUrl ? (
                <Image source={{ uri: h.profileImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <Text style={pf.initials}>{h.initials}</Text>
              )}
              {h.uploadingImage ? (
                <View style={pf.uploading}>
                  <ActivityIndicator color={Garden.white} />
                </View>
              ) : null}
            </View>
            <View style={pf.camera}>
              <Ionicons name="camera" size={13} color={Garden.white} />
            </View>
          </PressableScale>
          <Display size={24} numberOfLines={1}>
            {h.fullName || " "}
          </Display>
          {h.role ? <Pill tint={h.role === "super_admin" ? "lav" : "sage"} style={{ alignSelf: "center" }}>
              {roleLabel(h.role)}
            </Pill> : null}
        </View>

        <View style={{ gap: 12, marginTop: 20 }}>
          <GardenButton
            label="View Profile"
            tone="outline"
            icon="person-outline"
            fullWidth
            onPress={() => {
              h.avatarSheetRef.current?.dismiss();
              h.router.push({
                pathname: "/(staff)/teacher/[teacherId]" as any,
                params: { teacherId: h.userId, teacherName: h.fullName, classroom: "", program: "" },
              });
            }}
          />
          <PressableScale
            onPress={fb.confirmSignOut}
            accessibilityLabel="Sign out"
            style={pf.signOut}
          >
            <Ionicons name="log-out-outline" size={19} color={Garden.danger} />
            <Text style={pf.signOutText}>Sign out</Text>
          </PressableScale>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const pf = StyleSheet.create({
  avatarWrap: { width: 88, height: 88 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: "hidden",
    backgroundColor: Garden.mint,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Garden.white,
  },
  initials: { fontFamily: GardenFonts.display, fontSize: 28, color: Garden.sageDeep },
  uploading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(43,42,38,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Garden.sage,
    borderWidth: 2,
    borderColor: Garden.white,
    alignItems: "center",
    justifyContent: "center",
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: MIN_TAP + 4,
  },
  signOutText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.danger },
});

// ─────────────────────────────────────────────────────────────────────────────
// Student actions
// ─────────────────────────────────────────────────────────────────────────────
type Tile = {
  key: string;
  emoji: string;
  label: string;
  active: boolean;
  saving: boolean;
  tint: GardenTint;
  solid: string;
  onPress: () => void;
};

function StepLabel({ n, label }: { n: number; label: string }) {
  return (
    <View style={sa.step}>
      <View style={sa.stepNum}>
        <Text style={sa.stepNumText}>{n}</Text>
      </View>
      <Text style={sa.stepLabel}>{label}</Text>
    </View>
  );
}

function StudentActionSheet({ h, fb }: { h: StaffHome; fb: StaffHomeFeedback }) {
  const student = h.selectedStudent;
  return (
    <BottomSheetModal
      ref={h.studentActionSheetRef}
      {...gardenSheetChrome}
      enableDynamicSizing
      onDismiss={() => h.setSelectedStudent(null)}
    >
      <BottomSheetView style={sh.wrap}>
        {student ? <StudentActionBody h={h} fb={fb} student={student} /> : null}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

function StudentActionBody({
  h,
  fb,
  student,
}: {
  h: StaffHome;
  fb: StaffHomeFeedback;
  student: SchoolYearTodayStudent;
}) {
  const friday = h.selectedIsFriday;
  const record = h.getActiveAttendanceRecord(student);
  const present = isStudentCheckedIn(record);
  const saving = h.pending[student.student_id] ?? null;
  const status = getStudentDayStatus(student, friday);
  const isPaid = friday ? student.hasSchoolYearFridayEnrollment : student.hasSchoolYearEnrollment;
  const name = shortName(student.name);

  const tiles: Tile[] = [
    {
      key: friday ? "school_year_friday" : "school_year",
      emoji: friday ? "🌿" : "🎒",
      label: present ? (friday ? "Field Friday" : "Present") : "Mark Present",
      active: present,
      saving: saving === (friday ? "school_year_friday" : "school_year"),
      tint: "sage",
      solid: Garden.sage,
      onPress: () => void fb.togglePresent(student),
    },
    {
      key: friday ? "school_year_friday_absent" : "school_year_absent",
      emoji: "🚫",
      label: record?.marked_absent ? "Absent" : "Mark Absent",
      active: !!record?.marked_absent,
      saving: saving === (friday ? "school_year_friday_absent" : "school_year_absent"),
      tint: "butter",
      solid: "#d9a92a",
      onPress: () => void fb.toggleAbsent(student),
    },
  ];
  if (student.hasAftercareEnrollment || !!student.aftercareRecord) {
    tiles.push({
      key: "aftercare",
      emoji: "🏠",
      label: student.aftercareRecord ? "Aftercare" : "Log Aftercare",
      active: !!student.aftercareRecord,
      saving: saving === "aftercare",
      tint: "lav",
      solid: "#8a68a6",
      onPress: () => void fb.toggleAftercare(student),
    });
  }

  const hiding = h.rosterActionStudentId === student.student_id;

  return (
    <>
      {/* Header */}
      <View style={sa.header}>
        <StudentAvatar student={student} size={56} />
        <View style={{ flex: 1, gap: 6 }}>
          <Display size={24} numberOfLines={1}>
            {name}
          </Display>
          <View style={{ flexDirection: "row", gap: 5, flexWrap: "wrap" }}>
            {status !== "unmarked" ? <StatusPill status={status} /> : null}
            {student.has_allergies === "yes" ? (
              <View style={[sa.pill, { backgroundColor: GardenTints.coral.bg }]}>
                <Ionicons name="medical" size={11} color={Garden.danger} />
                <Text style={[sa.pillText, { color: Garden.danger }]}>Has allergies</Text>
              </View>
            ) : null}
            {!isPaid ? <UnpaidPill /> : null}
          </View>
        </View>
        <PressableScale
          hitSlop={8}
          accessibilityRole="link"
          accessibilityLabel={`Open ${name}'s profile`}
          onPress={() => {
            h.studentActionSheetRef.current?.dismiss();
            h.router.push({
              pathname: "/(staff)/students/[studentId]" as any,
              params: {
                studentId: student.student_id,
                studentName: student.name ?? "",
                program: student.program ?? "",
                classroom: "",
                // Home's roster is school-wide, so skip the "assigned to me" check
                // (same as the Students tab's All students view).
                allStudentsView: "1",
              },
            });
          }}
          style={sa.profileLink}
        >
          <Text style={sa.profileLinkText}>Profile</Text>
          <Ionicons name="arrow-forward" size={14} color={Garden.sageDeep} />
        </PressableScale>
      </View>

      {/* Step 1: attendance */}
      <StepLabel n={1} label={friday ? "Field Friday attendance" : "Attendance"} />
      <View style={sa.tiles}>
        {tiles.map((tile) => {
          const t = GardenTints[tile.tint];
          return (
            <PressableScale
              key={tile.key}
              haptics={false}
              onPress={tile.onPress}
              disabled={saving !== null}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: tile.active, disabled: saving !== null, busy: tile.saving }}
              accessibilityLabel={tile.label}
              style={[
                sa.tile,
                tile.active
                  ? { backgroundColor: tile.solid, borderColor: tile.solid }
                  : { backgroundColor: Garden.white, borderColor: Garden.line },
              ]}
            >
              {tile.saving ? (
                <ActivityIndicator color={tile.active ? Garden.white : t.fg} />
              ) : (
                <Text style={sa.tileEmoji}>{tile.emoji}</Text>
              )}
              <Text
                style={[sa.tileLabel, { color: tile.active ? Garden.white : Garden.ink }]}
                numberOfLines={2}
                maxFontSizeMultiplier={1.3}
              >
                {tile.label}
              </Text>
              {tile.active && !tile.saving ? (
                <Animated.View entering={gardenPopIn()} style={sa.tileCheck}>
                  <Ionicons name="checkmark-circle" size={18} color={Garden.white} />
                </Animated.View>
              ) : null}
            </PressableScale>
          );
        })}
      </View>

      {/* Step 2: pickup */}
      <StepLabel n={2} label="Pickup" />
      {record?.picked_up_by_name && present ? (
        <Animated.View entering={FadeIn} style={sa.pickedUp}>
          <Ionicons name="car" size={18} color={GardenTints.mint.fg} />
          <Text style={sa.pickedUpText}>Picked up · {record.picked_up_by_name}</Text>
        </Animated.View>
      ) : present ? (
        <GardenButton
          label="Record Pickup"
          tone="coral"
          icon="car-outline"
          fullWidth
          onPress={() => void fb.openPickup(student)}
        />
      ) : (
        <View style={sa.hintBox}>
          <Ionicons name="information-circle-outline" size={17} color={Garden.muted} />
          <Text style={sa.hintText}>Mark {name} present first, then record pickup here.</Text>
        </View>
      )}

      {/* Hide */}
      <PressableScale
        onPress={() => void fb.hideStudent(student)}
        disabled={h.rosterActionStudentId !== null || saving !== null}
        accessibilityLabel="Hide from today's list"
        accessibilityHint="You can undo right after"
        style={sa.hide}
      >
        {hiding ? (
          <ActivityIndicator size="small" color={Garden.muted} />
        ) : (
          <Ionicons name="eye-off-outline" size={17} color={Garden.soft} />
        )}
        <Text style={sa.hideText}>Hide from today&apos;s list</Text>
      </PressableScale>
    </>
  );
}

const sa = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: GardenRadii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11.5 },
  profileLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: MIN_TAP,
    paddingHorizontal: 12,
    borderRadius: GardenRadii.pill,
    backgroundColor: GardenTints.sage.bg,
  },
  profileLinkText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13.5, color: Garden.sageDeep },
  step: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, marginTop: 4 },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Garden.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12, color: Garden.white },
  stepLabel: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Garden.muted,
  },
  tiles: { flexDirection: "row", gap: 10, marginBottom: 18 },
  tile: {
    flex: 1,
    minHeight: 96,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  tileEmoji: { fontSize: 24 },
  tileLabel: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13.5, textAlign: "center" },
  tileCheck: { position: "absolute", top: 8, right: 8 },
  pickedUp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: GardenTints.mint.bg,
  },
  pickedUpText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: GardenTints.mint.fg },
  hintBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Garden.line,
  },
  hintText: { flex: 1, fontFamily: GardenFonts.bodySemi, fontSize: 13.5, color: Garden.soft },
  hide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: MIN_TAP + 4,
    marginTop: 16,
  },
  hideText: { fontFamily: GardenFonts.bodyBold, fontSize: 14, color: Garden.soft },
});

// ─────────────────────────────────────────────────────────────────────────────
// Pickup: who picked up?
// ─────────────────────────────────────────────────────────────────────────────
function PickupSheet({ h, fb }: { h: StaffHome; fb: StaffHomeFeedback }) {
  const student = h.pickupStudent;
  return (
    <BottomSheetModal
      ref={h.pickupSheetRef}
      {...gardenSheetChrome}
      snapPoints={["62%", "90%"]}
      enableDynamicSizing={false}
      onDismiss={h.resetPickupSheet}
    >
      <BottomSheetScrollView contentContainerStyle={[sh.wrap, { paddingBottom: 48 }]}>
        <Display size={26}>Who picked up?</Display>
        {student ? (
          <HandNote size={17} style={{ marginBottom: 14 }}>
            {shortName(student.name)} · step 2 of 2
          </HandNote>
        ) : null}

        {h.pickupPersonsLoading ? (
          <View style={{ gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <GardenSkeleton key={i} width="100%" height={58} radius={18} />
            ))}
          </View>
        ) : h.pickupPersons.length === 0 ? (
          <GardenEmpty emoji="🚗" title="No authorized pickup persons on file." tint="butter" />
        ) : (
          <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
            {h.pickupPersons.map((p) => {
              const selected = h.selectedPickupPerson?.name === p.name;
              return (
                <PressableScale
                  key={p.name}
                  haptics="select"
                  pressedScale={0.98}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${p.name}${p.relationship ? `, ${p.relationship}` : ""}`}
                  onPress={() => h.setSelectedPickupPerson(p)}
                  style={[
                    pk.row,
                    selected && { borderColor: Garden.sage, backgroundColor: GardenTints.sage.bg },
                  ]}
                >
                  <View style={[pk.radio, selected && { borderColor: Garden.sage }]}>
                    {selected ? <Animated.View entering={gardenPopIn()} style={pk.radioDot} /> : null}
                  </View>
                  <GardenAvatar name={p.name} size={38} />
                  <View style={{ flex: 1 }}>
                    <Text style={[pk.name, selected && { color: Garden.sageDeep }]}>{p.name}</Text>
                    {p.relationship ? <Text style={pk.rel}>{p.relationship}</Text> : null}
                  </View>
                  {selected ? <Ionicons name="checkmark-circle" size={20} color={Garden.sage} /> : null}
                </PressableScale>
              );
            })}
          </View>
        )}

        <View style={{ marginTop: 20, gap: 8 }}>
          {!h.selectedPickupPerson && h.pickupPersons.length > 0 && !h.pickupPersonsLoading ? (
            <HandNote size={16} color={Garden.muted} style={{ textAlign: "center" }}>
              pick a name above ↑
            </HandNote>
          ) : null}
          <GardenButton
            label="Confirm Pickup"
            loadingLabel="Saving…"
            loading={h.pickupSaving}
            disabled={!h.selectedPickupPerson}
            tone="coral"
            icon="car-outline"
            fullWidth
            onPress={() => void fb.confirmPickup()}
          />
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const pk = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Garden.line,
    backgroundColor: Garden.white,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#cfc6b8",
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: Garden.sage },
  name: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15.5, color: Garden.ink },
  rel: { fontFamily: GardenFonts.body, fontSize: 12.5, color: Garden.muted },
});

// ─────────────────────────────────────────────────────────────────────────────
// Add Student
// ─────────────────────────────────────────────────────────────────────────────
function AddStudentRow({
  student,
  busy,
  disabled,
  hidden,
  onPress,
}: {
  student: SchoolYearTodayStudent;
  busy: boolean;
  disabled: boolean;
  hidden: boolean;
  onPress: () => void;
}) {
  const name = shortName(student.name);
  return (
    <PressableScale
      pressedScale={0.98}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={hidden ? `${name}. Restore to list` : `${name}, unpaid. Add to roster`}
      style={as.row}
    >
      <GardenAvatar name={student.name} uri={student.profile_image_url} seed={student.student_id} size={42} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={as.name} numberOfLines={1}>
          {name}
        </Text>
        {hidden ? <Text style={as.hint}>Tap to restore to list</Text> : <UnpaidPill />}
      </View>
      {busy ? (
        <ActivityIndicator size="small" color={Garden.sageDeep} />
      ) : (
        <View style={as.action}>
          <Ionicons name={hidden ? "eye-outline" : "add"} size={20} color={Garden.sageDeep} />
        </View>
      )}
    </PressableScale>
  );
}

function AddStudentSheet({ h, fb }: { h: StaffHome; fb: StaffHomeFeedback }) {
  const q = h.addStudentSearch.trim().toLowerCase();
  const match = (s: SchoolYearTodayStudent) => !q || (s.name ?? "").toLowerCase().includes(q);
  const hidden = h.hiddenStudents.filter(match);
  const unpaid = h.unpaidStudents.filter(match);
  const nothingAtAll = h.unpaidStudents.length === 0 && h.hiddenStudents.length === 0;

  return (
    <BottomSheetModal
      ref={h.addStudentSheetRef}
      {...gardenSheetChrome}
      snapPoints={["62%", "90%"]}
      enableDynamicSizing={false}
      keyboardBehavior="extend"
      onDismiss={() => h.setAddStudentSearch("")}
    >
      <BottomSheetScrollView
        contentContainerStyle={[sh.wrap, { paddingBottom: 48 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Display size={26}>Add Student</Display>
        <HandNote size={16} style={{ marginBottom: 12 }}>
          add someone to this day&apos;s list
        </HandNote>
        <GardenField
          icon="search-outline"
          clearable
          placeholder="Search students…"
          value={h.addStudentSearch}
          onChangeText={h.setAddStudentSearch}
          autoCorrect={false}
          returnKeyType="search"
          InputComponent={BottomSheetTextInput as never}
          containerStyle={{ marginBottom: 14 }}
        />

        {h.unpaidStudentsLoading ? (
          <View style={{ gap: 10 }}>
            {[0, 1, 2, 3].map((i) => (
              <GardenSkeleton key={i} width="100%" height={60} radius={18} />
            ))}
          </View>
        ) : nothingAtAll ? (
          <GardenEmpty emoji="🎒" title="All enrolled students are already in today's list." tint="mint" />
        ) : hidden.length === 0 && unpaid.length === 0 ? (
          <GardenEmpty emoji="🔍" title={`No students match “${h.addStudentSearch.trim()}”`} tint="sky" />
        ) : (
          <View style={{ gap: 8 }}>
            {hidden.length > 0 ? <Text style={sh.blockLabel}>Hidden today</Text> : null}
            {hidden.map((student) => (
              <AddStudentRow
                key={`hidden-${student.student_id}`}
                student={student}
                hidden
                busy={h.rosterActionStudentId === student.student_id}
                disabled={h.rosterActionStudentId !== null}
                onPress={() => void fb.restoreStudent(student)}
              />
            ))}
            {unpaid.length > 0 ? (
              <Text style={[sh.blockLabel, hidden.length > 0 && { marginTop: 10 }]}>Add to roster</Text>
            ) : null}
            {unpaid.map((student) => (
              <AddStudentRow
                key={student.student_id}
                student={student}
                hidden={false}
                busy={h.rosterActionStudentId === student.student_id}
                disabled={h.rosterActionStudentId !== null}
                onPress={() => void fb.addStudent(student)}
              />
            ))}
          </View>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const as = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...gardenCard,
    borderRadius: 18,
  },
  name: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.ink },
  hint: { fontFamily: GardenFonts.body, fontSize: 12.5, color: Garden.muted },
  action: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GardenTints.sage.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Allergies for Today
// ─────────────────────────────────────────────────────────────────────────────
function HealthBlock({
  icon,
  tint,
  label,
  body,
}: {
  icon: IoniconName;
  tint: GardenTint;
  label: string;
  body: string;
}) {
  const t = GardenTints[tint];
  return (
    <View style={al.block}>
      <View style={[al.label, { backgroundColor: t.bg }]}>
        <Ionicons name={icon} size={12} color={t.fg} />
        <Text style={[al.labelText, { color: t.fg }]}>{label}</Text>
      </View>
      <Text style={al.body} selectable>
        {body}
      </Text>
    </View>
  );
}

function AllergiesSheet({ h }: { h: StaffHome }) {
  return (
    <BottomSheetModal
      ref={h.allergiesSheetRef}
      {...gardenSheetChrome}
      snapPoints={["62%", "90%"]}
      enableDynamicSizing={false}
    >
      <BottomSheetScrollView contentContainerStyle={[sh.wrap, { paddingBottom: 48, gap: 12 }]}>
        <Display size={26}>Allergies for Today</Display>
        {h.allergyDetailsLoading ? (
          [0, 1].map((i) => <GardenSkeleton key={i} width="100%" height={120} radius={20} />)
        ) : h.allergyDetails.length === 0 ? (
          <GardenEmpty emoji="🩺" title="No allergy information on file." tint="mint" />
        ) : (
          h.allergyDetails.map((s) => (
            <View key={s.student_id} style={al.card}>
              <View style={al.head}>
                <GardenAvatar name={s.name} uri={s.profile_image_url} seed={s.student_id} size={40} />
                <Text style={al.name}>{shortName(s.name)}</Text>
              </View>
              {s.allergies_description ? (
                <HealthBlock icon="medical" tint="coral" label="Allergies" body={s.allergies_description} />
              ) : null}
              {s.has_medical_conditions === "yes" && s.medical_conditions_description ? (
                <HealthBlock
                  icon="pulse-outline"
                  tint="butter"
                  label="Medical Conditions"
                  body={s.medical_conditions_description}
                />
              ) : null}
              {s.has_emergency_medications === "yes" && s.emergency_medications_description ? (
                <HealthBlock
                  icon="bandage-outline"
                  tint="lav"
                  label="Emergency Medications"
                  body={s.emergency_medications_description}
                />
              ) : null}
            </View>
          ))
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const al = StyleSheet.create({
  card: { ...gardenCard, borderRadius: 20, padding: 14, gap: 10 },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { fontFamily: GardenFonts.display, fontSize: 18, color: Garden.ink },
  block: { gap: 6 },
  label: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    borderRadius: GardenRadii.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  labelText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12 },
  body: { fontFamily: GardenFonts.body, fontSize: 14.5, lineHeight: 21, color: Garden.ink },
});

// ─────────────────────────────────────────────────────────────────────────────
// Event detail
// ─────────────────────────────────────────────────────────────────────────────
function EventSheet({ h, fb }: { h: StaffHome; fb: StaffHomeFeedback }) {
  const evt = h.selectedEvent;
  const attachments = evt?.attachment_links ?? [];
  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      fb.toast.show({ tone: "error", title: "Couldn't open that link", message: "Please try again." });
    }
  };
  return (
    <BottomSheetModal
      ref={h.eventSheetRef}
      {...gardenSheetChrome}
      snapPoints={["62%", "90%"]}
      onDismiss={() => h.setSelectedEvent(null)}
    >
      <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        {evt ? (
          <View style={ev.wrap}>
            <View style={[ev.stripe, { backgroundColor: evt.color }]} />
            <Display size={26}>{evt.title}</Display>
            {evt.category ? (
              <View style={[ev.cat, { backgroundColor: evt.color + "22" }]}>
                <Text style={[ev.catText, { color: evt.color }]}>{evt.category}</Text>
              </View>
            ) : null}

            <View style={ev.row}>
              <View style={[ev.icon, { backgroundColor: Garden.sky }]}>
                <Ionicons name="calendar-outline" size={17} color="#2f5f8a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ev.primary}>{formatFullDate(evt.event_date)}</Text>
                <Text style={ev.sub}>{formatEventTime(evt)}</Text>
              </View>
            </View>

            {evt.location ? (
              <View style={ev.row}>
                <View style={[ev.icon, { backgroundColor: Garden.peach }]}>
                  <Ionicons name="location-outline" size={17} color="#a2522a" />
                </View>
                <Text style={[ev.primary, { flex: 1 }]}>{evt.location}</Text>
              </View>
            ) : null}

            {evt.description ? (
              <View style={ev.block}>
                <Text style={sh.blockLabel}>Details</Text>
                <Text style={ev.desc} selectable>
                  {evt.description}
                </Text>
              </View>
            ) : null}

            {attachments.length > 0 ? (
              <View style={ev.block}>
                <Text style={sh.blockLabel}>Attachments</Text>
                {attachments.map((url, i) => (
                  <PressableScale
                    key={`${url}-${i}`}
                    pressedScale={0.98}
                    style={ev.attachment}
                    accessibilityRole="link"
                    accessibilityLabel={`Open ${url.split("/").pop() ?? `Attachment ${i + 1}`}`}
                    onPress={() => void openUrl(url)}
                  >
                    <Ionicons name="attach-outline" size={17} color={Garden.sageDeep} />
                    <Text style={ev.attachmentText} numberOfLines={1}>
                      {url.split("/").pop() ?? `Attachment ${i + 1}`}
                    </Text>
                    <Ionicons name="open-outline" size={14} color={Garden.muted} />
                  </PressableScale>
                ))}
              </View>
            ) : null}

            <GardenButton
              label="See in calendar"
              tone="outline"
              icon="calendar-outline"
              fullWidth
              style={{ marginTop: 20 }}
              onPress={() => {
                h.eventSheetRef.current?.dismiss();
                h.router.push({
                  pathname: "/(staff)/calendar",
                  params: { selectDate: evt.event_date },
                });
              }}
            />
          </View>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const ev = StyleSheet.create({
  wrap: { paddingHorizontal: 22, paddingTop: 6, gap: 10 },
  stripe: { width: 44, height: 6, borderRadius: 3 },
  cat: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  catText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8, minHeight: 44 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  primary: { fontFamily: GardenFonts.bodyBold, fontSize: 15, color: Garden.ink },
  sub: { fontFamily: GardenFonts.body, fontSize: 13, color: Garden.soft },
  block: { marginTop: 12, gap: 8 },
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

// ─────────────────────────────────────────────────────────────────────────────
// Chrome: mount every sheet + confetti once
// ─────────────────────────────────────────────────────────────────────────────
export function StaffHomeChrome({ h, fb }: { h: StaffHome; fb: StaffHomeFeedback }) {
  return (
    <>
      <ProfileSheet h={h} fb={fb} />
      <StudentActionSheet h={h} fb={fb} />
      <PickupSheet h={h} fb={fb} />
      <AddStudentSheet h={h} fb={fb} />
      <AllergiesSheet h={h} />
      <EventSheet h={h} fb={fb} />

      <ActivityPreferencesSheet
        ref={h.homePrefsSheetRef}
        activityId={h.selectedPrefsActivityId}
        attendingStudents={h.todayStudents.map((s) => ({
          student_id: s.student_id,
          name: s.name,
          profile_image_url: s.profile_image_url,
        }))}
      />
      <StaffSchoolDayFoodPrefsSheet
        ref={h.schoolDayFoodSheetRef}
        prefs={h.schoolDayFoodPrefs}
        loading={h.schoolDayFoodLoading}
      />
      <StaffAllBirthdaysSheet
        ref={h.allBirthdaysSheetRef}
        birthdays={h.allBirthdays}
        loading={h.birthdaysLoading}
      />
      <StaffWeekActivityPrefsSheet
        ref={h.weekActivityPrefsSheetRef}
        activities={h.activities}
        groups={h.weekActivityPrefGroups}
        loading={h.activitiesLoading || h.weekActivityPrefsLoading}
      />
      {h.showConferenceSection && h.userId ? (
        <StaffConferenceBookingsSheet
          ref={h.ptcBookingsSheetRef}
          bookings={h.conferenceBookings}
          currentTeacherId={h.userId}
        />
      ) : null}

      <Confetti ref={fb.confettiRef} />
    </>
  );
}

const sh = StyleSheet.create({
  wrap: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 36 },
  blockLabel: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 11.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Garden.muted,
  },
});
