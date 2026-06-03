import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase-server";
import {
  sendDiscordNotification,
  createFreeFridayRegistrationEmbed,
  createErrorEmbed,
} from "@/app/lib/discord";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { track, formData, signatureName } = body;

    if (!track || !formData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const row =
      track === "enrolled"
        ? {
            track,
            agreement_signed: true,
            signature_name: signatureName ?? null,
            enrolled_parent_name: formData.enrolledParentName || null,
            enrolled_child_name: formData.enrolledChildName || null,
            friend_child_name: formData.friendChildName || null,
            friend_child_age: formData.friendChildAge ? Number(formData.friendChildAge) : null,
            friend_parent_name: formData.friendParentName || null,
            friend_parent_email: formData.friendParentEmail || null,
            friend_parent_phone: formData.friendParentPhone || null,
            track_a_emergency_name: formData.trackAEmergencyName || null,
            track_a_emergency_phone: formData.trackAEmergencyPhone || null,
            track_a_notes: formData.trackANotes || null,
            track_a_photo_consent: !!formData.trackAPhotoConsent,
          }
        : {
            track,
            agreement_signed: true,
            signature_name: signatureName ?? null,
            parent_name: formData.parentName || null,
            email: formData.email || null,
            phone: formData.phone || null,
            child_name: formData.childName || null,
            child_age: formData.childAge ? Number(formData.childAge) : null,
            referral_source: formData.referralSource || null,
            notes: formData.notes || null,
            emergency_name: formData.emergencyName || null,
            emergency_phone: formData.emergencyPhone || null,
            consent_outdoor: !!formData.consentOutdoor,
            consent_photo: !!formData.consentPhoto,
            interested_in_enrollment: !!formData.interestedInEnrollment,
          };

    const { error: insertError } = await supabase
      .schema("marketing")
      .from("free_friday_registrations")
      .insert(row);

    if (insertError) {
      console.error("Failed to insert free friday registration:", insertError);
      sendDiscordNotification(
        createErrorEmbed({
          context: "Free Friday Registration — DB insert",
          error: insertError.message,
          details: { track },
        })
      ).catch(() => {});
      return NextResponse.json({ error: "Failed to save registration" }, { status: 500 });
    }

    try {
      await sendDiscordNotification(
        createFreeFridayRegistrationEmbed({
          track,
          ...formData,
          signatureName,
        })
      );
    } catch (err) {
      console.error("Discord notification failed:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Free Friday registration error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
