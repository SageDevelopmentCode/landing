import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Brand, FontFamilies, Spacing } from "@/constants/theme";

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
        <Ionicons name="chevron-back" size={18} color="#374151" />
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
      <View style={s.toggle}>
        <Pressable
          style={[s.toggleBtn, paymentMethod === "card" && s.toggleBtnActive]}
          onPress={() => setPaymentMethod("card")}
        >
          <Text style={[s.toggleText, paymentMethod === "card" && s.toggleTextActive]}>
            Credit/Debit Card
          </Text>
        </Pressable>
        <Pressable
          style={[s.toggleBtn, paymentMethod === "ach" && s.toggleBtnActive]}
          onPress={() => setPaymentMethod("ach")}
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
      <Pressable style={s.checkRow} onPress={() => setCoverFees((v) => !v)}>
        <View style={[s.checkbox, coverFees && s.checkboxOn]}>
          {coverFees && <Ionicons name="checkmark" size={12} color="#fff" />}
        </View>
        <Text style={s.checkText}>I agree to pay the processing fee</Text>
      </Pressable>

      {/* Total box */}
      <View style={s.totalBox}>
        <Text style={s.totalBoxLabel}>Total</Text>
        <Text style={s.totalBoxAmt}>{formatCents(displayTotal)}</Text>
      </View>

      <Pressable
        style={[s.cta, loading && s.ctaDim]}
        onPress={() => onPay(coverFees, paymentMethod)}
        disabled={loading}
      >
        <Text style={s.ctaText}>
          {loading ? "Processing..." : `Pay ${formatCents(displayTotal)}`}
        </Text>
      </Pressable>

      {error && <Text style={s.errorText}>{error}</Text>}

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
    gap: 4,
  },
  backText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#374151",
  },

  sectionLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#111827",
  },

  toggle: {
    flexDirection: "row",
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  toggleBtnActive: {
    backgroundColor: "rgba(94,124,104,0.08)",
    borderColor: Brand.sage700,
  },
  toggleText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  toggleTextActive: {
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage800,
  },

  feeNote: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: -4,
  },

  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxOn: {
    backgroundColor: Brand.sage700,
    borderColor: Brand.sage700,
  },
  checkText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },

  totalBox: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#86EFAC",
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalBoxLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#16A34A",
  },
  totalBoxAmt: {
    fontFamily: FontFamilies.heading,
    fontSize: 24,
    color: "#111827",
  },

  cta: {
    backgroundColor: Brand.sage700,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  ctaDim: { backgroundColor: "#D1D5DB" },
  ctaText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#fff",
  },

  summaryCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    padding: 14,
    gap: 6,
  },
  summaryLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#9CA3AF",
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
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#111827",
  },
  summaryAmt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#111827",
  },
  summaryDetail: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6B7280",
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
  summarySubtotalLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
  },
  summarySubtotalAmt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
  },

  checkNote: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 16,
  },
  errorText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#DC2626",
    textAlign: "center",
  },
});
