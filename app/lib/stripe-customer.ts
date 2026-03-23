import { getStripe } from "@/app/lib/stripe";
import { createAdminClient } from "@/app/lib/supabase-server";

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
    return data.stripe_customer_id;
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
