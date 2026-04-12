"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  Mail,
  UserX,
  Smartphone,
  MessageCircle,
  ChevronRight,
  Camera,
  Loader2,
} from "lucide-react";
import { uploadStudentProfileImage } from "@/app/actions/uploadStudentProfileImage";
import { getParentStudentAttendance, type ParentCheckInRecord } from "@/app/actions/getParentStudentAttendance";
import { DetailSidebar } from "@/app/admin/components/DetailSidebar";
import { SidebarField, SidebarSection } from "@/app/components/SidebarPrimitives";
import NextImage from "next/image";
import type { Database } from "@/app/types/database.types";
import type { TeacherAssignment } from "@/app/actions/teacherAssignments";

type Student = Database["admin"]["Tables"]["students"]["Row"];

type ContentTab = "teacher" | "attendance" | "learning" | "photos" | "profile";

interface Props {
  children: Student[];
  teachersByStudent: Record<string, TeacherAssignment[]>;
  nonEnrolledAppByStudent: Record<string, string>;
  studentProgramMap: Record<string, string>;
}

function formatProgramLabel(program: string | undefined | null): string | null {
  switch (program) {
    case "summer_26": return "Summer 2026";
    case "school_year_26_27": return "School Year 26–27";
    case "both": return "Summer & School Year";
    case "homeschool_drop_in": return "Homeschool Drop-In";
    default: return null;
  }
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function computeAge(
  month: string | null,
  day: string | null,
  year: string | null,
): number | null {
  if (!month || !day || !year) return null;
  const dob = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function formatDOB(
  month: string | null,
  day: string | null,
  year: string | null,
): string {
  if (!month && !day && !year) return "—";
  return [month, day, year].filter(Boolean).join("/");
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="py-2.5 border-b border-gray-50 last:border-0">
      <p className="text-xs font-body text-gray-400 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-sm font-body text-gray-700">
        {value?.trim() || (
          <span className="text-gray-300 italic">Not provided</span>
        )}
      </p>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold font-heading text-[#4a7c59] mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function EmptyStateCard({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 p-12 text-center">
      <div
        className="flex items-center justify-center w-14 h-14 rounded-full mb-4"
        style={{ backgroundColor: "#d4e6d0" }}
      >
        <Icon
          className="w-6 h-6"
          style={{ color: "#4a7c59" }}
          strokeWidth={1.5}
        />
      </div>
      <p className="text-base font-semibold font-heading text-gray-700 mb-1">
        {title}
      </p>
      <p className="text-sm font-body text-gray-400">{subtitle}</p>
    </div>
  );
}

const TEACHER_CARD_DATA: Record<
  string,
  { role: string; image: string; about: string; email: string }
> = {
  "Sabrina Obnamia": {
    role: "Lead Teacher & Director",
    image: "/assets/Headshot.jpeg",
    email: "sabrina@sagefieldschool.com",
    about:
      "Ms. Sabrina brings a wealth of experience to SageField. She holds a Bachelor's degree in Elementary Education with a concentration in Early Childhood Development from Biola University and a Teaching Credential. Her background includes working with children in a wide range of roles both in the U.S. and internationally—spanning special education, preschool, homeschooling, tutoring, coaching, traditional schooling, nature school guide, and more.",
  },
  "Paige Wood": {
    role: "Primary Lead Teacher",
    image: "/assets/team/Paige.webp",
    email: "paige@sagefieldschool.com",
    about:
      "Ms. Paige is the Lead Primary Teacher at Sage Field Private School. She has a passion for outdoor-based learning and creating environments where young children feel safe, curious, and inspired. With experience in Montessori-style education and outdoor learning, she brings creativity and intentionality to every lesson.",
  },
  "Zelinda Melo": {
    role: "Teacher Aide",
    image: "/assets/team/Zelinda.webp",
    email: "zelinda@sagefieldschool.com",
    about:
      "Ms. Zelinda has a deep love for children and a heart for nurturing their growth in a safe and encouraging environment. She looks forward to supporting each child's learning journey and being a positive presence in their day.",
  },
  "Nicole Elias": {
    role: "Summer Program Curriculum Coordinator",
    image: "/assets/team/Nicole.jpg",
    email: "",
    about:
      "My name is Nicole, and I am a teacher with a passion for hands-on, experiential learning. I believe every child deserves an education that sparks curiosity and joy. I am excited to bring creative, nature-inspired curriculum to our summer program.",
  },
  "Taylor Elias": {
    role: "Summer Program Curriculum Coordinator",
    image: "/assets/team/Taylor.jpg",
    email: "",
    about:
      "My name is Taylor, and I recently completed my education studies with a focus on child development and outdoor learning. I am passionate about creating meaningful experiences for children that connect them to nature and inspire a love of learning.",
  },
};

function TeacherCard({
  name,
  role,
  about,
  imageSrc,
  email,
  onMessage,
}: {
  name: string;
  role: string;
  about: string;
  imageSrc?: string;
  email: string;
  onMessage: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
      {imageSrc ? (
        <div className="relative w-full h-90">
          <NextImage
            src={imageSrc}
            alt={name}
            fill
            className="object-cover object-top"
          />
        </div>
      ) : (
        <div
          className="flex items-center justify-center w-full h-48"
          style={{ backgroundColor: "#d4e6d0" }}
        >
          <span
            className="text-4xl font-bold font-heading"
            style={{ color: "#4a7c59" }}
          >
            {getInitials(name)}
          </span>
        </div>
      )}
      <div className="p-5 space-y-2">
        <p className="text-lg font-semibold font-heading text-gray-800">
          {name}
        </p>
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#4a7c59]/10 text-[#4a7c59]">
          {role}
        </span>
        <p className="text-sm font-body text-gray-500 leading-relaxed">
          {about}
        </p>
        <div className="flex gap-2 pt-2">
          <button
            onClick={onMessage}
            className="flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-xl text-xs font-semibold bg-[#4a7c59]/10 text-[#4a7c59] hover:bg-[#4a7c59]/20 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Message
          </button>
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            Email
          </a>
        </div>
      </div>
    </div>
  );
}

function formatProgramName(key: string): string {
  const summerMatch = key.match(/^summer[_-]?(\d{2,4})$/i);
  if (summerMatch) {
    const yr = summerMatch[1];
    const full = yr.length === 2 ? `20${yr}` : yr;
    return `Summer ${full}`;
  }
  const syMatch = key.match(/^school[_-]year[_-](\d{2,4})[_-](\d{2,4})$/i);
  if (syMatch) {
    const [, a, b] = syMatch;
    const fa = a.length === 2 ? `20${a}` : a;
    const fb = b.length === 2 ? `20${b}` : b;
    return `School Year ${fa}-${fb}`;
  }
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function TeacherTab({
  teachers,
  onMessage,
}: {
  teachers: TeacherAssignment[];
  onMessage: (teacherId: string, teacherName: string) => void;
}) {
  const programMap = new Map<string, TeacherAssignment[]>();
  for (const t of teachers) {
    const key = t.program ?? "General";
    if (!programMap.has(key)) programMap.set(key, []);
    programMap.get(key)!.push(t);
  }
  const programs = [...programMap.keys()];

  const [activeProgram, setActiveProgram] = useState<string>(programs[0] ?? "");

  if (teachers.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold font-heading text-[#4a7c59] mb-4">
          Teacher Info
        </h3>
        <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-full mb-4"
            style={{ backgroundColor: "#d4e6d0" }}
          >
            <UserX
              className="w-6 h-6"
              style={{ color: "#4a7c59" }}
              strokeWidth={1.5}
            />
          </div>
          <p className="text-base font-semibold font-heading text-gray-700 mb-1">
            No teacher assigned yet
          </p>
          <p className="text-sm font-body text-gray-400">
            Teacher assignments will appear here once assigned.
          </p>
        </div>
      </div>
    );
  }

  const seen = new Set<string>();
  const uniqueTeachers = (programMap.get(activeProgram) ?? []).filter((t) => {
    if (seen.has(t.teacher_id)) return false;
    seen.add(t.teacher_id);
    return true;
  });

  return (
    <div>
      {programs.length > 1 && (
        <div className="flex gap-4 border-b border-gray-200 mb-5">
          {programs.map((p) => (
            <button
              key={p}
              onClick={() => setActiveProgram(p)}
              className={`pb-2 text-sm font-semibold transition-colors cursor-pointer border-b-2 -mb-px ${
                activeProgram === p
                  ? "border-[#4a7c59] text-[#4a7c59]"
                  : "border-transparent text-gray-400 hover:text-[#4a7c59]"
              }`}
            >
              {formatProgramName(p)}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {uniqueTeachers.map((t) => {
          const card = TEACHER_CARD_DATA[t.teacher_name ?? ""];
          return (
            <TeacherCard
              key={t.id}
              name={t.teacher_name ?? "Unknown Teacher"}
              role={card?.role ?? "Teacher"}
              imageSrc={card?.image}
              about={card?.about ?? ""}
              email={card?.email ?? ""}
              onMessage={() => onMessage(t.teacher_id, t.teacher_name ?? "")}
            />
          );
        })}
      </div>
    </div>
  );
}

function AttendanceTab({
  records,
  loading,
}: {
  records: ParentCheckInRecord[];
  loading: boolean;
}) {
  const [selectedRecord, setSelectedRecord] = useState<ParentCheckInRecord | null>(null);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const isPastDay = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    return d.toDateString() !== today.toDateString() && d < today;
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="space-y-0">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
              >
                <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-5 w-24 bg-gray-100 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <p className="text-sm text-gray-400 px-4 py-6">
            No attendance records found.
          </p>
        ) : (
          <div>
            <div className="grid grid-cols-4 px-4 py-2 border-b border-gray-100 bg-gray-50">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Date
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Checked In
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Checked Out
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 text-right">
                Status
              </span>
            </div>
            {records.map((r, i) => {
              const notCheckedOut = !r.checked_out_at && isPastDay(r.checked_in_at);
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRecord(r)}
                  className={`grid grid-cols-4 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                    i < records.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <span className="text-sm text-gray-700">
                    {formatDate(r.checked_in_at)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {formatTime(r.checked_in_at)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {r.checked_out_at ? formatTime(r.checked_out_at) : "—"}
                  </span>
                  <div className="flex justify-end">
                    {r.checked_out_at ? (
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">
                        Checked Out
                      </span>
                    ) : notCheckedOut ? (
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        Not Checked Out
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50">
          <Smartphone className="w-4 h-4 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
          <p className="text-xs text-gray-400">
            To check your child in or out, use the Sage Field mobile app.
          </p>
        </div>
      </div>

      <DetailSidebar
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Check-In Details"
      >
        {selectedRecord && (
          <SidebarSection title="Check-In Record">
            <SidebarField
              label="Date"
              value={formatDate(selectedRecord.checked_in_at)}
            />
            <SidebarField
              label="Checked In"
              value={formatTime(selectedRecord.checked_in_at)}
            />
            <SidebarField
              label="Checked Out"
              value={
                selectedRecord.checked_out_at
                  ? formatTime(selectedRecord.checked_out_at)
                  : "Not checked out"
              }
            />
            {selectedRecord.notes && (
              <SidebarField label="Notes" value={selectedRecord.notes} />
            )}
          </SidebarSection>
        )}
      </DetailSidebar>
    </>
  );
}

function LearningTab() {
  const goals = [
    "Strengthen fine motor skills",
    "Build group collaboration",
    "Expand vocabulary through read-alouds",
  ];
  return (
    <SectionCard title="Learning">
      <Field label="Current Unit" value="Seasons & Nature" />
      <Field
        label="Recent Note"
        value="Showed great curiosity during the leaf-sorting activity"
      />
      <div className="py-2.5">
        <p className="text-xs font-body text-gray-400 uppercase tracking-wide mb-1.5">
          Learning Goals
        </p>
        <ul className="space-y-1">
          {goals.map((g) => (
            <li key={g} className="text-sm font-body text-gray-700 flex gap-2">
              <span className="text-[#4a7c59] mt-0.5">•</span>
              {g}
            </li>
          ))}
        </ul>
      </div>
    </SectionCard>
  );
}

function ChildProfile({
  child,
  teachers,
  enrollmentAppId,
  initialProfileImageUrl,
}: {
  child: Student;
  teachers: TeacherAssignment[];
  enrollmentAppId?: string;
  initialProfileImageUrl: string | null;
}) {
  const [activeTab, setActiveTab] = useState<ContentTab>("teacher");
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(initialProfileImageUrl);
  const [avatarHovered, setAvatarHovered] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<ParentCheckInRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setAttendanceLoading(true);
    getParentStudentAttendance(child.id)
      .then(setAttendanceRecords)
      .catch(() => setAttendanceRecords([]))
      .finally(() => setAttendanceLoading(false));
  }, [child.id]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('studentId', child.id);
    const result = await uploadStudentProfileImage(formData);
    setUploading(false);
    if ('url' in result) setCurrentImageUrl(result.url);
    e.target.value = '';
  }

  const age = computeAge(child.dob_month, child.dob_day, child.dob_year);
  const dob = formatDOB(child.dob_month, child.dob_day, child.dob_year);
  const initials = getInitials(child.child_legal_name);

  const contentTabs: { id: ContentTab; label: string }[] = [
    { id: "teacher", label: "Teacher Info" },
    { id: "attendance", label: "Attendance" },
    { id: "learning", label: "Learning" },
    { id: "photos", label: "Photos" },
    { id: "profile", label: "Profile" },
  ];

  return (
    <div>
      {/* Profile Hero */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 flex items-center gap-6">
        <div
          className="relative flex-shrink-0 w-20 h-20 rounded-full overflow-hidden cursor-pointer"
          onMouseEnter={() => setAvatarHovered(true)}
          onMouseLeave={() => setAvatarHovered(false)}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {currentImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentImageUrl} alt={child.child_legal_name ?? ''} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-2xl font-bold font-heading"
              style={{ backgroundColor: "#d4e6d0", color: "#4a7c59" }}
            >
              {initials}
            </div>
          )}
          {(avatarHovered || uploading) && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              {uploading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="min-w-0">
          <h2 className="text-2xl font-bold font-heading text-gray-800 mb-1">
            {child.child_legal_name ?? "Unknown"}
          </h2>
          <p className="text-sm font-body text-gray-400">
            {dob !== "—" && (
              <>
                Born {dob}
                {age !== null && (
                  <span className="ml-2 text-gray-500">
                    · {age} years old
                    {child.child_grade ? ` · ${child.child_grade}` : ""}
                  </span>
                )}
              </>
            )}
            {dob === "—" && "Date of birth not provided"}
          </p>
          {child.special_interests?.trim() && (
            <p className="text-sm font-body text-gray-500 mt-1.5">
              <span className="text-gray-400">Interests: </span>
              {child.special_interests}
            </p>
          )}
        </div>
      </div>

      {enrollmentAppId ? (
        <a
          href={`/parent/dashboard?app=${enrollmentAppId}`}
          className="flex items-center gap-4 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 hover:bg-amber-100 transition-colors no-underline"
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-800">Enrollment not complete</div>
            <div className="text-xs text-amber-600 mt-0.5">Finish setting up this child&apos;s enrollment to access teacher info, attendance, and more.</div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1.5">
            <span className="text-sm font-semibold text-amber-700">Complete enrollment</span>
            <ChevronRight className="w-4 h-4 text-amber-700" strokeWidth={2} />
          </div>
        </a>
      ) : (
        <>
          {/* Content tabs */}
          <div className="flex gap-1 mb-6">
            {contentTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 text-sm rounded-full transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#4a7c59] text-white font-semibold"
                    : "text-gray-500 hover:text-[#4a7c59]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "teacher" && (
            <TeacherTab
              teachers={teachers}
              onMessage={(teacherId, teacherName) =>
                router.push(
                  `/parent/messages?recipientId=${teacherId}&recipientName=${encodeURIComponent(teacherName)}`,
                )
              }
            />
          )}
          {activeTab === "attendance" && <AttendanceTab records={attendanceRecords} loading={attendanceLoading} />}
          {activeTab === "learning" && <LearningTab />}

          {activeTab === "photos" && (
            <EmptyStateCard
              icon={ImageIcon}
              title="Photos coming soon"
              subtitle="Photos from school activities and events will appear here."
            />
          )}

          {activeTab === "profile" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SectionCard title="Medical Info">
                <Field
                  label="Has Medical Conditions"
                  value={child.has_medical_conditions}
                />
                {child.has_medical_conditions?.toLowerCase() === "yes" && (
                  <Field
                    label="Medical Conditions"
                    value={child.medical_conditions_description}
                  />
                )}
                <Field label="Has Allergies" value={child.has_allergies} />
                {child.has_allergies?.toLowerCase() === "yes" && (
                  <Field label="Allergies" value={child.allergies_description} />
                )}
                <Field
                  label="Has Emergency Medications"
                  value={child.has_emergency_medications}
                />
                {child.has_emergency_medications?.toLowerCase() === "yes" && (
                  <Field
                    label="Emergency Medications"
                    value={child.emergency_medications_description}
                  />
                )}
              </SectionCard>

              <SectionCard title="Learning Profile">
                <Field label="Learning Style" value={child.learning_style} />
                <Field
                  label="Strengths & Interests"
                  value={child.strengths_interests}
                />
                <Field
                  label="Current Challenges"
                  value={child.current_challenges}
                />
              </SectionCard>

              <SectionCard title="Regulation & Support">
                <Field
                  label="Dysregulation Response"
                  value={child.dysregulation_response}
                />
                <Field
                  label="Regulation Strategies"
                  value={child.regulation_strategies}
                />
                <Field
                  label="Activities to Avoid"
                  value={child.activities_to_avoid}
                />
              </SectionCard>

              <SectionCard title="Additional Support">
                <Field label="Needs Aide" value={child.needs_aide} />
                {child.needs_aide?.toLowerCase() === "yes" && (
                  <Field
                    label="Aide Description"
                    value={child.needs_aide_description}
                  />
                )}
                <Field label="History Flags" value={child.history_flags} />
                {child.history_flags?.toLowerCase() === "yes" && (
                  <Field
                    label="History Explanation"
                    value={child.history_explanation}
                  />
                )}
              </SectionCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ChildrenPage({ children, teachersByStudent, nonEnrolledAppByStudent, studentProgramMap }: Props) {
  // Sort: enrolled children first, non-enrolled last
  const sortedChildren = [...children].sort((a, b) => {
    const aEnrolled = !nonEnrolledAppByStudent[a.id];
    const bEnrolled = !nonEnrolledAppByStudent[b.id];
    if (aEnrolled === bEnrolled) return 0;
    return aEnrolled ? -1 : 1;
  });

  const [activeIndex, setActiveIndex] = useState(0);

  if (children.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center py-24">
        <div>
          <p className="text-gray-400 font-body text-lg">
            No enrolled children found.
          </p>
          <p className="text-gray-300 font-body text-sm mt-1">
            If you believe this is an error, please contact us.
          </p>
        </div>
      </div>
    );
  }

  const activeChild = sortedChildren[activeIndex];

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ── Left: Children sidebar ── */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 overflow-y-auto px-3 pt-8 gap-1 bg-white border-r border-gray-100">
        <p className="text-xs font-semibold font-body text-gray-400 uppercase tracking-wider px-2 pb-2">
          Children
        </p>
        {sortedChildren.map((child, i) => {
          const isActive = i === activeIndex;
          const profileImageUrl = (child as Record<string, unknown>).profile_image_url as string | null ?? null;
          const name = child.child_legal_name ?? `Child ${i + 1}`;
          const programLabel = formatProgramLabel(studentProgramMap[child.id]);
          return (
            <button
              key={child.id}
              onClick={() => setActiveIndex(i)}
              className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                isActive
                  ? "bg-[#4a7c59]/10 text-gray-800"
                  : "text-gray-400 hover:text-gray-600 hover:bg-black/5"
              }`}
            >
              {profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileImageUrl}
                  alt={name}
                  className="w-7 h-7 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0 bg-[#4a7c59]">
                  {getInitials(name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-body font-medium truncate leading-tight">
                  {name}
                </p>
                {programLabel && (
                  <p className="text-xs font-body text-gray-400 truncate leading-tight">
                    {programLabel}
                  </p>
                )}
              </div>
              {nonEnrolledAppByStudent[child.id] && (
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </aside>

      {/* ── Right: Main content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="mb-10">
            <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">
              My Children
            </h1>
          </div>
          <ChildProfile
            key={activeChild.id}
            child={activeChild}
            teachers={teachersByStudent[activeChild.id] ?? []}
            enrollmentAppId={nonEnrolledAppByStudent[activeChild.id]}
            initialProfileImageUrl={(activeChild as Record<string, unknown>).profile_image_url as string | null ?? null}
          />
        </div>
      </div>
    </div>
  );
}
