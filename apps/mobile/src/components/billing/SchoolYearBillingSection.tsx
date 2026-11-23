import {
  Display,
  Garden,
  GardenFonts,
  GardenRadii,
  GardenTints,
  gardenShadowSm,
  HandNote,
  MIN_TAP,
  Pill,
  PressableScale,
} from "@/components/garden";
import {
  countSchoolYearFunFridayPaidMonths,
  getSchoolYearHomeschoolApps,
  hasSchoolYearContent,
  type ApplicationRow,
  type PaidHomeschoolByStudent,
} from "@/lib/school-year-billing";
import { FUN_FRIDAY_DROPIN_CENTS } from "@/lib/school-year";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

const GUTTER = 18;

const CARD_IMAGES = {
  supply: require("@/assets/images/stock/Stock2.webp"),
  schoolYear: require("@/assets/images/stock/Stock4.webp"),
  homeschool: require("@/assets/images/stock/Stock5.webp"),
  aftercare: require("@/assets/images/stock/Stock3.webp"),
  funFriday: require("@/assets/images/stock/Stock1.webp"),
};

function formatDropinRate(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

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
  // Garden rule: no eyebrow above the heading — the "step i of 3" note sits below it.
  return (
    <View style={styles.stepHeader}>
      <View
        style={[
          styles.stepCircle,
          optional && styles.stepCircleOptional,
          done && styles.stepCircleDone,
        ]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {done ? (
          <Ionicons name="checkmark" size={18} color={Garden.white} />
        ) : optional ? (
          <Ionicons name="sparkles" size={15} color={GardenTints.lav.fg} />
        ) : (
          <Text style={styles.stepCircleText} maxFontSizeMultiplier={1.2}>
            {step}
          </Text>
        )}
      </View>
      <View style={styles.stepLabels}>
        <Display size={21}>{title}</Display>
        <HandNote size={16} color={optional ? GardenTints.lav.fg : Garden.sageDeep}>
          {optional ? "Optional" : `step ${step} of 3`}
          {done ? " · done ✓" : ""}
        </HandNote>
        {subtitle && !optional ? (
          <Pill tint="butter" style={{ marginTop: 4 }}>
            {subtitle}
          </Pill>
        ) : subtitle ? (
          <Text style={styles.stepSubtitle} maxFontSizeMultiplier={1.35}>
            {subtitle}
          </Text>
        ) : null}
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
  ctaPaid,
  locked,
  disabled,
  previewMode,
  onPress,
}: {
  bannerImage: number;
  programLabel: string;
  title: string;
  badge?: string;
  badgeGreen?: boolean;
  ctaLabel: string;
  ctaPaid?: boolean;
  locked?: boolean;
  disabled?: boolean;
  previewMode?: boolean;
  onPress?: () => void;
}) {
  const isPressable =
    !!onPress && (previewMode || (!disabled && !locked));
  const showLocked = !previewMode && locked;
  const dim = !previewMode && (disabled || locked);

  return (
    <PressableScale
      style={[styles.card, dim && styles.cardDisabled]}
      pressedScale={0.97}
      onPress={isPressable ? onPress : undefined}
      disabled={!isPressable}
      haptics={isPressable ? "tap" : false}
      accessibilityLabel={[title, badge, ctaLabel].filter(Boolean).join(", ")}
      accessibilityState={{ disabled: !isPressable }}
    >
      <View style={styles.cardBannerWrap}>
        <Image source={bannerImage} style={styles.cardBanner} contentFit="cover" />
        <LinearGradient
          colors={["transparent", "rgba(43,42,38,0.6)"]}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.cardProgramLabel} maxFontSizeMultiplier={1.3}>
          {programLabel}
        </Text>
        {badge ? (
          <View style={[styles.cardBadge, badgeGreen && styles.cardBadgeGreen]}>
            <Text
              style={[styles.cardBadgeText, badgeGreen && styles.cardBadgeTextGreen]}
              maxFontSizeMultiplier={1.3}
              numberOfLines={1}
            >
              {badgeGreen ? `${badge} ✓` : badge}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} maxFontSizeMultiplier={1.35} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.cardCtaRow}>
          {showLocked ? (
            <View style={[styles.cta, styles.lockedCta]}>
              <Ionicons name="lock-closed" size={12} color={Garden.muted} />
              <Text style={[styles.ctaText, { color: Garden.soft }]} maxFontSizeMultiplier={1.3}>
                {ctaLabel}
              </Text>
            </View>
          ) : ctaPaid ? (
            <View style={[styles.cta, styles.paidCta]}>
              <Ionicons name="checkmark-circle" size={14} color={Garden.sageDeep} />
              <Text style={[styles.ctaText, { color: Garden.sageDeep }]} maxFontSizeMultiplier={1.3}>
                {ctaLabel}
              </Text>
            </View>
          ) : (
            <View style={[styles.cta, previewMode ? styles.previewCta : styles.activeCta]}>
              <Text
                style={[styles.ctaText, { color: previewMode ? GardenTints.sky.fg : Garden.white }]}
                maxFontSizeMultiplier={1.3}
              >
                {ctaLabel}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={13}
                color={previewMode ? GardenTints.sky.fg : Garden.white}
              />
            </View>
          )}
        </View>
      </View>
    </PressableScale>
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
  readOnlyPreview = false,
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
  readOnlyPreview?: boolean;
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
        <View style={{ flex: 1 }}>
          <Display size={24}>School Year 26–27</Display>
        </View>
        <Pressable
          onPress={onCheckPress}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Paying by check? See instructions"
          style={({ pressed }) => [styles.checkLinkHit, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="mail-outline" size={14} color={Garden.sageDeep} />
          <Text style={styles.checkLink} maxFontSizeMultiplier={1.3}>
            Paying by check?
          </Text>
        </Pressable>
      </View>

      {showMultiChildSchoolYearBanner && (
        <View style={styles.sibBanner}>
          <Ionicons
            name="people"
            size={18}
            color={GardenTints.sky.fg}
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
            ctaLabel={
              supplyFeePaid ? "Paid" : readOnlyPreview ? "View plan" : "Pay now"
            }
            ctaPaid={supplyFeePaid}
            disabled={supplyFeePaid}
            previewMode={readOnlyPreview}
            onPress={onSelectSupplyFee}
          />
        </View>

        <View style={styles.stepBlock}>
          <StepHeader
            step="2"
            title="Tuition"
            subtitle="Tuition due December 1"
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
                    readOnlyPreview
                      ? hasPlan
                        ? "View plan"
                        : "View options"
                      : supplyFeePaid
                        ? hasPlan
                          ? "Add month"
                          : "Set up plan"
                        : "Pay supply fee first"
                  }
                  locked={!readOnlyPreview && !supplyFeePaid}
                  previewMode={readOnlyPreview}
                  onPress={() => onSelectHomeschool(app)}
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
                  readOnlyPreview
                    ? paidMonthsCount > 0
                      ? "View plan"
                      : "View options"
                    : supplyFeePaid
                      ? "Pay tuition"
                      : "Pay supply fee first"
                }
                locked={!readOnlyPreview && !supplyFeePaid}
                previewMode={readOnlyPreview}
                onPress={onSelectSchoolYearTuition}
              />
            )}
            <Pressable
              onPress={onTuitionCodePress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Have a tuition code? Enter it"
              style={({ pressed }) => [styles.tuitionCodeHit, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="pricetag-outline" size={14} color={Garden.sageDeep} />
              <Text style={styles.tuitionCodeLink} maxFontSizeMultiplier={1.3}>
                Have a tuition code?
              </Text>
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
                  : `${formatDropinRate(FUN_FRIDAY_DROPIN_CENTS)}/session drop-in`
              }
              badgeGreen={paidFfMonths > 0}
              ctaLabel={readOnlyPreview ? "View plan" : "Select plan"}
              previewMode={readOnlyPreview}
              onPress={onSelectFunFriday}
            />
            <ProgramCard
              bannerImage={CARD_IMAGES.aftercare}
              programLabel="School Year 26–27"
              title="Extended Learning (3:00–5:00pm)"
              badge="Optional"
              ctaLabel={readOnlyPreview ? "View plan" : "Select plan"}
              previewMode={readOnlyPreview}
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
    gap: 10,
    paddingHorizontal: GUTTER,
    marginTop: 4,
    marginBottom: 14,
  },
  checkLinkHit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: MIN_TAP,
  },
  checkLink: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 13.5,
    color: Garden.sageDeep,
    textDecorationLine: "underline",
  },
  sibBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: GUTTER,
    marginBottom: 18,
    backgroundColor: GardenTints.sky.bg,
    borderRadius: GardenRadii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sibBannerTitle: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 14,
    color: GardenTints.sky.fg,
  },
  sibBannerSub: {
    fontFamily: GardenFonts.body,
    fontSize: 13,
    color: Garden.soft,
    lineHeight: 18,
  },
  steps: { paddingHorizontal: GUTTER, gap: 28 },
  stepBlock: { gap: 12 },
  stepHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Garden.white,
    borderWidth: 2,
    borderColor: Garden.sage,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    ...gardenShadowSm,
  },
  stepCircleDone: { backgroundColor: Garden.sage, borderColor: Garden.sage },
  stepCircleOptional: { backgroundColor: GardenTints.lav.bg, borderColor: GardenTints.lav.bg },
  stepCircleText: {
    fontFamily: GardenFonts.hand,
    fontSize: 20,
    color: Garden.sageDeep,
    marginTop: -1,
  },
  stepLabels: { flex: 1, gap: 1 },
  stepSubtitle: {
    fontFamily: GardenFonts.bodySemi,
    fontSize: 13,
    color: Garden.soft,
    marginTop: 2,
  },
  stepCards: { gap: 14 },
  card: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
    // Mobile "toy shadow" for big cards.
    borderBottomWidth: 4,
    borderBottomColor: "#e6dccb",
  },
  cardDisabled: { opacity: 0.78 },
  cardBannerWrap: { height: 118 },
  cardBanner: { width: "100%", height: "100%" },
  cardProgramLabel: {
    position: "absolute",
    bottom: 10,
    left: 14,
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 11,
    color: "rgba(255,255,255,0.95)",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  cardBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    maxWidth: "70%",
    backgroundColor: Garden.butter,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    transform: [{ rotate: "3deg" }],
    ...gardenShadowSm,
  },
  cardBadgeGreen: { backgroundColor: Garden.mint },
  cardBadgeText: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 11.5,
    color: "#5c4500",
  },
  cardBadgeTextGreen: { color: GardenTints.mint.fg },
  cardBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
  },
  cardTitle: {
    fontFamily: GardenFonts.display,
    fontSize: 18,
    lineHeight: 21,
    letterSpacing: -0.4,
    color: Garden.ink,
  },
  cardCtaRow: { flexDirection: "row" },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: GardenRadii.pill,
    paddingHorizontal: 14,
    minHeight: 34,
  },
  ctaText: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 13,
  },
  lockedCta: { backgroundColor: "rgba(43,42,38,0.07)" },
  activeCta: { backgroundColor: Garden.coralDeep },
  paidCta: { backgroundColor: GardenTints.sage.bg },
  previewCta: { backgroundColor: GardenTints.sky.bg },
  tuitionCodeHit: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    minHeight: MIN_TAP,
  },
  tuitionCodeLink: {
    fontFamily: GardenFonts.bodyBold,
    fontSize: 14,
    color: Garden.sageDeep,
  },
});
