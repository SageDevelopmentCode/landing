export const STRIPE_URL_SCHEME = "sagefieldmobile";

export const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

if (__DEV__ && !STRIPE_PUBLISHABLE_KEY) {
  console.warn(
    "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set — Stripe payments will not work until the key is configured.",
  );
}
