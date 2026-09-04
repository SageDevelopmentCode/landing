import { sendActivityPreferenceReminderPreview } from "@/app/actions/sendActivityPreferenceReminderEmail";
import { sendCommunityGardenDayInviteEmail } from "@/app/actions/sendCommunityGardenDayInviteEmail";
import { sendEnrollmentChecklistDeadlineReminderEmail } from "@/app/actions/sendEnrollmentChecklistDeadlineReminderEmail";
import { sendEnrollmentConfirmationEmail } from "@/app/actions/sendEnrollmentConfirmationEmail";
import { sendEnrollmentReminder2Email } from "@/app/actions/sendEnrollmentReminder2Email";
import { sendEnrollmentReminder3Email } from "@/app/actions/sendEnrollmentReminder3Email";
import { sendEnrollmentReminderEmail } from "@/app/actions/sendEnrollmentReminderEmail";
import { sendFreeFridayAnnouncementEmail } from "@/app/actions/sendFreeFridayAnnouncementEmail";
import { sendFunFridayConfirmationEmail } from "@/app/actions/sendFunFridayConfirmationEmail";
import { sendGoogleReviewIncentiveEmail } from "@/app/actions/sendGoogleReviewIncentiveEmail";
import { sendHomeschoolDropInClarificationEmail } from "@/app/actions/sendHomeschoolDropInClarificationEmail";
import { sendHomeschoolDropInConfirmationEmail } from "@/app/actions/sendHomeschoolDropInConfirmationEmail";
import { sendHomeschoolDropInTuitionReminderEmail } from "@/app/actions/sendHomeschoolDropInTuitionReminderEmail";
import { sendInfoSessionInviteEmail } from "@/app/actions/sendInfoSessionInviteEmail";
import { sendLaborDayReminderEmail } from "@/app/actions/sendLaborDayReminderEmail";
import { sendMeetTheTeacherJoyEmail } from "@/app/actions/sendMeetTheTeacherJoyEmail";
import { sendMeetTheTeacherJoyReminderEmail } from "@/app/actions/sendMeetTheTeacherJoyReminderEmail";
import { sendOpenHouseEnrollmentEmail } from "@/app/actions/sendOpenHouseEnrollmentEmail";
import { sendParentTeacherConferenceRescheduleEmail } from "@/app/actions/sendParentTeacherConferenceRescheduleEmail";
import { sendPaySummerTuitionEmail } from "@/app/actions/sendPaySummerTuitionEmail";
import { sendPaySummerTuitionEmail2 } from "@/app/actions/sendPaySummerTuitionEmail2";
import { sendRegistrationFeeConfirmationEmail } from "@/app/actions/sendRegistrationFeeConfirmationEmail";
import { sendSchoolYearCommitmentEmail } from "@/app/actions/sendSchoolYearCommitmentEmail";
import { sendSchoolYearSeptemberDropInTuitionReminderEmail } from "@/app/actions/sendSchoolYearSeptemberDropInTuitionReminderEmail";
import { sendSchoolYearSeptemberTuitionReminderEmail } from "@/app/actions/sendSchoolYearSeptemberTuitionReminderEmail";
import { sendSchoolYearTuitionClarificationEmail } from "@/app/actions/sendSchoolYearTuitionClarificationEmail";
import { sendSchoolYearTuitionDueDateTodayReminderEmail } from "@/app/actions/sendSchoolYearTuitionDueDateTodayReminderEmail";
import { sendSchoolYearTuitionInfoEmail } from "@/app/actions/sendSchoolYearTuitionInfoEmail";
import { sendSchoolYearTuitionReminderEmail } from "@/app/actions/sendSchoolYearTuitionReminderEmail";
import { sendSchoolYearWeekOneNewsletterEmail } from "@/app/actions/sendSchoolYearWeekOneNewsletterEmail";
import { sendSchoolYearWeekTwoNewsletterEmail } from "@/app/actions/sendSchoolYearWeekTwoNewsletterEmail";
import { sendSummerFirstDayEmail } from "@/app/actions/sendSummerFirstDayEmail";
import { sendSummerStartingEmail } from "@/app/actions/sendSummerStartingEmail";
import { sendSummerTuitionConfirmationEmail } from "@/app/actions/sendSummerTuitionConfirmationEmail";
import { sendSummerTuitionDueDateReminderEmail } from "@/app/actions/sendSummerTuitionDueDateReminderEmail";
import { sendSummerTuitionDueDateTodayReminderEmail } from "@/app/actions/sendSummerTuitionDueDateTodayReminderEmail";
import { sendSummerWeekEightNewsletterEmail } from "@/app/actions/sendSummerWeekEightNewsletterEmail";
import { sendSummerWeekElevenNewsletterEmail } from "@/app/actions/sendSummerWeekElevenNewsletterEmail";
import { sendSummerWeekFiveNewsletterEmail } from "@/app/actions/sendSummerWeekFiveNewsletterEmail";
import { sendSummerWeekFourNewsletterEmail } from "@/app/actions/sendSummerWeekFourNewsletterEmail";
import { sendSummerWeekOneNewsletterEmail } from "@/app/actions/sendSummerWeekOneNewsletterEmail";
import { sendSummerWeekSevenNewsletterEmail } from "@/app/actions/sendSummerWeekSevenNewsletterEmail";
import { sendSummerWeekSixNewsletterEmail } from "@/app/actions/sendSummerWeekSixNewsletterEmail";
import { sendSummerWeekThreeNewsletterEmail } from "@/app/actions/sendSummerWeekThreeNewsletterEmail";
import { sendSummerWeekTwelveNewsletterEmail } from "@/app/actions/sendSummerWeekTwelveNewsletterEmail";
import { sendSummerWeekTwoNewsletterEmail } from "@/app/actions/sendSummerWeekTwoNewsletterEmail";
import { sendSummerWelcomeEmail } from "@/app/actions/sendSummerWelcomeEmail";

export type OutreachApplication = {
  id: string;
  user_id: string;
  g1_full_name: string | null;
  g1_email: string | null;
  child_legal_name: string | null;
  program: string | null;
  student_id: string | null;
};

export type OutreachSendResult = { success: boolean; error?: string };

export type OutreachEmailSender = (
  app: OutreachApplication,
) => Promise<OutreachSendResult>;

const PROGRAM_FEES: Record<string, string> = {
  summer_26: "$75",
  school_year_26_27: "$500",
  both: "$575",
  homeschool_drop_in: "varies",
};

function withEmail(
  app: OutreachApplication,
  send: (email: string) => Promise<OutreachSendResult>,
): Promise<OutreachSendResult> {
  if (!app.g1_email) {
    return Promise.resolve({ success: false, error: "No parent email" });
  }
  return send(app.g1_email);
}

const OUTREACH_EMAIL_SENDERS: Record<string, OutreachEmailSender> = {
  "reg-fee-confirmation": (app) =>
    withEmail(app, (email) => {
      const feeStr = (PROGRAM_FEES[app.program ?? ""] ?? "$0").replace("$", "");
      return sendRegistrationFeeConfirmationEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        program: app.program,
        amountDollars: feeStr,
        email,
      });
    }),
  "enrollment-reminder": (app) =>
    withEmail(app, (email) =>
      sendEnrollmentReminderEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        program: app.program,
        email,
      }),
    ),
  "enrollment-reminder-2": (app) =>
    withEmail(app, (email) =>
      sendEnrollmentReminder2Email({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        program: app.program,
        email,
      }),
    ),
  "enrollment-reminder-3": (app) =>
    withEmail(app, (email) =>
      sendEnrollmentReminder3Email({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        program: app.program,
        email,
      }),
    ),
  "enrollment-checklist-reminder": (app) =>
    withEmail(app, (email) =>
      sendEnrollmentChecklistDeadlineReminderEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "enrollment-confirmation": (app) =>
    withEmail(app, (email) =>
      sendEnrollmentConfirmationEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        program: app.program,
        email,
      }),
    ),
  "info-session-invite": (app) =>
    withEmail(app, (email) =>
      sendInfoSessionInviteEmail({
        name: app.g1_full_name ?? "",
        email,
      }),
    ),
  "open-house-follow-up": (app) =>
    withEmail(app, (email) =>
      sendOpenHouseEnrollmentEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        program: app.program,
        email,
      }),
    ),
  "drop-in-payment-confirmation": (app) =>
    withEmail(app, (email) =>
      sendHomeschoolDropInConfirmationEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
        applicationId: app.id,
      }),
    ),
  "drop-in-clarification": (app) =>
    withEmail(app, (email) =>
      sendHomeschoolDropInClarificationEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "school-year-commitment": (app) =>
    withEmail(app, (email) =>
      sendSchoolYearCommitmentEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "summer-week-selection": (app) =>
    withEmail(app, (email) =>
      sendPaySummerTuitionEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "summer-week-selection-2": (app) =>
    withEmail(app, (email) =>
      sendPaySummerTuitionEmail2({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "summer-welcome": (app) =>
    withEmail(app, (email) =>
      sendSummerWelcomeEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "summer-tuition-confirmation": (app) =>
    withEmail(app, (email) =>
      sendSummerTuitionConfirmationEmail({
        parentId: app.user_id,
        applicationId: app.id,
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "summer-tuition-due-reminder": (app) =>
    withEmail(app, (email) =>
      sendSummerTuitionDueDateReminderEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "summer-tuition-due-today": (app) =>
    withEmail(app, (email) =>
      sendSummerTuitionDueDateTodayReminderEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "summer-starting-soon": (app) =>
    withEmail(app, (email) =>
      sendSummerStartingEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
        program: app.program,
      }),
    ),
  "summer-first-day": (app) =>
    withEmail(app, (email) =>
      sendSummerFirstDayEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "summer-week-one-newsletter": (app) =>
    withEmail(app, (email) =>
      sendSummerWeekOneNewsletterEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "summer-week-two-newsletter": (app) =>
    withEmail(app, (email) =>
      sendSummerWeekTwoNewsletterEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "summer-week-three-newsletter": (app) =>
    withEmail(app, (email) =>
      sendSummerWeekThreeNewsletterEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "summer-week-four-newsletter": (app) =>
    withEmail(app, (email) =>
      sendSummerWeekFourNewsletterEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "summer-week-five-newsletter": (app) =>
    withEmail(app, (email) =>
      sendSummerWeekFiveNewsletterEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "summer-week-six-newsletter": (app) =>
    withEmail(app, (email) =>
      sendSummerWeekSixNewsletterEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "summer-week-seven-newsletter": (app) =>
    withEmail(app, (email) =>
      sendSummerWeekSevenNewsletterEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "summer-week-eight-newsletter": (app) =>
    withEmail(app, (email) =>
      sendSummerWeekEightNewsletterEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "summer-week-eleven-newsletter": (app) =>
    withEmail(app, (email) =>
      sendSummerWeekElevenNewsletterEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "summer-week-twelve-newsletter": (app) =>
    withEmail(app, (email) =>
      sendSummerWeekTwelveNewsletterEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "school-year-week-one-newsletter": (app) =>
    withEmail(app, (email) =>
      sendSchoolYearWeekOneNewsletterEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "school-year-week-two-newsletter": (app) =>
    withEmail(app, (email) =>
      sendSchoolYearWeekTwoNewsletterEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "september-tuition-reminder-school-year": (app) =>
    withEmail(app, (email) =>
      sendSchoolYearSeptemberTuitionReminderEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "september-tuition-reminder-drop-in": (app) =>
    withEmail(app, (email) =>
      sendSchoolYearSeptemberDropInTuitionReminderEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "labor-day-reminder": (app) =>
    withEmail(app, (email) =>
      sendLaborDayReminderEmail({
        g1FullName: app.g1_full_name ?? "",
        email,
      }),
    ),
  "free-friday-announcement": (app) =>
    withEmail(app, (email) =>
      sendFreeFridayAnnouncementEmail({
        parentName: app.g1_full_name ?? "",
        childName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "fun-friday-confirmation": (app) =>
    withEmail(app, (email) =>
      sendFunFridayConfirmationEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
        applicationId: app.id,
      }),
    ),
  "google-review-incentive": (app) =>
    withEmail(app, (email) =>
      sendGoogleReviewIncentiveEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "meet-miss-joy-invite": (app) =>
    withEmail(app, (email) =>
      sendMeetTheTeacherJoyEmail({
        parentName: app.g1_full_name ?? "",
        email,
      }),
    ),
  "meet-miss-joy-reminder": (app) =>
    withEmail(app, (email) =>
      sendMeetTheTeacherJoyReminderEmail({
        parentName: app.g1_full_name ?? "",
        email,
      }),
    ),
  "activity-preference-reminder": (app) => {
    if (!app.g1_email) {
      return Promise.resolve({ success: false, error: "No parent email" });
    }
    if (!app.student_id) {
      return Promise.resolve({ success: false, error: "No student linked" });
    }
    return sendActivityPreferenceReminderPreview({
      email: app.g1_email,
      g1FullName: app.g1_full_name ?? "",
      childLegalName: app.child_legal_name ?? "your child",
    });
  },
  "ptc-reschedule": (app) =>
    withEmail(app, (email) =>
      sendParentTeacherConferenceRescheduleEmail({
        email,
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "your child",
      }),
    ),
  "community-garden-day-invite": (app) =>
    withEmail(app, (email) =>
      sendCommunityGardenDayInviteEmail({
        g1FullName: app.g1_full_name ?? "",
        email,
      }),
    ),
  "school-year-tuition-info": (app) =>
    withEmail(app, (email) =>
      sendSchoolYearTuitionInfoEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "tuition-clarification-2nd-4th": (app) =>
    withEmail(app, (email) =>
      sendSchoolYearTuitionClarificationEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "august-tuition-reminder-school-year": (app) =>
    withEmail(app, (email) =>
      sendSchoolYearTuitionReminderEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "august-tuition-due-tonight-school-year": (app) =>
    withEmail(app, (email) =>
      sendSchoolYearTuitionDueDateTodayReminderEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
  "august-tuition-reminder-drop-in": (app) =>
    withEmail(app, (email) =>
      sendHomeschoolDropInTuitionReminderEmail({
        g1FullName: app.g1_full_name ?? "",
        childLegalName: app.child_legal_name ?? "",
        email,
      }),
    ),
};

export function getOutreachEmailSender(emailKey: string): OutreachEmailSender | null {
  return OUTREACH_EMAIL_SENDERS[emailKey] ?? null;
}
