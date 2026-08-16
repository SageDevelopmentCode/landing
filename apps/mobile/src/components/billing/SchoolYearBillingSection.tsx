import { Brand, FontFamilies, Spacing } from "@/constants/theme";
import {
  countSchoolYearFunFridayPaidMonths,
  getSchoolYearHomeschoolApps,
  hasSchoolYearContent,
  type ApplicationRow,
  type PaidHomeschoolByStudent,
} from "@/lib/school-year-billing";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

const CARD_IMAGES = {
  supply: require("@/assets/images/stock/Stock2.webp"),
  schoolYear: require("@/assets/images/stock/Stock4.webp"),
  homeschool: require("@/assets/images/stock/Stock5.webp"),
  aftercare: require("@/assets/images/stock/Stock3.webp"),
  funFriday: require("@/assets/images/stock/Stock1.webp"),
};

type StudentInfo = { id: string; name: string; profileImageUrl: string | null };

function StepHeader({
  step,
  title,
  subtitle,
  done,
  optional,
}: {
  step: string;
  title: string;
  subtitle?: string;
  done?: boolean;
  optional?: boolean;
}) {
  return (
    <View style={styles.stepHeader}>
      <View
        style={[
          styles.stepCircle,
          optional && styles.stepCircleOptional,
          done && styles.stepCircleDone,
        ]}
      >
        {done ? (
          <Ionicons name="checkmark" size={16} color="#ffffff" />
        ) : optional ? (
          <Ionicons name="sparkles" size={14} color="#7c3aed" />
        ) : (
          <Text style={styles.stepCircleText}>{step}</Text>
        )}
      </View>
      <View style={styles.stepLabels}>
        <Text style={styles.stepEyebrow}>
          {optional ? "Optional" : `Step ${step}`}
        </Text>
        <Text style={styles.stepTitle}>{title}</Text>
        {subtitle ? <Text style={styles.stepSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function ProgramCard({
  bannerImage,
  programLabel,
  title,
  badge,
  badgeGreen,
  ctaLabel,
  locked,
  disabled,
  onPress,
}: {
  bannerImage: number;
  programLabel: string;
  title: string;
  badge?: string;
  badgeGreen?: boolean;
  ctaLabel: string;
  locked?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        (disabled || locked) && styles.cardDisabled,
        pressed && !disabled && !locked && { opacity: 0.85 },
      ]}
      onPress={!disabled && !locked ? onPress : undefined}
      disabled={disabled || locked || !onPress}
    >
      <View style={styles.cardBannerWrap}>
        <Image source={bannerImage} style={styles.cardBanner} contentFit="cover" />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.54)"]}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.cardProgramLabel}>{programLabel}</Text>
        {badge ? (
          <View
            style={[
              styles.cardBadge,
              badgeGreen && styles.cardBadgeGreen,
            ]}
          >
            <Text
              style={[
                styles.cardBadgeText,
                badgeGreen && styles.cardBadgeTextGreen,
              ]}
            >
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.cardCtaRow}>
          {locked ? (
            <View style={styles.lockedCta}>
              <Ionicons name="lock-closed" size={11} color="#6B7280" />
              <Text style={styles.lockedCtaText}>{ctaLabel}</Text>
            </View>
          ) : (
            <View style={styles.activeCta}>
              <Text style={styles.activeCtaText}>{ctaLabel}</Text>
              <Ionicons name="chevron-forward" size={12} color="#ffffff" />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export function SchoolYearBillingSection({
  activeStudentId,
  applications,
  allApplications,
  studentMap,
  paidSupplyFeeByStudent,
  paidSchoolYearByStudent,
  paidHomeschoolByStudent,
  paidFunFridayByStudent,
  showMultiChildSchoolYearBanner,
  onSelectSupplyFee,
  onSelectSchoolYearTuition,
  onSelectHomeschool,
  onSelectAftercare,
  onSelectFunFriday,
  onTuitionCodePress,
  onCheckPress,
}: {
  activeStudentId: string;
  applications: ApplicationRow[];
  allApplications: ApplicationRow[];
  studentMap: Record<string, StudentInfo>;
  paidSupplyFeeByStudent: Record<string, boolean>;
  paidSchoolYearByStudent: Record<string, number[]>;
  paidHomeschoolByStudent: PaidHomeschoolByStudent;
  paidFunFridayByStudent: Record<
    string,
    { months: string[]; fridays: string[] }
  >;
  showMultiChildSchoolYearBanner: boolean;
  onSelectSupplyFee: () => void;
  onSelectSchoolYearTuition: () => void;
  onSelectHomeschool: (app: ApplicationRow) => void;
  onSelectAftercare: () => void;
  onSelectFunFriday: () => void;
  onTuitionCodePress: () => void;
  onCheckPress: () => void;
}) {
  if (!hasSchoolYearContent(allApplications, activeStudentId)) return null;

  const supplyFeePaid = paidSupplyFeeByStudent[activeStudentId] ?? false;
  const paidMonthsCount =
    paidSchoolYearByStudent[activeStudentId]?.length ?? 0;
  const homeschoolApps = getSchoolYearHomeschoolApps(
    applications,
    activeStudentId,
  );
  const hasSchoolYearTuitionCard =
    applications.some(
      (a) =>
        a.program === "school_year_26_27" || a.program === "both",
    ) || homeschoolApps.length > 0;
  const paidFfMonths = countSchoolYearFunFridayPaidMonths(
    paidFunFridayByStudent[activeStudentId],
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabel}>School Year 26–27</Text>
        <Pressable onPress={onCheckPress} hitSlop={8}>
          <Text style={styles.checkLink}>Paying by check?</Text>
        </Pressable>
      </View>

      {showMultiChildSchoolYearBanner && (
        <View style={styles.sibBanner}>
          <Ionicons
            name="information-circle"
            size={18}
            color="#3b6cb7"
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.sibBannerTitle}>
              Pay for all children in one transaction
            </Text>
            <Text style={styles.sibBannerSub}>
              Add siblings during checkout and pay only one processing fee.
            </Text>
          </View>
        </View>
      )}

      <View style={styles.steps}>
        <View style={styles.stepBlock}>
          <StepHeader
            step="1"
            title="Supply Fee"
            done={supplyFeePaid}
          />
          <ProgramCard
            bannerImage={CARD_IMAGES.supply}
            programLabel="School Year 26–27"
            title="Annual Supply Fee"
            badge="$300"
            ctaLabel={supplyFeePaid ? "Paid" : "Pay now"}
            disabled={supplyFeePaid}
            onPress={supplyFeePaid ? undefined : onSelectSupplyFee}
          />
        </View>

        <View style={styles.stepBlock}>
          <StepHeader
            step="2"
            title="Tuition"
            subtitle="August tuition due Aug 10"
          />
          <View style={styles.stepCards}>
            {homeschoolApps.map((app) => {
              const hasPlan =
                (paidHomeschoolByStudent[app.student_id]?.schoolYear.length ??
                  0) > 0;
              return (
                <ProgramCard
                  key={app.id}
                  bannerImage={CARD_IMAGES.homeschool}
                  programLabel="School Year 26–27"
                  title="Homeschool Drop-In"
                  badge={hasPlan ? "Plan active" : "Select schedule & days"}
                  badgeGreen={hasPlan}
                  ctaLabel={
                    supplyFeePaid
                      ? hasPlan
                        ? "Add month"
                        : "Set up plan"
                      : "Pay supply fee first"
                  }
                  locked={!supplyFeePaid}
                  onPress={
                    supplyFeePaid
                      ? () => onSelectHomeschool(app)
                      : undefined
                  }
                />
              );
            })}
            {hasSchoolYearTuitionCard && (
              <ProgramCard
                bannerImage={CARD_IMAGES.schoolYear}
                programLabel="School Year 26–27"
                title="School Year Tuition"
                badge={
                  paidMonthsCount > 0
                    ? `${paidMonthsCount} mo. paid`
                    : undefined
                }
                badgeGreen={paidMonthsCount > 0}
                ctaLabel={
                  supplyFeePaid ? "Pay tuition" : "Pay supply fee first"
                }
                locked={!supplyFeePaid}
                onPress={
                  supplyFeePaid ? onSelectSchoolYearTuition : undefined
                }
              />
            )}
            <Pressable onPress={onTuitionCodePress} hitSlop={8}>
              <Text style={styles.tuitionCodeLink}>Have a tuition code?</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.stepBlock}>
          <StepHeader
            step="3"
            title="Add-ons"
            subtitle="Friday & aftercare programs"
            optional
          />
          <View style={styles.stepCards}>
            <ProgramCard
              bannerImage={CARD_IMAGES.funFriday}
              programLabel="School Year 26–27"
              title="Friday Enrichment Day"
              badge={
                paidFfMonths > 0
                  ? `${paidFfMonths} mo. paid`
                  : "Optional"
              }
              badgeGreen={paidFfMonths > 0}
              ctaLabel="Select plan"
              onPress={onSelectFunFriday}
            />
            <ProgramCard
              bannerImage={CARD_IMAGES.aftercare}
              programLabel="School Year 26–27"
              title="Extended Learning (3:00–5:00pm)"
              badge="Optional"
              ctaLabel="Select plan"
              onPress={onSelectAftercare}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 4 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  sectionLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  checkLink: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: Brand.sage700,
    textDecorationLine: "underline",
  },
  sibBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: Spacing.three,
    marginBottom: 12,
    backgroundColor: "rgba(59,108,183,0.08)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(59,108,183,0.22)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sibBannerTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#3b6cb7",
  },
  sibBannerSub: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 17,
  },
  steps: { paddingHorizontal: Spacing.three, gap: 28 },
  stepBlock: { gap: 12 },
  stepHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Brand.sage700,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleDone: { backgroundColor: Brand.sage700 },
  stepCircleOptional: { backgroundColor: "#ede9fe" },
  stepCircleText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#ffffff",
  },
  stepLabels: { flex: 1, gap: 2 },
  stepEyebrow: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  stepTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#374151",
  },
  stepSubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#d97706",
    marginTop: 2,
  },
  stepCards: { gap: 12 },
  card: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },
  cardDisabled: { opacity: 0.85 },
  cardBannerWrap: { height: 110 },
  cardBanner: { width: "100%", height: "100%" },
  cardProgramLabel: {
    position: "absolute",
    bottom: 8,
    left: 10,
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  cardBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cardBadgeGreen: { backgroundColor: "#22c55e" },
  cardBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#374151",
  },
  cardBadgeTextGreen: { color: "#ffffff" },
  cardBody: { padding: 12, gap: 10 },
  cardTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#111827",
  },
  cardCtaRow: { flexDirection: "row" },
  lockedCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  lockedCtaText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#6B7280",
  },
  activeCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Brand.sage700,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activeCtaText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#ffffff",
  },
  tuitionCodeLink: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
  },
});
