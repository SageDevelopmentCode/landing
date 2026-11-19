// Every sheet on the staff Attendance screen, mounted once by AttendanceChrome:
// student actions (1 Attendance → 2 Pickup), "Who picked up?", pickup details,
// calendar, month picker and the student profile (Info / Contacts / Notes / Weeks).
import {
  Confetti,
  Display,
  Garden,
  GardenAvatar,
  GardenButton,
  GardenEmpty,
  GardenErrorCard,
  GardenFonts,
  GardenRadii,
  GardenSegmented,
  GardenSkeleton,
  GardenTints,
  HandNote,
  MIN_TAP,
  Pill,
  PressableScale,
  gardenCard,
  gardenSheetChrome,
  haptic,
} from "@/components/garden";
import { StatusPill } from "@/features/staff-home/garden/StaffHomeParts";
import { CATEGORY_TINT } from "@/features/students/garden/StudentDetailParts";
import { ContactsList, InfoCards, ProfileCardSkeleton } from "@/features/students/garden/StudentProfileBits";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  DOW_SHORT,
  SCHOOL_YEAR_AFTERCARE_MONTHS,
  SCHOOL_YEAR_MONTHS,
  buildMonthCells,
  formatDateLabel,
  getCurrentSchoolYearMonthIndex,
  isCalendarDaySelectable,
  shortName,
  toYMD,
  type ProfileSchedule,
  type StaffUser,
} from "../attendanceData";
import { isCheckedIn, rowStatus, type StaffAttendance } from "../useStaffAttendance";
import type { StaffAttendanceFeedback } from "./useStaffAttendanceFeedback";

function useBottomPad() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 16) + 10;
}

function StepLabel({ n, label, done }: { n: number; label: string; done?: boolean }) {
  return (
    <View style={s.step}>
      <View style={[s.stepNum, done && { backgroundColor: Garden.sage }]}>
        {done ? <Ionicons name="checkmark" size={14} color={Garden.white} /> : <Text style={s.stepNumText}>{n}</Text>}
      </View>
      <Text style={s.stepText} accessibilityRole="header" maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Student actions
// ─────────────────────────────────────────────────────────────────────────────
function ActionSheet({ a, fb }: { a: StaffAttendance; fb: StaffAttendanceFeedback }) {
  const pad = useBottomPad();
  const row = a.actionRow;
  const program = a.action?.program;
  return (
    <BottomSheetModal ref={a.actionSheetRef} {...gardenSheetChrome} enableDynamicSizing onDismiss={() => a.setAction(null)}>
      <BottomSheetView style={[s.body, { paddingBottom: pad }]}>
        {row && program ? (
          (() => {
            const status = rowStatus(program, row);
            const checked = isCheckedIn(program, row);
            const picked = status === "picked_up";
            const busy = !!a.pending[a.lockKey(program, row.student_id)];
            const name = shortName(row.name);
            const first = (row.name ?? "").split(" ")[0] || name;
            return (
              <>
                <View style={s.head}>
                  <GardenAvatar name={row.name} uri={row.profile_image_url} seed={row.student_id} size={52} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Display size={24} numberOfLines={1}>
                      {name}
                    </Display>
                    <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                      {status !== "unmarked" ? <StatusPill status={status} /> : <Pill tint="coral">Unmarked</Pill>}
                      <Pill tint={row.hasEnrollment ? "sage" : "coral"}>{row.hasEnrollment ? "Paid" : "Unpaid"}</Pill>
                    </View>
                  </View>
                </View>
                <HandNote size={16} color={Garden.soft}>
                  {formatDateLabel(a.dates[program])}
                </HandNote>

                <View style={s.stage}>
                  <StepLabel n={1} label="Attendance" done={checked} />
                  <PressableScale
                    disabled={busy || picked}
                    haptics={false}
                    onPress={() => void fb.togglePresent(program, row)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked, disabled: busy || picked }}
                    accessibilityLabel={program === "aftercare" ? "Checked in" : "Present"}
                    style={[s.tile, checked && { backgroundColor: GardenTints.sage.bg, borderColor: Garden.sage }, picked && { opacity: 0.6 }]}
                  >
                    <View style={[s.check, checked && { backgroundColor: Garden.sage, borderColor: Garden.sage }]}>
                      {busy ? (
                        <ActivityIndicator size="small" color={checked ? Garden.white : Garden.sage} />
                      ) : checked ? (
                        <Animated.View entering={ZoomIn.springify()}>
                          <Ionicons name="checkmark" size={18} color={Garden.white} />
                        </Animated.View>
                      ) : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.tileTitle} maxFontSizeMultiplier={1.3}>
                        {program === "aftercare" ? (checked ? "Checked in" : "Check In") : checked ? "Present" : "Mark Present"}
                      </Text>
                      <Text style={s.tileHint} maxFontSizeMultiplier={1.3}>
                        {picked
                          ? "Picked up, so this can't be changed here."
                          : checked
                            ? "Tap to un-mark (you can undo)."
                            : status === "absent"
                              ? "Marked absent. Tap to mark present instead."
                              : "Tap when they arrive."}
                      </Text>
                    </View>
                  </PressableScale>
                </View>

                <View style={s.stage}>
                  <StepLabel n={2} label="Pickup" done={picked} />
                  {picked ? (
                    <PressableScale
                      onPress={() => {
                        a.actionSheetRef.current?.dismiss();
                        void fb.openPickupDetails(program, row);
                      }}
                      accessibilityLabel={`Picked up by ${row.record?.picked_up_by_name}. View pickup details`}
                      style={[s.tile, { backgroundColor: GardenTints.mint.bg, borderColor: "transparent" }]}
                    >
                      <Ionicons name="car" size={20} color={GardenTints.mint.fg} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.tileTitle}>{row.record?.picked_up_by_name}</Text>
                        {row.record?.picked_up_by_relationship ? (
                          <Text style={s.tileHint}>{row.record.picked_up_by_relationship}</Text>
                        ) : null}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={GardenTints.mint.fg} />
                    </PressableScale>
                  ) : checked ? (
                    <GardenButton
                      label="Record Pickup"
                      tone="coral"
                      icon="car-outline"
                      fullWidth
                      onPress={() => {
                        a.actionSheetRef.current?.dismiss();
                        void fb.openPickup(program, row);
                      }}
                    />
                  ) : (
                    <View style={s.hintBox}>
                      <Ionicons name="lock-closed-outline" size={15} color={Garden.soft} />
                      <Text style={s.hintText} maxFontSizeMultiplier={1.3}>
                        {program === "aftercare"
                          ? `Check ${first} in first, then record pickup here.`
                          : `Mark ${first} present first, then record pickup here.`}
                      </Text>
                    </View>
                  )}
                </View>

                <GardenButton
                  label="View profile"
                  tone="outline"
                  icon="person-circle-outline"
                  fullWidth
                  onPress={() => void fb.openProfile(row)}
                />
              </>
            );
          })()
        ) : (
          <View style={{ height: 120 }} />
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Who picked up?
// ─────────────────────────────────────────────────────────────────────────────
function PickupSheet({ a, fb }: { a: StaffAttendance; fb: StaffAttendanceFeedback }) {
  const pad = useBottomPad();
  const row = a.pickupRow;
  const canConfirm = !!a.selectedPickupPerson && !a.pickupSaving;
  return (
    <BottomSheetModal
      ref={a.pickupSheetRef}
      {...gardenSheetChrome}
      snapPoints={["62%", "85%"]}
      onDismiss={a.resetPickup}
    >
      <BottomSheetScrollView contentContainerStyle={[s.body, { paddingBottom: pad }]}>
        <View style={{ gap: 2 }}>
          <Display size={26}>Who picked up?</Display>
          {row ? (
            <HandNote size={17} color={Garden.sageDeep}>
              for {shortName(row.name)}
            </HandNote>
          ) : null}
        </View>
        {a.pickupPersonsLoading ? (
          <View style={{ gap: 8 }}>
            {[0, 1, 2].map((i) => (
              <GardenSkeleton key={i} width="100%" height={58} radius={18} />
            ))}
          </View>
        ) : a.pickupPersons.length === 0 ? (
          <GardenEmpty emoji="🚗" title="No authorized pickup persons on file." tint="peach" />
        ) : (
          <View style={{ gap: 8 }} accessibilityRole="radiogroup">
            {a.pickupPersons.map((p) => {
              const on = a.selectedPickupPerson?.name === p.name;
              return (
                <PressableScale
                  key={p.name}
                  haptics="select"
                  onPress={() => a.setSelectedPickupPerson(p)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${p.name}${p.relationship ? `, ${p.relationship}` : ""}`}
                  style={[s.person, on && { borderColor: Garden.sage, backgroundColor: GardenTints.sage.bg }]}
                >
                  <GardenAvatar name={p.name} seed={p.name} size={38} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.personName} maxFontSizeMultiplier={1.35}>
                      {p.name}
                    </Text>
                    {p.relationship ? (
                      <Text style={s.personRel} maxFontSizeMultiplier={1.3}>
                        {p.relationship}
                      </Text>
                    ) : null}
                  </View>
                  <View style={[s.radio, on && { borderColor: Garden.sage, backgroundColor: Garden.sage }]}>
                    {on ? (
                      <Animated.View entering={ZoomIn}>
                        <Ionicons name="checkmark" size={14} color={Garden.white} />
                      </Animated.View>
                    ) : null}
                  </View>
                </PressableScale>
              );
            })}
          </View>
        )}
        {!a.pickupPersonsLoading && a.pickupPersons.length > 0 && !a.selectedPickupPerson ? (
          <View style={s.hintBox}>
            <Ionicons name="hand-left-outline" size={15} color={Garden.soft} />
            <Text style={s.hintText}>Choose who picked them up to confirm.</Text>
          </View>
        ) : null}
        <GardenButton
          label="Confirm Pickup"
          tone="coral"
          icon="car"
          fullWidth
          disabled={!canConfirm}
          loading={a.pickupSaving}
          loadingLabel="Saving…"
          onPress={() => void fb.confirmPickup()}
        />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pickup details
// ─────────────────────────────────────────────────────────────────────────────
function StaffLine({ label, user, loading }: { label: string; user: StaffUser | null; loading: boolean }) {
  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      {loading ? (
        <GardenSkeleton width={120} height={30} radius={15} />
      ) : (
        <View style={s.staff}>
          <GardenAvatar name={user?.full_name ?? null} uri={user?.profile_image_url} seed={user?.id} size={30} />
          <Text style={s.staffName} numberOfLines={1}>
            {user?.full_name ?? "Unknown"}
          </Text>
        </View>
      )}
    </View>
  );
}

function PickupDetailsSheet({ a }: { a: StaffAttendance }) {
  const pad = useBottomPad();
  const rec = a.details?.row.record;
  return (
    <BottomSheetModal ref={a.detailsSheetRef} {...gardenSheetChrome} enableDynamicSizing onDismiss={a.resetDetails}>
      <BottomSheetView style={[s.body, { paddingBottom: pad }]}>
        {a.details && rec?.picked_up_by_name ? (
          <>
            <Display size={24}>{a.details.row.name ?? "Student"}</Display>
            <View style={s.detailCard}>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Picked Up</Text>
                <View style={s.staff}>
                  <GardenAvatar name={rec.picked_up_by_name} seed={rec.picked_up_by_name} size={30} />
                  <Text style={s.staffName}>{rec.picked_up_by_name.split(" ")[0]}</Text>
                </View>
              </View>
              {rec.picked_up_by_relationship ? (
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Relationship</Text>
                  <Text style={s.staffName}>{rec.picked_up_by_relationship}</Text>
                </View>
              ) : null}
              <StaffLine label="Checked In By" user={a.detailsStaff.checkedInBy} loading={a.detailsLoading} />
              <StaffLine label="Pickup Recorded By" user={a.detailsStaff.pickedUpBy} loading={a.detailsLoading} />
            </View>
            <GardenButton label="Close" tone="outline" fullWidth onPress={() => a.detailsSheetRef.current?.dismiss()} />
          </>
        ) : (
          <View style={{ height: 120 }} />
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Calendar + month picker
// ─────────────────────────────────────────────────────────────────────────────
function CalendarSheet({ a }: { a: StaffAttendance }) {
  const pad = useBottomPad();
  const target = a.calendarTarget;
  const y = a.calendarMonth.getFullYear();
  const m = a.calendarMonth.getMonth();
  const cells = buildMonthCells(y, m);
  const selected = target ? a.dates[target] : null;
  const shift = (delta: number) => {
    haptic.select();
    a.setCalendarMonth(new Date(y, m + delta, 1));
  };
  return (
    <BottomSheetModal
      ref={a.calendarSheetRef}
      {...gardenSheetChrome}
      enableDynamicSizing
      onDismiss={() => a.setCalendarTarget(null)}
    >
      <BottomSheetView style={[s.body, { paddingBottom: pad }]}>
        <View style={s.calHead}>
          <PressableScale onPress={() => shift(-1)} haptics={false} accessibilityLabel="Previous month" style={s.calNav}>
            <Ionicons name="chevron-back" size={20} color={Garden.ink} />
          </PressableScale>
          <Display size={22} style={{ flex: 1, textAlign: "center" }}>
            {a.calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </Display>
          <PressableScale onPress={() => shift(1)} haptics={false} accessibilityLabel="Next month" style={s.calNav}>
            <Ionicons name="chevron-forward" size={20} color={Garden.ink} />
          </PressableScale>
        </View>
        <View style={s.calRow}>
          {DOW_SHORT.map((d, i) => (
            <Text key={i} style={s.dow}>
              {d}
            </Text>
          ))}
        </View>
        <View style={s.grid}>
          {cells.map((day, i) => {
            if (!day || !target) return <View key={i} style={s.cell} />;
            const ymd = toYMD(new Date(y, m, day));
            const ok = isCalendarDaySelectable(ymd, target);
            const isSel = ymd === selected;
            const isToday = ymd === a.today;
            return (
              <View key={i} style={s.cell}>
                <PressableScale
                  disabled={!ok}
                  haptics="select"
                  onPress={() => a.pickCalendarDate(ymd)}
                  accessibilityLabel={new Date(y, m, day).toDateString()}
                  accessibilityState={{ selected: isSel, disabled: !ok }}
                  style={[
                    s.dayBtn,
                    isToday && !isSel && { borderWidth: 2, borderColor: Garden.sage },
                    isSel && { backgroundColor: Garden.sageDeep },
                  ]}
                >
                  <Text
                    style={[
                      s.dayText,
                      !ok && { color: "#d4ccbe" },
                      isSel && { color: Garden.white },
                    ]}
                  >
                    {day}
                  </Text>
                </PressableScale>
              </View>
            );
          })}
        </View>
        {target ? (
          <GardenButton
            label={target === "field_friday" ? "This Friday" : "Today"}
            tone="outline"
            icon="return-up-back"
            fullWidth
            onPress={() => {
              a.goToToday(target);
              a.calendarSheetRef.current?.dismiss();
            }}
          />
        ) : null}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

function MonthSheet({ a }: { a: StaffAttendance }) {
  const pad = useBottomPad();
  return (
    <BottomSheetModal ref={a.monthSheetRef} {...gardenSheetChrome} snapPoints={["60%", "85%"]}>
      <BottomSheetScrollView contentContainerStyle={[s.body, { paddingBottom: pad, gap: 8 }]}>
        <Display size={24} style={{ marginBottom: 4 }}>
          Select Month
        </Display>
        {SCHOOL_YEAR_MONTHS.map((mo) => {
          const on = mo.index === a.planMonthIndex;
          return (
            <PressableScale
              key={mo.index}
              haptics="select"
              onPress={() => {
                a.setPlanMonthIndex(mo.index);
                a.monthSheetRef.current?.dismiss();
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={mo.label}
              style={[s.monthRow, on && { backgroundColor: GardenTints.sky.bg, borderColor: GardenTints.sky.fg }]}
            >
              <Text style={[s.monthText, on && { color: GardenTints.sky.fg }]}>{mo.label}</Text>
              {on ? <Ionicons name="checkmark" size={18} color={GardenTints.sky.fg} /> : null}
            </PressableScale>
          );
        })}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Student profile
// ─────────────────────────────────────────────────────────────────────────────
type ProfileTab = "info" | "contacts" | "notes" | "weeks";

function fmtShort(ds: string) {
  const [y, m, d] = ds.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function WeeksTab({ schedule }: { schedule: ProfileSchedule | null }) {
  if (!schedule) return <GardenEmpty emoji="🗓️" title="No school year schedule on file." tint="sky" />;
  const current = getCurrentSchoolYearMonthIndex();
  const now = Date.now();
  const monthRange = (index: number) => {
    const days = SCHOOL_YEAR_AFTERCARE_MONTHS[index - 1]?.days ?? [];
    const first = days[0]?.date;
    const last = days[days.length - 1]?.date;
    return { first, last, isPast: last ? new Date(last + "T23:59:59").getTime() < now : false };
  };
  if (schedule.programType === "school_year_full") {
    return (
      <View style={{ gap: 8 }}>
        {SCHOOL_YEAR_MONTHS.map((mo) => {
          const { first, last, isPast } = monthRange(mo.index);
          const attending = schedule.paidMonths.includes(mo.index);
          const isCurrent = mo.index === current;
          return (
            <View
              key={mo.index}
              style={[s.weekRow, isCurrent && s.weekCurrent, isPast && { opacity: 0.45 }]}
              accessible
              accessibilityLabel={`${mo.label}, ${attending ? "Attending" : "Not Enrolled"}`}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.weekTitle}>{mo.label}</Text>
                {first && last ? (
                  <Text style={s.weekRange}>
                    {fmtShort(first)} – {fmtShort(last)}
                  </Text>
                ) : null}
              </View>
              <Pill tint={attending ? "sage" : "butter"}>{attending ? "Attending" : "Not Enrolled"}</Pill>
            </View>
          );
        })}
      </View>
    );
  }
  if (schedule.homeschoolSelections.length === 0) {
    return <GardenEmpty emoji="🗓️" title="No drop-in days on file." tint="sky" />;
  }
  const DAY_KEYS = ["mon", "tue", "wed", "thu"] as const;
  const DAY_LABELS: Record<string, string> = { mon: "M", tue: "T", wed: "W", thu: "Th" };
  return (
    <View style={{ gap: 8 }}>
      {schedule.homeschoolSelections.map(({ month, days }) => {
        const meta = SCHOOL_YEAR_MONTHS.find((x) => x.index === month);
        const { first, last, isPast } = monthRange(month);
        const set = new Set(days);
        return (
          <View key={month} style={[s.weekRow, month === current && s.weekCurrent, isPast && { opacity: 0.45 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.weekTitle}>{meta?.label ?? `Month ${month}`}</Text>
              {first && last ? (
                <Text style={s.weekRange}>
                  {fmtShort(first)} – {fmtShort(last)}
                </Text>
              ) : null}
            </View>
            <View style={{ flexDirection: "row", gap: 4 }}>
              {DAY_KEYS.map((k) => (
                <View key={k} style={[s.dayDot, set.has(k) && { backgroundColor: Garden.sage }]}>
                  <Text style={[s.dayDotText, set.has(k) && { color: Garden.white }]}>{DAY_LABELS[k]}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ProfileSheet({ a }: { a: StaffAttendance }) {
  const pad = useBottomPad();
  const [tab, setTab] = useState<ProfileTab>("info");
  const p = a.profile;
  const fallback = a.profileFallback;
  const name = p?.displayName ?? p?.student?.child_legal_name ?? fallback?.name ?? "Student";
  const grade = p?.student?.child_grade ?? fallback?.grade;

  let body: React.ReactNode;
  if (a.profileLoading && !p) {
    body = (
      <View style={{ gap: 12 }}>
        <ProfileCardSkeleton />
        <ProfileCardSkeleton rows={2} />
      </View>
    );
  } else if (a.profileError) {
    body = (
      <GardenErrorCard
        title="Couldn't load the profile"
        onRetry={() => (a.profileStudentId ? void a.loadProfile(a.profileStudentId) : undefined)}
      />
    );
  } else if (p) {
    if (tab === "info") {
      body = p.student ? <InfoCards student={p.student} /> : <GardenEmpty emoji="🔍" title="No information on file." tint="sky" />;
    } else if (tab === "contacts") {
      body = p.contacts ? (
        <ContactsList
          contacts={p.contacts}
          titles={{
            g1: "Guardian 1",
            g2: "Guardian 2",
            inState: "In-State Emergency",
            outOfState: "Out-of-State Emergency",
          }}
        />
      ) : (
        <GardenEmpty emoji="📇" title="No contact data available." tint="sky" />
      );
    } else if (tab === "notes") {
      body =
        p.notes.length === 0 ? (
          <GardenEmpty emoji="📝" title="No notes yet." tint="butter" />
        ) : (
          <View style={{ gap: 10 }}>
            {p.notes.map((n) => {
              const t = GardenTints[CATEGORY_TINT[n.category]];
              return (
                <View key={n.id} style={s.note}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={[s.noteCat, { backgroundColor: t.bg }]}>
                      <Text style={[s.noteCatText, { color: t.fg }]}>{n.category}</Text>
                    </View>
                    <Text style={s.noteDate}>
                      {new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </Text>
                  </View>
                  <Text style={s.noteText}>{n.note_text}</Text>
                </View>
              );
            })}
          </View>
        );
    } else {
      body = <WeeksTab schedule={p.schedule} />;
    }
  }

  return (
    <BottomSheetModal
      ref={a.profileSheetRef}
      {...gardenSheetChrome}
      snapPoints={["75%", "92%"]}
      onDismiss={() => {
        setTab("info");
        a.resetProfile();
      }}
    >
      <BottomSheetScrollView contentContainerStyle={[s.body, { paddingBottom: pad }]}>
        <View style={s.head}>
          <GardenAvatar
            name={name}
            uri={p?.student?.profile_image_url ?? fallback?.photo}
            seed={a.profileStudentId}
            size={52}
          />
          <View style={{ flex: 1, gap: 4 }}>
            <Display size={24} numberOfLines={2}>
              {name}
            </Display>
            {grade ? <Pill tint="butter">{grade}</Pill> : null}
          </View>
        </View>
        <GardenSegmented
          accessibilityLabel="Profile sections"
          value={tab}
          onChange={setTab}
          options={[
            { value: "info", label: "Info" },
            { value: "contacts", label: "Contacts" },
            { value: "notes", label: "Notes" },
            { value: "weeks", label: "Weeks" },
          ]}
        />
        <Animated.View key={tab} entering={FadeIn.duration(160)}>
          {body}
        </Animated.View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chrome
// ─────────────────────────────────────────────────────────────────────────────
export function AttendanceChrome({ a, fb }: { a: StaffAttendance; fb: StaffAttendanceFeedback }) {
  return (
    <>
      <ActionSheet a={a} fb={fb} />
      <PickupSheet a={a} fb={fb} />
      <PickupDetailsSheet a={a} />
      <CalendarSheet a={a} />
      <MonthSheet a={a} />
      <ProfileSheet a={a} />
      <Confetti ref={fb.confettiRef} />
    </>
  );
}

const s = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 6, gap: 16 },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  stage: { gap: 10 },
  step: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Garden.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12.5, color: Garden.white },
  stepText: { fontFamily: GardenFonts.display, fontSize: 16, color: Garden.ink },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64,
    padding: 12,
    borderRadius: 18,
    backgroundColor: Garden.white,
    borderWidth: 1.5,
    borderColor: Garden.line,
  },
  check: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Garden.line,
    alignItems: "center",
    justifyContent: "center",
  },
  tileTitle: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15.5, color: Garden.ink },
  tileHint: { fontFamily: GardenFonts.bodySemi, fontSize: 12.5, color: Garden.soft },
  hintBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: GardenRadii.sm,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Garden.line,
  },
  hintText: { flex: 1, fontFamily: GardenFonts.bodySemi, fontSize: 13.5, color: Garden.soft },
  person: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: Garden.white,
    borderWidth: 1.5,
    borderColor: Garden.line,
  },
  personName: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15.5, color: Garden.ink },
  personRel: { fontFamily: GardenFonts.bodySemi, fontSize: 13, color: Garden.soft },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Garden.line,
    alignItems: "center",
    justifyContent: "center",
  },
  detailCard: { ...gardenCard, borderRadius: 20, padding: 14, gap: 12 },
  detailRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 36 },
  detailLabel: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 11.5,
    color: Garden.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  staff: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  staffName: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14.5, color: Garden.ink, flexShrink: 1 },
  calHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  calNav: { width: MIN_TAP, height: MIN_TAP, borderRadius: MIN_TAP / 2, alignItems: "center", justifyContent: "center" },
  calRow: { flexDirection: "row" },
  dow: {
    flex: 1,
    textAlign: "center",
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 12,
    color: Garden.muted,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: 2 },
  dayBtn: { width: MIN_TAP, height: MIN_TAP, borderRadius: MIN_TAP / 2, alignItems: "center", justifyContent: "center" },
  dayText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.ink },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: Garden.white,
    borderWidth: 1.5,
    borderColor: Garden.line,
  },
  monthText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15.5, color: Garden.ink },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
  },
  weekCurrent: { borderLeftWidth: 4, borderLeftColor: Garden.sage },
  weekTitle: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14.5, color: Garden.ink },
  weekRange: { fontFamily: GardenFonts.bodySemi, fontSize: 12.5, color: Garden.soft },
  dayDot: {
    minWidth: 26,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3eadc",
  },
  dayDotText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11, color: Garden.muted },
  note: { ...gardenCard, borderRadius: 18, padding: 12, gap: 8 },
  noteCat: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: GardenRadii.pill },
  noteCatText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11.5 },
  noteDate: { fontFamily: GardenFonts.bodyBold, fontSize: 12, color: Garden.muted },
  noteText: { fontFamily: GardenFonts.bodySemi, fontSize: 14.5, color: Garden.ink, lineHeight: 20 },
});
