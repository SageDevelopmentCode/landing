"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Image as ImageIcon,
  Mail,
  UserX,
  Smartphone,
  MessageCircle,
  ChevronRight,
  Camera,
  Loader2,
  User,
  UserPlus,
  Pencil,
  Trash2,
  Plus,
  X,
  Check,
} from "lucide-react";
import { uploadStudentProfileImage } from "@/app/actions/uploadStudentProfileImage";
import { saveAuthorizedPickup, type PickupPersonEntry } from "@/app/actions/saveAuthorizedPickup";
import { saveParentLearningNote, updateParentLearningNote, deleteParentLearningNote, type LearningNote, type LearningNoteCategory } from "@/app/actions/saveParentLearningNote";
import { formatPhone } from "@/app/utils/formatPhone";
import { getParentStudentAttendance, type ParentCheckInRecord } from "@/app/actions/getParentStudentAttendance";
import { DetailSidebar } from "@/app/admin/components/DetailSidebar";
import { SidebarField, SidebarSection } from "@/app/components/SidebarPrimitives";
import NextImage from "next/image";
import type { Database } from "@/app/types/database.types";
import type { TeacherAssignment } from "@/app/actions/teacherAssignments";

type Student = Database["admin"]["Tables"]["students"]["Row"];
type AuthorizedPickupPlan = Database["parent_app"]["Tables"]["student_authorized_pickup_plan"]["Row"];
type AuthorizedPickupPerson = Database["parent_app"]["Tables"]["student_authorized_pickup_persons"]["Row"];

type ContentTab = "teacher" | "attendance" | "learning" | "photos" | "pickup" | "profile";

interface Props {
  children: Student[];
  teachersByStudent: Record<string, TeacherAssignment[]>;
  nonEnrolledAppByStudent: Record<string, string>;
  studentProgramMap: Record<string, string>;
  pickupByStudent: Record<string, { plan: AuthorizedPickupPlan | null; persons: AuthorizedPickupPerson[] }>;
  notesByStudent: Record<string, LearningNote[]>;
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
  teacherId,
  onMessage,
}: {
  name: string;
  role: string;
  about: string;
  imageSrc?: string;
  email: string;
  teacherId: string;
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
          <Link
            href={`/parent/profile/${teacherId}`}
            className="flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            View Profile
          </Link>
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
              teacherId={t.teacher_id}
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

const CATEGORY_META: Record<LearningNoteCategory, { label: string; cls: string }> = {
  academic:   { label: "Academic",   cls: "bg-blue-50 text-blue-600" },
  social:     { label: "Social",     cls: "bg-purple-50 text-purple-600" },
  behavioral: { label: "Behavioral", cls: "bg-orange-50 text-orange-600" },
  health:     { label: "Health",     cls: "bg-red-50 text-red-600" },
  other:      { label: "Other",      cls: "bg-gray-100 text-gray-500" },
};

function LearningTab({ studentId, initialNotes, learningStyle, strengthsInterests, currentChallenges }: {
  studentId: string;
  initialNotes: LearningNote[];
  learningStyle: string | null;
  strengthsInterests: string | null;
  currentChallenges: string | null;
}) {
  const [notes, setNotes] = useState<LearningNote[]>(initialNotes);
  const [showForm, setShowForm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [category, setCategory] = useState<LearningNoteCategory>("academic");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editCategory, setEditCategory] = useState<LearningNoteCategory>("academic");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  async function handleSave() {
    if (!noteText.trim()) return;
    setSaving(true);
    setSaveError(null);
    const result = await saveParentLearningNote({ studentId, category, noteText });
    setSaving(false);
    if (result.error) { setSaveError(result.error); return; }
    if (result.note) setNotes((prev) => [result.note!, ...prev]);
    setNoteText("");
    setCategory("academic");
    setShowForm(false);
  }

  async function handleDelete(noteId: string) {
    setDeletingId(noteId);
    const result = await deleteParentLearningNote(noteId);
    setDeletingId(null);
    if (!result.error) setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  function startEdit(note: LearningNote) {
    setEditingId(note.id);
    setEditText(note.note_text);
    setEditCategory(note.category);
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
    setEditError(null);
  }

  async function handleEditSave(noteId: string) {
    if (!editText.trim()) return;
    setEditSaving(true);
    setEditError(null);
    const result = await updateParentLearningNote({ noteId, category: editCategory, noteText: editText });
    setEditSaving(false);
    if (result.error) { setEditError(result.error); return; }
    if (result.note) {
      setNotes((prev) => prev.map((n) => n.id === noteId ? result.note! : n));
    }
    setEditingId(null);
    setEditText("");
  }

  const inputCls = "w-full text-sm font-body text-gray-800 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59]";
  const hasProfile = learningStyle || strengthsInterests || currentChallenges;

  return (
    <div className="space-y-4">
    {hasProfile && (
      <SectionCard title="Learning Profile">
        <Field label="Learning Style" value={learningStyle} />
        <Field label="Strengths & Interests" value={strengthsInterests} />
        <Field label="Current Challenges" value={currentChallenges} />
      </SectionCard>
    )}
    <SectionCard title="Special Requests">
      {notes.length === 0 && !showForm && (
        <p className="text-sm font-body text-gray-400 italic py-1 mb-3">
          No special requests yet. Let teachers know if your child needs any extra support.
        </p>
      )}

      {notes.length > 0 && (
        <ul className="divide-y divide-gray-50 mb-4">
          {notes.map((note) => {
            const meta = CATEGORY_META[note.category] ?? CATEGORY_META.other;
            const date = new Date(note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const isEditing = editingId === note.id;
            return (
              <li key={note.id} className="py-3">
                {isEditing ? (
                  <div className="space-y-2">
                    <select
                      className={inputCls}
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as LearningNoteCategory)}
                    >
                      {(Object.keys(CATEGORY_META) as LearningNoteCategory[]).map((k) => (
                        <option key={k} value={k}>{CATEGORY_META[k].label}</option>
                      ))}
                    </select>
                    <textarea
                      className={`${inputCls} resize-none`}
                      rows={3}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                    {editError && <p className="text-xs text-red-500">{editError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSave(note.id)}
                        disabled={editSaving || !editText.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#4a7c59] text-white hover:bg-[#3d6b4a] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {editSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-body text-gray-400">{date}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.cls}`}>{meta.label}</span>
                      </div>
                      <p className="text-sm font-body text-gray-700 leading-relaxed">{note.note_text}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
                      <button
                        onClick={() => startEdit(note)}
                        className="text-gray-300 hover:text-[#4a7c59] transition-colors cursor-pointer"
                        aria-label="Edit note"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        disabled={deletingId === note.id}
                        className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                        aria-label="Delete note"
                      >
                        {deletingId === note.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {showForm ? (
        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-body text-gray-400 uppercase tracking-wide mb-1">Category</label>
            <select
              className={inputCls}
              value={category}
              onChange={(e) => setCategory(e.target.value as LearningNoteCategory)}
            >
              {(Object.keys(CATEGORY_META) as LearningNoteCategory[]).map((k) => (
                <option key={k} value={k}>{CATEGORY_META[k].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-body text-gray-400 uppercase tracking-wide mb-1">Note <span className="text-red-400">*</span></label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="e.g. My child is needing extra help with reading comprehension this month."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
          </div>
          {saveError && <p className="text-xs text-red-500">{saveError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !noteText.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#4a7c59] text-white hover:bg-[#3d6b4a] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save
            </button>
            <button
              onClick={() => { setShowForm(false); setNoteText(""); setSaveError(null); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#4a7c59]/10 text-[#4a7c59] hover:bg-[#4a7c59]/20 transition-colors cursor-pointer mt-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Note
        </button>
      )}
    </SectionCard>
    </div>
  );
}

type EditablePerson = PickupPersonEntry & { _key: string };

function blankPerson(): EditablePerson {
  return {
    _key: Math.random().toString(36).slice(2),
    fullName: "",
    relationship: "",
    phone: "",
    email: "",
    dlStateIdNumber: "",
    vehicleInfo: "",
    licensePlateState: "",
  };
}

function personToEditable(p: AuthorizedPickupPerson): EditablePerson {
  return {
    _key: p.id,
    fullName: p.full_name ?? "",
    relationship: p.relationship ?? "",
    phone: p.phone ?? "",
    email: p.email ?? "",
    dlStateIdNumber: p.dl_state_id_number ?? "",
    vehicleInfo: p.vehicle_info ?? "",
    licensePlateState: p.license_plate_state ?? "",
  };
}

function PickupPersonForm({
  person,
  onChange,
  onCancel,
  onSave,
  saving,
  error,
}: {
  person: EditablePerson;
  onChange: (field: keyof PickupPersonEntry, value: string) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
}) {
  const inputCls = "w-full text-sm font-body text-gray-800 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59]";
  const labelCls = "block text-xs font-body text-gray-400 uppercase tracking-wide mb-1";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Full Name <span className="text-red-400">*</span></label>
          <input className={inputCls} value={person.fullName} onChange={e => onChange("fullName", e.target.value)} placeholder="Jane Smith" />
        </div>
        <div>
          <label className={labelCls}>Relationship <span className="text-red-400">*</span></label>
          <input className={inputCls} value={person.relationship} onChange={e => onChange("relationship", e.target.value)} placeholder="Aunt" />
        </div>
        <div>
          <label className={labelCls}>Phone <span className="text-red-400">*</span></label>
          <input className={inputCls} value={person.phone} onChange={e => onChange("phone", formatPhone(e.target.value))} placeholder="(555) 000-0000" />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input className={inputCls} value={person.email} onChange={e => onChange("email", e.target.value)} placeholder="optional" />
        </div>
        <div>
          <label className={labelCls}>DL / State ID</label>
          <input className={inputCls} value={person.dlStateIdNumber} onChange={e => onChange("dlStateIdNumber", e.target.value)} placeholder="optional" />
        </div>
        <div>
          <label className={labelCls}>Vehicle Info</label>
          <input className={inputCls} value={person.vehicleInfo} onChange={e => onChange("vehicleInfo", e.target.value)} placeholder="optional" />
        </div>
        <div>
          <label className={labelCls}>License Plate State</label>
          <input className={inputCls} value={person.licensePlateState} onChange={e => onChange("licensePlateState", e.target.value)} placeholder="optional" />
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-[#4a7c59] text-white text-sm rounded-full font-semibold disabled:opacity-50 cursor-pointer hover:bg-[#3d6b4a] transition-colors"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Save
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 text-gray-500 text-sm rounded-full hover:text-gray-700 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>
    </div>
  );
}

function PickupTab({
  pickup,
  studentId,
}: {
  pickup: { plan: AuthorizedPickupPlan | null; persons: AuthorizedPickupPerson[] };
  studentId: string;
}) {
  const [persons, setPersons] = useState<EditablePerson[]>(() =>
    pickup.persons.map(personToEditable)
  );
  const [plan, setPlan] = useState(pickup.plan);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditablePerson | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newDraft, setNewDraft] = useState<EditablePerson>(blankPerson);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Dates from the plan (or empty strings if no plan yet)
  const [dateOfRequest, setDateOfRequest] = useState(plan?.date_of_request ?? "");
  const [effectiveUntil, setEffectiveUntil] = useState(plan?.effective_until ?? "");

  function validatePerson(p: EditablePerson): string | null {
    if (!p.fullName.trim()) return "Full name is required.";
    if (!p.relationship.trim()) return "Relationship is required.";
    if (!p.phone.trim()) return "Phone is required.";
    return null;
  }

  async function commitSave(updatedPersons: EditablePerson[]) {
    setSaving(true);
    setFormError(null);
    const result = await saveAuthorizedPickup({
      studentId,
      dateOfRequest: dateOfRequest || new Date().toISOString().slice(0, 10),
      effectiveUntil: effectiveUntil || "",
      persons: updatedPersons.map(({ _key: _k, ...p }) => p),
    });
    setSaving(false);
    if (result.error) {
      setFormError(result.error);
      return false;
    }
    if (result.data) setPlan(result.data);
    return true;
  }

  async function handleSaveEdit() {
    if (!editDraft) return;
    const err = validatePerson(editDraft);
    if (err) { setFormError(err); return; }
    const updated = persons.map(p => p._key === editDraft._key ? editDraft : p);
    const ok = await commitSave(updated);
    if (ok) { setPersons(updated); setEditingKey(null); setEditDraft(null); }
  }

  async function handleSaveNew() {
    const err = validatePerson(newDraft);
    if (err) { setFormError(err); return; }
    const updated = [...persons, newDraft];
    const ok = await commitSave(updated);
    if (ok) { setPersons(updated); setAddingNew(false); setNewDraft(blankPerson()); }
  }

  async function handleDelete(key: string) {
    const updated = persons.filter(p => p._key !== key);
    const ok = await commitSave(updated);
    if (ok) setPersons(updated);
  }

  function startEdit(person: EditablePerson) {
    setAddingNew(false);
    setFormError(null);
    setEditingKey(person._key);
    setEditDraft({ ...person });
  }

  function startAdd() {
    setEditingKey(null);
    setEditDraft(null);
    setFormError(null);
    setNewDraft(blankPerson());
    setAddingNew(true);
  }

  const hasAnyData = plan || persons.length > 0;

  return (
    <div className="space-y-4">
      {/* Persons list */}
      <SectionCard title={`Authorized Persons${persons.length > 0 ? ` (${persons.length})` : ""}`}>
        {persons.length === 0 && !addingNew && (
          <p className="text-sm font-body text-gray-400 italic py-1">No authorized pickup persons on file.</p>
        )}

        {persons.map((person, i) => (
          <div key={person._key} className={i > 0 ? "pt-3 mt-3 border-t border-gray-100" : ""}>
            {editingKey === person._key && editDraft ? (
              <PickupPersonForm
                person={editDraft}
                onChange={(field, value) => setEditDraft(prev => prev ? { ...prev, [field]: value } : prev)}
                onCancel={() => { setEditingKey(null); setEditDraft(null); setFormError(null); }}
                onSave={handleSaveEdit}
                saving={saving}
                error={formError}
              />
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 mb-1">{person.fullName}</p>
                  <Field label="Relationship" value={person.relationship || null} />
                  <Field label="Phone" value={person.phone || null} />
                  {person.email && <Field label="Email" value={person.email} />}
                  {person.dlStateIdNumber && <Field label="DL / State ID" value={person.dlStateIdNumber} />}
                  {person.vehicleInfo && <Field label="Vehicle" value={person.vehicleInfo} />}
                  {person.licensePlateState && <Field label="License Plate State" value={person.licensePlateState} />}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                  <button
                    onClick={() => startEdit(person)}
                    disabled={saving}
                    className="p-1.5 text-gray-400 hover:text-[#4a7c59] rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-40"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(person._key)}
                    disabled={saving}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40"
                    title="Delete"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {addingNew && (
          <div className={persons.length > 0 ? "pt-3 mt-3 border-t border-gray-100" : ""}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">New Person</p>
            <PickupPersonForm
              person={newDraft}
              onChange={(field, value) => setNewDraft(prev => ({ ...prev, [field]: value }))}
              onCancel={() => { setAddingNew(false); setFormError(null); }}
              onSave={handleSaveNew}
              saving={saving}
              error={formError}
            />
          </div>
        )}

        {!addingNew && editingKey === null && (
          <button
            onClick={startAdd}
            className="mt-3 flex items-center gap-1.5 text-sm text-[#4a7c59] font-semibold hover:underline cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add person
          </button>
        )}
      </SectionCard>

      {/* Plan dates */}
      {hasAnyData && plan && (
        <SectionCard title="Pickup Plan">
          <Field label="Date of Request" value={plan.date_of_request ?? null} />
          <Field label="Effective Until" value={plan.effective_until ?? null} />
        </SectionCard>
      )}
    </div>
  );
}

function ChildProfile({
  child,
  teachers,
  enrollmentAppId,
  initialProfileImageUrl,
  pickup,
  initialNotes,
}: {
  child: Student;
  teachers: TeacherAssignment[];
  enrollmentAppId?: string;
  initialProfileImageUrl: string | null;
  pickup: { plan: AuthorizedPickupPlan | null; persons: AuthorizedPickupPerson[] };
  initialNotes: LearningNote[];
}) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as ContentTab | null) ?? "teacher";
  const [activeTab, setActiveTab] = useState<ContentTab>(initialTab);
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
    { id: "pickup", label: "Pickup" },
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
          {activeTab === "learning" && (
            <LearningTab
              studentId={child.id}
              initialNotes={initialNotes}
              learningStyle={child.learning_style}
              strengthsInterests={child.strengths_interests}
              currentChallenges={child.current_challenges}
            />
          )}

          {activeTab === "photos" && (
            <EmptyStateCard
              icon={ImageIcon}
              title="Photos coming soon"
              subtitle="Photos from school activities and events will appear here."
            />
          )}

          {activeTab === "pickup" && <PickupTab pickup={pickup} studentId={child.id} />}

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

export default function ChildrenPage({ children, teachersByStudent, nonEnrolledAppByStudent, studentProgramMap, pickupByStudent, notesByStudent }: Props) {
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
            pickup={pickupByStudent[activeChild.id] ?? { plan: null, persons: [] }}
            initialNotes={notesByStudent[activeChild.id] ?? []}
          />
        </div>
      </div>
    </div>
  );
}
