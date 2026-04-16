"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, ArrowLeft, Pencil, X, Check, MessageCircle } from "lucide-react";
import { updateTeacherProfile } from "./actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Teacher = {
  id: string;
  full_name: string;
  role: string;
  profile_image_url: string | null;
};

type Profile = {
  bio: string | null;
  quote: string | null;
  years_experience: string | null;
  grade_range: string | null;
} | null;

type Qualification = {
  id: string;
  icon: string;
  text: string;
  sort_order: number;
};

type Experience = {
  id: string;
  role: string;
  place: string;
  period: string;
  is_current: boolean;
  detail: string | null;
  sort_order: number;
};

type Student = {
  id: string;
  student_id: string;
  child_legal_name: string;
  child_grade: string | null;
  profile_image_url: string | null;
  program: string | null;
  classroom: string | null;
};

type Props = {
  teacher: Teacher;
  profile: Profile;
  qualifications: Qualification[];
  experience: Experience[];
  students: Student[];
  canEdit: boolean;
  backHref: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-[#4a7c59]",
  "bg-[#5a6b8a]",
  "bg-[#8a5a6b]",
  "bg-[#7c6b4a]",
  "bg-[#6b7c4a]",
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function getRoleLabel(role: string | null): string {
  if (!role || role === "super_admin") return "Lead Teacher";
  if (role === "teacher") return "Teacher";
  if (role === "admin") return "Administrator";
  return role
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatLabel(str: string | null): string {
  if (!str) return "";
  return str
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AuthorAvatar({
  initials,
  color,
  size,
  imageUrl,
}: {
  initials: string;
  color: string;
  size: "sm" | "md" | "lg" | "xl";
  imageUrl?: string | null;
}) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-24 h-24 text-2xl",
  };
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={initials}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${sizes[size]} ${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

// Icon map for qualifications (Ionicon names → emoji/lucide fallback for web)
const QUAL_ICON_MAP: Record<string, string> = {
  "school-outline": "🎓",
  "medkit-outline": "🩺",
  "leaf-outline": "🌿",
  "heart-outline": "❤️",
  "ribbon-outline": "🎗️",
  "book-outline": "📖",
};

function QualIcon({ icon }: { icon: string }) {
  return (
    <span className="text-base leading-none">{QUAL_ICON_MAP[icon] ?? "✦"}</span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeacherProfileClient({
  teacher,
  profile,
  qualifications,
  experience,
  students,
  canEdit,
  backHref,
}: Props) {
  const router = useRouter();

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [quote, setQuote] = useState(profile?.quote ?? "");
  const [yearsExp, setYearsExp] = useState(profile?.years_experience ?? "");
  const [gradeRange, setGradeRange] = useState(profile?.grade_range ?? "");

  // Local saved values (reflect after save)
  const [savedBio, setSavedBio] = useState(profile?.bio ?? "");
  const [savedQuote, setSavedQuote] = useState(profile?.quote ?? "");
  const [savedYearsExp, setSavedYearsExp] = useState(profile?.years_experience ?? "");
  const [savedGradeRange, setSavedGradeRange] = useState(profile?.grade_range ?? "");

  // Experience expansion
  const [expandedExpIds, setExpandedExpIds] = useState<Set<string>>(new Set());

  // Program filter
  const uniquePrograms = useMemo(
    () => [...new Set(students.map((s) => s.program ?? "Unassigned"))],
    [students]
  );
  const [activeProgram, setActiveProgram] = useState<string | null>(
    uniquePrograms.length > 0 ? uniquePrograms[0] : null
  );

  const filteredStudents = useMemo(() => {
    if (!activeProgram) return students;
    return students.filter((s) => (s.program ?? "Unassigned") === activeProgram);
  }, [students, activeProgram]);

  function handleEditClick() {
    setBio(savedBio);
    setQuote(savedQuote);
    setYearsExp(savedYearsExp);
    setGradeRange(savedGradeRange);
    setIsEditing(true);
  }

  function handleCancel() {
    setIsEditing(false);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateTeacherProfile(teacher.id, {
        bio: bio || null,
        quote: quote || null,
        years_experience: yearsExp || null,
        grade_range: gradeRange || null,
      });
      setSavedBio(bio);
      setSavedQuote(quote);
      setSavedYearsExp(yearsExp);
      setSavedGradeRange(gradeRange);
      setIsEditing(false);
    } catch {
      // keep editing open on error
    } finally {
      setIsSaving(false);
    }
  }

  function toggleExpDetail(id: string) {
    setExpandedExpIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const initials = getInitials(teacher.full_name);
  const color = avatarColor(teacher.id);
  const roleLabel = getRoleLabel(teacher.role);

  const hasAbout = !!(savedBio || savedQuote);
  const hasExpOrQuals = experience.length > 0 || qualifications.length > 0;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push(backHref)}
          className="flex items-center gap-1.5 text-sm font-body text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-body text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-body text-white bg-[#4a7c59] hover:bg-[#3d6649] rounded-lg transition-colors disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" />
              {isSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        ) : null}
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-8 items-start">
          {/* ── Left: Sticky sidebar ── */}
          <aside className="hidden md:flex flex-col w-72 flex-shrink-0 sticky top-20">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-4">
              {/* Avatar */}
              <AuthorAvatar
                initials={initials}
                color={color}
                size="xl"
                imageUrl={teacher.profile_image_url}
              />

              {/* Name + role */}
              <div className="text-center">
                <h1 className="text-xl font-bold font-heading text-gray-800 leading-snug">
                  {teacher.full_name}
                </h1>
                <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-[#4a7c59]/10 text-[#4a7c59] text-xs font-semibold font-body rounded-full">
                  {roleLabel}
                </span>
              </div>

              {/* Stats row */}
              <div className="w-full grid grid-cols-3 divide-x divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex flex-col items-center py-2.5 px-1">
                  <span className="text-sm font-bold font-heading text-gray-800 whitespace-nowrap">
                    {students.length}
                  </span>
                  <span className="text-[10px] font-body text-gray-400 text-center leading-tight">
                    Students
                  </span>
                </div>
                <div className="flex flex-col items-center py-2.5 px-1">
                  <span className="text-sm font-bold font-heading text-gray-800 whitespace-nowrap">
                    {savedYearsExp || "—"}
                  </span>
                  <span className="text-[10px] font-body text-gray-400 text-center leading-tight">
                    Yrs Exp
                  </span>
                </div>
                <div className="flex flex-col items-center py-2.5 px-1">
                  <span className="text-sm font-bold font-heading text-gray-800 whitespace-nowrap">
                    {savedGradeRange || "—"}
                  </span>
                  <span className="text-[10px] font-body text-gray-400 text-center leading-tight">
                    Grades
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="w-full flex flex-col gap-2">
                {canEdit && !isEditing && (
                  <button
                    onClick={handleEditClick}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4a7c59] hover:bg-[#3d6649] text-white text-sm font-semibold font-body rounded-xl transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Profile
                  </button>
                )}
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 hover:text-gray-800 hover:border-gray-300 text-sm font-semibold font-body rounded-xl transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Send a Message
                </button>
              </div>
            </div>
          </aside>

          {/* ── Right: Scrollable content ── */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">

            {/* Mobile-only header */}
            <div className="md:hidden flex flex-col items-center gap-3 pb-2">
              <AuthorAvatar
                initials={initials}
                color={color}
                size="xl"
                imageUrl={teacher.profile_image_url}
              />
              <div className="text-center">
                <h1 className="text-xl font-bold font-heading text-gray-800">{teacher.full_name}</h1>
                <span className="inline-block mt-1 px-2.5 py-0.5 bg-[#4a7c59]/10 text-[#4a7c59] text-xs font-semibold font-body rounded-full">
                  {roleLabel}
                </span>
              </div>
              <div className="flex gap-2">
                {canEdit && !isEditing && (
                  <button
                    onClick={handleEditClick}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#4a7c59] hover:bg-[#3d6649] text-white text-sm font-semibold font-body rounded-xl transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Profile
                  </button>
                )}
                <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm font-semibold font-body rounded-xl transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Message
                </button>
              </div>
            </div>

            {/* About card */}
            {isEditing ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold font-heading text-gray-700 mb-4">About</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      placeholder="Write a short bio…"
                      className="w-full text-sm font-body text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">
                      Quote
                    </label>
                    <textarea
                      value={quote}
                      onChange={(e) => setQuote(e.target.value)}
                      rows={2}
                      placeholder="A teaching motto or personal quote…"
                      className="w-full text-sm font-body text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">
                        Years of Experience
                      </label>
                      <input
                        type="text"
                        value={yearsExp}
                        onChange={(e) => setYearsExp(e.target.value)}
                        placeholder="e.g. 5+"
                        className="w-full text-sm font-body text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">
                        Grade Range
                      </label>
                      <input
                        type="text"
                        value={gradeRange}
                        onChange={(e) => setGradeRange(e.target.value)}
                        placeholder="e.g. K–6"
                        className="w-full text-sm font-body text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : hasAbout ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold font-heading text-gray-700 mb-4">About</h2>
                {savedBio && (
                  <p className="text-sm font-body text-gray-600 leading-relaxed">{savedBio}</p>
                )}
                {savedQuote && (
                  <blockquote className="mt-4 border-l-4 border-[#4a7c59] pl-4 italic text-sm font-body text-gray-500">
                    {savedQuote}
                  </blockquote>
                )}
              </div>
            ) : canEdit ? (
              <button
                onClick={handleEditClick}
                className="w-full bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center hover:border-[#4a7c59]/40 hover:bg-[#4a7c59]/[0.02] transition-colors group"
              >
                <p className="text-sm font-semibold font-body text-gray-400 group-hover:text-[#4a7c59] transition-colors">
                  + Add a bio, quote, years of experience, and grade range
                </p>
              </button>
            ) : null}

            {/* Experience + Qualifications */}
            {hasExpOrQuals && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                {/* Experience timeline */}
                {experience.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-base font-bold font-heading text-gray-700 mb-4">
                      Experience
                    </h2>
                    <div className="relative pl-5">
                      {/* Vertical connector line */}
                      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />

                      <div className="flex flex-col gap-4">
                        {experience.map((exp) => {
                          const isExpanded = expandedExpIds.has(exp.id);
                          return (
                            <div key={exp.id} className="relative">
                              {/* Dot */}
                              <div
                                className={`absolute -left-5 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                  exp.is_current ? "bg-[#4a7c59]" : "bg-gray-300"
                                }`}
                              />
                              <button
                                className="w-full text-left group"
                                onClick={() => exp.detail && toggleExpDetail(exp.id)}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold font-body text-gray-800 leading-snug">
                                      {exp.role}
                                    </p>
                                    <p className="text-xs font-body text-gray-500 mt-0.5">
                                      {exp.place} · {exp.period}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                                    {exp.is_current && (
                                      <span className="px-2 py-0.5 bg-[#4a7c59]/10 text-[#4a7c59] text-[10px] font-semibold font-body rounded-full">
                                        Current
                                      </span>
                                    )}
                                    {exp.detail && (
                                      <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                                        {isExpanded ? (
                                          <ChevronUp className="w-4 h-4" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4" />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {isExpanded && exp.detail && (
                                  <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs font-body text-gray-600 leading-relaxed">
                                    {exp.detail}
                                  </div>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Qualifications grid */}
                {qualifications.length > 0 && (
                  <div>
                    {experience.length > 0 && (
                      <div className="border-t border-gray-100 mb-4" />
                    )}
                    <h2 className="text-base font-bold font-heading text-gray-700 mb-3">
                      Qualifications
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {qualifications.map((q) => (
                        <div
                          key={q.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#4a7c59]/5 rounded-full border border-[#4a7c59]/10"
                        >
                          <QualIcon icon={q.icon} />
                          <span className="text-xs font-semibold font-body text-[#4a7c59]">
                            {q.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Students section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold font-heading text-gray-700">
                  Students
                </h2>
                <span className="text-xs font-semibold font-body text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                  {filteredStudents.length}
                </span>
              </div>

              {/* Program filter pills */}
              {uniquePrograms.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {uniquePrograms.map((prog) => (
                    <button
                      key={prog}
                      onClick={() => setActiveProgram(prog)}
                      className={`px-3 py-1 text-xs font-semibold font-body rounded-full border transition-colors ${
                        activeProgram === prog
                          ? "bg-[#4a7c59] border-[#4a7c59] text-white"
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {formatLabel(prog)}
                    </button>
                  ))}
                </div>
              )}

              {filteredStudents.length === 0 ? (
                <p className="text-sm font-body text-gray-400 text-center py-8">
                  No students assigned yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredStudents.map((s) => {
                    const sInitials = getInitials(s.child_legal_name);
                    const sColor = avatarColor(s.student_id);
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        <AuthorAvatar
                          initials={sInitials}
                          color={sColor}
                          size="md"
                          imageUrl={s.profile_image_url}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold font-body text-gray-800 truncate leading-snug">
                            {s.child_legal_name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {s.child_grade && (
                              <span className="text-[10px] font-body text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {s.child_grade}
                              </span>
                            )}
                            {s.classroom && (
                              <span className="text-[10px] font-body text-[#4a7c59] bg-[#4a7c59]/8 px-1.5 py-0.5 rounded">
                                {formatLabel(s.classroom)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
