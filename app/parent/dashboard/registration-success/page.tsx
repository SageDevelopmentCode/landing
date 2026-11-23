import { getStripe } from "@/app/lib/stripe";
import { getBillingProgramLabel } from "@/app/lib/application-programs";
import { createServerSupabaseClient } from "@/app/lib/supabase-server";
import { resolveActingParentId } from "@/app/lib/parent-access";
import RegistrationSuccessCard from "../garden/RegistrationSuccessCard";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function RegistrationSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  let amountFormatted = "";
  let programLabel = "Summer 2026";

  if (session_id) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const session = await getStripe().checkout.sessions.retrieve(session_id);

      // Only show payment details to the parent the session belongs to (or their shared-access users).
      // Anyone else holding the link sees the generic success message.
      const actingParentId = user ? await resolveActingParentId(user.id) : null;
      if (actingParentId && session.metadata?.parent_id === actingParentId) {
        const cents = session.amount_total ?? 0;
        amountFormatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "usd",
        }).format(cents / 100);

        if (session.metadata?.application_ids) {
          // Combined payment — generic label
          programLabel = "all enrolled programs";
        } else {
          const program = session.metadata?.program ?? "summer_26";
          programLabel =
            program === "homeschool_drop_in"
              ? "Homeschool Drop-In"
              : getBillingProgramLabel(program);
        }
      }
    } catch (err) {
      console.error("Failed to retrieve Stripe session:", err);
    }
  }

  return (
    <RegistrationSuccessCard amount={amountFormatted}>
      {amountFormatted ? (
        <p>
          Thank you! Your child is now registered for {programLabel}. We&apos;ll be in touch with next steps soon.
        </p>
      ) : (
        <p>Thank you! We&apos;ll be in touch with next steps soon.</p>
      )}
    </RegistrationSuccessCard>
  );
}
