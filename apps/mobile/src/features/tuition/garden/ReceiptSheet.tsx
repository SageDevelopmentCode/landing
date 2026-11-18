// Receipt for one payment. The math (children breakdown, processing fee,
// payer) is identical to the old TransactionDetailSheet; only the skin is new.
import {
  Display,
  Garden,
  GardenAvatar,
  GardenFonts,
  GardenRadii,
  gardenSheetChrome,
  gardenShadowSm,
} from "@/components/garden";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatCents, formatPaymentType, firstNames, studentsForTx, type StudentInfo } from "../tuitionUtils";
import type { ParentTuition } from "../useParentTuition";
import { AvatarStack, TxStatusPill } from "./TuitionParts";

function ReceiptRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={s.row}>
      <Text style={[s.rowLabel, highlight && s.rowLabelHi]} maxFontSizeMultiplier={1.35}>
        {label}
      </Text>
      <Text style={[s.rowValue, highlight && s.rowValueHi]} maxFontSizeMultiplier={1.35}>
        {value}
      </Text>
    </View>
  );
}

function Perforation() {
  return (
    <View style={s.perfWrap}>
      <View style={s.perf} />
    </View>
  );
}

export function ReceiptSheet({ c }: { c: ParentTuition }) {
  const insets = useSafeAreaInsets();
  const tx = c.selectedTx;
  const student = tx ? (c.studentMap[tx.student_id ?? ""] ?? null) : null;
  const meta = tx?.metadata as Record<string, string> | null;
  const { all: allStudents, siblings: sibStudents, sibIds } = tx
    ? studentsForTx(tx, student, c.studentMap)
    : { all: [] as StudentInfo[], siblings: [] as StudentInfo[], sibIds: [] as string[] };

  let childRows: { student: StudentInfo | null; amountCents: number | null }[] = [];
  if (tx && sibIds.length > 0 && tx.intended_amount_cents != null) {
    const sibCentsArr = (meta?.sibling_intended_cents ?? "")
      .split(",")
      .map(Number)
      .filter(Boolean);
    const sibTotal = sibCentsArr.reduce((a, b) => a + b, 0);
    const primaryIntended = tx.intended_amount_cents - sibTotal;
    childRows = [
      { student, amountCents: primaryIntended },
      ...sibStudents.map((st, i) => ({ student: st, amountCents: sibCentsArr[i] ?? null })),
    ];
  }

  const headerNames = firstNames(allStudents);

  const hasFee =
    tx != null &&
    tx.cover_fees === true &&
    tx.intended_amount_cents != null &&
    tx.amount_cents !== tx.intended_amount_cents;
  const feeCents = hasFee && tx ? tx.amount_cents - tx.intended_amount_cents! : 0;

  const caption = tx
    ? `${formatPaymentType(tx.payment_type)} · ${new Date(tx.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })}`
    : "";

  return (
    <BottomSheetModal ref={c.detailSheetRef} {...gardenSheetChrome} snapPoints={["62%", "90%"]} enableDynamicSizing={false}>
      <BottomSheetScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}>
        {tx ? (
          <View style={s.paper}>
            <View style={s.hero}>
              <AvatarStack students={allStudents} size={52} />
              <Text style={s.heroNames} maxFontSizeMultiplier={1.35}>
                {headerNames}
              </Text>
              <Display size={40}>{formatCents(tx.amount_cents)}</Display>
              <TxStatusPill status={tx.status} center />
              <Text style={s.caption} maxFontSizeMultiplier={1.35}>
                {caption}
              </Text>
            </View>

            <Perforation />

            {childRows.length > 0 ? (
              <View style={s.section}>
                <Text style={s.blockLabel}>Children</Text>
                {childRows.map((row, i) => (
                  <View key={i} style={s.childRow}>
                    <GardenAvatar name={row.student?.name ?? "—"} uri={row.student?.profileImageUrl} seed={row.student?.id} size={28} />
                    <Text style={s.childName} numberOfLines={1} maxFontSizeMultiplier={1.35}>
                      {row.student?.name ?? "—"}
                    </Text>
                    {row.amountCents != null ? (
                      <Text style={s.rowValue} maxFontSizeMultiplier={1.35}>
                        {formatCents(row.amountCents)}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}

            <View style={s.section}>
              <Text style={s.blockLabel}>Summary</Text>
              {tx.intended_amount_cents != null ? (
                <ReceiptRow label="Tuition" value={formatCents(tx.intended_amount_cents)} />
              ) : null}
              {hasFee ? <ReceiptRow label="Processing Fee" value={formatCents(feeCents)} /> : null}
              <ReceiptRow label="Total Paid" value={formatCents(tx.amount_cents)} highlight />
            </View>

            {tx.payer_name || tx.payer_email ? (
              <>
                <Perforation />
                <View style={s.section}>
                  <Text style={s.blockLabel}>Payer</Text>
                  {tx.payer_name ? (
                    <View style={s.row}>
                      <Text style={s.rowLabel}>Name</Text>
                      <Text style={s.payerValue} numberOfLines={1}>
                        {tx.payer_name}
                      </Text>
                    </View>
                  ) : null}
                  {tx.payer_email ? (
                    <View style={s.row}>
                      <Text style={s.rowLabel}>Email</Text>
                      <Text style={s.payerValue} numberOfLines={1}>
                        {tx.payer_email}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </>
            ) : null}
          </View>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingTop: 6 },
  paper: {
    backgroundColor: Garden.white,
    borderRadius: GardenRadii.card,
    borderWidth: 1,
    borderColor: Garden.line,
    paddingHorizontal: 18,
    paddingBottom: 18,
    ...gardenShadowSm,
  },
  hero: { alignItems: "center", paddingTop: 22, paddingBottom: 18, gap: 6 },
  heroNames: { fontFamily: GardenFonts.bodyBold, fontSize: 14, color: Garden.soft, marginTop: 4 },
  caption: {
    fontFamily: GardenFonts.bodySemi,
    fontSize: 12.5,
    color: Garden.muted,
    marginTop: 2,
    textAlign: "center",
  },
  perfWrap: { overflow: "hidden", marginVertical: 4 },
  perf: { borderBottomWidth: 1.5, borderStyle: "dashed", borderColor: Garden.line },
  section: { marginTop: 8 },
  blockLabel: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 11,
    color: Garden.muted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
    marginTop: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    minHeight: 40,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Garden.line,
  },
  rowLabel: { fontFamily: GardenFonts.bodySemi, fontSize: 14, color: Garden.soft },
  rowLabelHi: { fontFamily: GardenFonts.bodyHeavy, color: Garden.ink },
  rowValue: { fontFamily: GardenFonts.bodyBold, fontSize: 14, color: Garden.ink },
  rowValueHi: { fontFamily: GardenFonts.display, fontSize: 17, color: Garden.sageDeep },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Garden.line,
  },
  childName: { flex: 1, fontFamily: GardenFonts.bodySemi, fontSize: 14, color: Garden.ink },
  payerValue: { flex: 1, textAlign: "right", fontFamily: GardenFonts.bodySemi, fontSize: 14, color: Garden.ink },
});
