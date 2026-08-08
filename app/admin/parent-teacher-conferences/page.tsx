import { getAllConferenceBookings } from "@/app/lib/get-all-conference-bookings";
import { CONFERENCE_TEACHERS } from "@/app/lib/parent-teacher-conference";
import { cssColors as colors } from "../design-system";
import ConferenceScheduleClient from "./ConferenceScheduleClient";

export default async function ParentTeacherConferencesPage() {
  let bookings: Awaited<ReturnType<typeof getAllConferenceBookings>>["bookings"] =
    [];
  let countsByTeacherId: Awaited<
    ReturnType<typeof getAllConferenceBookings>
  >["countsByTeacherId"] = {};
  let loadError: string | null = null;

  try {
    const result = await getAllConferenceBookings();
    bookings = result.bookings;
    countsByTeacherId = result.countsByTeacherId;
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Failed to load conference bookings";
  }

  if (loadError) {
    return (
      <div style={{ padding: "32px", color: colors.textPrimary }}>
        <p style={{ color: "#dc2626" }}>{loadError}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", color: colors.textPrimary, maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          Parent-Teacher Conferences
        </h1>
        <p style={{ fontSize: 13, color: colors.textSecondary }}>
          {bookings.length} confirmed conference
          {bookings.length !== 1 ? "s" : ""} · School year 2026–27
        </p>
      </div>

      <ConferenceScheduleClient
        bookings={bookings}
        teacherOptions={CONFERENCE_TEACHERS}
        countsByTeacherId={countsByTeacherId}
      />
    </div>
  );
}
