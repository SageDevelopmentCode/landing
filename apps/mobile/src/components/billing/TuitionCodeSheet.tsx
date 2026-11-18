import { Garden, GardenButton, GardenFonts, gardenSheetChrome } from "@/components/garden";
import { PaymentMethodStep } from "@/components/billing/PaymentMethodStep";
import { API_BASE_URL } from "@/constants/config";
import { useStripePayment } from "@/hooks/useStripePayment";
import { supabase } from "@/lib/supabase";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { GardenInlineError } from "./GardenInlineError";

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
      {...gardenSheetChrome}
      snapPoints={["70%", "90%"]}
      enableDynamicSizing={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      onDismiss={reset}
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
          <BottomSheetTextInput
            style={s.input}
            accessibilityLabel="Tuition code"
            returnKeyType="go"
            onSubmitEditing={() => void handleValidate()}
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            placeholder="e.g. SMITH900"
            placeholderTextColor="#d9cfbf"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {error ? <GardenInlineError message={error} style={{ marginTop: 10 }} /> : null}
          <GardenButton
            label="Apply Code"
            loading={validating}
            loadingLabel="Checking…"
            onPress={handleValidate}
            disabled={!code.trim()}
            fullWidth
            style={s.primaryBtn}
          />
        </BottomSheetScrollView>
      )}
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  content: { padding: 18, paddingTop: 6, paddingBottom: 40 },
  title: {
    fontFamily: GardenFonts.display,
    fontSize: 26,
    color: Garden.ink,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: GardenFonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Garden.soft,
    marginBottom: 16,
  },
  input: {
    backgroundColor: Garden.white,
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: Garden.line,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 16,
    color: Garden.ink,
    letterSpacing: 1.5,
  },
  primaryBtn: { marginTop: 20 },
});
