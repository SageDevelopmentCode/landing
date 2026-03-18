"use client";

import { useState } from "react";
import {
  Image as ImageIcon,
  MessageCircle,
  Mail,
  UserX,
  Smartphone,
} from "lucide-react";
import NextImage from "next/image";
import type { Database } from "@/app/types/database.types";
import type { TeacherAssignment } from "@/app/actions/teacherAssignments";

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
  teachersByStudent: Record<string, TeacherAssignment[]>;
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
  onMessage: () => void;
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
              onMessage={onMessage}
            />
          );
        })}
      </div>
    </div>
  );
}

function AttendanceTab() {
  return (
    <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 p-12 text-center">
      <div
        className="flex items-center justify-center w-14 h-14 rounded-full mb-4"
        style={{ backgroundColor: "#d4e6d0" }}
      >
        <Smartphone
          className="w-6 h-6"
          style={{ color: "#4a7c59" }}
          strokeWidth={1.5}
        />
      </div>
      <p className="text-base font-semibold font-heading text-gray-700 mb-1">
        Checking in/out your child is only available on the Sage Field App
      </p>
      <p className="text-sm font-body text-gray-400 mb-5">
        Download the app to manage attendance.
      </p>
      <button
        onClick={() => {}}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#4a7c59] text-white hover:bg-[#3d6b4a] transition-colors cursor-pointer"
      >
        Download the App
      </button>
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

function ChildProfile({
  child,
  teachers,
}: {
  child: Student;
  teachers: TeacherAssignment[];
}) {
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
          teachers={teachers}
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

export default function ChildrenPage({ children, teachersByStudent }: Props) {
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

      <ChildProfile
        key={activeChild.id}
        child={activeChild}
        teachers={teachersByStudent[activeChild.id] ?? []}
      />
    </div>
  );
}
