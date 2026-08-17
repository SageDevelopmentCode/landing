import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Brand, FontFamilies } from "@/constants/theme";
import { bookConference } from "@/lib/conference-actions";
import {
  CONFERENCE_WEEKS,
  FRIDAY_SLOTS,
  MON_THU_SLOTS,
  formatConferenceDateForDisplay,
  getDaysForWeek,
  getFirstAvailableDayForTeacher,
  isConferenceDayAvailable,
  resolveTeacherImageSource,
  takenSlotKey,
  type ConferenceBookingRecord,
  type ConferenceStudentContext,
  type ConferenceTeacherDisplay,
} from "@/lib/parent-teacher-conference";

type ConferenceFormat = "in_person" | "virtual";

type ChildSelection = {
  teacherId: string | null;
  weekStart: string;
  dayDate: string;
  slot: string | null;
  format: ConferenceFormat;
  accommodationNote: string;
};

export type ParentTeacherConferenceSheetHandle = {
  prepareOpen: () => void;
};

type Props = {
  parentId: string;
  conferenceTeachers: ConferenceTeacherDisplay[];
  conferenceStudents: ConferenceStudentContext[];
  initialBookingsByStudent: Record<string, ConferenceBookingRecord>;
  initialTakenSlotKeys: string[];
  contextLoading?: boolean;
  contextError?: string | null;
  onRetryLoad?: () => void;
  onBookingsChange?: (
    bookings: Record<string, ConferenceBookingRecord>,
    takenSlotKeys: string[],
  ) => void;
};

function defaultSelectionForChild(child: ConferenceStudentContext): ChildSelection {
  const weekStart = CONFERENCE_WEEKS[0].start;
  const days = getDaysForWeek(weekStart);
  return {
    teacherId: child.assignedTeacherId,
    weekStart,
    dayDate: days[0].date,
    slot: null,
    format: "in_person",
    accommodationNote: "",
  };
}

export const ParentTeacherConferenceSheet = forwardRef<
  BottomSheetModal,
  Props
>(function ParentTeacherConferenceSheet(
  {
    parentId,
    conferenceTeachers,
    conferenceStudents,
    initialBookingsByStudent,
    initialTakenSlotKeys,
    contextLoading = false,
    contextError = null,
    onRetryLoad,
    onBookingsChange,
  },
  ref,
) {
  const sheetRef = useRef<BottomSheetModal>(null);
  useImperativeHandle(ref, () => sheetRef.current!);

  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [selectionsByStudent, setSelectionsByStudent] = useState<
    Record<string, ChildSelection>
  >({});
  const [bookingsByStudent, setBookingsByStudent] = useState<
    Record<string, ConferenceBookingRecord>
  >(initialBookingsByStudent);
  const [takenSlotKeys, setTakenSlotKeys] = useState<string[]>(
    initialTakenSlotKeys,
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setBookingsByStudent(initialBookingsByStudent);
  }, [initialBookingsByStudent]);

  useEffect(() => {
    setTakenSlotKeys(initialTakenSlotKeys);
  }, [initialTakenSlotKeys]);

  const hasMultipleChildren = conferenceStudents.length > 1;

  const distinctAssignedTeachers = useMemo(() => {
    const ids = conferenceStudents
      .map((s) => s.assignedTeacherId)
      .filter(Boolean) as string[];
    return new Set(ids).size > 1;
  }, [conferenceStudents]);

  const activeChild =
    conferenceStudents.find((s) => s.studentId === activeStudentId) ??
    conferenceStudents[0] ??
    null;

  const activeBooking = activeChild
    ? bookingsByStudent[activeChild.studentId]
    : null;
  const isActiveChildBooked = !!activeBooking;

  const activeSelection = activeChild
    ? (selectionsByStudent[activeChild.studentId] ??
        defaultSelectionForChild(activeChild))
    : null;

  const weekDays = activeSelection
    ? getDaysForWeek(activeSelection.weekStart)
    : getDaysForWeek(CONFERENCE_WEEKS[0].start);
  const activeDayDate =
    activeSelection?.dayDate ?? weekDays[0].date;
  const activeDay =
    weekDays.find((d) => d.date === activeDayDate) ?? weekDays[0];
  const timeSlots = activeDay.isFriday ? FRIDAY_SLOTS : [...MON_THU_SLOTS];
  const selectedTeacherId = activeSelection?.teacherId ?? null;
  const selectedSlot = activeSelection?.slot ?? null;
  const selectedWeekStart =
    activeSelection?.weekStart ?? CONFERENCE_WEEKS[0].start;
  const selectedFormat = activeSelection?.format ?? "in_person";
  const accommodationNote = activeSelection?.accommodationNote ?? "";

  const prepareOpen = useCallback(() => {
    const initial: Record<string, ChildSelection> = {};
    for (const child of conferenceStudents) {
      initial[child.studentId] = defaultSelectionForChild(child);
    }
    setSelectionsByStudent(initial);
    const firstUnbooked =
      conferenceStudents.find((s) => !bookingsByStudent[s.studentId]) ??
      conferenceStudents[0];
    setActiveStudentId(firstUnbooked?.studentId ?? null);
    setSubmitError(null);
    setSuccessMessage(null);
  }, [conferenceStudents, bookingsByStudent]);

  function isChildBooked(studentId: string) {
    return !!bookingsByStudent[studentId];
  }

  function isSlotTaken(teacherId: string | null, date: string, slot: string) {
    if (!teacherId) return false;
    return takenSlotKeys.includes(takenSlotKey(teacherId, date, slot));
  }

  function updateActiveSelection(patch: Partial<ChildSelection>) {
    if (!activeChild || isActiveChildBooked) return;
    setSelectionsByStudent((prev) => {
      const current =
        prev[activeChild.studentId] ?? defaultSelectionForChild(activeChild);
      const next = { ...current, ...patch };

      if (patch.teacherId !== undefined) {
        const weekStart = patch.weekStart ?? current.weekStart;
        const dayDate = patch.dayDate ?? current.dayDate;
        const weekDays = getDaysForWeek(weekStart);
        const selectedDay =
          weekDays.find((d) => d.date === dayDate) ?? weekDays[0];
        if (!isConferenceDayAvailable(patch.teacherId, selectedDay)) {
          next.dayDate = getFirstAvailableDayForTeacher(
            weekStart,
            patch.teacherId,
          );
          next.slot = null;
        }
      }

      return {
        ...prev,
        [activeChild.studentId]: next,
      };
    });
    setSubmitError(null);
    setSuccessMessage(null);
  }

  function handleWeekChange(start: string) {
    updateActiveSelection({
      weekStart: start,
      dayDate: getFirstAvailableDayForTeacher(start, selectedTeacherId),
      slot: null,
    });
  }

  async function handleConfirm() {
    if (!activeChild || !activeSelection || isActiveChildBooked) return;
    if (!selectedTeacherId || !selectedSlot) {
      setSubmitError("Please select a teacher and time slot.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      await bookConference({
        parentId,
        studentId: activeChild.studentId,
        teacherId: selectedTeacherId,
        weekStart: selectedWeekStart,
        conferenceDate: activeDayDate,
        timeSlot: selectedSlot,
        format: selectedFormat,
        accommodationNote: accommodationNote.trim() || undefined,
      });

      const booking: ConferenceBookingRecord = {
        teacherId: selectedTeacherId,
        conferenceDate: activeDayDate,
        timeSlot: selectedSlot,
        format: selectedFormat,
        accommodationNote: accommodationNote.trim() || null,
      };

      const nextBookings = {
        ...bookingsByStudent,
        [activeChild.studentId]: booking,
      };
      const nextTaken = [
        ...takenSlotKeys,
        takenSlotKey(selectedTeacherId, activeDayDate, selectedSlot),
      ];

      setBookingsByStudent(nextBookings);
      setTakenSlotKeys(nextTaken);
      onBookingsChange?.(nextBookings, nextTaken);

      setSuccessMessage(`Conference confirmed for ${activeChild.name}!`);

      const nextUnbooked = conferenceStudents.find(
        (s) =>
          s.studentId !== activeChild.studentId &&
          !bookingsByStudent[s.studentId],
      );
      if (nextUnbooked) {
        setTimeout(() => {
          setActiveStudentId(nextUnbooked.studentId);
          setSuccessMessage(null);
        }, 1500);
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const canConfirm =
    !isActiveChildBooked &&
    selectedTeacherId &&
    selectedSlot &&
    !submitting;

  const showContextLoading =
    conferenceTeachers.length === 0 && contextLoading;
  const showContextError =
    conferenceTeachers.length === 0 && !contextLoading && !!contextError;

  if (conferenceStudents.length === 0) {
    return null;
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["92%"]}
      enablePanDownToClose
      onDismiss={() => {
        setSubmitError(null);
        setSuccessMessage(null);
      }}
      onChange={(index) => {
        if (index >= 0) prepareOpen();
      }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
        />
      )}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar-outline" size={18} color={Brand.sage700} />
          <Text style={styles.headerTitle}>Parent-Teacher Conference</Text>
        </View>
        <Pressable
          onPress={() => sheetRef.current?.dismiss()}
          hitSlop={8}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="close" size={20} color="#6b7280" />
        </Pressable>
      </View>

      {hasMultipleChildren ? (
        <View style={styles.childTabsWrap}>
          <Text style={styles.sectionLabel}>SELECT CHILD</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.childTabs}
          >
            {conferenceStudents.map((child) => {
              const booked = isChildBooked(child.studentId);
              const selected = activeStudentId === child.studentId;
              return (
                <Pressable
                  key={child.studentId}
                  onPress={() => {
                    setActiveStudentId(child.studentId);
                    setSubmitError(null);
                    setSuccessMessage(null);
                  }}
                  style={[
                    styles.childTab,
                    selected && styles.childTabSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.childTabText,
                      selected && styles.childTabTextSelected,
                    ]}
                  >
                    {child.name}
                  </Text>
                  {booked && (
                    <Ionicons
                      name="checkmark"
                      size={12}
                      color={selected ? "#fff" : Brand.sage700}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
          {distinctAssignedTeachers && (
            <Text style={styles.distinctTeachersNote}>
              Your children have different teachers — book one session per child.
            </Text>
          )}
        </View>
      ) : activeChild ? (
        <View style={styles.singleChildWrap}>
          <Text style={styles.singleChildText}>
            Scheduling for{" "}
            <Text style={styles.singleChildName}>{activeChild.name}</Text>
            {isActiveChildBooked && (
              <Text style={styles.bookedLabel}> · Booked</Text>
            )}
          </Text>
        </View>
      ) : null}

      <BottomSheetScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {activeChild && activeSelection ? (
          isActiveChildBooked && activeBooking ? (
            <View style={styles.confirmedCard}>
              <Text style={styles.confirmedTitle}>
                Conference confirmed for {activeChild.name}
              </Text>
              <Text style={styles.confirmedLine}>
                <Text style={styles.confirmedLabel}>Teacher: </Text>
                {conferenceTeachers.find((t) => t.id === activeBooking.teacherId)
                  ?.name ?? "Your teacher"}
              </Text>
              <Text style={styles.confirmedLine}>
                <Text style={styles.confirmedLabel}>When: </Text>
                {formatConferenceDateForDisplay(activeBooking.conferenceDate)} ·{" "}
                {activeBooking.timeSlot}
              </Text>
              <Text style={styles.confirmedLine}>
                <Text style={styles.confirmedLabel}>Format: </Text>
                {activeBooking.format === "in_person"
                  ? "In person at Sage Field"
                  : "Virtual"}
              </Text>
              {activeBooking.accommodationNote ? (
                <Text style={styles.confirmedLine}>
                  <Text style={styles.confirmedLabel}>Note: </Text>
                  {activeBooking.accommodationNote}
                </Text>
              ) : null}
              <Text style={styles.confirmedFooter}>
                A confirmation email has been sent. Contact us if you need to
                make a change.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.infoCallout}>
                <Text style={styles.infoCalloutText}>
                  Conferences are available the weeks of{" "}
                  <Text style={styles.infoCalloutBold}>
                    August 24, August 31, and September 7
                  </Text>
                  . Each child needs their own conference
                  {hasMultipleChildren
                    ? " — use the tabs above to schedule separately for each child."
                    : "."}
                </Text>
              </View>

              {showContextLoading ? (
                <View style={styles.contextStateWrap}>
                  <ActivityIndicator size="large" color={Brand.sage700} />
                  <Text style={styles.contextStateText}>
                    Loading teachers and availability…
                  </Text>
                </View>
              ) : showContextError ? (
                <View style={styles.contextStateWrap}>
                  <Ionicons
                    name="cloud-offline-outline"
                    size={32}
                    color="#9ca3af"
                  />
                  <Text style={styles.contextStateText}>{contextError}</Text>
                  {onRetryLoad && (
                    <Pressable
                      onPress={onRetryLoad}
                      style={({ pressed }) => [
                        styles.retryBtn,
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <Text style={styles.retryBtnText}>Try again</Text>
                    </Pressable>
                  )}
                </View>
              ) : (
                <>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="people-outline" size={16} color="#9ca3af" />
                  <Text style={styles.sectionTitle}>
                    Choose teacher for {activeChild.name}
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.teacherRow}
                >
                  {conferenceTeachers.map((teacher) => {
                    const isAssigned =
                      teacher.id === activeChild.assignedTeacherId;
                    const isSelected = selectedTeacherId === teacher.id;
                    return (
                      <Pressable
                        key={teacher.id}
                        onPress={() =>
                          updateActiveSelection({ teacherId: teacher.id })
                        }
                        style={[
                          styles.teacherCard,
                          isSelected && styles.teacherCardSelected,
                          selectedTeacherId && !isSelected && { opacity: 0.6 },
                        ]}
                      >
                        <View style={styles.teacherImageWrap}>
                          <Image
                            source={resolveTeacherImageSource(teacher)}
                            style={styles.teacherImage}
                            contentFit="cover"
                          />
                          {isAssigned && (
                            <View style={styles.yourTeacherBadge}>
                              <Text style={styles.yourTeacherBadgeText}>
                                Your Teacher
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.teacherInfo}>
                          <Text style={styles.teacherName} numberOfLines={1}>
                            {teacher.name}
                          </Text>
                          <Text style={styles.teacherGrade} numberOfLines={2}>
                            {teacher.gradeBand}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Choose a week</Text>
                <View style={styles.pillRow}>
                  {CONFERENCE_WEEKS.map((week) => (
                    <Pressable
                      key={week.start}
                      onPress={() => handleWeekChange(week.start)}
                      style={[
                        styles.pill,
                        selectedWeekStart === week.start && styles.pillSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          selectedWeekStart === week.start &&
                            styles.pillTextSelected,
                        ]}
                      >
                        {week.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Choose a day</Text>
                <View style={styles.pillRow}>
                  {weekDays.map((day) => {
                    const dayAvailable = isConferenceDayAvailable(
                      selectedTeacherId,
                      day,
                    );
                    return (
                    <Pressable
                      key={day.date}
                      disabled={!dayAvailable}
                      onPress={() =>
                        updateActiveSelection({
                          dayDate: day.date,
                          slot: null,
                        })
                      }
                      style={[
                        styles.pill,
                        !dayAvailable && styles.pillDisabled,
                        activeDayDate === day.date && styles.pillSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          !dayAvailable && styles.pillTextDisabled,
                          activeDayDate === day.date &&
                            styles.pillTextSelected,
                        ]}
                      >
                        {day.label}
                      </Text>
                    </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Choose a time</Text>
                <Text style={styles.sectionSub}>
                  {activeDay.isFriday
                    ? "Friday · 30-minute blocks, 8:30am – 3:00pm"
                    : "Mon – Thu · Afternoon blocks"}
                </Text>
                <View
                  style={[
                    styles.slotGrid,
                    activeDay.isFriday && styles.slotGridFriday,
                  ]}
                >
                  {timeSlots.map((slot) => {
                    const taken = isSlotTaken(
                      selectedTeacherId,
                      activeDayDate,
                      slot,
                    );
                    return (
                      <Pressable
                        key={slot}
                        disabled={taken || !selectedTeacherId}
                        onPress={() => updateActiveSelection({ slot })}
                        style={[
                          styles.slotBtn,
                          activeDay.isFriday && styles.slotBtnFriday,
                          taken && styles.slotBtnTaken,
                          selectedSlot === slot && styles.slotBtnSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.slotBtnText,
                            taken && styles.slotBtnTextTaken,
                            selectedSlot === slot && styles.slotBtnTextSelected,
                          ]}
                        >
                          {taken ? `${slot} · Booked` : slot}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {!selectedTeacherId && (
                  <Text style={styles.hint}>
                    Select a teacher to see available times.
                  </Text>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Conference format</Text>
                <View style={styles.formatRow}>
                  {(
                    [
                      {
                        key: "in_person" as const,
                        label: "In person",
                        sub: "At Sage Field",
                      },
                      {
                        key: "virtual" as const,
                        label: "Virtual",
                        sub: "Video call",
                      },
                    ] as const
                  ).map((opt) => (
                    <Pressable
                      key={opt.key}
                      onPress={() =>
                        updateActiveSelection({ format: opt.key })
                      }
                      style={[
                        styles.formatBtn,
                        selectedFormat === opt.key && styles.formatBtnSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.formatLabel,
                          selectedFormat === opt.key &&
                            styles.formatLabelSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text
                        style={[
                          styles.formatSub,
                          selectedFormat === opt.key && styles.formatSubSelected,
                        ]}
                      >
                        {opt.sub}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Need a different time?</Text>
                <Text style={styles.sectionSub}>
                  If none of these times work for you, let us know here so we
                  can best accommodate you and find a time that works.
                </Text>
                <TextInput
                  value={accommodationNote}
                  onChangeText={(text) =>
                    updateActiveSelection({ accommodationNote: text })
                  }
                  placeholder="e.g. We need an earlier morning slot…"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                  style={styles.noteInput}
                  textAlignVertical="top"
                />
              </View>
                </>
              )}
            </>
          )
        ) : null}
      </BottomSheetScrollView>

      {!isActiveChildBooked &&
        activeChild &&
        !showContextLoading &&
        !showContextError && (
        <View style={styles.footer}>
          <Pressable
            disabled={!canConfirm}
            onPress={handleConfirm}
            style={[
              styles.confirmBtn,
              !canConfirm && styles.confirmBtnDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={[
                  styles.confirmBtnText,
                  !canConfirm && styles.confirmBtnTextDisabled,
                ]}
              >
                Confirm conference for {activeChild.name}
              </Text>
            )}
          </Pressable>
          {submitError ? (
            <Text style={styles.errorText}>{submitError}</Text>
          ) : null}
          {successMessage ? (
            <Text style={styles.successText}>{successMessage}</Text>
          ) : null}
        </View>
      )}
    </BottomSheetModal>
  );
});

ParentTeacherConferenceSheet.displayName = "ParentTeacherConferenceSheet";

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f3f4f6",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 15,
    color: "#1f2937",
  },
  closeBtn: {
    padding: 4,
  },
  childTabsWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f3f4f6",
  },
  sectionLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: "#9ca3af",
    marginBottom: 8,
  },
  childTabs: {
    gap: 8,
    paddingBottom: 4,
  },
  childTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#f3f4f6",
    backgroundColor: "#fff",
  },
  childTabSelected: {
    backgroundColor: Brand.sage700,
    borderColor: Brand.sage700,
  },
  childTabText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#4b5563",
  },
  childTabTextSelected: {
    color: "#fff",
  },
  distinctTeachersNote: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#b45309",
    marginTop: 8,
    lineHeight: 18,
  },
  singleChildWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f3f4f6",
  },
  singleChildText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
  singleChildName: {
    fontFamily: FontFamilies.bodySemiBold,
    color: "#374151",
  },
  bookedLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage700,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 24,
  },
  confirmedCard: {
    backgroundColor: "rgba(94, 124, 104, 0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(94, 124, 104, 0.2)",
    padding: 16,
    gap: 6,
  },
  confirmedTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 14,
    color: "#1f2937",
    marginBottom: 4,
  },
  confirmedLine: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#4b5563",
    lineHeight: 18,
  },
  confirmedLabel: {
    fontFamily: FontFamilies.bodySemiBold,
  },
  confirmedFooter: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    marginTop: 6,
    lineHeight: 18,
  },
  infoCallout: {
    backgroundColor: "rgba(94, 124, 104, 0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(94, 124, 104, 0.15)",
    padding: 14,
  },
  infoCalloutText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#4b5563",
    lineHeight: 18,
  },
  infoCalloutBold: {
    fontFamily: FontFamilies.bodySemiBold,
    color: "#1f2937",
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 14,
    color: "#1f2937",
  },
  sectionSub: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
    lineHeight: 17,
  },
  teacherRow: {
    gap: 12,
    paddingVertical: 4,
  },
  teacherCard: {
    width: 152,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  teacherCardSelected: {
    borderColor: Brand.sage700,
    borderWidth: 2,
  },
  teacherImageWrap: {
    height: 128,
    backgroundColor: "#f3f4f6",
    position: "relative",
  },
  teacherImage: {
    width: "100%",
    height: "100%",
  },
  yourTeacherBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: Brand.sage700,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  yourTeacherBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#fff",
  },
  teacherInfo: {
    padding: 10,
  },
  teacherName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#1f2937",
  },
  teacherGrade: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 2,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },
  pillSelected: {
    backgroundColor: Brand.sage700,
  },
  pillDisabled: {
    opacity: 0.5,
  },
  pillText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#4b5563",
  },
  pillTextSelected: {
    color: "#fff",
  },
  pillTextDisabled: {
    color: "#9ca3af",
  },
  slotGrid: {
    gap: 8,
  },
  slotGridFriday: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  slotBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  slotBtnFriday: {
    width: "48%",
  },
  slotBtnTaken: {
    backgroundColor: "#f3f4f6",
    opacity: 0.7,
  },
  slotBtnSelected: {
    backgroundColor: Brand.sage700,
    borderColor: Brand.sage700,
  },
  slotBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#374151",
  },
  slotBtnTextTaken: {
    color: "#9ca3af",
  },
  slotBtnTextSelected: {
    color: "#fff",
  },
  hint: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },
  formatRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  formatBtn: {
    flex: 1,
    minWidth: 140,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    backgroundColor: "#f9fafb",
  },
  formatBtnSelected: {
    backgroundColor: Brand.sage700,
    borderColor: Brand.sage700,
  },
  formatLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#374151",
  },
  formatLabelSelected: {
    color: "#fff",
  },
  formatSub: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 2,
  },
  formatSubSelected: {
    color: "rgba(255,255,255,0.8)",
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#1f2937",
    minHeight: 80,
    backgroundColor: "#fff",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#f3f4f6",
    gap: 8,
    backgroundColor: "#fff",
  },
  confirmBtn: {
    backgroundColor: Brand.sage700,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  confirmBtnDisabled: {
    backgroundColor: "#e5e7eb",
  },
  confirmBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#fff",
  },
  confirmBtnTextDisabled: {
    color: "#6b7280",
  },
  errorText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#dc2626",
    textAlign: "center",
  },
  successText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: Brand.sage700,
    textAlign: "center",
  },
  contextStateWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 16,
  },
  contextStateText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: Brand.sage700,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#fff",
  },
});
