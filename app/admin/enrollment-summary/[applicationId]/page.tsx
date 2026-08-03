import { notFound } from "next/navigation";
import { createAdminClient } from "@/app/lib/supabase-server";
import { getAdminEnrollmentData } from "@/app/actions/getAdminEnrollmentData";
import { EnrollmentSummaryDocument } from "@/app/admin/components/enrollment-summary/EnrollmentSummaryDocument";
import { EnrollmentSummaryToolbar } from "./EnrollmentSummaryToolbar";

export default async function EnrollmentSummaryPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const adminClient = createAdminClient();

  const { data: application, error } = await adminClient
    .schema("parent_app")
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (error || !application) {
    notFound();
  }

  if (application.status !== "enrolled" || !application.student_id) {
    notFound();
  }

  const studentId = application.student_id;
  const enrollmentData = await getAdminEnrollmentData(application.user_id, [
    studentId,
  ]);

  const { data: immunizationFiles } = await adminClient.storage
    .from("immunization-records")
    .list(`${application.user_id}/${studentId}`, {
      sortBy: { column: "created_at", order: "asc" },
    });

  const immunizationFileNames = (immunizationFiles ?? [])
    .filter((f) => f.name !== ".emptyFolderPlaceholder")
    .map((f) => f.name);

  const generatedAt = new Date().toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <div className="enrollment-summary-print-root min-h-full bg-gray-50">
      <EnrollmentSummaryToolbar />
      <EnrollmentSummaryDocument
        application={application}
        enrollmentData={enrollmentData}
        studentId={studentId}
        registrationFeePaid={application.registration_fee_paid ?? false}
        immunizationFileNames={immunizationFileNames}
        generatedAt={generatedAt}
      />
    </div>
  );
}
