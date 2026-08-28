import type Stripe from "stripe";

const MOBILE_PI_PAYMENT_TYPES = new Set([
  "school_year_tuition",
  "fun_friday_tuition",
  "aftercare_tuition",
  "summer_tuition",
  "homeschool_dropin",
  "supply_fee",
  "custom_tuition",
]);

/** True for Payment Sheet PIs created by mobile checkout routes (not web Checkout Sessions). */
export function isMobilePaymentIntent(intent: Stripe.PaymentIntent): boolean {
  const metadata = intent.metadata ?? {};

  if (metadata.mobile === "true") return true;

  const paymentType = metadata.payment_type;
  if (!paymentType || !MOBILE_PI_PAYMENT_TYPES.has(paymentType)) return false;
  if (!metadata.parent_id) return false;

  const orderReference = intent.payment_details?.order_reference;
  if (orderReference?.startsWith("cs_")) return false;

  return true;
}
