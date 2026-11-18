// Garden pieces shared by the 8 read-only form detail screens:
// the screen shell (header + states + pull to refresh), cards, info rows,
// legal sections and the signature record.
import {
  Display,
  Garden,
  GardenEmpty,
  GardenErrorCard,
  GardenFonts,
  GardenIconButton,
  GardenRadii,
  GardenSkeleton,
  GardenSpace,
  GardenTints,
  Pill,
  gardenCard,
  type GardenTint,
} from "@/components/garden";
import { FontFamilies } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import type { SectionContent } from "../content/types";
import { formatDateTime, type SignatureRow } from "../formsUtils";
import type { FormDetail } from "../useFormDetail";
import { useFormsFeedback, type FormsFeedback } from "./useFormsFeedback";

const GUTTER = GardenSpace.gutter;
const EMAIL_RE = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi;

export function goBackOr(router: ReturnType<typeof useRouter>, fallback: "/(tabs)/forms" | "/(tabs)/home") {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

// ─── Header ──────────────────────────────────────────────────────────────────
export function FormDetailHeader({ title, completed }: { title: string; completed: boolean }) {
  const router = useRouter();
  return (
    <View style={s.header}>
      <GardenIconButton
        icon="chevron-back"
        label="Back to Forms & Docs"
        onPress={() => goBackOr(router, "/(tabs)/forms")}
      />
      <View style={s.headerText}>
        <Display size={title.length > 40 ? 21 : 24} numberOfLines={3}>
          {title}
        </Display>
        {completed ? (
          <Animated.View entering={FadeIn.duration(200)}>
            <Pill tint="mint">✓ Completed</Pill>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

// ─── Screen shell ────────────────────────────────────────────────────────────
/**
 * Composes header → (skeleton | error | empty | body) inside a pull-to-refresh
 * ScrollView. `children` renders the loaded data.
 */
export function FormDetailScreen<T>({
  title,
  detail,
  skeletonCards = 3,
  isEmpty,
  emptyTitle,
  emptyBody,
  children,
}: {
  title: string;
  detail: FormDetail<T>;
  skeletonCards?: number;
  /** Treat loaded data as "nothing on file" (e.g. maybeSingle() → null). */
  isEmpty?: (data: T) => boolean;
  emptyTitle?: string;
  emptyBody?: string;
  children: (data: T, fb: FormsFeedback) => ReactNode;
}) {
  const fb = useFormsFeedback(detail.reload);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, loading, error } = detail;
  const empty = data !== null && isEmpty ? isEmpty(data) : data === null;
  const ready = !loading && !error && data !== null && !empty;

  let body: ReactNode;
  if (loading) {
    body = <FormDetailSkeleton cards={skeletonCards} />;
  } else if (error === "missing") {
    body = (
      <GardenEmpty
        emoji="🧭"
        tint="butter"
        title="This link is missing some details"
        body="Go back to Forms & Docs and open the document again."
        actionLabel="Back to Forms & Docs"
        onAction={() => goBackOr(router, "/(tabs)/forms")}
      />
    );
  } else if (error === "load") {
    body = (
      <GardenErrorCard
        title="We couldn't load this document"
        onRetry={() => void fb.retry()}
        retrying={fb.retrying}
      />
    );
  } else if (empty || data === null) {
    body = <FormEmpty title={emptyTitle} body={emptyBody} />;
  } else {
    body = (
      <View style={s.body}>{children(data, fb)}</View>
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <FormDetailHeader title={title} completed={ready} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
        refreshControl={
          loading || error === "missing" ? undefined : (
            <RefreshControl
              refreshing={fb.refreshing}
              onRefresh={() => void fb.refresh()}
              tintColor={Garden.sage}
            />
          )
        }
      >
        {body}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── States ──────────────────────────────────────────────────────────────────
export function FormDetailSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <View style={s.body} accessibilityLabel="Loading document" accessible>
      {Array.from({ length: cards }, (_, i) => (
        <View key={i} style={[s.card, { gap: 10 }]}>
          <GardenSkeleton width={140} height={18} />
          <GardenSkeleton width="92%" height={13} />
          <GardenSkeleton width="80%" height={13} />
          <GardenSkeleton width="55%" height={13} />
        </View>
      ))}
    </View>
  );
}

export function FormEmpty({
  title = "Nothing on file yet",
  body = "Documents will appear here once they are submitted.",
}: {
  title?: string;
  body?: string;
}) {
  return <GardenEmpty emoji="🗂️" tint="sky" title={title} body={body} />;
}

// ─── Cards ───────────────────────────────────────────────────────────────────
export function FormInfoCard({
  icon,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  children: string;
}) {
  return (
    <View style={s.info}>
      <View style={s.infoIcon}>
        <Ionicons name={icon} size={18} color={Garden.sageDeep} />
      </View>
      <Text style={s.infoText} maxFontSizeMultiplier={1.4}>
        {children}
      </Text>
    </View>
  );
}

export function FormCard({
  title,
  right,
  tint,
  children,
  style,
}: {
  title?: string;
  right?: ReactNode;
  tint?: GardenTint;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        s.card,
        tint ? { backgroundColor: GardenTints[tint].bg, borderColor: "transparent" } : null,
        style,
      ]}
    >
      {title || right ? (
        <View style={s.cardHead}>
          {title ? (
            <View style={{ flex: 1 }}>
              <Display size={19}>{title}</Display>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** "Medications (2)"-style list heading between cards. */
export function FormListHeading({ children }: { children: string }) {
  return (
    <Display size={21} style={{ marginTop: 6 }}>
      {children}
    </Display>
  );
}

export function InfoRow({
  label,
  value,
  right,
}: {
  label: string;
  value: string | null | undefined;
  right?: ReactNode;
}) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.rowLabel} maxFontSizeMultiplier={1.4}>
          {label}
        </Text>
        <Text style={s.rowValue} selectable maxFontSizeMultiplier={1.4}>
          {value || "—"}
        </Text>
      </View>
      {right}
    </View>
  );
}

// ─── Text with tappable email addresses ──────────────────────────────────────
export function LinkedText({
  text,
  onEmail,
  style,
}: {
  text: string;
  onEmail?: (email: string) => void;
  style?: StyleProp<TextStyle>;
}) {
  const parts = onEmail ? text.split(EMAIL_RE) : [text];
  if (!onEmail || parts.length === 1) {
    return (
      <Text style={style} maxFontSizeMultiplier={1.4}>
        {text}
      </Text>
    );
  }
  return (
    <Text style={style} maxFontSizeMultiplier={1.4}>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <Text
            key={i}
            style={s.link}
            accessibilityRole="link"
            accessibilityHint="Opens Mail"
            suppressHighlighting={false}
            onPress={() => onEmail(p)}
          >
            {p}
          </Text>
        ) : (
          p
        ),
      )}
    </Text>
  );
}

// ─── Legal section ───────────────────────────────────────────────────────────
export function LegalSection({
  title,
  section,
  onEmail,
  children,
}: {
  title: string;
  section: Pick<SectionContent, "paragraphs" | "bullets" | "afterBullets">;
  onEmail?: (email: string) => void;
  children?: ReactNode;
}) {
  return (
    <FormCard title={title}>
      <View style={{ gap: 8 }}>
        {section.paragraphs.map((p, i) => (
          <LinkedText key={`p${i}`} text={p} onEmail={onEmail} style={s.para} />
        ))}
        {section.bullets?.length ? (
          <View style={{ gap: 6 }}>
            {section.bullets.map((b, i) => (
              <View key={`b${i}`} style={s.bulletRow}>
                <View style={s.bulletDot} />
                <LinkedText text={b} onEmail={onEmail} style={[s.para, { flex: 1 }]} />
              </View>
            ))}
          </View>
        ) : null}
        {section.afterBullets?.map((a, i) => (
          <LinkedText key={`a${i}`} text={a} onEmail={onEmail} style={s.para} />
        ))}
      </View>
      {children}
    </FormCard>
  );
}

// ─── Acknowledgment + signature ──────────────────────────────────────────────
export function AcknowledgmentCard({
  title,
  text,
  sig,
  onEmail,
}: {
  title: string;
  text: string;
  sig: SignatureRow | null | undefined;
  onEmail?: (email: string) => void;
}) {
  return (
    <FormCard title={title}>
      <View style={{ gap: 8 }}>
        {text.split("\n\n").map((t, i) => (
          <LinkedText key={i} text={t} onEmail={onEmail} style={s.para} />
        ))}
      </View>
      <SignatureRecord sig={sig} />
    </FormCard>
  );
}

/** The paper-styled signature record: printed name in script + date + ✓ stamp. */
export function SignatureRecord({ sig }: { sig: SignatureRow | null | undefined }) {
  if (!sig) {
    return (
      <View style={s.unsigned} accessible accessibilityLabel="Not signed yet">
        <Ionicons name="ellipse-outline" size={16} color={Garden.muted} />
        <Text style={s.unsignedText} maxFontSizeMultiplier={1.4}>
          Not signed yet
        </Text>
      </View>
    );
  }
  const date = formatDateTime(sig.signed_at);
  return (
    <View
      style={s.paper}
      accessible
      accessibilityLabel={`Signed by ${sig.printed_name}, ${date}`}
    >
      <View style={s.stamp}>
        <Ionicons name="checkmark" size={18} color={GardenTints.mint.fg} />
      </View>
      <Text style={s.rowLabel} maxFontSizeMultiplier={1.4}>
        Signed By
      </Text>
      <Text style={s.signature} maxFontSizeMultiplier={1.3}>
        {sig.printed_name || "—"}
      </Text>
      <View style={s.baseline} />
      <Text style={[s.rowLabel, { marginTop: 8 }]} maxFontSizeMultiplier={1.4}>
        Date Signed
      </Text>
      <Text style={s.rowValue} maxFontSizeMultiplier={1.4}>
        {date}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Garden.cream },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: GUTTER,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: Garden.cream,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Garden.line,
  },
  headerText: { flex: 1, gap: 6, paddingTop: 6 },
  scroll: { paddingHorizontal: GUTTER, paddingTop: 16 },
  body: { gap: 14 },
  card: { ...gardenCard, borderRadius: GardenRadii.md, padding: 18 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  info: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    backgroundColor: GardenTints.sage.bg,
    borderRadius: GardenRadii.md,
    padding: 14,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Garden.white,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    flex: 1,
    fontFamily: GardenFonts.bodySemi,
    fontSize: 14,
    color: Garden.sageDeep,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Garden.line,
  },
  rowLabel: { fontFamily: GardenFonts.bodyBold, fontSize: 13, color: Garden.muted },
  rowValue: { fontFamily: GardenFonts.bodySemi, fontSize: 15, color: Garden.ink },
  para: { fontFamily: GardenFonts.body, fontSize: 15, color: Garden.soft },
  link: {
    fontFamily: GardenFonts.bodyBold,
    color: Garden.sageDeep,
    textDecorationLine: "underline",
  },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Garden.sage,
    marginTop: 8,
  },
  paper: {
    marginTop: 14,
    backgroundColor: "#fffcf6",
    borderRadius: GardenRadii.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#e6d8c2",
    padding: 14,
  },
  stamp: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: GardenTints.mint.fg,
    backgroundColor: GardenTints.mint.bg,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-10deg" }],
  },
  signature: {
    fontFamily: FontFamilies.signature,
    fontSize: 28,
    color: Garden.sageDeep,
    marginTop: 2,
    paddingRight: 40,
  },
  baseline: { height: 1, backgroundColor: "#e6d8c2", marginTop: 2 },
  unsigned: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Garden.cream,
    borderRadius: GardenRadii.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  unsignedText: { fontFamily: GardenFonts.bodyBold, fontSize: 14, color: Garden.soft },
});
