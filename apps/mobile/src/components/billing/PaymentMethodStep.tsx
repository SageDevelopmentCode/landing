import { Garden, GardenButton, GardenFonts, GardenTints, haptic } from "@/components/garden";
import { GardenInlineError } from "./GardenInlineError";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type LineItem = {
  studentName: string;
  programLabel: string;
  detail: string;
  amountCents: number;
};

type Props = {
  intendedAmountCents: number;
  lineItems?: LineItem[];
  onBack: () => void;
  onPay: (coverFees: boolean, paymentMethod: "card" | "ach") => Promise<void>;
  loading: boolean;
  error?: string | null;
};

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100
  );
}

export function PaymentMethodStep({ intendedAmountCents, lineItems, onBack, onPay, loading, error }: Props) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ach">("card");
  const [coverFees, setCoverFees] = useState(false);

  const cardFeeCents = useMemo(
    () => Math.round((intendedAmountCents + 30) / (1 - 0.029)) - intendedAmountCents,
    [intendedAmountCents]
  );
  const achFeeCents = useMemo(
    () => Math.min(Math.round(intendedAmountCents * 0.008), 500),
    [intendedAmountCents]
  );
  const feeCents = paymentMethod === "card" ? cardFeeCents : achFeeCents;
  const displayTotal = coverFees ? intendedAmountCents + feeCents : intendedAmountCents;

  return (
    <View style={s.container}>
      {/* Back row */}
      <Pressable style={s.backRow} onPress={onBack} hitSlop={8}>
        <Ionicons name="chevron-back" size={18} color={Garden.ink} />
        <Text style={s.backText}>Back to selection</Text>
      </Pressable>

      {/* Order summary */}
      {lineItems && lineItems.length > 0 && (
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>Order Summary</Text>
          {lineItems.map((item, i) => (
            <View key={i}>
              {i > 0 && <View style={s.summaryDivider} />}
              <View style={s.summaryRow}>
                <Text style={s.summaryName}>{item.studentName}</Text>
                <Text style={s.summaryAmt}>{formatCents(item.amountCents)}</Text>
              </View>
              <Text style={s.summaryDetail}>{item.programLabel} · {item.detail}</Text>
            </View>
          ))}
          {lineItems.length > 1 && (
            <>
              <View style={s.summaryDivider} />
              <View style={s.summaryRow}>
                <Text style={s.summarySubtotalLabel}>Subtotal</Text>
                <Text style={s.summarySubtotalAmt}>{formatCents(intendedAmountCents)}</Text>
              </View>
            </>
          )}
        </View>
      )}

      {/* Section label */}
      <Text style={s.sectionLabel}>How will you be paying?</Text>

      {/* Payment method toggle */}
      <View style={s.toggle} accessibilityRole="tablist">
        <Pressable
          style={[s.toggleBtn, paymentMethod === "card" && s.toggleBtnActive]}
          onPress={() => {
            if (paymentMethod !== "card") haptic.select();
            setPaymentMethod("card");
          }}
          accessibilityRole="tab"
          accessibilityState={{ selected: paymentMethod === "card" }}
        >
          <Text style={[s.toggleText, paymentMethod === "card" && s.toggleTextActive]}>
            Credit/Debit Card
          </Text>
        </Pressable>
        <Pressable
          style={[s.toggleBtn, paymentMethod === "ach" && s.toggleBtnActive]}
          onPress={() => {
            if (paymentMethod !== "ach") haptic.select();
            setPaymentMethod("ach");
          }}
          accessibilityRole="tab"
          accessibilityState={{ selected: paymentMethod === "ach" }}
        >
          <Text style={[s.toggleText, paymentMethod === "ach" && s.toggleTextActive]}>
            ACH / US bank account
          </Text>
        </Pressable>
      </View>

      {/* Fee estimate */}
      <Text style={s.feeNote}>
        {paymentMethod === "card"
          ? `Processing fee (est.): ~${formatCents(cardFeeCents)}`
          : `Processing fee (est.): ~${formatCents(achFeeCents)} (0.8%, max $5.00)`}
      </Text>

      {/* Agree to pay fee checkbox */}
      <Pressable
        style={s.checkRow}
        onPress={() => {
          haptic.select();
          setCoverFees((v) => !v);
        }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: coverFees }}
      >
        <View style={[s.checkbox, coverFees && s.checkboxOn]}>
          {coverFees && <Ionicons name="checkmark" size={12} color={Garden.white} />}
        </View>
        <Text style={s.checkText}>I agree to pay the processing fee</Text>
      </Pressable>

      {/* Total box */}
      <View style={s.totalBox}>
        <Text style={s.totalBoxLabel}>Total</Text>
        <Text style={s.totalBoxAmt}>{formatCents(displayTotal)}</Text>
      </View>

      <GardenButton
        label={`Pay ${formatCents(displayTotal)}`}
        loading={loading}
        loadingLabel="Processing..."
        disabled={!coverFees}
        onPress={() => void onPay(coverFees, paymentMethod)}
        fullWidth
      />

      {error ? <GardenInlineError message={error} /> : null}

      {/* Check note */}
      <Text style={s.checkNote}>
        Prefer to pay by check? Email us at sabrina@sagefield.co and we'll send you instructions.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    gap: 16,
  },

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    minHeight: 44,
  },
  backText: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 14,
    color: Garden.sageDeep,
  },

  sectionLabel: {
    fontFamily: GardenFonts.display,
    fontSize: 20,
    letterSpacing: -0.5,
    color: Garden.ink,
  },

  toggle: {
    flexDirection: "row",
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    minHeight: 52,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Garden.line,
    backgroundColor: Garden.white,
  },
  toggleBtnActive: {
    backgroundColor: GardenTints.sage.bg,
    borderColor: Garden.sage,
  },
  toggleText: {
    fontFamily: GardenFonts.bodySemi,
    fontSize: 13.5,
    color: Garden.soft,
    textAlign: "center",
  },
  toggleTextActive: {
    fontFamily: GardenFonts.bodyHeavy,
    color: Garden.sageDeep,
  },

  feeNote: {
    fontFamily: GardenFonts.body,
    fontSize: 12.5,
    color: Garden.soft,
    marginTop: -4,
  },

  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#d9cfbf",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Garden.white,
  },
  checkboxOn: {
    backgroundColor: Garden.sage,
    borderColor: Garden.sage,
  },
  checkText: {
    fontFamily: GardenFonts.bodyBold,
    fontSize: 14,
    color: Garden.ink,
    flex: 1,
  },

  totalBox: {
    backgroundColor: GardenTints.mint.bg,
    borderRadius: 20,
    borderWidth: 0,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalBoxLabel: {
    fontFamily: GardenFonts.bodyBold,
    fontSize: 14,
    color: GardenTints.mint.fg,
  },
  totalBoxAmt: {
    fontFamily: GardenFonts.display,
    fontSize: 26,
    color: Garden.ink,
  },

  summaryCard: {
    backgroundColor: Garden.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Garden.line,
    padding: 16,
    gap: 6,
  },
  summaryLabel: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 11,
    color: Garden.muted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryName: {
    fontFamily: GardenFonts.bodyBold,
    fontSize: 13,
    color: Garden.ink,
  },
  summaryAmt: {
    fontFamily: GardenFonts.bodyBold,
    fontSize: 13,
    color: Garden.ink,
  },
  summaryDetail: {
    fontFamily: GardenFonts.body,
    fontSize: 12,
    color: Garden.soft,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Garden.line,
    marginVertical: 8,
  },
  summarySubtotalLabel: {
    fontFamily: GardenFonts.bodyBold,
    fontSize: 13,
    color: Garden.ink,
  },
  summarySubtotalAmt: {
    fontFamily: GardenFonts.bodyBold,
    fontSize: 13,
    color: Garden.ink,
  },

  checkNote: {
    fontFamily: GardenFonts.body,
    fontSize: 12,
    color: Garden.muted,
    textAlign: "center",
    lineHeight: 17,
  },
});
