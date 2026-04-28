import { createServerSupabaseClient } from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import ShadowStartClient from "./ShadowStartClient";

export default async function ShadowDayStartPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/shadow-day/dashboard");
  }

  const params = await searchParams;

  return (
    <ShadowStartClient
      initialData={{
        firstName: params.firstName ?? "",
        lastName: params.lastName ?? "",
        email: params.email ?? "",
        phone: params.phone ?? "",
        childName: params.childName ?? "",
        childGrade: params.childGrade ?? "",
        referralSource: params.referralSource ?? "",
        notes: params.notes ?? "",
        shadowDate: params.shadowDate ?? "",
      }}
    />
  );
}
