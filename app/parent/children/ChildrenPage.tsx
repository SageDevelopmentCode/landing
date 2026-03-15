"use client";

import { useState } from "react";
import { Image as ImageIcon, MessageCircle, Mail } from "lucide-react";
import NextImage from "next/image";
import type { Database } from "@/app/types/database.types";

type Student = Database["admin"]["Tables"]["students"]["Row"];

type ContentTab =
  | "teacher"
  | "attendance"
  | "learning"
  | "photos"
  | "messages"
  | "profile";

interface Props {
  children: Student[];
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

function AttendanceBadge({
  status,
}: {
  status: "Present" | "Absent" | "Late";
}) {
  const styles = {
    Present: "bg-green-100 text-green-700",
    Absent: "bg-red-100 text-red-700",
    Late: "bg-amber-100 text-amber-700",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
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

function isLowerGrade(grade: string | null): boolean {
  if (!grade) return true;
  const normalized = grade.trim().toLowerCase();
  return (
    normalized === "pre-k" ||
    normalized === "prek" ||
    normalized === "pre k" ||
    normalized === "k" ||
    normalized === "kindergarten" ||
    normalized === "1" ||
    normalized === "1st"
  );
}

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
  imageSrc: string;
  email: string;
  onMessage: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
      <div className="relative w-full h-90">
        <NextImage
          src={imageSrc}
          alt={name}
          fill
          className="object-cover object-top"
        />
      </div>
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

function TeacherTab({
  grade,
  onMessage,
}: {
  grade: string | null;
  onMessage: () => void;
}) {
  if (isLowerGrade(grade)) {
    return (
      <div>
        <h3 className="text-sm font-semibold font-heading text-[#4a7c59] mb-4">
          Teacher Info
        </h3>
        <TeacherCard
          name="Paige Wood"
          role="Primary Lead Teacher"
          imageSrc="/assets/team/Paige.webp"
          about="Ms. Paige is the Lead Primary Teacher at Sage Field Private School. She has a passion for nature-based learning and creating environments where young children feel safe, curious, and inspired."
          email="paige@sagefieldschool.com"
          onMessage={onMessage}
        />
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold font-heading text-[#4a7c59] mb-4">
        Teacher Info
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TeacherCard
          name="Sabrina Grace Obnamia"
          role="Lead Teacher & Director"
          imageSrc="/assets/Headshot.jpeg"
          about="Ms. Sabrina holds a Bachelor's degree in Elementary Education with a concentration in Early Childhood Development from Biola University. Her background spans special education, preschool, homeschooling, tutoring, and nature school guiding both in the U.S. and internationally."
          email="sabrina@sagefieldschool.com"
          onMessage={onMessage}
        />
        <TeacherCard
          name="Zelinda Melo"
          role="Teacher Aide"
          imageSrc="/assets/team/Zelinda.webp"
          about="Ms. Zelinda has a deep love for children and a heart for nurturing their growth in a safe and encouraging environment. She looks forward to supporting each child's learning journey."
          email="zelinda@sagefieldschool.com"
          onMessage={onMessage}
        />
      </div>
    </div>
  );
}

function AttendanceTab() {
  const records: { date: string; status: "Present" | "Absent" | "Late" }[] = [
    { date: "Mar 13, 2026", status: "Present" },
    { date: "Mar 12, 2026", status: "Present" },
    { date: "Mar 11, 2026", status: "Late" },
    { date: "Mar 10, 2026", status: "Present" },
    { date: "Mar 7, 2026", status: "Absent" },
  ];
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Days Present", value: "42" },
          { label: "Days Absent", value: "3" },
          { label: "Attendance Rate", value: "93%" },
          { label: "Late Arrivals", value: "1" },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-2xl font-bold font-heading text-[#4a7c59]">
              {item.value}
            </p>
            <p className="text-xs font-body text-gray-400 mt-0.5">
              {item.label}
            </p>
          </div>
        ))}
      </div>
      <SectionCard title="Recent Attendance">
        <div className="space-y-2">
          {records.map((r) => (
            <div
              key={r.date}
              className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
            >
              <span className="text-sm font-body text-gray-700">{r.date}</span>
              <AttendanceBadge status={r.status} />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
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

function ChildProfile({ child }: { child: Student }) {
  const [activeTab, setActiveTab] = useState<ContentTab>("teacher");

  const age = computeAge(child.dob_month, child.dob_day, child.dob_year);
  const dob = formatDOB(child.dob_month, child.dob_day, child.dob_year);
  const initials = getInitials(child.child_legal_name);

  const contentTabs: { id: ContentTab; label: string }[] = [
    { id: "teacher", label: "Teacher Info" },
    { id: "attendance", label: "Attendance" },
    { id: "learning", label: "Learning" },
    { id: "photos", label: "Photos" },
    { id: "messages", label: "Messages" },
    { id: "profile", label: "Profile" },
  ];

  return (
    <div>
      {/* Profile Hero */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 flex items-center gap-6">
        <div
          className="flex-shrink-0 flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold font-heading"
          style={{ backgroundColor: "#d4e6d0", color: "#4a7c59" }}
        >
          {initials}
        </div>
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
          grade={child.child_grade}
          onMessage={() => setActiveTab("messages")}
        />
      )}
      {activeTab === "attendance" && <AttendanceTab />}
      {activeTab === "learning" && <LearningTab />}

      {activeTab === "photos" && (
        <EmptyStateCard
          icon={ImageIcon}
          title="Photos coming soon"
          subtitle="Photos from school activities and events will appear here."
        />
      )}
      {activeTab === "messages" && (
        <EmptyStateCard
          icon={MessageCircle}
          title="Messages coming soon"
          subtitle="Direct communication with teachers will be available here."
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
    </div>
  );
}

export default function ChildrenPage({ children }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (children.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-400 font-body text-lg">
          No enrolled children found.
        </p>
        <p className="text-gray-300 font-body text-sm mt-1">
          If you believe this is an error, please contact us.
        </p>
      </div>
    );
  }

  const activeChild = children[activeIndex];

  return (
    <div>
      {/* Child switcher — only shown if >1 child */}
      {children.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {children.map((child, i) => (
            <button
              key={child.id}
              onClick={() => setActiveIndex(i)}
              className={`px-4 py-1.5 text-sm rounded-full border transition-colors cursor-pointer whitespace-nowrap ${
                i === activeIndex
                  ? "bg-[#4a7c59] text-white border-[#4a7c59] font-semibold"
                  : "bg-white border-gray-200 text-gray-600 hover:border-[#4a7c59]"
              }`}
            >
              {child.child_legal_name ?? `Child ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      <ChildProfile key={activeChild.id} child={activeChild} />
    </div>
  );
}
