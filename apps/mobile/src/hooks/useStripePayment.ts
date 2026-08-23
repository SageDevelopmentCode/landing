import { useState } from "react";
import { initStripe, useStripe } from "@stripe/stripe-react-native";
import { supabase } from "@/lib/supabase";
import { API_BASE_URL } from "@/constants/config";
import { STRIPE_PUBLISHABLE_KEY, STRIPE_URL_SCHEME } from "@/constants/stripe";
import { useAuth } from "@/contexts/AuthContext";
import * as Sentry from "@sentry/react-native";
import { notifyError } from "@/lib/discord";

export function useStripePayment() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { effectiveParentId, isReadOnlyPreview } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay(
    endpoint: string,
    payload: Record<string, unknown>,
  ): Promise<boolean> {
    if (isReadOnlyPreview) return false;
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const parentId = effectiveParentId ?? user.id;

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          parentId,
          parentEmail: user.email ?? "",
          mobile: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `Payment failed (${res.status})`);
      }
      if (!data.clientSecret) {
        throw new Error(
          data.url
            ? "Server returned web checkout instead of mobile payment. Please update the app or try again later."
            : "Failed to create payment",
        );
      }

      const publishableKey =
        (typeof data.publishableKey === "string" && data.publishableKey) ||
        STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        throw new Error("Stripe publishable key is not configured");
      }

      await initStripe({ publishableKey, urlScheme: STRIPE_URL_SCHEME });

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: data.clientSecret,
        customerEphemeralKeySecret: data.ephemeralKey,
        customerId: data.customerId,
        merchantDisplayName: "Sage Field",
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: { email: user.email ?? "" },
        returnURL: "sagefieldmobile://stripe-redirect",
      });
      if (initError) throw new Error(initError.message);

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== "Canceled") {
          const err = new Error(presentError.message);
          notifyError(`stripe-checkout:${endpoint}`, err);
          Sentry.captureException(err, { tags: { area: "stripe-checkout", endpoint } });
          setError(presentError.message);
        }
        return false;
      }
      return true;
    } catch (e: unknown) {
      notifyError(`stripe-checkout:${endpoint}`, e);
      Sentry.captureException(e instanceof Error ? e : new Error(String(e)), {
        tags: { area: "stripe-checkout", endpoint },
      });
      setError(e instanceof Error ? e.message : "Payment failed");
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { pay, loading, error };
}
