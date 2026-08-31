import { PaymentMethodStep } from "@/components/billing/PaymentMethodStep";
import { API_BASE_URL } from "@/constants/config";
import { Brand, FontFamilies, Spacing } from "@/constants/theme";
import { useStripePayment } from "@/hooks/useStripePayment";
import { supabase } from "@/lib/supabase";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type TuitionResult = {
  label: string;
  amount_cents: number;
  code: string;
};

export function TuitionCodeSheet({
  sheetRef,
  parentId,
  onSuccess,
}: {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  parentId: string;
  onSuccess?: () => void;
}) {
  const { pay, loading, error: payError } = useStripePayment();
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"entry" | "payment">("entry");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TuitionResult | null>(null);

  function reset() {
    setCode("");
    setStep("entry");
    setValidating(false);
    setError(null);
    setResult(null);
  }

  async function handleValidate() {
    if (!code.trim()) return;
    setValidating(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Your session expired. Please sign in again.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/billing/validate-tuition-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code: code.trim(), parentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid code. Please check and try again.");
        return;
      }
      setResult(data);
      setStep("payment");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setValidating(false);
    }
  }

  async function handlePay(coverFees: boolean, paymentMethod: "card" | "ach") {
    if (!result) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const success = await pay("/api/stripe/create-custom-tuition-checkout", {
      tuitionCode: result.code,
      label: result.label,
      intendedAmountCents: result.amount_cents,
      coverFees,
      paymentMethod,
      parentEmail: user?.email ?? "",
    });
    if (success) {
      sheetRef.current?.dismiss();
      onSuccess?.();
    }
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["70%", "90%"]}
      enablePanDownToClose
      onDismiss={reset}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
        />
      )}
    >
      {step === "payment" && result ? (
        <BottomSheetScrollView contentContainerStyle={s.content}>
          <PaymentMethodStep
            intendedAmountCents={result.amount_cents}
            lineItems={[
              {
                studentName: "Tuition code",
                programLabel: result.label,
                detail: result.code,
                amountCents: result.amount_cents,
              },
            ]}
            onBack={() => setStep("entry")}
            onPay={handlePay}
            loading={loading}
            error={payError}
          />
        </BottomSheetScrollView>
      ) : (
        <BottomSheetScrollView contentContainerStyle={s.content}>
          <Text style={s.title}>Enter Tuition Code</Text>
          <Text style={s.subtitle}>
            Enter the tuition code provided by the school.
          </Text>
          <TextInput
            style={s.input}
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            placeholder="e.g. SMITH900"
            placeholderTextColor="#D1D5DB"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {error ? <Text style={s.error}>{error}</Text> : null}
          <Pressable
            style={[s.primaryBtn, (!code.trim() || validating) && s.primaryBtnDisabled]}
            disabled={!code.trim() || validating}
            onPress={handleValidate}
          >
            <Text style={s.primaryBtnText}>
              {validating ? "Checking…" : "Apply Code"}
            </Text>
          </Pressable>
        </BottomSheetScrollView>
      )}
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  content: { padding: Spacing.three, paddingBottom: 40 },
  title: {
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: "#111827",
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#111827",
    letterSpacing: 1,
  },
  error: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#B91C1C",
    marginTop: 8,
  },
  primaryBtn: {
    backgroundColor: "#0d9488",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#ffffff",
  },
});
