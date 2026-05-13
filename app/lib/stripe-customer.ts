import { getStripe } from "@/app/lib/stripe";
import { createAdminClient } from "@/app/lib/supabase-server";
import Stripe from "stripe";

/**
 * Returns an existing Stripe Customer ID for the user, or creates one and stores it.
 * This enables Stripe Checkout to show saved payment methods on future sessions.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string | null,
): Promise<string> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .schema("admin")
    .from("users")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (data?.stripe_customer_id) {
    try {
      const existing = await getStripe().customers.retrieve(data.stripe_customer_id);
      if (!existing.deleted) return data.stripe_customer_id;
      // deleted customer — fall through to create a new one
    } catch (err: unknown) {
      if (!(err instanceof Stripe.errors.StripeError && err.code === "resource_missing")) {
        throw err; // unexpected error, re-throw
      }
      // resource_missing = stale ID from wrong mode/account — fall through
    }
  }

  const customer = await getStripe().customers.create({
    email,
    ...(name ? { name } : {}),
    metadata: { supabase_user_id: userId },
  });

  await supabase
    .schema("admin")
    .from("users")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  return customer.id;
}
