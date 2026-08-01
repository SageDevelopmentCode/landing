"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Clock,
  MessageCircle,
  Calendar,
  Rss,
  CreditCard,
  FileText,
  ChevronDown,
  CalendarDays,
  TrendingUp,
  LogIn,
  LogOut,
  MapPin,
  Paperclip,
  ChevronRight,
  ChevronLeft,
  Banknote,
  X,
  Trash2,
  LayoutGrid,
  Search,
  Send,
  SquarePen,
  MoreHorizontal,
  Plus,
  Heart,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_TEACHER = {
  name: "Jordan Taylor",
  initials: "JT",
  subject: "Math & Science",
};

const BANNER_IMAGES = [
  "/assets/ImageTwo.jpg",
  "/assets/ImageThree.jpg",
  "/assets/ImageFive.jpg",
  "/assets/ImageNine.jpg",
  "/assets/ImageTen.jpg",
];

type DemoCalendarEvent = {
  id: string;
  title: string;
  event_date: string;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  color: string | null;
  category: string | null;
  description: string | null;
  location: string | null;
  attachment_links: string[] | null;
};

const DEMO_EVENTS: DemoCalendarEvent[] = [
  {
    id: "e1",
    title: "Staff Meeting",
    event_date: "2026-04-22",
    is_all_day: false,
    start_time: "08:30",
    end_time: "09:15",
    color: "#4a7c59",
    category: "Staff",
    description: "Weekly all-staff check-in in the main hall. Please bring your weekly progress notes.",
    location: "Main Hall",
    attachment_links: ["agenda.pdf"],
  },
  {
    id: "e2",
    title: "Nature Walk — Elementary",
    event_date: "2026-04-24",
    is_all_day: false,
    start_time: "10:00",
    end_time: "11:30",
    color: "#7FA888",
    category: "Field Trip",
    description: "Guided nature walk around the school garden. Wear comfortable shoes.",
    location: "School Garden",
    attachment_links: null,
  },
  {
    id: "e3",
    title: "Parent–Teacher Conferences",
    event_date: "2026-04-28",
    is_all_day: false,
    start_time: "13:00",
    end_time: "17:00",
    color: "#f29a8f",
    category: "Conferences",
    description: "Spring conference sessions. Check your schedule in the teacher portal for assigned time slots.",
    location: "Classroom 3B",
    attachment_links: ["conference-schedule.pdf", "talking-points.pdf"],
  },
  {
    id: "e4",
    title: "Professional Development Day",
    event_date: "2026-05-02",
    is_all_day: true,
    start_time: null,
    end_time: null,
    color: "#6b8db5",
    category: "PD",
    description: "No students on campus. Full-day professional development for all staff.",
    location: "Room 101",
    attachment_links: null,
  },
];

// Mon–Sun for a realistic week (today = Sunday Apr 20)
const DEMO_WEEKLY_HOURS = [4.5, 6.0, 5.5, 7.0, 4.0, 0, 0]; // Mon–Sun

type DemoSession = { id: string; clockInAt: Date; clockOutAt: Date | null; note: string };

// Preload today with 4.5h already logged
const TODAY = new Date();
const todayKey = (d: Date) => d.toISOString().slice(0, 10);

function buildInitialSessions(): Record<string, DemoSession[]> {
  const sessions: Record<string, DemoSession[]> = {};
  // Add Mon–Fri sessions for the current week
  const monday = getMondayOfWeek(TODAY);
  const dayHours = DEMO_WEEKLY_HOURS;
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = todayKey(d);
    const hrs = dayHours[i];
    if (hrs > 0 && todayKey(d) !== todayKey(TODAY)) {
      const clockIn = new Date(d);
      clockIn.setHours(8, 0, 0, 0);
      const clockOut = new Date(clockIn);
      clockOut.setTime(clockIn.getTime() + hrs * 3600 * 1000);
      sessions[key] = [{ id: `s-${i}`, clockInAt: clockIn, clockOutAt: clockOut, note: "" }];
    }
  }
  // Today has 4.5h logged but no active session
  const todayClockIn = new Date(TODAY);
  todayClockIn.setHours(8, 0, 0, 0);
  const todayClockOut = new Date(todayClockIn);
  todayClockOut.setTime(todayClockIn.getTime() + 4.5 * 3600 * 1000);
  sessions[todayKey(TODAY)] = [{ id: "s-today", clockInAt: todayClockIn, clockOutAt: todayClockOut, note: "" }];
  return sessions;
}

// ─── Clock Utilities (inlined from clock-utils) ───────────────────────────────

function getMondayOfWeek(d: Date): Date {
  const day = new Date(d);
  const dow = day.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  day.setDate(day.getDate() + diff);
  day.setHours(0, 0, 0, 0);
  return day;
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getDayTotalHours(sessions: DemoSession[]): number {
  return sessions.reduce((sum, s) => {
    const end = s.clockOutAt ?? new Date();
    return sum + (end.getTime() - s.clockInAt.getTime()) / 3_600_000;
  }, 0);
}

function getWeekTotalHours(monday: Date, sessionsByDay: Record<string, DemoSession[]>): number {
  return getWeekDays(monday).reduce((sum, d) => {
    return sum + getDayTotalHours(sessionsByDay[todayKey(d)] ?? []);
  }, 0);
}

function formatDuration(hours: number): string {
  if (hours <= 0) return "0h";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function fmt12(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatEventDate(event: DemoCalendarEvent): string {
  const d = new Date(event.event_date + "T00:00:00");
  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (event.is_all_day) return `${dateStr} · All day`;
  if (event.start_time) {
    const [sh, sm] = event.start_time.split(":").map(Number);
    const startD = new Date();
    startD.setHours(sh, sm);
    const startStr = startD.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    if (event.end_time) {
      const [eh, em] = event.end_time.split(":").map(Number);
      const endD = new Date();
      endD.setHours(eh, em);
      const endStr = endD.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      return `${dateStr} · ${startStr} – ${endStr}`;
    }
    return `${dateStr} · ${startStr}`;
  }
  return dateStr;
}

// ─── Student Demo Data ────────────────────────────────────────────────────────

type AttendanceStatus = "checked_in" | "checked_out" | "absent";

type DemoStudent = {
  id: string;
  student_id: string;
  name: string;
  grade: string;
  program: string;
  classroom: string;
  profile_image_url: null;
  attendance_status: AttendanceStatus;
  color: string;
  dob: string;
  allergies: string | null;
  learning_style: string;
  strengths: string;
  challenges: string;
  dysregulation_response: string;
  regulation_strategies: string;
  medical_notes: string | null;
  special_interests: string;
  history_flags: string | null;
};

const DEMO_STUDENTS: DemoStudent[] = [
  {
    id: "s1", student_id: "sid1",
    name: "Emma Rivera", grade: "3rd Grade",
    program: "summer_26", classroom: "Room 3B",
    profile_image_url: null, attendance_status: "checked_in",
    color: "#7FA888",
    dob: "March 12, 2017",
    allergies: "Tree nuts, mild seasonal pollen",
    learning_style: "Visual and kinesthetic — responds well to hands-on projects and illustrated instructions.",
    strengths: "Creative problem-solving, strong artistic ability, natural collaborator with peers.",
    challenges: "Can become distracted during long verbal instruction segments.",
    dysregulation_response: "Tends to withdraw and becomes quiet; may seek a corner seat.",
    regulation_strategies: "Short movement breaks, fidget tool, one-on-one check-ins.",
    medical_notes: null,
    special_interests: "Painting, nature walks, building with blocks.",
    history_flags: null,
  },
  {
    id: "s2", student_id: "sid2",
    name: "Marcus Chen", grade: "4th Grade",
    program: "summer_26", classroom: "Room 3B",
    profile_image_url: null, attendance_status: "checked_in",
    color: "#6b8db5",
    dob: "July 22, 2016",
    allergies: null,
    learning_style: "Auditory and logical — thrives with verbal explanation and step-by-step structure.",
    strengths: "Strong math reasoning, excellent memory retention, enjoys leading small groups.",
    challenges: "Transitions between activities can be abrupt; benefits from advance notice.",
    dysregulation_response: "May become louder and more assertive; responds to direct calm redirection.",
    regulation_strategies: "Transition countdowns, clear activity timelines posted on board.",
    medical_notes: null,
    special_interests: "Chess, robotics, reading non-fiction.",
    history_flags: null,
  },
  {
    id: "s3", student_id: "sid3",
    name: "Lily Okafor", grade: "2nd Grade",
    program: "summer_26", classroom: "Room 2A",
    profile_image_url: null, attendance_status: "absent",
    color: "#f29a8f",
    dob: "November 3, 2018",
    allergies: "Penicillin (medication allergy — notify nurse)",
    learning_style: "Social learner — performs best in small collaborative groups.",
    strengths: "High emotional intelligence, strong reader, encourages peers naturally.",
    challenges: "Can struggle with independent seat work for extended periods.",
    dysregulation_response: "Cries quietly; benefits from a calm adult presence nearby.",
    regulation_strategies: "Buddy system, short check-in at start of independent work.",
    medical_notes: "Mild asthma — inhaler kept in nurse's office.",
    special_interests: "Storytelling, dance, animals.",
    history_flags: null,
  },
  {
    id: "s4", student_id: "sid4",
    name: "Noah Williams", grade: "3rd Grade",
    program: "summer_26", classroom: "Room 3B",
    profile_image_url: null, attendance_status: "checked_out",
    color: "#c9a96e",
    dob: "February 8, 2017",
    allergies: null,
    learning_style: "Kinesthetic — needs to move and manipulate objects to process new concepts.",
    strengths: "Persistent with physical challenges, good spatial reasoning, humorous and warm with peers.",
    challenges: "Reading comprehension requires extra scaffolding; tires quickly with dense text.",
    dysregulation_response: "Becomes restless and may disrupt; outdoor time or physical task helps reset.",
    regulation_strategies: "Sensory breaks, stress ball, reduce seated time with movement integration.",
    medical_notes: null,
    special_interests: "Soccer, building, cooking.",
    history_flags: null,
  },
  {
    id: "s5", student_id: "sid5",
    name: "Aisha Thompson", grade: "Kindergarten",
    program: "school_year_26_27", classroom: "Room K1",
    profile_image_url: null, attendance_status: "checked_in",
    color: "#a78bda",
    dob: "September 14, 2020",
    allergies: "Dairy (dietary preference, not medical)",
    learning_style: "Play-based and musical — engages deeply through song and dramatic play.",
    strengths: "Joyful energy, imaginative, quick to form connections with new peers.",
    challenges: "Separation anxiety in the first hour; benefits from a consistent morning routine.",
    dysregulation_response: "Seeks physical comfort; calm corner with stuffed animal available.",
    regulation_strategies: "Predictable morning routine, visual schedule, quiet comfort object.",
    medical_notes: null,
    special_interests: "Singing, dolls, finger painting.",
    history_flags: null,
  },
  {
    id: "s6", student_id: "sid6",
    name: "Ethan Park", grade: "1st Grade",
    program: "school_year_26_27", classroom: "Room 1C",
    profile_image_url: null, attendance_status: "checked_out",
    color: "#5ba8c4",
    dob: "May 30, 2019",
    allergies: null,
    learning_style: "Independent and analytical — prefers to work through problems alone before asking for help.",
    strengths: "Detail-oriented, strong writing for age, asks insightful questions.",
    challenges: "Can be reluctant to ask for help; occasionally perfectionistic.",
    dysregulation_response: "Shuts down; gentle private check-in more effective than group attention.",
    regulation_strategies: "Private check-in, journaling, 'ask for help' visual cue card.",
    medical_notes: null,
    special_interests: "Dinosaurs, maps, drawing comics.",
    history_flags: null,
  },
  {
    id: "s7", student_id: "sid7",
    name: "Zoe Martinez", grade: "Mixed Ages",
    program: "homeschool_drop_in", classroom: "Open Lab",
    profile_image_url: null, attendance_status: "checked_in",
    color: "#e8a05a",
    dob: "August 19, 2016",
    allergies: null,
    learning_style: "Self-directed — accustomed to setting her own pace; benefits from project-based work.",
    strengths: "Highly motivated, excellent research skills, adaptable.",
    challenges: "Can struggle with structured group pacing; used to a more flexible schedule.",
    dysregulation_response: "Becomes visibly frustrated; a brief walk or change of task helps.",
    regulation_strategies: "Student-chosen project topics, flexible seating, time to decompress.",
    medical_notes: null,
    special_interests: "Astronomy, coding, baking.",
    history_flags: null,
  },
];

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: "Summer 2026",
  school_year_26_27: "School Year 2026–2027",
  homeschool_drop_in: "Homeschool Drop-In",
};

const PROGRAM_ORDER = ["summer_26", "school_year_26_27", "homeschool_drop_in"];

// ─── Sidebar Primitives (inlined) ─────────────────────────────────────────────

function SidebarField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 font-body">{label}</span>
      <span className="text-sm text-gray-800 font-body">{value}</span>
    </div>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-3">
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

// ─── Student Detail Sidebar ───────────────────────────────────────────────────

function StudentDetailSidebar({
  student,
  onClose,
}: {
  student: DemoStudent | null;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && student) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [student, onClose]);

  useEffect(() => {
    document.body.style.overflow = student ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [student]);

  return (
    <AnimatePresence>
      {student && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 backdrop-blur-sm"
            style={{ background: "rgba(0,0,0,0.15)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] z-50 flex flex-col overflow-hidden bg-white border-l border-gray-100 shadow-xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 px-6 py-5 flex items-center justify-between border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold font-body shrink-0"
                  style={{ backgroundColor: student.color }}
                >
                  {student.name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-800 font-body leading-tight">
                    {student.name}
                  </h2>
                  <p className="text-xs text-gray-400 font-body">{student.grade} · {student.classroom}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-0">
              <SidebarSection title="Student Info">
                <SidebarField label="Full Name" value={student.name} />
                <SidebarField label="Grade" value={student.grade} />
                <SidebarField label="Date of Birth" value={student.dob} />
                <SidebarField label="Program" value={PROGRAM_LABELS[student.program] ?? student.program} />
                <SidebarField label="Classroom" value={student.classroom} />
                <SidebarField label="Special Interests" value={student.special_interests} />
              </SidebarSection>
              <SidebarSection title="Learning Profile">
                <SidebarField label="Learning Style" value={student.learning_style} />
                <SidebarField label="Strengths & Interests" value={student.strengths} />
                <SidebarField label="Current Challenges" value={student.challenges} />
                <SidebarField label="Dysregulation Response" value={student.dysregulation_response} />
                <SidebarField label="Regulation Strategies" value={student.regulation_strategies} />
              </SidebarSection>
              <SidebarSection title="Health Notes">
                {student.allergies ? (
                  <SidebarField label="Allergies" value={student.allergies} />
                ) : (
                  <p className="text-sm text-gray-400 font-body">No known allergies.</p>
                )}
                {student.medical_notes && (
                  <SidebarField label="Medical Notes" value={student.medical_notes} />
                )}
              </SidebarSection>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Student Avatar ───────────────────────────────────────────────────────────

function StudentAvatar({ name, color }: { name: string; color: string }) {
  const initials = name.trim().split(/\s+/).map((w) => w[0].toUpperCase()).slice(0, 2).join("");
  return (
    <div
      className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-semibold font-body select-none"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

// ─── My Students Section ──────────────────────────────────────────────────────

function MyStudentsSection() {
  const programs = PROGRAM_ORDER.filter((p) => DEMO_STUDENTS.some((s) => s.program === p));
  const [activeProgram, setActiveProgram] = useState(programs[0] ?? "");
  const [selectedStudent, setSelectedStudent] = useState<DemoStudent | null>(null);

  const filtered = DEMO_STUDENTS.filter((s) => s.program === activeProgram);

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-700 font-body">My Students</h2>
        <div className="flex gap-2 flex-wrap justify-end">
          {programs.map((p) => (
            <button
              key={p}
              onClick={() => setActiveProgram(p)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium font-body transition-colors cursor-pointer ${
                activeProgram === p
                  ? "bg-[#4a7c59] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {PROGRAM_LABELS[p] ?? p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {filtered.map((s) => (
          <div
            key={s.id}
            onClick={() => setSelectedStudent(s)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-200 cursor-pointer transition-all"
          >
            <StudentAvatar name={s.name} color={s.color} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 font-body">{s.name}</p>
              <p className="text-xs text-gray-400 font-body mt-0.5">Grade: {s.grade}</p>
            </div>
            <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full shrink-0 font-body">
              {s.classroom}
            </span>
            {s.attendance_status === "checked_in" && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#4a7c59]/10 text-[#4a7c59] shrink-0 font-body">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4a7c59] animate-pulse" />
                Checked In
              </span>
            )}
            {s.attendance_status === "checked_out" && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 shrink-0 font-body">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                Checked Out
              </span>
            )}
            {s.attendance_status === "absent" && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-500 shrink-0 font-body">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Not Checked In
              </span>
            )}
          </div>
        ))}
      </div>

      <StudentDetailSidebar
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </section>
  );
}

// ─── Hours Helpers ────────────────────────────────────────────────────────────

function sessionDurationHours(s: DemoSession): number {
  const end = s.clockOutAt ?? new Date();
  return (end.getTime() - s.clockInAt.getTime()) / 3_600_000;
}

function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells: (Date | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function buildHoursInitialSessions(): Record<string, DemoSession[]> {
  const sessions: Record<string, DemoSession[]> = {};
  const today = new Date();
  const notes = ["Curriculum planning", "Student assessments", "Parent emails", "Lesson prep", "Staff meeting", ""];

  // Build 4 weeks back of data
  for (let weekBack = 0; weekBack <= 3; weekBack++) {
    const monday = getMondayOfWeek(today);
    monday.setDate(monday.getDate() - weekBack * 7);
    const dayHours = weekBack === 0
      ? [4.5, 6.0, 5.5, 7.0, 4.0, 0, 0]
      : weekBack === 1
      ? [5.0, 5.5, 6.5, 5.0, 6.0, 0, 0]
      : weekBack === 2
      ? [4.0, 7.0, 5.0, 6.0, 5.5, 0, 0]
      : [6.0, 5.0, 4.5, 5.5, 6.5, 0, 0];

    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = todayKey(d);
      const hrs = dayHours[i];
      if (hrs <= 0) continue;
      if (key > todayKey(today)) continue;
      if (key === todayKey(today)) {
        // Today: already clocked out session
        const ci = new Date(d); ci.setHours(8, 0, 0, 0);
        const co = new Date(ci); co.setTime(ci.getTime() + hrs * 3_600_000);
        sessions[key] = [{ id: `h-${key}-0`, clockInAt: ci, clockOutAt: co, note: "Morning session" }];
      } else {
        const ci = new Date(d); ci.setHours(8, 0, 0, 0);
        const co = new Date(ci); co.setTime(ci.getTime() + hrs * 3_600_000);
        sessions[key] = [{ id: `h-${key}-0`, clockInAt: ci, clockOutAt: co, note: notes[i % notes.length] }];
      }
    }
  }
  return sessions;
}

const WEEKLY_GOAL = 40;
type ViewMode = "day" | "week" | "month";

// ─── Session Row ──────────────────────────────────────────────────────────────

function SessionRow({
  session,
  onDelete,
  onNoteChange,
}: {
  session: DemoSession;
  onDelete: (id: string) => void;
  onNoteChange: (id: string, note: string) => void;
}) {
  const [note, setNote] = useState(session.note);
  const [editing, setEditing] = useState(false);
  const noteRef = useRef<HTMLInputElement>(null);
  const hours = sessionDurationHours(session);

  function handleNoteBlur() {
    setEditing(false);
    if (note !== session.note) onNoteChange(session.id, note);
  }

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 rounded-xl bg-gray-50 border border-gray-100 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-sm font-semibold text-gray-700 font-body tabular-nums">
            {fmt12(session.clockInAt)}
            {session.clockOutAt && <> &ndash; {fmt12(session.clockOutAt)}</>}
          </span>
          {session.clockOutAt && (
            <span className="text-xs font-semibold text-[#4a7c59] bg-[#4a7c59]/8 px-2 py-0.5 rounded-full font-body">
              {formatDuration(hours)}
            </span>
          )}
        </div>
        {session.clockOutAt && (
          editing ? (
            <input
              ref={noteRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={handleNoteBlur}
              onKeyDown={(e) => { if (e.key === "Enter") noteRef.current?.blur(); }}
              autoFocus
              placeholder="Add a note..."
              className="w-full text-xs text-gray-500 font-body bg-transparent border-b border-gray-200 focus:outline-none focus:border-[#4a7c59] py-0.5"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-gray-400 font-body hover:text-gray-600 transition-colors text-left truncate max-w-[260px] cursor-pointer"
            >
              {note || "Add a note…"}
            </button>
          )
        )}
      </div>
      <button
        onClick={() => onDelete(session.id)}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({
  selectedDate,
  sessionsByDay,
  activeSession,
  onClockIn,
  onClockOut,
  onDeleteSession,
  onNoteChange,
}: {
  selectedDate: Date;
  sessionsByDay: Record<string, DemoSession[]>;
  activeSession: DemoSession | null;
  onClockIn: () => void;
  onClockOut: () => void;
  onDeleteSession: (id: string) => void;
  onNoteChange: (id: string, note: string) => void;
}) {
  const currentTodayKey = todayKey(new Date());
  const selectedKey = todayKey(selectedDate);
  const isToday = selectedKey === currentTodayKey;
  const isFuture = selectedKey > currentTodayKey;
  const daySessions = sessionsByDay[selectedKey] ?? [];
  const dayTotalHours = getDayTotalHours(daySessions);
  const isActiveDay = activeSession !== null && todayKey(new Date(activeSession.clockInAt)) === selectedKey;

  const dayFull = selectedDate.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-6"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-semibold font-heading text-gray-800">
              {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
            </h2>
            {isToday && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium font-body bg-amber-50 text-amber-600 border border-amber-200">
                Today
              </span>
            )}
            {dayTotalHours > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[#4a7c59]/8 rounded-full">
                <Clock className="w-3.5 h-3.5 text-[#4a7c59]" />
                <span className="text-sm font-semibold text-[#4a7c59] font-body tabular-nums">
                  {formatDuration(dayTotalHours)}
                </span>
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 font-body">
            {dayFull.split(", ").slice(1).join(", ")}
          </p>
        </div>

        {isToday && (
          <div className={`flex items-center justify-between px-6 py-5 rounded-2xl border ${
            isActiveDay ? "bg-[#4a7c59]/5 border-[#4a7c59]/20" : "bg-gray-50 border-gray-100"
          }`}>
            <div>
              {isActiveDay ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#4a7c59] font-body mb-1">Clocked In</p>
                  <p className="text-2xl font-bold font-heading text-gray-800 tabular-nums leading-none">
                    <ElapsedTimer clockInAt={activeSession!.clockInAt} />
                  </p>
                  <p className="text-xs text-gray-400 font-body mt-1">Since {fmt12(activeSession!.clockInAt)}</p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-1">Not clocked in</p>
                  <p className="text-sm text-gray-400 font-body">
                    {daySessions.length > 0 ? "Clock in again to log more time" : "Tap Clock In to start tracking"}
                  </p>
                </>
              )}
            </div>
            {isActiveDay ? (
              <button
                onClick={onClockOut}
                className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 font-semibold font-body text-sm rounded-xl hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Clock Out
              </button>
            ) : (
              <button
                onClick={onClockIn}
                className="flex items-center gap-2 px-5 py-3 bg-[#4a7c59] text-white font-semibold font-body text-sm rounded-xl hover:bg-[#3d6b4a] transition-colors shadow-sm cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Clock In
              </button>
            )}
          </div>
        )}

        {!isToday && !isFuture && daySessions.length === 0 && (
          <div className="px-6 py-5 rounded-2xl bg-gray-50 border border-gray-100">
            <p className="text-sm text-gray-400 font-body">No sessions logged for this day.</p>
          </div>
        )}

        {daySessions.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-1">Sessions</p>
            {daySessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                onDelete={onDeleteSession}
                onNoteChange={onNoteChange}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({
  sessionsByDay,
  activeSession,
  onDayClick,
}: {
  sessionsByDay: Record<string, DemoSession[]>;
  activeSession: DemoSession | null;
  onDayClick: (date: Date, switchView: boolean) => void;
}) {
  const currentTodayKey = todayKey(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const monday = getMondayOfWeek(new Date());
  monday.setDate(monday.getDate() + weekOffset * 7);
  const weekDays = getWeekDays(monday);
  const totalHours = getWeekTotalHours(monday, sessionsByDay);

  const fri = new Date(monday); fri.setDate(monday.getDate() + 4);
  const weekLabel = `${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${fri.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-700 font-body">
            {weekOffset === 0 ? "This Week" : weekOffset === -1 ? "Last Week" : weekLabel.split("–")[0].trim()}
          </h2>
          <p className="text-xs text-gray-400 font-body mt-0.5">{weekLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold font-body text-gray-500 tabular-nums mr-2">
            {formatDuration(totalHours)}
            <span className="text-xs font-normal text-gray-300 ml-1">/ {WEEKLY_GOAL}h</span>
          </span>
          <button onClick={() => setWeekOffset((w) => w - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setWeekOffset((w) => w + 1)} disabled={weekOffset >= 0} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {weekDays.map((d, i) => {
          const key = todayKey(d);
          const daySessions = sessionsByDay[key] ?? [];
          const isActiveDay = activeSession !== null && todayKey(new Date(activeSession.clockInAt)) === key;
          const isLogged = daySessions.some((s) => !!s.clockOutAt);
          const isToday = key === currentTodayKey;
          const hours = getDayTotalHours(daySessions);

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              onClick={() => onDayClick(d, true)}
              className={`flex items-center gap-5 px-5 py-4 rounded-xl border cursor-pointer transition-all duration-150 group
                ${isLogged || isActiveDay
                  ? "border-l-[3px] border-l-[#4a7c59] border-t-gray-100 border-r-gray-100 border-b-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm"
                  : isToday
                  ? "border border-[#4a7c59]/20 bg-[#4a7c59]/5 hover:shadow-sm"
                  : key > currentTodayKey
                  ? "border border-gray-50 bg-gray-50/50 opacity-50"
                  : "border border-gray-100 hover:bg-gray-50 hover:shadow-sm"
                }`}
            >
              <div className="w-16 shrink-0">
                <p className="text-sm font-semibold text-gray-700 font-body">{d.toLocaleDateString("en-US", { weekday: "short" })}</p>
                <p className="text-xs text-gray-400 font-body">{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
              </div>
              <div className="shrink-0">
                {isActiveDay ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium font-body bg-[#4a7c59]/10 text-[#4a7c59]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4a7c59] animate-pulse" />Active
                  </span>
                ) : isLogged ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium font-body bg-[#4a7c59]/10 text-[#4a7c59]">Logged</span>
                ) : isToday ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium font-body bg-amber-50 text-amber-500 border border-amber-200">Today</span>
                ) : key > currentTodayKey ? (
                  <span className="text-xs text-gray-300 font-body">Upcoming</span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium font-body bg-gray-100 text-gray-400">Not logged</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {hours > 0 && (
                  <span className="text-xs text-[#4a7c59] font-semibold font-body bg-[#4a7c59]/8 px-2.5 py-1 rounded-full">
                    {formatDuration(hours)}
                  </span>
                )}
                {isActiveDay && activeSession && (
                  <span className="text-xs text-gray-400 font-body ml-2">Clocked in {fmt12(activeSession.clockInAt)}</span>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400 font-body font-semibold uppercase tracking-widest">Week total</span>
        <span className="text-base font-semibold text-gray-700 font-body tabular-nums">
          {formatDuration(totalHours)} <span className="text-sm font-normal text-gray-400">of {WEEKLY_GOAL}h</span>
        </span>
      </div>
    </motion.div>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({
  sessionsByDay,
  onDayClick,
}: {
  sessionsByDay: Record<string, DemoSession[]>;
  onDayClick: (date: Date, switchView: boolean) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const currentTodayKey = todayKey(today);

  const cells = getMonthDays(year, month);
  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1);
  }

  const loggedCount = cells.filter((d) => d && getDayTotalHours(sessionsByDay[todayKey(d)] ?? []) > 0).length;
  const totalLoggedHours = cells.reduce((acc, d) => d ? acc + getDayTotalHours(sessionsByDay[todayKey(d)] ?? []) : acc, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-700 font-body">{monthLabel}</h2>
          <p className="text-xs text-gray-400 font-body mt-0.5">
            {loggedCount} day{loggedCount !== 1 ? "s" : ""} logged · {formatDuration(totalLoggedHours)} total
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-gray-300 font-body py-1.5">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} />;
          const key = todayKey(d);
          const hours = getDayTotalHours(sessionsByDay[key] ?? []);
          const isLogged = hours > 0;
          const isToday = key === currentTodayKey;
          const isFuture = key > currentTodayKey;
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          return (
            <button
              key={key}
              onClick={() => !isWeekend && onDayClick(d, true)}
              disabled={isWeekend}
              className={`relative flex flex-col items-center justify-start rounded-xl py-2 px-1 transition-all group
                ${isWeekend ? "cursor-default opacity-30" : "cursor-pointer"}
                ${isLogged && !isWeekend ? "bg-[#4a7c59]/8 hover:bg-[#4a7c59]/15" : isToday ? "ring-2 ring-[#4a7c59]/30 hover:bg-gray-50" : !isWeekend ? "hover:bg-gray-50" : ""}`}
            >
              <span className={`text-sm font-medium font-body leading-none mb-1.5
                ${isToday ? "w-6 h-6 flex items-center justify-center rounded-full bg-[#4a7c59] text-white text-xs"
                  : isLogged ? "text-gray-800"
                  : isFuture ? "text-gray-300"
                  : "text-gray-500"}`}
              >
                {d.getDate()}
              </span>
              {isLogged && (
                <span className="text-[10px] font-semibold text-[#4a7c59] font-body tabular-nums leading-none">
                  {formatDuration(hours)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#4a7c59]/15" /><span className="text-xs text-gray-400 font-body">Logged</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded ring-2 ring-[#4a7c59]/30" /><span className="text-xs text-gray-400 font-body">Today</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-100" /><span className="text-xs text-gray-400 font-body">Not logged</span></div>
      </div>
    </motion.div>
  );
}

// ─── Summary Panel ────────────────────────────────────────────────────────────

function SummaryPanel({
  sessionsByDay,
  activeSession,
}: {
  sessionsByDay: Record<string, DemoSession[]>;
  activeSession: DemoSession | null;
}) {
  const today = new Date();
  const currentTodayKey = todayKey(today);
  const monday = getMondayOfWeek(today);
  const weekDays = getWeekDays(monday);
  const weekTotal = getWeekTotalHours(monday, sessionsByDay);
  const weekLogged = weekDays.filter((d) => getDayTotalHours(sessionsByDay[todayKey(d)] ?? []) > 0).length;

  const monthCells = getMonthDays(today.getFullYear(), today.getMonth());
  const monthTotal = monthCells.reduce((acc, d) => d ? acc + getDayTotalHours(sessionsByDay[todayKey(d)] ?? []) : acc, 0);
  const monthLogged = monthCells.filter((d) => d && getDayTotalHours(sessionsByDay[todayKey(d)] ?? []) > 0).length;

  const todayHours = getDayTotalHours(sessionsByDay[currentTodayKey] ?? []);
  const todaySessions = sessionsByDay[currentTodayKey] ?? [];

  const recentDays = Object.entries(sessionsByDay)
    .filter(([k]) => k <= currentTodayKey && getDayTotalHours(sessionsByDay[k]) > 0)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 5);

  const weekPct = Math.min(1, weekTotal / WEEKLY_GOAL);
  const weekRemaining = Math.max(0, WEEKLY_GOAL - weekTotal);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-6 border-b border-gray-100">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-4">This Week</p>
        <div className="flex items-end justify-between mb-2.5">
          <span className="text-2xl font-bold font-heading text-gray-800 tabular-nums leading-none">{formatDuration(weekTotal)}</span>
          <span className="text-xs text-gray-400 font-body">of {WEEKLY_GOAL}h</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${weekPct * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="h-full bg-[#4a7c59] rounded-full"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-body">{weekLogged}/5 days</span>
          {weekRemaining > 0 ? (
            <span className="text-xs text-gray-500 font-body"><span className="font-semibold text-gray-700">{formatDuration(weekRemaining)}</span> to go</span>
          ) : (
            <span className="text-xs font-semibold text-[#4a7c59] font-body">Goal reached!</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 border-b border-gray-100">
        <div className="px-6 py-5 border-r border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-2">Today</p>
          {activeSession ? (
            <>
              <p className="text-[11px] font-semibold text-[#4a7c59] font-body mb-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4a7c59] animate-pulse inline-block" />Clocked in
              </p>
              <p className="text-xl font-bold font-heading text-gray-800 tabular-nums leading-none">
                <ElapsedTimer clockInAt={activeSession.clockInAt} />
              </p>
            </>
          ) : todayHours > 0 ? (
            <>
              <p className="text-xl font-bold font-heading text-gray-800 tabular-nums leading-none">{formatDuration(todayHours)}</p>
              <p className="text-[11px] text-gray-400 font-body mt-1">{todaySessions.length} session{todaySessions.length !== 1 ? "s" : ""}</p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold font-heading text-gray-300 leading-none">—</p>
              <p className="text-[11px] text-gray-300 font-body mt-1">Not clocked in</p>
            </>
          )}
        </div>
        <div className="px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-2">Month</p>
          <p className="text-xl font-bold font-heading text-gray-800 tabular-nums leading-none">{formatDuration(monthTotal)}</p>
          <p className="text-[11px] text-gray-400 font-body mt-1 leading-snug">{monthLogged} day{monthLogged !== 1 ? "s" : ""}<br />logged</p>
        </div>
      </div>

      <div className="px-6 py-5 flex-1">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-3 h-3 text-gray-400" />
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body">Recent</p>
        </div>
        {recentDays.length === 0 ? (
          <p className="text-sm text-gray-300 font-body">No entries yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {recentDays.map(([key]) => {
              const d = new Date(key + "T00:00:00");
              const isToday = key === currentTodayKey;
              const hours = getDayTotalHours(sessionsByDay[key] ?? []);
              const sessionCount = (sessionsByDay[key] ?? []).filter((s) => !!s.clockOutAt).length;
              return (
                <div key={key} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700 font-body leading-none mb-0.5">
                      {isToday ? "Today" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                    <p className="text-[11px] text-gray-400 font-body">{sessionCount} session{sessionCount !== 1 ? "s" : ""}</p>
                  </div>
                  <span className="text-xs font-semibold text-[#4a7c59] font-body tabular-nums shrink-0">{formatDuration(hours)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Hours Page ───────────────────────────────────────────────────────────────

function HoursPage() {
  const [view, setView] = useState<ViewMode>("day");
  const [sessionsByDay, setSessionsByDay] = useState<Record<string, DemoSession[]>>(buildHoursInitialSessions);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    if (day === 6) { const d = new Date(today); d.setDate(today.getDate() - 1); return d; }
    if (day === 0) { const d = new Date(today); d.setDate(today.getDate() - 2); return d; }
    return today;
  });

  const activeSession = Object.values(sessionsByDay).flat().find((s) => !s.clockOutAt) ?? null;

  function handleClockIn() {
    const now = new Date();
    const key = todayKey(now);
    setSessionsByDay((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), { id: `h-${Date.now()}`, clockInAt: now, clockOutAt: null, note: "" }],
    }));
  }

  function handleClockOut() {
    if (!activeSession) return;
    const key = todayKey(activeSession.clockInAt);
    const clockOutAt = new Date();
    setSessionsByDay((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).map((s) => s.id === activeSession.id ? { ...s, clockOutAt } : s),
    }));
  }

  function handleDeleteSession(id: string) {
    setSessionsByDay((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = next[key].filter((s) => s.id !== id);
        if (next[key].length === 0) delete next[key];
      }
      return next;
    });
  }

  function handleNoteChange(id: string, note: string) {
    setSessionsByDay((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = next[key].map((s) => s.id === id ? { ...s, note } : s);
      }
      return next;
    });
  }

  function handleDayClick(date: Date, switchToDay: boolean) {
    setSelectedDate(date);
    if (switchToDay) setView("day");
  }

  function goDay(delta: number) {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + delta);
    if (next.getDay() === 0) next.setDate(next.getDate() + (delta > 0 ? 1 : -2));
    if (next.getDay() === 6) next.setDate(next.getDate() + (delta > 0 ? 2 : -1));
    setSelectedDate(next);
  }

  const views: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: "day", label: "Day", icon: <Clock className="w-3.5 h-3.5" /> },
    { id: "week", label: "Week", icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { id: "month", label: "Month", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex gap-6">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-end justify-between mb-7"
        >
          <div>
            <h1 className="text-3xl font-bold font-heading text-gray-800">My Hours</h1>
            <p className="text-sm text-gray-400 font-body mt-1">Clock in and out to track your daily work time.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {view === "day" && (
              <div className="flex items-center gap-1">
                <button onClick={() => goDay(-1)} className="p-1.5 rounded-lg hover:bg-gray-200/60 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-600 font-body tabular-nums min-w-[110px] text-center">
                  {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
                <button onClick={() => goDay(1)} className="p-1.5 rounded-lg hover:bg-gray-200/60 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              {views.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-body transition-all cursor-pointer
                    ${view === id ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {icon}{label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {view === "day" && (
            <motion.div key="day" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <DayView
                selectedDate={selectedDate}
                sessionsByDay={sessionsByDay}
                activeSession={activeSession}
                onClockIn={handleClockIn}
                onClockOut={handleClockOut}
                onDeleteSession={handleDeleteSession}
                onNoteChange={handleNoteChange}
              />
            </motion.div>
          )}
          {view === "week" && (
            <motion.div key="week" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <WeekView sessionsByDay={sessionsByDay} activeSession={activeSession} onDayClick={handleDayClick} />
            </motion.div>
          )}
          {view === "month" && (
            <motion.div key="month" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <MonthView sessionsByDay={sessionsByDay} onDayClick={handleDayClick} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Summary sidebar */}
      <div className="w-64 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <SummaryPanel sessionsByDay={sessionsByDay} activeSession={activeSession} />
      </div>
    </div>
  );
}

// ─── Messages Demo Data ───────────────────────────────────────────────────────

type DemoConvo = {
  id: string; name: string; role: string; color: string;
  lastMsg: string; lastTime: string; unread: number;
};
type DemoMsg = { id: string; from: "me" | "them"; body: string; time: string };

const DEMO_CONVOS: DemoConvo[] = [
  { id: "c1", name: "Sarah Rivera", role: "Parent", color: "#7FA888", lastMsg: "Thank you so much, that's great to hear!", lastTime: "2m ago", unread: 2 },
  { id: "c2", name: "David Chen", role: "Parent", color: "#6b8db5", lastMsg: "Could we reschedule our conference?", lastTime: "Yesterday", unread: 1 },
  { id: "c3", name: "Ms. Paige Sun", role: "Teacher", color: "#c9a96e", lastMsg: "I'll cover your 10am on Friday.", lastTime: "Apr 18", unread: 0 },
  { id: "c4", name: "Sage Field Office", role: "Admin", color: "#4a7c59", lastMsg: "PD day reminder: May 2nd, no students.", lastTime: "Apr 17", unread: 0 },
];

const DEMO_THREADS: Record<string, DemoMsg[]> = {
  c1: [
    { id: "m1", from: "them", body: "Hi Jordan! Just checking in — Emma seemed a bit tired this morning.", time: "9:02 AM" },
    { id: "m2", from: "me", body: "Hi Sarah! Yes, I noticed too. She settled in really well once we started our project.", time: "9:10 AM" },
    { id: "m3", from: "them", body: "That's a relief. Did she participate okay?", time: "9:12 AM" },
    { id: "m4", from: "me", body: "Absolutely — she was actually one of the first to finish her watercolor piece today. Really proud of her.", time: "9:15 AM" },
    { id: "m5", from: "them", body: "Thank you so much, that's great to hear!", time: "9:16 AM" },
  ],
  c2: [
    { id: "m1", from: "them", body: "Hi! I wanted to confirm our parent-teacher conference for April 28th.", time: "Yesterday 2:00 PM" },
    { id: "m2", from: "me", body: "Hi David! Yes, you're confirmed for 2:30 PM. Looking forward to it.", time: "Yesterday 2:30 PM" },
    { id: "m3", from: "them", body: "Could we reschedule our conference?", time: "Yesterday 4:00 PM" },
  ],
  c3: [
    { id: "m1", from: "them", body: "Hey Jordan — are you free on Friday morning? I have a conflict with my 10am.", time: "Apr 18 11:00 AM" },
    { id: "m2", from: "me", body: "Sure thing! What time works for you?", time: "Apr 18 11:15 AM" },
    { id: "m3", from: "them", body: "I'll cover your 10am on Friday.", time: "Apr 18 11:20 AM" },
  ],
  c4: [
    { id: "m1", from: "them", body: "Reminder: Professional Development Day is May 2nd. No students on campus. Bring your curriculum planning materials.", time: "Apr 17 9:00 AM" },
    { id: "m2", from: "me", body: "Got it, thanks for the heads-up!", time: "Apr 17 9:05 AM" },
    { id: "m3", from: "them", body: "PD day reminder: May 2nd, no students.", time: "Apr 17 9:10 AM" },
  ],
};

function initialsFrom(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0].toUpperCase()).slice(0, 2).join("");
}

function MessagesPage() {
  const [activeId, setActiveId] = useState<string>("c1");
  const [threads, setThreads] = useState<Record<string, DemoMsg[]>>(DEMO_THREADS);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [convos, setConvos] = useState<DemoConvo[]>(DEMO_CONVOS);
  const [mobileView, setMobileView] = useState<"list" | "chat">("chat");
  const endRef = useRef<HTMLDivElement>(null);

  const active = convos.find((c) => c.id === activeId) ?? null;
  const messages = threads[activeId] ?? [];
  const filtered = convos.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, messages.length]);

  function sendMsg() {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    const newMsg: DemoMsg = { id: `m-${Date.now()}`, from: "me", body, time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) };
    setThreads((prev) => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), newMsg] }));
    setConvos((prev) => prev.map((c) => c.id === activeId ? { ...c, lastMsg: body, lastTime: "Just now", unread: 0 } : c));
  }

  function openConvo(id: string) {
    setActiveId(id);
    setConvos((prev) => prev.map((c) => c.id === id ? { ...c, unread: 0 } : c));
    setMobileView("chat");
  }

  return (
    <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ height: "600px" }}>
      {/* Conversation list */}
      <div className={`w-72 shrink-0 border-r border-gray-100 flex flex-col ${mobileView === "chat" ? "hidden sm:flex" : "flex"}`}>
        <div className="p-3 border-b border-gray-100 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm font-body bg-gray-50 border border-gray-100 rounded-lg focus:outline-none text-gray-800 placeholder:text-gray-400"
            />
          </div>
          <button className="w-full flex items-center justify-center gap-2 bg-[#4a7c59] hover:bg-[#3d6b4a] text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer">
            <SquarePen className="w-4 h-4" />New Message
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => openConvo(c.id)}
              className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer ${c.id === activeId ? "bg-[#4a7c59]/5 border-r-2 border-[#4a7c59]" : "hover:bg-gray-50"}`}
            >
              <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-semibold font-body" style={{ backgroundColor: c.color }}>
                {initialsFrom(c.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold font-body text-gray-800 truncate">{c.name}</span>
                  <span className="text-[11px] text-gray-400 font-body shrink-0 ml-2">{c.lastTime}</span>
                </div>
                <p className="text-[11px] text-gray-400 font-body">{c.role}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-gray-500 font-body truncate flex-1">{c.lastMsg}</p>
                  {c.unread > 0 && (
                    <span className="bg-[#4a7c59] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">{c.unread}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col min-w-0 ${mobileView === "list" ? "hidden sm:flex" : "flex"}`}>
        {active ? (
          <>
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 shrink-0">
              <button onClick={() => setMobileView("list")} className="sm:hidden text-gray-500 cursor-pointer">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-semibold font-body" style={{ backgroundColor: active.color }}>
                {initialsFrom(active.name)}
              </div>
              <div>
                <p className="text-sm font-semibold font-body text-gray-800">{active.name}</p>
                <p className="text-[11px] text-gray-400 font-body">{active.role}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm font-body leading-relaxed ${msg.from === "me" ? "bg-[#4a7c59] text-white rounded-br-md" : "bg-gray-100 text-gray-800 rounded-bl-md"}`}>
                    <p>{msg.body}</p>
                    <p className={`text-[10px] mt-1 ${msg.from === "me" ? "text-white/60" : "text-gray-400"}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-2 shrink-0">
              <input
                type="text"
                placeholder="Type a message..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                className="flex-1 px-4 py-2.5 text-sm font-body bg-gray-50 border border-gray-100 rounded-xl focus:outline-none text-gray-800 placeholder:text-gray-400"
              />
              <button
                onClick={sendMsg}
                disabled={!draft.trim()}
                className="w-10 h-10 rounded-xl bg-[#4a7c59] hover:bg-[#3d6b4a] disabled:opacity-40 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-400 font-body">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Calendar Demo Data ───────────────────────────────────────────────────────

const CALENDAR_EVENTS: DemoCalendarEvent[] = [
  ...DEMO_EVENTS,
  {
    id: "ce1", title: "Curriculum Planning", event_date: "2026-04-21",
    is_all_day: false, start_time: "09:00", end_time: "11:00",
    color: "#c9a96e", category: "Planning",
    description: "Q3 curriculum mapping session with department heads.",
    location: "Room 101", attachment_links: ["curriculum-map-q3.pdf"],
  },
  {
    id: "ce2", title: "Spring Showcase", event_date: "2026-05-08",
    is_all_day: false, start_time: "14:00", end_time: "16:30",
    color: "#a78bda", category: "Community",
    description: "Student art and project showcase for families. All parents invited.",
    location: "Main Hall", attachment_links: null,
  },
  {
    id: "ce3", title: "End-of-Month Review", event_date: "2026-04-30",
    is_all_day: false, start_time: "15:30", end_time: "16:15",
    color: "#5ba8c4", category: "Staff",
    description: "Monthly wrap-up with admin team. Bring your student progress notes.",
    location: "Conference Room B", attachment_links: null,
  },
];

type CalView = "month" | "week";

function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [view, setView] = useState<CalView>("month");
  const [selectedEvent, setSelectedEvent] = useState<DemoCalendarEvent | null>(null);
  const currentTodayKey = todayKey(today);

  const cells = getMonthDays(year, month);
  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  function prevPeriod() {
    if (view === "month") { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); }
  }
  function nextPeriod() {
    if (view === "month") { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); }
  }

  function eventsForDay(d: Date) {
    const key = todayKey(d);
    return CALENDAR_EVENTS.filter((e) => e.event_date === key);
  }

  // Close sidebar on escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setSelectedEvent(null); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={prevPeriod} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-semibold font-body text-gray-800 min-w-[160px] text-center">{monthLabel}</h2>
            <button onClick={nextPeriod} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {(["month", "week"] as CalView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-body transition-all cursor-pointer capitalize ${view === v ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-7 mb-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-300 font-body py-1.5">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
          {cells.map((d, i) => {
            if (!d) return <div key={`e-${i}`} className="bg-white min-h-[80px]" />;
            const key = todayKey(d);
            const isToday = key === currentTodayKey;
            const dayEvents = eventsForDay(d);
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            return (
              <div
                key={key}
                className={`bg-white min-h-[80px] p-1.5 ${isWeekend ? "bg-gray-50/60" : ""}`}
              >
                <div className={`text-xs font-semibold font-body mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-[#4a7c59] text-white" : "text-gray-500"}`}>
                  {d.getDate()}
                </div>
                <div className="flex flex-col gap-0.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="w-full text-left text-[10px] font-semibold font-body px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: (ev.color ?? "#4a7c59") + "22", color: ev.color ?? "#4a7c59" }}
                    >
                      {ev.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] text-gray-400 font-body px-1.5">+{dayEvents.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3">
          {Array.from(new Set(CALENDAR_EVENTS.map((e) => e.category))).filter(Boolean).map((cat) => {
            const ev = CALENDAR_EVENTS.find((e) => e.category === cat)!;
            return (
              <div key={cat} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ev.color ?? "#4a7c59" }} />
                <span className="text-[11px] text-gray-500 font-body">{cat}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming events sidebar */}
      <div className="w-64 shrink-0 flex flex-col gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body">Upcoming</p>
          {CALENDAR_EVENTS
            .filter((e) => e.event_date >= currentTodayKey)
            .sort((a, b) => a.event_date.localeCompare(b.event_date))
            .slice(0, 6)
            .map((ev) => (
              <button
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className="w-full text-left relative rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors cursor-pointer"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: ev.color ?? "#4a7c59" }} />
                <div className="pl-4 pr-3 py-2.5">
                  <p className="text-[11px] text-gray-400 font-body">{formatEventDate(ev)}</p>
                  <p className="text-xs font-semibold text-gray-800 font-body leading-snug">{ev.title}</p>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Event detail sidebar */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 backdrop-blur-sm"
              style={{ background: "rgba(0,0,0,0.15)" }}
              onClick={() => setSelectedEvent(null)}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] z-50 flex flex-col overflow-hidden bg-white border-l border-gray-100 shadow-xl"
            >
              <div className="sticky top-0 z-10 px-6 py-5 flex items-center justify-between border-b border-gray-100 bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selectedEvent.color ?? "#4a7c59" }} />
                  <h2 className="text-base font-semibold text-gray-800 font-body">{selectedEvent.title}</h2>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
                {selectedEvent.category && (
                  <span className="inline-block text-xs font-semibold font-body px-2.5 py-1 rounded-full w-fit" style={{ backgroundColor: (selectedEvent.color ?? "#4a7c59") + "22", color: selectedEvent.color ?? "#4a7c59" }}>
                    {selectedEvent.category}
                  </span>
                )}
                <div>
                  <p className="text-xs text-gray-400 font-body mb-0.5">Date & Time</p>
                  <p className="text-sm font-semibold text-gray-800 font-body">{formatEventDate(selectedEvent)}</p>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 font-body">{selectedEvent.location}</p>
                  </div>
                )}
                {selectedEvent.description && (
                  <div>
                    <p className="text-xs text-gray-400 font-body mb-1">Description</p>
                    <p className="text-sm text-gray-700 font-body leading-relaxed">{selectedEvent.description}</p>
                  </div>
                )}
                {selectedEvent.attachment_links && selectedEvent.attachment_links.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 font-body mb-2">Attachments</p>
                    <div className="flex flex-col gap-2">
                      {selectedEvent.attachment_links.map((name) => (
                        <div key={name} className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                          <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-sm font-body text-gray-700 truncate">{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Feed Demo Data ───────────────────────────────────────────────────────────

type DemoReaction = { emoji: string; count: number; mine: boolean };
type DemoComment = { id: string; authorName: string; authorColor: string; body: string; time: string };
type DemoFeedPost = {
  id: string; authorName: string; authorId: string; authorColor: string;
  body: string; createdAt: string; reactions: DemoReaction[]; comments: DemoComment[];
};

const DEMO_TEACHERS_FEED = [
  { id: "t1", name: "Jordan Taylor", color: "#4a7c59" },
  { id: "t2", name: "Ms. Paige Sun", color: "#c9a96e" },
  { id: "t3", name: "Ms. Nicole Park", color: "#7FA888" },
];

const INITIAL_POSTS: DemoFeedPost[] = [
  {
    id: "p1", authorName: "Jordan Taylor", authorId: "t1", authorColor: "#4a7c59",
    body: "What a wonderful morning in Room 3B! The students dove headfirst into our new watercolor unit today. Emma and Marcus were especially focused — watching them mix colors and experiment was such a joy. 🎨",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    reactions: [{ emoji: "❤️", count: 4, mine: false }, { emoji: "👏", count: 2, mine: false }],
    comments: [
      { id: "cm1", authorName: "Sarah Rivera", authorColor: "#6b8db5", body: "Emma came home and told us all about it! She was so excited.", time: "1h ago" },
      { id: "cm2", authorName: "Ms. Paige Sun", authorColor: "#c9a96e", body: "Love the watercolor unit — we do something similar in K1. Let me know if you want to share supplies!", time: "45m ago" },
    ],
  },
  {
    id: "p2", authorName: "Ms. Paige Sun", authorId: "t2", authorColor: "#c9a96e",
    body: "Aisha counted to 20 entirely on her own today during morning circle — completely unprompted. The whole class cheered for her. These little moments are everything. 🌟",
    createdAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    reactions: [{ emoji: "❤️", count: 7, mine: false }, { emoji: "😊", count: 3, mine: false }, { emoji: "👏", count: 5, mine: false }],
    comments: [
      { id: "cm3", authorName: "Jordan Taylor", authorColor: "#4a7c59", body: "That's such a big milestone! Way to go Aisha.", time: "Yesterday" },
    ],
  },
  {
    id: "p3", authorName: "Ms. Nicole Park", authorId: "t3", authorColor: "#7FA888",
    body: "Quick reminder to all parents — the Nature Walk field trip for elementary students is this Thursday, April 24th. Students should wear closed-toe shoes and bring a water bottle. We'll be out from 10–11:30 AM. So excited for this one!",
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    reactions: [{ emoji: "👍", count: 6, mine: false }],
    comments: [],
  },
  {
    id: "p4", authorName: "Jordan Taylor", authorId: "t1", authorColor: "#4a7c59",
    body: "Parent-teacher conferences are next Monday, April 28th. I've sent individual time slot confirmations via Messages. Looking forward to connecting with each family and sharing how much your students have grown this semester.",
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    reactions: [{ emoji: "❤️", count: 3, mine: false }, { emoji: "👏", count: 1, mine: false }],
    comments: [
      { id: "cm4", authorName: "David Chen", authorColor: "#6b8db5", body: "Thanks for the heads up! Looking forward to our slot.", time: "3 days ago" },
    ],
  },
];

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `Today at ${new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

const DEFAULT_EMOJIS = ["❤️", "👏", "😊", "👍"];

function FeedPage() {
  const [posts, setPosts] = useState<DemoFeedPost[]>(INITIAL_POSTS);
  const [filterTeacher, setFilterTeacher] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<DemoFeedPost | null>(null);
  const [composing, setComposing] = useState(false);
  const [draftBody, setDraftBody] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const livePost = selectedPost ? (posts.find((p) => p.id === selectedPost.id) ?? selectedPost) : null;

  const displayed = filterTeacher ? posts.filter((p) => p.authorId === filterTeacher) : posts;

  function toggleReaction(postId: string, emoji: string) {
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const existing = p.reactions.find((r) => r.emoji === emoji);
      let reactions: DemoReaction[];
      if (existing) {
        reactions = p.reactions
          .map((r) => r.emoji === emoji ? { ...r, count: r.mine ? r.count - 1 : r.count + 1, mine: !r.mine } : r)
          .filter((r) => r.count > 0);
      } else {
        reactions = [...p.reactions, { emoji, count: 1, mine: true }];
      }
      return { ...p, reactions };
    }));
  }

  function addComment(postId: string, body: string) {
    const newComment: DemoComment = {
      id: `c-${Date.now()}`, authorName: DEMO_TEACHER.name, authorColor: "#4a7c59", body, time: "Just now",
    };
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
  }

  function submitPost() {
    const body = draftBody.trim();
    if (!body) return;
    const newPost: DemoFeedPost = {
      id: `p-${Date.now()}`, authorName: DEMO_TEACHER.name, authorId: "t1", authorColor: "#4a7c59",
      body, createdAt: new Date().toISOString(), reactions: [], comments: [],
    };
    setPosts((prev) => [newPost, ...prev]);
    setDraftBody("");
    setComposing(false);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setSelectedPost(null); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex gap-6">
      {/* Teacher filter sidebar */}
      <aside className="w-44 shrink-0 flex flex-col gap-1 pt-1">
        <p className="text-xs font-semibold font-body text-gray-400 uppercase tracking-wider px-2 pb-2">Teachers</p>
        <button
          onClick={() => setFilterTeacher(null)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${filterTeacher === null ? "bg-[#4a7c59]/8 text-gray-800" : "text-gray-400 hover:text-gray-600 hover:bg-black/5"}`}
        >
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
            <span className="text-[10px] text-gray-500 font-bold">All</span>
          </div>
          <span className="text-sm font-body font-medium truncate">All Teachers</span>
        </button>
        {DEMO_TEACHERS_FEED.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilterTeacher(filterTeacher === t.id ? null : t.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${filterTeacher === t.id ? "bg-[#4a7c59]/8 text-gray-800" : "text-gray-400 hover:text-gray-600 hover:bg-black/5"}`}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0" style={{ backgroundColor: t.color }}>
              {initialsFrom(t.name)}
            </div>
            <span className="text-xs font-body font-medium truncate">{t.name.split(" ")[0]}</span>
          </button>
        ))}
      </aside>

      {/* Feed */}
      <div className="flex-1 min-w-0 max-w-2xl">
        {/* Compose bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#4a7c59] flex items-center justify-center text-white text-xs font-semibold font-body shrink-0 mt-0.5">
              {initialsFrom(DEMO_TEACHER.name)}
            </div>
            <div className="flex-1">
              {!composing ? (
                <button
                  onClick={() => setComposing(true)}
                  className="w-full text-left bg-gray-50 rounded-full px-4 py-2.5 border border-gray-100 text-sm font-body text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Share something with parents...
                </button>
              ) : (
                <div>
                  <textarea
                    autoFocus
                    value={draftBody}
                    onChange={(e) => setDraftBody(e.target.value)}
                    placeholder="What's happening in the classroom today?"
                    rows={3}
                    className="w-full bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 text-sm font-body text-gray-700 placeholder-gray-400 outline-none resize-none focus:border-[#4a7c59]/40 transition-colors"
                  />
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button onClick={() => { setComposing(false); setDraftBody(""); }} className="px-3 py-1.5 text-sm font-body text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">Cancel</button>
                    <button
                      onClick={submitPost}
                      disabled={!draftBody.trim()}
                      className="px-4 py-1.5 bg-[#4a7c59] text-white text-sm font-semibold font-body rounded-full hover:bg-[#3d6b4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="flex flex-col gap-4">
          {displayed.length === 0 ? (
            <p className="text-sm text-gray-400 font-body text-center py-12">No posts yet.</p>
          ) : displayed.map((post) => (
            <motion.div
              key={post.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setSelectedPost(post)}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:border-gray-200 transition-colors group"
            >
              <div className="flex items-start justify-between pt-5 px-5 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-semibold font-body" style={{ backgroundColor: post.authorColor }}>
                    {initialsFrom(post.authorName)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold font-body text-gray-800 leading-tight">{post.authorName}</p>
                    <p className="text-xs text-gray-400 font-body">Teacher · {timeAgo(post.createdAt)}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm font-body text-gray-700 leading-relaxed px-5 pb-4">{post.body}</p>

              <div className="px-5 pb-4 border-t border-gray-50 pt-3.5 flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_EMOJIS.map((emoji) => {
                    const r = post.reactions.find((rx) => rx.emoji === emoji);
                    return (
                      <button
                        key={emoji}
                        onClick={(e) => { e.stopPropagation(); toggleReaction(post.id, emoji); }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm border transition-colors cursor-pointer ${r?.mine ? "bg-[#4a7c59]/10 border-[#4a7c59]/30 text-[#4a7c59]" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}
                      >
                        <span>{emoji}</span>
                        {r && r.count > 0 && <span className="text-xs font-semibold">{r.count}</span>}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedPost(post); }}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#4a7c59] transition-colors font-body ml-3 shrink-0 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  {post.comments.length}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Post detail sidebar */}
      <AnimatePresence>
        {livePost && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 backdrop-blur-sm"
              style={{ background: "rgba(0,0,0,0.15)" }}
              onClick={() => setSelectedPost(null)}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] z-50 flex flex-col overflow-hidden bg-white border-l border-gray-100 shadow-xl"
            >
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                {/* Post header */}
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-semibold font-body" style={{ backgroundColor: livePost.authorColor }}>
                    {initialsFrom(livePost.authorName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold font-body text-gray-800">{livePost.authorName}</p>
                    <p className="text-xs text-gray-400 font-body">Teacher · {timeAgo(livePost.createdAt)}</p>
                  </div>
                  <button onClick={() => setSelectedPost(null)} className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm font-body text-gray-700 leading-relaxed">{livePost.body}</p>

                {/* Reactions */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold font-body text-gray-400 uppercase tracking-wide mb-3">Reactions</p>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_EMOJIS.map((emoji) => {
                      const r = livePost.reactions.find((rx) => rx.emoji === emoji);
                      return (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(livePost.id, emoji)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${r?.mine ? "bg-[#4a7c59]/10 border-[#4a7c59]/30 text-[#4a7c59]" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}
                        >
                          <span>{emoji}</span>
                          {r && r.count > 0 && <span className="text-xs font-semibold">{r.count}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comments */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold font-body text-gray-400 uppercase tracking-wide mb-4">Comments · {livePost.comments.length}</p>
                  <div className="flex flex-col gap-4">
                    {livePost.comments.map((c) => (
                      <div key={c.id} className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-[9px] font-bold font-body" style={{ backgroundColor: c.authorColor }}>
                          {initialsFrom(c.authorName)}
                        </div>
                        <div className="flex-1">
                          <div className="bg-[#eef4ef] rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                            <p className="text-xs font-semibold font-body text-gray-700 mb-0.5">{c.authorName}</p>
                            <p className="text-sm font-body text-gray-600 leading-relaxed">{c.body}</p>
                          </div>
                          <p className="text-xs text-gray-400 font-body mt-1 ml-1">{c.time}</p>
                        </div>
                      </div>
                    ))}
                    {livePost.comments.length === 0 && (
                      <p className="text-sm text-gray-400 font-body">No comments yet.</p>
                    )}
                  </div>
                </div>

                {/* Comment input */}
                <div className="border-t border-gray-100 pt-4 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#4a7c59] flex items-center justify-center text-white text-[9px] font-bold font-body shrink-0">
                    {initialsFrom(DEMO_TEACHER.name)}
                  </div>
                  <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3.5 py-2">
                    <input
                      type="text"
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { addComment(livePost.id, commentDraft.trim()); setCommentDraft(""); } }}
                      placeholder="Add a comment..."
                      className="flex-1 bg-transparent text-sm font-body text-gray-700 placeholder-gray-400 outline-none"
                    />
                    <button
                      onClick={() => { addComment(livePost.id, commentDraft.trim()); setCommentDraft(""); }}
                      disabled={!commentDraft.trim()}
                      className="text-[#4a7c59] hover:text-[#3d6b4a] transition-colors shrink-0 disabled:opacity-40 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Payroll Demo Data ────────────────────────────────────────────────────────

type DemoPayStub = {
  id: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number;
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
};

function grossPay(s: DemoPayStub) { return (s.regularHours * s.hourlyRate) + (s.overtimeHours * s.hourlyRate * 1.5); }
function totalDeductions(s: DemoPayStub) { return s.federalTax + s.stateTax + s.socialSecurity + s.medicare; }
function netPay(s: DemoPayStub) { return grossPay(s) - totalDeductions(s); }
function fmtUSD(n: number) { return "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function fmtDate(iso: string) { return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

const DEMO_PAY_STUBS: DemoPayStub[] = [
  { id: "ps1", periodStart: "2026-04-06", periodEnd: "2026-04-19", payDate: "2026-04-25", regularHours: 76, overtimeHours: 2, hourlyRate: 22.50, federalTax: 198.40, stateTax: 89.20, socialSecurity: 112.36, medicare: 26.28 },
  { id: "ps2", periodStart: "2026-03-23", periodEnd: "2026-04-05", payDate: "2026-04-11", regularHours: 80, overtimeHours: 0, hourlyRate: 22.50, federalTax: 202.10, stateTax: 90.80, socialSecurity: 111.60, medicare: 26.10 },
  { id: "ps3", periodStart: "2026-03-09", periodEnd: "2026-03-22", payDate: "2026-03-28", regularHours: 78, overtimeHours: 3, hourlyRate: 22.50, federalTax: 210.50, stateTax: 94.20, socialSecurity: 115.42, medicare: 27.00 },
  { id: "ps4", periodStart: "2026-02-23", periodEnd: "2026-03-08", payDate: "2026-03-14", regularHours: 80, overtimeHours: 0, hourlyRate: 22.50, federalTax: 202.10, stateTax: 90.80, socialSecurity: 111.60, medicare: 26.10 },
  { id: "ps5", periodStart: "2026-02-09", periodEnd: "2026-02-22", payDate: "2026-02-27", regularHours: 74, overtimeHours: 1, hourlyRate: 22.50, federalTax: 191.60, stateTax: 86.10, socialSecurity: 108.81, medicare: 25.46 },
  { id: "ps6", periodStart: "2026-01-26", periodEnd: "2026-02-08", payDate: "2026-02-13", regularHours: 80, overtimeHours: 0, hourlyRate: 22.50, federalTax: 202.10, stateTax: 90.80, socialSecurity: 111.60, medicare: 26.10 },
];

function PayrollPage() {
  const [selectedId, setSelectedId] = useState<string>(DEMO_PAY_STUBS[0].id);
  const selected = DEMO_PAY_STUBS.find((s) => s.id === selectedId) ?? DEMO_PAY_STUBS[0];

  const ytdGross = DEMO_PAY_STUBS.reduce((sum, s) => sum + grossPay(s), 0);
  const ytdDeductions = DEMO_PAY_STUBS.reduce((sum, s) => sum + totalDeductions(s), 0);
  const ytdNet = ytdGross - ytdDeductions;
  const lastNet = netPay(DEMO_PAY_STUBS[0]);

  const breakdown = [
    { label: "Regular Hours", value: `${selected.regularHours} hrs x ${fmtUSD(selected.hourlyRate)}`, amount: selected.regularHours * selected.hourlyRate, positive: true },
    { label: "Overtime Hours", value: `${selected.overtimeHours} hrs x ${fmtUSD(selected.hourlyRate * 1.5)}`, amount: selected.overtimeHours * selected.hourlyRate * 1.5, positive: true },
    { label: "Gross Pay", value: "", amount: grossPay(selected), positive: true, bold: true },
    { label: "Federal Income Tax", value: "", amount: -selected.federalTax, positive: false },
    { label: "State Income Tax", value: "", amount: -selected.stateTax, positive: false },
    { label: "Social Security", value: "", amount: -selected.socialSecurity, positive: false },
    { label: "Medicare", value: "", amount: -selected.medicare, positive: false },
    { label: "Total Deductions", value: "", amount: -totalDeductions(selected), positive: false, bold: true },
    { label: "Net Pay", value: "", amount: netPay(selected), positive: true, bold: true, highlight: true },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Next Pay Date", value: "May 2, 2026", sub: "in 12 days", accent: true },
          { label: "Last Net Pay", value: fmtUSD(lastNet), sub: `Paid ${fmtDate(DEMO_PAY_STUBS[0].payDate)}`, accent: false },
          { label: "YTD Earnings", value: fmtUSD(ytdNet), sub: `${fmtUSD(ytdGross)} gross`, accent: false },
        ].map(({ label, value, sub, accent }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
            className={`rounded-2xl border p-5 ${accent ? "bg-[#4a7c59]/5 border-[#4a7c59]/15" : "bg-white border-gray-100 shadow-sm"}`}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-2">{label}</p>
            <p className="text-2xl font-bold font-heading text-gray-800 leading-none">{value}</p>
            <p className="text-xs text-gray-400 font-body mt-1">{sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Pay stubs list */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }}
          className="w-72 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 font-body">Pay Stubs</h2>
            <span className="text-[11px] font-semibold font-body px-2 py-0.5 rounded-full bg-amber-50 text-amber-500 border border-amber-100">Coming soon</span>
          </div>
          <div className="flex flex-col">
            {DEMO_PAY_STUBS.map((s) => {
              const isSelected = s.id === selectedId;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left flex items-center gap-3 px-5 py-4 border-b border-gray-50 transition-all cursor-pointer relative ${isSelected ? "bg-[#4a7c59]/5" : "hover:bg-gray-50"}`}
                >
                  {isSelected && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#4a7c59]" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 font-body">
                      {fmtDate(s.periodStart)} – {new Date(s.periodEnd + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    <p className="text-[11px] text-gray-400 font-body mt-0.5">Paid {fmtDate(s.payDate)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold font-body ${isSelected ? "text-[#4a7c59]" : "text-gray-700"}`}>{fmtUSD(netPay(s))}</p>
                    <p className="text-[10px] text-gray-400 font-body">net</p>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Pay stub detail */}
        <motion.div
          key={selectedId}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
          className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold font-heading text-gray-800">Pay Stub</h2>
              <p className="text-sm text-gray-400 font-body mt-0.5">
                {fmtDate(selected.periodStart)} – {fmtDate(selected.periodEnd)} · Paid {fmtDate(selected.payDate)}
              </p>
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-body text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
              <ChevronDown className="w-4 h-4" />
              Download
            </button>
          </div>

          <div className="border border-gray-100 rounded-xl overflow-hidden">
            {breakdown.map(({ label, value, amount, positive, bold, highlight }) => (
              <div
                key={label}
                className={`flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0 ${highlight ? "bg-[#4a7c59]/5" : bold ? "bg-gray-50/60" : ""}`}
              >
                <div>
                  <p className={`text-sm font-body ${bold ? "font-semibold text-gray-800" : "text-gray-600"}`}>{label}</p>
                  {value && <p className="text-xs text-gray-400 font-body">{value}</p>}
                </div>
                <p className={`text-sm tabular-nums font-body ${bold ? "font-bold" : ""} ${highlight ? "text-[#4a7c59] text-base" : positive ? "text-gray-800" : "text-gray-500"}`}>
                  {amount < 0 ? `(${fmtUSD(Math.abs(amount))})` : fmtUSD(amount)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-3">Year-to-Date Summary</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Gross Earnings", value: fmtUSD(ytdGross) },
                { label: "Total Deductions", value: fmtUSD(ytdDeductions) },
                { label: "Net Earnings", value: fmtUSD(ytdNet) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                  <p className="text-[11px] text-gray-400 font-body mb-1">{label}</p>
                  <p className="text-sm font-semibold text-gray-800 font-body tabular-nums">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Forms & Documents Demo Data ──────────────────────────────────────────────

type DemoForm = { id: string; title: string; description: string; completed: boolean; signedDate: string | null };
type DemoDocument = { id: string; title: string; category: string; size: string };

const INITIAL_FORMS: DemoForm[] = [
  { id: "f1", title: "Direct Deposit Authorization", description: "Set up or update your direct deposit banking information.", completed: true, signedDate: "Jan 15, 2026" },
  { id: "f2", title: "W-4 Tax Withholding", description: "Federal tax withholding elections for the current year.", completed: true, signedDate: "Jan 15, 2026" },
  { id: "f3", title: "Employee Handbook Acknowledgement", description: "Confirm you have read and understood the staff handbook.", completed: true, signedDate: "Jan 16, 2026" },
  { id: "f4", title: "Emergency Contact Update", description: "Verify or update your emergency contact on file.", completed: false, signedDate: null },
  { id: "f5", title: "Technology Use Policy", description: "Acknowledge the school's acceptable use policy for devices.", completed: false, signedDate: null },
];

const DEMO_DOCUMENTS: DemoDocument[] = [
  { id: "d1", title: "Employee Handbook", category: "Policy", size: "2.4 MB" },
  { id: "d2", title: "Benefits Guide 2026", category: "Benefits", size: "1.1 MB" },
  { id: "d3", title: "PTO & Leave Policy", category: "Policy", size: "380 KB" },
  { id: "d4", title: "Payroll Schedule 2026", category: "Payroll", size: "120 KB" },
  { id: "d5", title: "School Calendar 2025–26", category: "Schedule", size: "540 KB" },
];

function FormsPage() {
  const [forms, setForms] = useState<DemoForm[]>(INITIAL_FORMS);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");

  const completed = forms.filter((f) => f.completed).length;
  const signingForm = forms.find((f) => f.id === signingId);

  function sign() {
    if (!signingId || !nameInput.trim()) return;
    setForms((prev) => prev.map((f) => f.id === signingId
      ? { ...f, completed: true, signedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }
      : f
    ));
    setSigningId(null);
    setNameInput("");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Required Forms */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-700 font-body">Required Forms</h2>
          <span className={`text-xs font-semibold font-body px-2.5 py-1 rounded-full ${completed === forms.length ? "bg-[#4a7c59]/10 text-[#4a7c59]" : "bg-amber-50 text-amber-500 border border-amber-100"}`}>
            {completed} of {forms.length} complete
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {forms.map((form) => (
            <div key={form.id} className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50">
              <div className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center border-2 ${form.completed ? "bg-[#4a7c59] border-[#4a7c59]" : "border-gray-300"}`}>
                {form.completed && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 font-body">{form.title}</p>
                <p className="text-xs text-gray-400 font-body mt-0.5">{form.description}</p>
              </div>
              <div className="shrink-0">
                {form.completed ? (
                  <span className="flex items-center gap-1 text-xs font-semibold font-body text-[#4a7c59] bg-[#4a7c59]/8 px-2.5 py-1 rounded-full">
                    Signed {form.signedDate}
                  </span>
                ) : (
                  <button
                    onClick={() => { setSigningId(form.id); setNameInput(""); }}
                    className="px-3.5 py-1.5 bg-[#4a7c59] text-white text-xs font-semibold font-body rounded-lg hover:bg-[#3d6b4a] transition-colors cursor-pointer"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Documents */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.08 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
      >
        <h2 className="text-lg font-semibold text-gray-700 font-body mb-5">Documents</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DEMO_DOCUMENTS.map((doc) => (
            <div key={doc.id} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-200 transition-all">
              <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 font-body leading-snug">{doc.title}</p>
                <p className="text-xs text-gray-400 font-body mt-0.5">{doc.category} · PDF · {doc.size}</p>
                <button className="mt-2 text-xs font-semibold font-body text-[#4a7c59] hover:text-[#3d6b4a] transition-colors cursor-pointer">
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Sign modal */}
      <AnimatePresence>
        {signingId && signingForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 flex items-center justify-center backdrop-blur-sm"
              style={{ background: "rgba(0,0,0,0.3)" }}
              onClick={() => setSigningId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md mx-4 p-6 pointer-events-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-800 font-body">Sign Form</h3>
                  <button onClick={() => setSigningId(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm font-semibold text-gray-700 font-body mb-1">{signingForm.title}</p>
                <p className="text-xs text-gray-400 font-body mb-5">{signingForm.description}</p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                  <p className="text-xs text-gray-500 font-body leading-relaxed">
                    By signing below, I confirm I have read and agree to the contents of this form. This constitutes my electronic signature.
                  </p>
                </div>
                <label className="block mb-1">
                  <span className="text-xs font-semibold text-gray-500 font-body">Type your full name to sign</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Jordan Taylor"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sign(); }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-body text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#4a7c59]/40 mb-4"
                />
                <div className="flex items-center gap-3">
                  <button onClick={() => setSigningId(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-body text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
                    Cancel
                  </button>
                  <button
                    onClick={sign}
                    disabled={!nameInput.trim()}
                    className="flex-1 px-4 py-2.5 bg-[#4a7c59] text-white rounded-xl text-sm font-semibold font-body hover:bg-[#3d6b4a] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Sign & Submit
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Nav Types ────────────────────────────────────────────────────────────────

type NavTab = "dashboard" | "students" | "hours" | "messages" | "calendar" | "feed" | "payroll" | "forms";

const PRIMARY_NAV: { label: string; icon: LucideIcon; tab: NavTab }[] = [
  { label: "Dashboard", icon: LayoutDashboard, tab: "dashboard" },
  { label: "My Students", icon: Users, tab: "students" },
  { label: "My Hours", icon: Clock, tab: "hours" },
  { label: "Messages", icon: MessageCircle, tab: "messages" },
  { label: "Calendar", icon: Calendar, tab: "calendar" },
  { label: "Feed", icon: Rss, tab: "feed" },
];

const MORE_NAV: { label: string; icon: LucideIcon; tab: NavTab }[] = [
  { label: "Payroll", icon: CreditCard, tab: "payroll" },
  { label: "Forms and Documents", icon: FileText, tab: "forms" },
];

// ─── Elapsed Timer ────────────────────────────────────────────────────────────

function ElapsedTimer({ clockInAt }: { clockInAt: Date }) {
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - clockInAt.getTime()) / 1000)
  );

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - clockInAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [clockInAt]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return <>{h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`}</>;
}

// ─── ClockWidget ──────────────────────────────────────────────────────────────

function ClockWidget({
  sessionsByDay,
  onClockIn,
  onClockOut,
}: {
  sessionsByDay: Record<string, DemoSession[]>;
  onClockIn: () => void;
  onClockOut: () => void;
}) {
  const today = new Date();
  const todaySessions = sessionsByDay[todayKey(today)] ?? [];
  const activeSession = Object.values(sessionsByDay).flat().find((s) => !s.clockOutAt) ?? null;
  const monday = getMondayOfWeek(today);
  const todayHours = getDayTotalHours(todaySessions);
  const weekTotal = getWeekTotalHours(monday, sessionsByDay);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 font-body">
          Clock
        </h2>
        <span
          className={`flex items-center gap-1.5 text-xs font-semibold font-body px-2.5 py-1 rounded-full ${
            activeSession ? "bg-[#4a7c59]/10 text-[#4a7c59]" : "bg-gray-100 text-gray-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              activeSession ? "bg-[#4a7c59] animate-pulse" : "bg-gray-300"
            }`}
          />
          {activeSession ? "Clocked In" : "Not Clocked In"}
        </span>
      </div>

      <div
        className={`rounded-xl px-5 py-4 ${
          activeSession
            ? "bg-[#4a7c59]/5 border border-[#4a7c59]/15"
            : "bg-gray-50 border border-gray-100"
        }`}
      >
        {activeSession ? (
          <div>
            <p className="text-3xl font-bold font-heading text-gray-800 leading-none mb-1">
              <ElapsedTimer clockInAt={activeSession.clockInAt} />
            </p>
            <p className="text-xs text-gray-400 font-body">
              Since {fmt12(activeSession.clockInAt)}
            </p>
          </div>
        ) : todayHours > 0 ? (
          <div>
            <p className="text-3xl font-bold font-heading text-gray-800 leading-none mb-1">
              {formatDuration(todayHours)}
            </p>
            <p className="text-xs text-gray-400 font-body">
              Logged today · clock in again to add more
            </p>
          </div>
        ) : (
          <div>
            <p className="text-3xl font-bold font-heading text-gray-300 leading-none mb-1">
              0h
            </p>
            <p className="text-xs text-gray-400 font-body">
              Clock in to start tracking
            </p>
          </div>
        )}
      </div>

      {activeSession ? (
        <button
          onClick={onClockOut}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 font-semibold font-body text-sm rounded-xl hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Clock Out
        </button>
      ) : (
        <button
          onClick={onClockIn}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#4a7c59] text-white font-semibold font-body text-sm rounded-xl hover:bg-[#3d6b4a] transition-colors shadow-sm cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          Clock In
        </button>
      )}

      <div className="flex items-center gap-3 pt-1">
        <div className="flex-1 rounded-lg bg-gray-50 border border-gray-100 px-4 py-2.5 text-center">
          <p className="text-[11px] text-gray-400 font-body mb-0.5">Today</p>
          <p className="text-sm font-semibold text-gray-700 font-body tabular-nums">
            {formatDuration(activeSession ? getDayTotalHours(todaySessions) : todayHours)}
          </p>
        </div>
        <div className="flex-1 rounded-lg bg-gray-50 border border-gray-100 px-4 py-2.5 text-center">
          <p className="text-[11px] text-gray-400 font-body mb-0.5">This Week</p>
          <p className="text-sm font-semibold text-gray-700 font-body tabular-nums">
            {formatDuration(weekTotal)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Upcoming Events ──────────────────────────────────────────────────────────

function UpcomingEventsCard({
  events,
  expandedId,
  onToggle,
}: {
  events: DemoCalendarEvent[];
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.05 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4"
    >
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-gray-400" />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 font-body">
          Upcoming Events
        </h2>
      </div>

      <div className="flex flex-col gap-2">
        {events.map((event) => {
          const accent = event.color ?? "#4a7c59";
          const isExpanded = expandedId === event.id;
          return (
            <div
              key={event.id}
              className="relative rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:border-gray-200 transition-colors"
              onClick={() => onToggle(event.id)}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: accent }}
              />
              <div className="pl-4 pr-3 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-400 font-body mb-0.5">
                      {formatEventDate(event)}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 font-body leading-snug">
                      {event.title}
                    </p>
                    {event.category && (
                      <span
                        className="inline-block mt-1.5 text-[11px] font-semibold font-body px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: accent + "22", color: accent }}
                      >
                        {event.category}
                      </span>
                    )}
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-gray-300 shrink-0 mt-1 transition-transform duration-200 ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 mt-3 border-t border-gray-100 flex flex-col gap-2">
                        {event.description && (
                          <p className="text-xs text-gray-500 font-body leading-relaxed">
                            {event.description}
                          </p>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-gray-300 shrink-0" />
                            <p className="text-xs text-gray-400 font-body">{event.location}</p>
                          </div>
                        )}
                        {event.attachment_links && event.attachment_links.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Paperclip className="w-3 h-3 text-gray-300 shrink-0" />
                            <p className="text-xs text-gray-400 font-body">
                              {event.attachment_links.length} attachment
                              {event.attachment_links.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Weekly Hours Chart ───────────────────────────────────────────────────────

function WeeklyHoursChart({ sessionsByDay }: { sessionsByDay: Record<string, DemoSession[]> }) {
  const today = new Date();
  const currentTodayKey = todayKey(today);
  const monday = getMondayOfWeek(today);
  const weekDays = getWeekDays(monday);

  const weekDayData = weekDays.map((d) => ({
    date: d,
    key: todayKey(d),
    hours: getDayTotalHours(sessionsByDay[todayKey(d)] ?? []),
  }));

  const maxDayHours = Math.max(...weekDayData.map((d) => d.hours), 0.1);

  const fri = new Date(monday);
  fri.setDate(monday.getDate() + 4);
  const weekLabel = `${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${fri.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.1 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 font-body">
            Weekly Hours
          </h2>
        </div>
        <span className="text-xs text-gray-400 font-body">{weekLabel}</span>
      </div>

      <div className="flex items-end gap-3 h-28">
        {weekDayData.map(({ date, key, hours }) => {
          const isToday = key === currentTodayKey;
          const isFuture = key > currentTodayKey;
          const pct = hours > 0 ? (hours / maxDayHours) * 100 : 0;

          return (
            <div key={key} className="flex flex-col items-center gap-1.5 flex-1 group relative">
              {hours > 0 && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] font-body px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {formatDuration(hours)}
                </div>
              )}
              <div className="w-full flex items-end h-20">
                <div
                  className={`w-full rounded-t-md transition-all duration-500 min-h-[4px] ${
                    isToday
                      ? "bg-[#4a7c59]"
                      : !isFuture && hours > 0
                      ? "bg-[#4a7c59]/40"
                      : "bg-gray-100"
                  }`}
                  style={{ height: `${Math.max(pct, 4)}%` }}
                />
              </div>
              <p
                className={`text-[11px] font-semibold font-body ${
                  isToday ? "text-[#4a7c59]" : "text-gray-400"
                }`}
              >
                {date.toLocaleDateString("en-US", { weekday: "short" })}
              </p>
              {isToday && <span className="w-1 h-1 rounded-full bg-[#4a7c59]" />}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Payroll Card ─────────────────────────────────────────────────────────────

function PayrollCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.15 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Banknote className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 font-body">
            Payroll
          </h2>
        </div>
        <span className="text-[11px] font-semibold font-body px-2.5 py-1 rounded-full bg-amber-50 text-amber-500 border border-amber-100">
          Coming soon
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-xl bg-[#4a7c59]/5 border border-[#4a7c59]/10 px-4 py-3.5">
          <p className="text-[11px] text-gray-400 font-body mb-1">Next Payroll</p>
          <p className="text-base font-semibold text-gray-800 font-body">May 2, 2026</p>
          <p className="text-[11px] text-gray-400 font-body mt-0.5">in 12 days</p>
        </div>
        <div className="flex-1 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3.5">
          <p className="text-[11px] text-gray-400 font-body mb-1">Last Paid</p>
          <p className="text-base font-semibold text-gray-800 font-body">Apr 18, 2026</p>
          <p className="text-[11px] text-gray-400 font-body mt-0.5">2 weeks ago</p>
        </div>
      </div>

      <p className="text-xs text-gray-300 font-body">
        Full payroll details and history will be available here soon.
      </p>
    </motion.div>
  );
}

// ─── Coming Soon Placeholder ──────────────────────────────────────────────────

function ComingSoonPage({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
        <Clock className="w-5 h-5 text-gray-300" />
      </div>
      <p className="text-sm font-semibold text-gray-400 font-body">{label}</p>
      <p className="text-xs text-gray-300 font-body">Coming in the next demo update</p>
    </div>
  );
}

// ─── TeacherNav (state-driven, no router) ─────────────────────────────────────

function TeacherNav({
  activeTab,
  onTabChange,
}: {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [moreOpen]);

  return (
    <nav className="flex items-center gap-2">
      {PRIMARY_NAV.map(({ label, icon: Icon, tab }) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-body rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              isActive
                ? "text-[#4a7c59] bg-[#4a7c59]/8 font-semibold"
                : "text-gray-600 hover:text-[#4a7c59] hover:bg-gray-50"
            }`}
          >
            <Icon className="w-4 h-4 pointer-events-none" />
            {label}
          </button>
        );
      })}

      <div className="relative" ref={moreRef}>
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-body text-gray-600 hover:text-[#4a7c59] hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
        >
          More
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`}
            strokeWidth={2.5}
          />
        </button>

        {moreOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 mt-1.5 w-52 bg-white border border-gray-100 rounded-xl shadow-sm z-50 py-1.5">
            {MORE_NAV.map(({ label, icon: Icon, tab }) => (
              <button
                key={tab}
                onClick={() => {
                  onTabChange(tab);
                  setMoreOpen(false);
                }}
                className="flex items-center gap-1.5 w-full text-left px-4 py-2 text-sm font-body text-gray-700 hover:bg-gray-50 hover:text-[#4a7c59] transition-colors cursor-pointer"
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

// ─── Main Demo Component ──────────────────────────────────────────────────────

export default function TeacherDashboardDemo() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [sessionsByDay, setSessionsByDay] = useState<Record<string, DemoSession[]>>(
    buildInitialSessions
  );
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [bannerIndex, setBannerIndex] = useState(() =>
    Math.floor(Math.random() * BANNER_IMAGES.length),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((i) => (i + 1) % BANNER_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  function handleClockIn() {
    const now = new Date();
    const key = todayKey(now);
    const newSession: DemoSession = {
      id: `demo-${Date.now()}`,
      clockInAt: now,
      clockOutAt: null,
      note: "",
    };
    setSessionsByDay((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), newSession],
    }));
  }

  function handleClockOut() {
    const activeSession = Object.values(sessionsByDay).flat().find((s) => !s.clockOutAt);
    if (!activeSession) return;
    const key = todayKey(activeSession.clockInAt);
    const clockOutAt = new Date();
    setSessionsByDay((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).map((s) =>
        s.id === activeSession.id ? { ...s, clockOutAt } : s
      ),
    }));
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] font-body">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
          {/* Logo */}
          <div className="shrink-0">
            <Image
              src="/assets/Logo.png"
              alt="Sage Field"
              width={96}
              height={32}
              className="h-7 w-auto object-contain"
            />
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <TeacherNav activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Profile avatar */}
          <div className="shrink-0 w-8 h-8 rounded-full bg-[#4a7c59] flex items-center justify-center cursor-pointer">
            <span className="text-white text-xs font-semibold font-body">
              {DEMO_TEACHER.initials}
            </span>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === "dashboard" && (
          <div className="flex flex-col gap-6">
            {/* Banner slideshow */}
            <motion.div
              initial={{ opacity: 0, scale: 1.01 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative h-44 rounded-2xl overflow-hidden shadow-sm"
            >
              <AnimatePresence initial={false}>
                <motion.div
                  key={bannerIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={BANNER_IMAGES[bannerIndex]}
                    alt=""
                    fill
                    className="object-cover"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-black/45" />

              {/* Dot indicators */}
              <div className="absolute bottom-3 right-5 flex gap-1.5">
                {BANNER_IMAGES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setBannerIndex(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      i === bannerIndex ? "bg-white scale-125" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>

              <div className="absolute inset-0 flex flex-col justify-end px-7 pb-6">
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                  className="text-white/70 text-sm font-body mb-1"
                >
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="text-white text-3xl font-bold font-heading leading-tight"
                >
                  Welcome, {DEMO_TEACHER.name.split(" ")[0]}.
                </motion.h1>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ClockWidget
                sessionsByDay={sessionsByDay}
                onClockIn={handleClockIn}
                onClockOut={handleClockOut}
              />
              <UpcomingEventsCard
                events={DEMO_EVENTS}
                expandedId={expandedEventId}
                onToggle={(id) => setExpandedEventId((prev) => (prev === id ? null : id))}
              />
            </div>

            <WeeklyHoursChart sessionsByDay={sessionsByDay} />
            <PayrollCard />
          </div>
        )}

        {activeTab === "students" && <MyStudentsSection />}

        {activeTab === "hours" && <HoursPage />}

        {activeTab === "messages" && <MessagesPage />}

        {activeTab === "calendar" && <CalendarPage />}

        {activeTab === "feed" && <FeedPage />}

        {activeTab === "payroll" && <PayrollPage />}

        {activeTab === "forms" && <FormsPage />}

        {activeTab !== "dashboard" && activeTab !== "students" && activeTab !== "hours" && activeTab !== "messages" && activeTab !== "calendar" && activeTab !== "feed" && activeTab !== "payroll" && activeTab !== "forms" && (
          <ComingSoonPage
            label={
              PRIMARY_NAV.find((n) => n.tab === activeTab)?.label ??
              MORE_NAV.find((n) => n.tab === activeTab)?.label ??
              activeTab
            }
          />
        )}
      </main>
    </div>
  );
}
