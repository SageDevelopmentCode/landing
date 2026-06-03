import { createAdminClient } from "@/app/lib/supabase-server";
import { cssColors as colors } from "../design-system";
import { FreeFridayClient } from "./FreeFridayClient";
import { FreeFridayAnnouncement } from "./FreeFridayAnnouncement";
import type { FreeFridayRow } from "./FreeFridayDetailPanel";

export default async function FreeFridayPage() {
  const supabase = createAdminClient();

  const [{ data }, { count: enrolledCount }] = await Promise.all([
    supabase
      .schema("marketing")
      .from("free_friday_registrations")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false }),
    supabase
      .schema("parent_app")
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("approved", true)
      .eq("is_active", true),
  ]);

  const rows = (data ?? []) as FreeFridayRow[];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
          Free Friday
        </h1>
        <p className="text-sm mt-1" style={{ color: colors.textTertiary }}>
          June 5, 2026 · Bring a Friend for Free
        </p>
      </div>

      {/* Announcement email blast */}
      <FreeFridayAnnouncement recipientCount={enrolledCount ?? 0} />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Registrations", value: rows.length },
          { label: "New Families", value: rows.filter((r) => r.track === "new").length },
          { label: "Enrolled Families", value: rows.filter((r) => r.track === "enrolled").length },
          { label: "Confirmed", value: rows.filter((r) => r.status === "confirmed").length },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl px-4 py-3"
            style={{ backgroundColor: colors.elevated, border: `1px solid ${colors.border}` }}
          >
            <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{stat.value}</p>
            <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <FreeFridayClient rows={rows} />
    </div>
  );
}
