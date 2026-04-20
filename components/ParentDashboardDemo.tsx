"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText, Users, CreditCard, MessageCircle, Calendar,
  Rss, Heart, Phone, HelpCircle, ChevronDown, ChevronLeft,
  ChevronRight, Check, X, Plus, Trash2, Upload, ClipboardCheck,
  Pill, ShieldCheck, Camera, AlertTriangle, UserPlus, PenLine,
  CheckCircle, Clock, Mail, Copy, BookOpen, ClipboardList,
  Send, Paperclip, Image, Download, Smile, MessageSquare,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type ChildId = "emma" | "jake";
type NavTab = "enrollment" | "children" | "billing" | "messages" | "calendar" | "feed" | "forms" | "volunteer" | "emergency-contacts";
type ModalId = null | "contract-1" | "contract-2" | "health-form" | "medication-plan" | "immunization" | "photo-release" | "assumption-of-risk" | "authorized-pickup" | "health-statement" | "registration-fee";
type ChildDetailTab = "teacher" | "attendance" | "learning" | "profile";

interface DemoMedication { id: string; name: string; condition: string; dosage: string; }
interface DemoAuthorizedPerson { id: string; name: string; relationship: string; phone: string; }
interface DemoMessage { id: string; senderId: string; text: string; time: string; }
interface DemoConversation { id: string; name: string; role: string; lastMsg: string; lastTime: string; unread: number; color: string; }
interface DemoEvent { id: string; title: string; date: string; time?: string; category: string; color: string; description: string; program: "summer" | "school-year"; }
interface DemoPost { id: string; author: string; role: string; time: string; text: string; color: string; }
interface DemoTransaction { id: string; desc: string; amount: string; date: string; status: "paid" | "pending"; childId: ChildId; }
interface DemoContact { label: string; name: string; relationship: string; phone: string; email: string; }
interface DemoAttendance { date: string; checkIn: string; checkOut: string; }
interface DemoLearningNote { date: string; note: string; }

// ─── DEMO DATA ────────────────────────────────────────────────────────────────

const DEMO_CHILDREN = {
  emma: {
    id: "emma" as ChildId,
    name: "Emma Mitchell",
    grade: "Elementary",
    dob: "March 12, 2017",
    allergies: "Tree nuts, mild seasonal pollen",
    notes: "Loves art and outdoor activities. Thrives with visual learning approaches.",
    initials: "EM",
    color: "#7FA888",
    teachers: [
      { name: "Ms. Taylor Reyes", role: "Lead Teacher", email: "taylor@sagefield.co" },
      { name: "Ms. Nicole Park", role: "Co-Teacher", email: "nicole@sagefield.co" },
    ],
  },
  jake: {
    id: "jake" as ChildId,
    name: "Jake Mitchell",
    grade: "Pre-K",
    dob: "August 5, 2020",
    allergies: "None known",
    notes: "Very social and energetic. Enjoys music and movement-based activities.",
    initials: "JM",
    color: "#f29a8f",
    teachers: [
      { name: "Ms. Paige Sun", role: "Lead Teacher", email: "paige@sagefield.co" },
    ],
  },
};

const ATTENDANCE_DATA: DemoAttendance[] = [
  { date: "Apr 18, 2026", checkIn: "8:12 AM", checkOut: "3:05 PM" },
  { date: "Apr 17, 2026", checkIn: "8:20 AM", checkOut: "3:10 PM" },
  { date: "Apr 16, 2026", checkIn: "8:08 AM", checkOut: "3:00 PM" },
  { date: "Apr 15, 2026", checkIn: "8:15 AM", checkOut: "3:07 PM" },
  { date: "Apr 14, 2026", checkIn: "8:22 AM", checkOut: "3:15 PM" },
];

const LEARNING_NOTES: DemoLearningNote[] = [
  { date: "Apr 18, 2026", note: "Showed strong focus during the watercolor project — completed a full piece independently and helped a peer mix colors." },
  { date: "Apr 14, 2026", note: "Excellent participation during morning circle. Asked thoughtful questions about the plant life cycle unit." },
  { date: "Apr 10, 2026", note: "Made great progress on reading fluency. Read two pages aloud with confidence and correct pacing." },
  { date: "Apr 7, 2026", note: "Collaborated well in the small group math activity. Demonstrated solid understanding of skip counting." },
];

const DEMO_CONVERSATIONS: DemoConversation[] = [
  { id: "c1", name: "Ms. Taylor Reyes", role: "Lead Teacher", lastMsg: "Emma did wonderfully in today's project!", lastTime: "2m ago", unread: 2, color: "#7FA888" },
  { id: "c2", name: "Ms. Nicole Park", role: "Co-Teacher", lastMsg: "Just a reminder about the field trip form.", lastTime: "Yesterday", unread: 0, color: "#97C09B" },
  { id: "c3", name: "Sage Field Office", role: "Admin", lastMsg: "Your enrollment checklist is almost complete.", lastTime: "Apr 17", unread: 1, color: "#4A6354" },
];

const DEMO_THREADS: Record<string, DemoMessage[]> = {
  c1: [
    { id: "m1", senderId: "teacher", text: "Hi Sarah! Just wanted to share that Emma had a wonderful day today.", time: "9:02 AM" },
    { id: "m2", senderId: "parent", text: "That's so great to hear, thank you!", time: "9:15 AM" },
    { id: "m3", senderId: "teacher", text: "She was especially engaged during our watercolor session this morning.", time: "9:17 AM" },
    { id: "m4", senderId: "parent", text: "She loves painting at home too. I'm so glad she's getting to do that at school.", time: "9:20 AM" },
    { id: "m5", senderId: "teacher", text: "Emma did wonderfully in today's project!", time: "10:45 AM" },
  ],
  c2: [
    { id: "m1", senderId: "teacher", text: "Hello! I wanted to reach out about next week's nature walk.", time: "Yesterday 2:00 PM" },
    { id: "m2", senderId: "parent", text: "Oh of course! What do we need to bring?", time: "Yesterday 3:30 PM" },
    { id: "m3", senderId: "teacher", text: "Just a reminder about the field trip form.", time: "Yesterday 4:00 PM" },
  ],
  c3: [
    { id: "m1", senderId: "teacher", text: "Hi Sarah, your enrollment checklist is almost complete. Just a few items remaining!", time: "Apr 17" },
    { id: "m2", senderId: "parent", text: "Thanks for the reminder, I'll get to those tonight.", time: "Apr 17" },
    { id: "m3", senderId: "teacher", text: "Your enrollment checklist is almost complete.", time: "Apr 17" },
  ],
};

const DEMO_EVENTS: DemoEvent[] = [
  { id: "e1", title: "First Day of Summer Session", date: "2026-06-15", time: "8:00 AM", category: "School", color: "#7FA888", description: "Welcome to Summer 2026! Drop-off begins at 7:45 AM.", program: "summer" },
  { id: "e2", title: "Nature Walk — Local Trail", date: "2026-06-18", time: "9:00 AM", category: "Field Trip", color: "#f29a8f", description: "Students will explore the nature trail. Please pack sunscreen and a water bottle.", program: "summer" },
  { id: "e3", title: "Art Showcase", date: "2026-06-24", time: "4:00 PM", category: "Event", color: "#97C09B", description: "Families are invited to view the students' artwork from week 1.", program: "summer" },
  { id: "e4", title: "No School — July 4th", date: "2026-07-04", category: "Holiday", color: "#CBD5E1", description: "School closed for Independence Day.", program: "summer" },
  { id: "e5", title: "Parent-Teacher Connections", date: "2026-07-09", time: "3:30 PM", category: "Meeting", color: "#4A6354", description: "Optional 15-minute check-ins with lead teachers. Sign up in advance.", program: "summer" },
  { id: "e6", title: "Water Play Day", date: "2026-07-14", time: "10:00 AM", category: "Activity", color: "#BAE1FF", description: "Please send your child in a swimsuit with a change of clothes and towel.", program: "summer" },
  { id: "e7", title: "Last Day of Summer Session", date: "2026-08-14", time: "8:00 AM", category: "School", color: "#7FA888", description: "Celebration day! Early pickup at 1:00 PM.", program: "summer" },
  { id: "e8", title: "Back to School Night", date: "2026-09-01", time: "6:00 PM", category: "Event", color: "#4A6354", description: "Meet your child's teachers and tour the classrooms.", program: "school-year" },
  { id: "e9", title: "First Day — School Year", date: "2026-09-08", time: "8:00 AM", category: "School", color: "#7FA888", description: "First day of the 2026–2027 school year!", program: "school-year" },
];

const DEMO_POSTS: DemoPost[] = [
  { id: "p1", author: "Ms. Taylor Reyes", role: "Lead Teacher", time: "2 hours ago", color: "#7FA888", text: "What an incredible morning! The students dove into our new plant life cycle unit with so much curiosity. We planted bean seeds and each child made a prediction about what would happen first — roots or a sprout. Can't wait to watch these grow! 🌱" },
  { id: "p2", author: "Ms. Nicole Park", role: "Co-Teacher", time: "Yesterday", color: "#97C09B", text: "Our watercolor session today was magical. The children mixed colors with such intention and care. We talked about how colors can show feelings — blues for calm, yellows for joy. The finished pieces are hanging in the hallway." },
  { id: "p3", author: "Sage Field Office", role: "Admin", time: "Apr 17", color: "#4A6354", text: "Reminder: Summer 2026 enrollment is now open for siblings of current students. Early enrollment closes April 30. Please complete your checklist to secure your spot!" },
  { id: "p4", author: "Ms. Taylor Reyes", role: "Lead Teacher", time: "Apr 15", color: "#7FA888", text: "We wrapped up our community helpers theme with a visit from a local librarian! Students got to ask questions and even check out a book to bring home. Thank you to everyone who donated books to our classroom library this month." },
];

const DEMO_SEED_COMMENTS: Record<string, string[]> = {
  p1: ["So sweet! Emma came home talking about her bean seed 🌱", "Love this! Jake was so excited too."],
  p2: ["The painting is hanging on our fridge already ❤️"],
  p3: [],
  p4: ["What a great experience! Thank you for arranging this."],
};

const DEMO_SEED_REACTIONS: Record<string, string[]> = {
  p1: ["❤️", "🌱"],
  p2: ["❤️", "😊"],
  p3: [],
  p4: ["❤️", "👏"],
};

const DEMO_TRANSACTIONS: DemoTransaction[] = [
  { id: "t1", desc: "Registration Fee — Emma Mitchell", amount: "$75.00", date: "Mar 15, 2026", status: "paid", childId: "emma" },
  { id: "t2", desc: "Summer Tuition — Week 1 (Jun 15–19)", amount: "$375.00", date: "Jun 1, 2026", status: "pending", childId: "emma" },
  { id: "t3", desc: "Summer Tuition — Week 2 (Jun 22–26)", amount: "$375.00", date: "Jun 8, 2026", status: "pending", childId: "emma" },
  { id: "t4", desc: "After-Care — April", amount: "$180.00", date: "Apr 1, 2026", status: "paid", childId: "emma" },
  { id: "t5", desc: "Registration Fee — Jake Mitchell", amount: "$75.00", date: "Apr 10, 2026", status: "pending", childId: "jake" },
];

const SUMMER_WEEKS = [
  { week: 1, dates: "Jun 15–19", theme: "Plants & Growing Things" },
  { week: 2, dates: "Jun 22–26", theme: "Water & Weather" },
  { week: 3, dates: "Jun 29–Jul 3", theme: "Community Helpers" },
  { week: 4, dates: "Jul 7–11", theme: "Animals & Habitats" },
  { week: 5, dates: "Jul 14–18", theme: "Art & Expression" },
  { week: 6, dates: "Jul 21–25", theme: "Space & Stars" },
];

const DEMO_CONTACTS: Record<ChildId, DemoContact[]> = {
  emma: [
    { label: "School Contact", name: "Sage Field Office", relationship: "School", phone: "(555) 200-1234", email: "hello@sagefield.co" },
    { label: "Parent — Mom", name: "Sarah Mitchell", relationship: "Mother", phone: "(555) 301-4567", email: "sarah.mitchell@email.com" },
    { label: "Parent — Dad", name: "Daniel Mitchell", relationship: "Father", phone: "(555) 301-7890", email: "daniel.mitchell@email.com" },
    { label: "Emergency Contact 1", name: "Linda Torres", relationship: "Grandmother", phone: "(555) 412-3344", email: "linda.torres@email.com" },
  ],
  jake: [
    { label: "School Contact", name: "Sage Field Office", relationship: "School", phone: "(555) 200-1234", email: "hello@sagefield.co" },
    { label: "Parent — Mom", name: "Sarah Mitchell", relationship: "Mother", phone: "(555) 301-4567", email: "sarah.mitchell@email.com" },
    { label: "Parent — Dad", name: "Daniel Mitchell", relationship: "Father", phone: "(555) 301-7890", email: "daniel.mitchell@email.com" },
    { label: "Emergency Contact 1", name: "Linda Torres", relationship: "Grandmother", phone: "(555) 412-3344", email: "linda.torres@email.com" },
  ],
};

const C1_SECTIONS = [
  { id: "1-1", title: "1. Program Description & Schedule", body: "Sage Field Private School offers a nature-centered, play-based learning environment for Pre-K through Elementary students. Our program runs Monday through Friday, 8:00 AM to 3:00 PM, with optional after-care until 5:30 PM. Students participate in outdoor learning, project-based study, and community-focused activities aligned with each season." },
  { id: "1-2", title: "2. Tuition & Payment Policy", body: "Tuition is due on the first of each month. A 5-day grace period is provided. Accounts more than 10 days past due may result in a temporary enrollment hold. Families experiencing hardship are encouraged to contact the director to discuss payment arrangements. All fees are non-refundable once the program month has begun." },
  { id: "1-3", title: "3. Health & Wellness Standards", body: "Students must be symptom-free for 24 hours before returning to school after illness. Please do not send your child with fever, vomiting, or signs of a communicable illness. The school follows local public health guidance and may require additional protocols during community health events. Up-to-date immunization records or an approved exemption must be on file." },
  { id: "1-4", title: "4. Acknowledgment & Agreement", body: "By signing below, I confirm that I have read and understand all sections of the Program Description and Key Policies document. I agree to the terms outlined herein and commit to supporting the Sage Field community through my participation, communication, and adherence to the policies described." },
];

const C2_SECTIONS = [
  { id: "2-1", title: "1. Core Commitments", body: "As a member of the Sage Field community, I commit to treating all students, staff, and families with dignity and respect. I will communicate concerns directly and constructively through appropriate channels, maintain confidentiality about individual children and families, and actively support a culture of inclusion, curiosity, and kindness." },
  { id: "2-2", title: "2. Respectful Communication", body: "I agree to address disagreements or concerns calmly and directly with the appropriate staff member. I will refrain from posting negative or identifying comments about students, families, or staff on social media or other public platforms. I understand that repeated or serious violations of community communication standards may result in a required meeting with the director." },
  { id: "2-3", title: "3. Acknowledgment", body: "By signing below, I confirm that I have read and agree to uphold the Sage Field Community Agreement for the duration of my child's enrollment. I understand that this agreement exists to protect the safety, wellbeing, and dignity of every member of our school community." },
];

const C5_SECTIONS = [
  { id: "5-1", title: "1. Permission to Photograph & Record", body: "I, the undersigned parent or legal guardian, hereby grant Sage Field Private School permission to photograph, video record, and otherwise capture images or likenesses of my child during school activities, programs, field trips, events, and related educational experiences." },
  { id: "5-2", title: "2. Scope of Use", body: "All photographs, videos, and other media captured by Sage Field staff are the property of Sage Field Private School. The School may edit, crop, or enhance media for use in materials including the website, social media, newsletters, and print publications. The School will not sell images to third parties." },
  { id: "5-3", title: "3. Parent/Guardian Acknowledgment", body: "By signing below, I confirm my selected consent level and release Sage Field Private School from any claims arising from the use of photographs or recordings of my child as described in this agreement. This release remains in effect for the duration of enrollment unless revoked in writing." },
];

const C6_SECTIONS = [
  { id: "6-1", title: "Releasor Acknowledgment & Signature", body: "I, the undersigned parent or legal guardian, acknowledge that participation in Sage Field Private School programs involves inherent risks including but not limited to outdoor and nature-based activities, physical movement, and field excursions. I voluntarily assume all such risks and release Sage Field Private School, its directors, staff, and volunteers from any liability for injury or loss arising from participation in school activities. I have read this agreement in full and sign voluntarily." },
];

const C7_SECTIONS = [
  { id: "7-1", title: "Authorization Statement", body: "I authorize the individuals listed above to pick up my child from Sage Field Private School on my behalf. I understand that school staff may request photo identification from any authorized pickup person and that this list supersedes any prior pickup authorization on file. I accept full responsibility for ensuring that all listed individuals are aware of and agree to comply with school pickup procedures." },
];

const C8_SECTIONS = [
  { id: "8-1", title: "Parent/Guardian Signature", body: "By signing below, I certify that the information provided in this Health Statement is accurate and complete to the best of my knowledge. I understand that Sage Field Private School requires this documentation to ensure the health and safety of all enrolled students and that any changes to my child's health status should be reported to the school promptly." },
];

// ─── SHARED SUB-COMPONENTS ───────────────────────────────────────────────────

function Avatar({ initials, color, size = "md" }: { initials: string; color: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-9 h-9 text-sm";
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`} style={{ backgroundColor: color }}>
      {initials}
    </div>
  );
}

function SignatureBlock({ sectionKey, parentName, sigs, onSign }: {
  sectionKey: string; parentName: string; sigs: Record<string, string>; onSign: (key: string, name: string) => void;
}) {
  const [nameInput, setNameInput] = useState(parentName);
  const [editing, setEditing] = useState(false);
  const signed = sigs[sectionKey];

  if (signed && !editing) {
    return (
      <div className="mt-4 border border-emerald-200 rounded-xl bg-emerald-50 p-4">
        <p className="text-xs text-emerald-600 font-medium mb-1">Signed</p>
        <p className="text-2xl text-emerald-700" style={{ fontFamily: "'Georgia', cursive", fontStyle: "italic" }}>{signed}</p>
        <button onClick={() => setEditing(true)} className="mt-2 text-xs text-emerald-600 underline cursor-pointer">Edit</button>
      </div>
    );
  }

  return (
    <div className="mt-4 border border-gray-200 rounded-xl bg-gray-50 p-4">
      <p className="text-xs text-gray-500 font-medium mb-2">Parent / Guardian Signature</p>
      <input
        type="text"
        value={nameInput}
        onChange={e => setNameInput(e.target.value)}
        placeholder="Type your full name"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-[#4a7c59] mb-3"
      />
      <button
        disabled={!nameInput.trim()}
        onClick={() => { onSign(sectionKey, nameInput.trim()); setEditing(false); }}
        className="px-4 py-1.5 rounded-lg text-sm font-medium bg-[#4a7c59] text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-opacity"
      >
        Click to Sign
      </button>
    </div>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className="h-2 rounded-full bg-[#4a7c59] transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

function ModalShell({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh] ${wide ? "max-w-2xl" : "max-w-lg"}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-800 text-base">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── ENROLLMENT MODALS ───────────────────────────────────────────────────────

function ContractModal({ contractId, sections, title, sigs, onSign, onClose }: {
  contractId: string; sections: { id: string; title: string; body: string }[]; title: string;
  sigs: Record<string, string>; onSign: (k: string, n: string) => void; onClose: () => void;
}) {
  const signed = sections.filter(s => sigs[s.id]).length;
  return (
    <ModalShell title={title} onClose={onClose} wide>
      <p className="text-xs text-gray-400 mb-4">{signed} of {sections.length} sections signed</p>
      <div className="space-y-6">
        {sections.map(s => (
          <div key={s.id} className="border border-gray-100 rounded-xl p-4">
            <h3 className="font-semibold text-gray-700 text-sm mb-2">{s.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
            <SignatureBlock sectionKey={s.id} parentName="Sarah Mitchell" sigs={sigs} onSign={onSign} />
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

function HealthFormModal({ sigs, onSign, onClose, saved, onSave }: {
  sigs: Record<string, string>; onSign: (k: string, n: string) => void; onClose: () => void; saved: boolean; onSave: () => void;
}) {
  const [form, setForm] = useState({ ec1Name: "Linda Torres", ec1Phone: "(555) 412-3344", ec1Rel: "Grandmother", physician: "Dr. Karen Osei", clinic: "Greenview Pediatrics", physicianPhone: "(555) 900-2200", insurance: "BlueCross BlueShield", policyNum: "BCB-4492817", hospital: "St. Mary's Medical Center" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  return (
    <ModalShell title="Emergency Contact, Health & Immunization Form" onClose={onClose} wide>
      <div className="space-y-5">
        <div className="bg-sage-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Emergency Contact</p>
          <div className="grid grid-cols-2 gap-3">
            {[["Name", "ec1Name"], ["Relationship", "ec1Rel"], ["Phone", "ec1Phone"]].map(([label, key]) => (
              <div key={key} className={key === "ec1Name" ? "col-span-2" : ""}>
                <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                <input value={form[key as keyof typeof form]} onChange={set(key as keyof typeof form)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4a7c59]" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-sage-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Physician & Insurance</p>
          <div className="grid grid-cols-2 gap-3">
            {[["Physician", "physician"], ["Clinic", "clinic"], ["Physician Phone", "physicianPhone"], ["Insurance", "insurance"], ["Policy #", "policyNum"], ["Preferred Hospital", "hospital"]].map(([label, key]) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                <input value={form[key as keyof typeof form]} onChange={set(key as keyof typeof form)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4a7c59]" />
              </div>
            ))}
          </div>
        </div>
        {!saved ? (
          <button onClick={onSave} className="w-full py-2.5 rounded-xl bg-[#4a7c59] text-white text-sm font-medium cursor-pointer hover:bg-[#3d6b4f] transition-colors">
            Save Health Form
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 text-sm"><CheckCircle className="w-4 h-4" /> Form saved — please sign the sections below.</div>
            <SignatureBlock sectionKey="3-1" parentName="Sarah Mitchell" sigs={sigs} onSign={onSign} />
            <SignatureBlock sectionKey="3-2" parentName="Sarah Mitchell" sigs={sigs} onSign={onSign} />
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function MedicationPlanModal({ sigs, onSign, onClose, meds, setMeds, saved, onSave }: {
  sigs: Record<string, string>; onSign: (k: string, n: string) => void; onClose: () => void;
  meds: DemoMedication[]; setMeds: (m: DemoMedication[]) => void; saved: boolean; onSave: () => void;
}) {
  const addMed = () => setMeds([...meds, { id: Date.now().toString(), name: "", condition: "", dosage: "" }]);
  const removeMed = (id: string) => setMeds(meds.filter(m => m.id !== id));
  const updateMed = (id: string, field: keyof DemoMedication, val: string) => setMeds(meds.map(m => m.id === id ? { ...m, [field]: val } : m));
  return (
    <ModalShell title="Emergency Medication Plan (Optional)" onClose={onClose} wide>
      <div className="space-y-4">
        <p className="text-sm text-gray-500">List any medications your child may need during the school day or in an emergency.</p>
        {meds.map(med => (
          <div key={med.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
            <div className="flex justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500">Medication</span>
              <button onClick={() => removeMed(med.id)} className="text-red-400 hover:text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[["Medication Name", "name"], ["Condition/Reason", "condition"], ["Dosage", "dosage"]].map(([label, field]) => (
                <div key={field} className={field === "name" ? "col-span-2" : ""}>
                  <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                  <input value={med[field as keyof DemoMedication]} onChange={e => updateMed(med.id, field as keyof DemoMedication, e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4a7c59] bg-white" />
                </div>
              ))}
            </div>
          </div>
        ))}
        <button onClick={addMed} className="flex items-center gap-1.5 text-sm text-[#4a7c59] hover:underline cursor-pointer"><Plus className="w-4 h-4" /> Add Medication</button>
        {!saved ? (
          <button onClick={onSave} disabled={meds.length === 0} className="w-full py-2.5 rounded-xl bg-[#4a7c59] text-white text-sm font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#3d6b4f] transition-colors">Save Plan</button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 text-sm"><CheckCircle className="w-4 h-4" /> Plan saved — sign below to complete.</div>
            <SignatureBlock sectionKey="4-1" parentName="Sarah Mitchell" sigs={sigs} onSign={onSign} />
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function ImmunizationModal({ count, onUpload, onClose }: { count: number; onUpload: () => void; onClose: () => void; }) {
  const fakeFiles = Array.from({ length: count }, (_, i) => `immunization_record_${i + 1}.pdf`);
  return (
    <ModalShell title="Proof of Immunizations" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Upload your child's immunization records or approved exemption documents (PDF, JPG, PNG — max 10MB each).</p>
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400 mb-3">Drag & drop files here</p>
          <button onClick={onUpload} className="px-4 py-2 rounded-lg bg-[#4a7c59] text-white text-sm font-medium cursor-pointer hover:bg-[#3d6b4f] transition-colors">Choose File</button>
        </div>
        {fakeFiles.length > 0 && (
          <div className="space-y-2">
            {fakeFiles.map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-600" /><span className="text-sm text-emerald-700">{f}</span></div>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
            ))}
          </div>
        )}
        {count > 0 && <p className="text-xs text-emerald-600 text-center font-medium">{count} file{count > 1 ? "s" : ""} uploaded successfully</p>}
      </div>
    </ModalShell>
  );
}

function PhotoReleaseModal({ sigs, onSign, onClose, consent, onConsentSave }: {
  sigs: Record<string, string>; onSign: (k: string, n: string) => void; onClose: () => void;
  consent: "FULL" | "LIMITED" | "NO" | null; onConsentSave: (c: "FULL" | "LIMITED" | "NO") => void;
}) {
  const [selected, setSelected] = useState<"FULL" | "LIMITED" | "NO" | null>(consent);
  const [consentSaved, setConsentSaved] = useState(!!consent);
  const options: { value: "FULL" | "LIMITED" | "NO"; label: string; desc: string }[] = [
    { value: "FULL", label: "Full Consent", desc: "Image may be used in all school materials including website, social media, and print." },
    { value: "LIMITED", label: "Limited Consent", desc: "Internal materials only (newsletters to enrolled families). Not for public platforms." },
    { value: "NO", label: "No Consent", desc: "No photography or video recording for school use. Child excluded from group photos." },
  ];
  const allSigned = C5_SECTIONS.every(s => sigs[s.id]);
  return (
    <ModalShell title="Photo Release Form" onClose={onClose} wide>
      <div className="space-y-5">
        {C5_SECTIONS.slice(0, 2).map(s => (
          <div key={s.id} className="border border-gray-100 rounded-xl p-4">
            <h3 className="font-semibold text-gray-700 text-sm mb-2">{s.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
          </div>
        ))}
        <div className="border border-gray-100 rounded-xl p-4">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">Select Your Consent Level</h3>
          <div className="space-y-2">
            {options.map(o => (
              <label key={o.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selected === o.value ? "border-[#4a7c59] bg-sage-50" : "border-gray-100 hover:border-gray-200"}`}>
                <input type="radio" name="consent" value={o.value} checked={selected === o.value} onChange={() => { setSelected(o.value); setConsentSaved(false); }} className="mt-0.5 accent-[#4a7c59]" />
                <div><p className="text-sm font-medium text-gray-700">{o.label}</p><p className="text-xs text-gray-400 mt-0.5">{o.desc}</p></div>
              </label>
            ))}
          </div>
          {!consentSaved && selected && (
            <button onClick={() => { onConsentSave(selected!); setConsentSaved(true); }} className="mt-3 w-full py-2.5 rounded-xl bg-[#4a7c59] text-white text-sm font-medium cursor-pointer hover:bg-[#3d6b4f] transition-colors">Save Consent Level</button>
          )}
          {consentSaved && <div className="mt-3 flex items-center gap-2 text-emerald-600 text-sm"><CheckCircle className="w-4 h-4" /> Consent level saved</div>}
        </div>
        {consentSaved && (
          <div className="border border-gray-100 rounded-xl p-4">
            <h3 className="font-semibold text-gray-700 text-sm mb-2">{C5_SECTIONS[2].title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{C5_SECTIONS[2].body}</p>
            <SignatureBlock sectionKey="5-3" parentName="Sarah Mitchell" sigs={sigs} onSign={onSign} />
          </div>
        )}
        {!consentSaved && !allSigned && <p className="text-xs text-gray-400 text-center">Save your consent level first to enable signing.</p>}
      </div>
    </ModalShell>
  );
}

function AssumptionOfRiskModal({ sigs, onSign, onClose }: { sigs: Record<string, string>; onSign: (k: string, n: string) => void; onClose: () => void; }) {
  return (
    <ModalShell title="Assumption of Risk" onClose={onClose} wide>
      <div className="space-y-4">
        <div className="text-center text-xs text-gray-400 pb-2 border-b border-gray-100">
          <p className="font-semibold text-gray-600 text-sm">Sage Field Private School</p>
          <p>Assumption of Risk & Release of Liability</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-xs text-amber-700 font-medium mb-1">Please read carefully before signing</p>
          <p className="text-sm text-gray-600 leading-relaxed">I acknowledge that participation in Sage Field Private School programs involves inherent risks, including outdoor and nature-based activities, physical movement, and field excursions. I voluntarily assume all such risks on behalf of my child and agree to hold Sage Field Private School, its directors, staff, and volunteers harmless from any liability for injury or loss arising from school participation.</p>
        </div>
        {C6_SECTIONS.map(s => (
          <div key={s.id} className="border border-gray-100 rounded-xl p-4">
            <h3 className="font-semibold text-gray-700 text-sm mb-2">{s.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
            <SignatureBlock sectionKey={s.id} parentName="Sarah Mitchell" sigs={sigs} onSign={onSign} />
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

function AuthorizedPickupModal({ sigs, onSign, onClose, persons, setPersons, saved, onSave }: {
  sigs: Record<string, string>; onSign: (k: string, n: string) => void; onClose: () => void;
  persons: DemoAuthorizedPerson[]; setPersons: (p: DemoAuthorizedPerson[]) => void; saved: boolean; onSave: () => void;
}) {
  const addPerson = () => setPersons([...persons, { id: Date.now().toString(), name: "", relationship: "", phone: "" }]);
  const removePerson = (id: string) => setPersons(persons.filter(p => p.id !== id));
  const updatePerson = (id: string, field: keyof DemoAuthorizedPerson, val: string) => setPersons(persons.map(p => p.id === id ? { ...p, [field]: val } : p));
  return (
    <ModalShell title="Additional Authorized Pickup (Optional)" onClose={onClose} wide>
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Add individuals authorized to pick up your child from school on your behalf.</p>
        {persons.map(person => (
          <div key={person.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
            <div className="flex justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500">Authorized Person</span>
              <button onClick={() => removePerson(person.id)} className="text-red-400 hover:text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[["Full Name", "name"], ["Relationship", "relationship"], ["Phone", "phone"]].map(([label, field]) => (
                <div key={field} className={field === "name" ? "col-span-2" : ""}>
                  <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                  <input value={person[field as keyof DemoAuthorizedPerson]} onChange={e => updatePerson(person.id, field as keyof DemoAuthorizedPerson, e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4a7c59] bg-white" />
                </div>
              ))}
            </div>
          </div>
        ))}
        <button onClick={addPerson} className="flex items-center gap-1.5 text-sm text-[#4a7c59] hover:underline cursor-pointer"><Plus className="w-4 h-4" /> Add Person</button>
        {!saved ? (
          <button onClick={onSave} disabled={persons.length === 0} className="w-full py-2.5 rounded-xl bg-[#4a7c59] text-white text-sm font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#3d6b4f] transition-colors">Save List</button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 text-sm"><CheckCircle className="w-4 h-4" /> List saved — sign below to complete.</div>
            {C7_SECTIONS.map(s => (
              <div key={s.id} className="border border-gray-100 rounded-xl p-4">
                <h3 className="font-semibold text-gray-700 text-sm mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
                <SignatureBlock sectionKey={s.id} parentName="Sarah Mitchell" sigs={sigs} onSign={onSign} />
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function HealthStatementModal({ sigs, onSign, onClose, option, onOptionSave }: {
  sigs: Record<string, string>; onSign: (k: string, n: string) => void; onClose: () => void;
  option: "A" | "B" | null; onOptionSave: (o: "A" | "B") => void;
}) {
  const [selected, setSelected] = useState<"A" | "B" | null>(option);
  const [optionSaved, setOptionSaved] = useState(!!option);
  return (
    <ModalShell title="Health Information Form" onClose={onClose} wide>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">California law requires a health assessment or approved exemption for enrollment. Please select one of the following options.</p>
        <div className="space-y-3">
          {[
            { val: "A" as const, title: "Option A — Health Care Professional Examination", desc: "My child has received a health examination by a licensed health care professional within the past 18 months. I will provide documentation." },
            { val: "B" as const, title: "Option B — Religious Exemption Affidavit", desc: "I am requesting a religious exemption from the health examination requirement. I will upload the required affidavit documentation." },
          ].map(o => (
            <label key={o.val} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${selected === o.val ? "border-[#4a7c59] bg-sage-50" : "border-gray-100 hover:border-gray-200"}`}>
              <input type="radio" name="hsOption" value={o.val} checked={selected === o.val} onChange={() => { setSelected(o.val); setOptionSaved(false); }} className="mt-0.5 accent-[#4a7c59]" />
              <div><p className="text-sm font-medium text-gray-700">{o.title}</p><p className="text-xs text-gray-400 mt-1">{o.desc}</p></div>
            </label>
          ))}
        </div>
        {!optionSaved && selected && (
          <button onClick={() => { onOptionSave(selected!); setOptionSaved(true); }} className="w-full py-2.5 rounded-xl bg-[#4a7c59] text-white text-sm font-medium cursor-pointer hover:bg-[#3d6b4f] transition-colors">Save Selection</button>
        )}
        {optionSaved && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 text-sm"><CheckCircle className="w-4 h-4" /> Selection saved — sign below to complete.</div>
            {C8_SECTIONS.map(s => (
              <div key={s.id} className="border border-gray-100 rounded-xl p-4">
                <h3 className="font-semibold text-gray-700 text-sm mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
                <SignatureBlock sectionKey={s.id} parentName="Sarah Mitchell" sigs={sigs} onSign={onSign} />
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function RegistrationFeeModal({ onPay, onClose }: { onPay: () => void; onClose: () => void; }) {
  const [paid, setPaid] = useState(false);
  return (
    <ModalShell title="Registration Fee" onClose={onClose}>
      <div className="space-y-4 text-center">
        <div className="w-16 h-16 rounded-full bg-sage-50 flex items-center justify-center mx-auto">
          <CreditCard className="w-7 h-7 text-[#4a7c59]" />
        </div>
        {!paid ? (
          <>
            <div>
              <p className="text-2xl font-semibold text-gray-800">$75.00</p>
              <p className="text-sm text-gray-400 mt-1">One-time registration fee</p>
            </div>
            <p className="text-sm text-gray-500">This fee secures your child's spot for the upcoming program. Payment is processed securely.</p>
            <button onClick={() => { setPaid(true); setTimeout(onPay, 800); }} className="w-full py-3 rounded-xl bg-[#4a7c59] text-white font-medium cursor-pointer hover:bg-[#3d6b4f] transition-colors">Pay $75.00</button>
          </>
        ) : (
          <div className="py-4">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold text-gray-800">Payment Successful!</p>
            <p className="text-sm text-gray-400 mt-1">Your registration is confirmed.</p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

// ─── CHECKLIST VIEW ──────────────────────────────────────────────────────────

const CHECKLIST_ITEMS = [
  { id: 1, label: "Program Description & Key Policies", icon: FileText, required: true, modal: "contract-1" as ModalId, optional: false },
  { id: 2, label: "Community Agreement", icon: Users, required: true, modal: "contract-2" as ModalId, optional: false },
  { id: 3, label: "Emergency Contact, Health & Immunization Form", icon: Heart, required: true, modal: "health-form" as ModalId, optional: false },
  { id: 4, label: "Emergency Medication Plan", icon: Pill, required: false, modal: "medication-plan" as ModalId, optional: true },
  { id: 5, label: "Proof of Immunizations", icon: ShieldCheck, required: true, modal: "immunization" as ModalId, optional: false },
  { id: 6, label: "Health Information Form", icon: ClipboardList, required: true, modal: "health-statement" as ModalId, optional: false },
  { id: 7, label: "Photo Release Form", icon: Camera, required: true, modal: "photo-release" as ModalId, optional: false },
  { id: 8, label: "Assumption of Risk", icon: AlertTriangle, required: true, modal: "assumption-of-risk" as ModalId, optional: false },
  { id: 9, label: "Additional Authorized Pickup", icon: UserPlus, required: false, modal: "authorized-pickup" as ModalId, optional: true },
  { id: 10, label: "Pay Registration Fee", icon: CreditCard, required: true, modal: "registration-fee" as ModalId, optional: false },
];

function ChecklistView({ completions, onOpen, enrolled }: {
  completions: boolean[]; onOpen: (modal: ModalId) => void; enrolled: boolean;
}) {
  const required = CHECKLIST_ITEMS.filter(i => i.required);
  const completedRequired = required.filter((_, idx) => {
    const item = CHECKLIST_ITEMS.find(ci => ci.required && required.indexOf(ci) === idx);
    return item ? completions[item.id - 1] : false;
  }).length;
  const reqCompleted = CHECKLIST_ITEMS.filter(i => i.required && completions[i.id - 1]).length;
  const reqTotal = CHECKLIST_ITEMS.filter(i => i.required).length;

  return (
    <div className="space-y-4">
      {enrolled && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800">Enrollment Confirmed!</p>
            <p className="text-sm text-emerald-600">All required steps are complete. We'll see you soon!</p>
          </div>
        </div>
      )}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700">Enrollment Progress</p>
          <span className="text-sm text-gray-400">{reqCompleted} / {reqTotal} required</span>
        </div>
        <ProgressBar value={reqCompleted} max={reqTotal} />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50 shadow-sm overflow-hidden">
        {CHECKLIST_ITEMS.map((item, idx) => {
          const done = completions[item.id - 1];
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => onOpen(item.modal)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left cursor-pointer">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-emerald-100" : "bg-gray-100"}`}>
                {done ? <Check className="w-4 h-4 text-emerald-600" /> : <Icon className="w-4 h-4 text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${done ? "text-gray-500 line-through" : "text-gray-700"}`}>{item.label}</p>
                {item.optional && <span className="text-xs text-gray-400">Optional</span>}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── OTHER PAGE VIEWS ────────────────────────────────────────────────────────

function ChildrenPage({ activeChildId }: { activeChildId: ChildId }) {
  const [detailTab, setDetailTab] = useState<ChildDetailTab>("teacher");
  const child = DEMO_CHILDREN[activeChildId];
  const tabs: { id: ChildDetailTab; label: string }[] = [
    { id: "teacher", label: "Teacher Info" }, { id: "attendance", label: "Attendance" },
    { id: "learning", label: "Learning" }, { id: "profile", label: "Profile" },
  ];
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex border-b border-gray-100">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setDetailTab(t.id)} className={`px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${detailTab === t.id ? "text-[#4a7c59] border-b-2 border-[#4a7c59]" : "text-gray-500 hover:text-gray-700"}`}>{t.label}</button>
        ))}
      </div>
      <div className="p-5">
        {detailTab === "teacher" && (
          <div className="space-y-3">
            {child.teachers.map(t => (
              <div key={t.email} className="border border-gray-100 rounded-xl p-4 flex items-start gap-4">
                <Avatar initials={t.name.split(" ").map(n => n[0]).join("").slice(0, 2)} color="#7FA888" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                  <div className="flex gap-2 mt-3">
                    <a href={`mailto:${t.email}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sage-50 text-[#4a7c59] text-xs font-medium hover:bg-sage-100 transition-colors"><Mail className="w-3.5 h-3.5" /> Email</a>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sage-50 text-[#4a7c59] text-xs font-medium hover:bg-sage-100 transition-colors cursor-pointer"><MessageCircle className="w-3.5 h-3.5" /> Message</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {detailTab === "attendance" && (
          <div className="space-y-2">
            {ATTENDANCE_DATA.map(a => (
              <div key={a.date} className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3">
                <p className="text-sm font-medium text-gray-700">{a.date}</p>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span className="text-emerald-600 font-medium">In {a.checkIn}</span>
                  <span className="text-gray-400">Out {a.checkOut}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {detailTab === "learning" && (
          <div className="space-y-3">
            {LEARNING_NOTES.map(n => (
              <div key={n.date} className="border-l-2 border-sage-200 pl-4 py-1">
                <p className="text-xs text-gray-400 mb-1">{n.date}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{n.note}</p>
              </div>
            ))}
          </div>
        )}
        {detailTab === "profile" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <Avatar initials={child.initials} color={child.color} size="lg" />
              <div>
                <p className="font-semibold text-gray-800">{child.name}</p>
                <p className="text-sm text-gray-400">{child.grade}</p>
              </div>
            </div>
            {[["Date of Birth", child.dob], ["Grade", child.grade], ["Allergies / Health Notes", child.allergies], ["Additional Notes", child.notes]].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="text-sm text-gray-700">{val}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BillingPage({ activeChildId, paidInvoices, onPay }: { activeChildId: ChildId; paidInvoices: Set<string>; onPay: (id: string) => void; }) {
  const childTx = DEMO_TRANSACTIONS.filter(t => t.childId === activeChildId);
  const pending = childTx.filter(t => t.status === "pending" && !paidInvoices.has(t.id));
  const paid = childTx.filter(t => t.status === "paid" || paidInvoices.has(t.id));
  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">Pending Invoices</h3>
          <div className="space-y-2">
            {pending.map(t => (
              <div key={t.id} className="flex items-center justify-between border border-amber-100 bg-amber-50 rounded-xl px-4 py-3">
                <div><p className="text-sm font-medium text-gray-700">{t.desc}</p><p className="text-xs text-gray-400">{t.date}</p></div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800 text-sm">{t.amount}</span>
                  <button onClick={() => onPay(t.id)} className="px-3 py-1.5 rounded-lg bg-[#4a7c59] text-white text-xs font-medium cursor-pointer hover:bg-[#3d6b4f] transition-colors">Pay</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-700 text-sm mb-3">Summer 2026 — Tuition Schedule</h3>
        <div className="grid grid-cols-2 gap-2">
          {SUMMER_WEEKS.map((w, i) => {
            const isPaid = i < 0;
            return (
              <div key={w.week} className={`border rounded-xl px-3 py-2.5 ${isPaid ? "border-emerald-100 bg-emerald-50" : "border-gray-100 bg-gray-50"}`}>
                <div className="flex justify-between items-start">
                  <div><p className="text-xs font-semibold text-gray-600">Week {w.week}</p><p className="text-xs text-gray-400">{w.dates}</p></div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPaid ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"}`}>{isPaid ? "Paid" : "Due"}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 truncate">{w.theme}</p>
              </div>
            );
          })}
        </div>
      </div>
      {paid.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">Payment History</h3>
          <div className="space-y-2">
            {paid.map(t => (
              <div key={t.id} className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3">
                <div><p className="text-sm font-medium text-gray-700">{t.desc}</p><p className="text-xs text-gray-400">{t.date}</p></div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800 text-sm">{t.amount}</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Paid</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MessagesPage({ threads, setThreads }: { threads: Record<string, DemoMessage[]>; setThreads: (t: Record<string, DemoMessage[]>) => void; }) {
  const [activeConv, setActiveConv] = useState<string>("c1");
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const conv = DEMO_CONVERSATIONS.find(c => c.id === activeConv)!;
  const messages = threads[activeConv] || [];

  const sendMsg = () => {
    if (!input.trim()) return;
    const newMsg: DemoMessage = { id: Date.now().toString(), senderId: "parent", text: input.trim(), time: "Just now" };
    setThreads({ ...threads, [activeConv]: [...messages, newMsg] });
    setInput("");
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex" style={{ height: "520px" }}>
      <div className="w-64 border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-gray-100"><p className="text-sm font-semibold text-gray-700">Messages</p></div>
        <div className="overflow-y-auto flex-1">
          {DEMO_CONVERSATIONS.map(c => (
            <button key={c.id} onClick={() => setActiveConv(c.id)} className={`w-full flex items-start gap-3 p-3 text-left transition-colors cursor-pointer ${activeConv === c.id ? "bg-sage-50" : "hover:bg-gray-50"}`}>
              <Avatar initials={c.name.split(" ").map(n => n[0]).join("").slice(0, 2)} color={c.color} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-semibold text-gray-700 truncate">{c.name}</p>
                  {c.unread > 0 && <span className="w-4 h-4 rounded-full bg-[#4a7c59] text-white text-[10px] flex items-center justify-center flex-shrink-0">{c.unread}</span>}
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">{c.lastMsg}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Avatar initials={conv.name.split(" ").map(n => n[0]).join("").slice(0, 2)} color={conv.color} size="sm" />
          <div><p className="text-sm font-semibold text-gray-700">{conv.name}</p><p className="text-xs text-gray-400">{conv.role}</p></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.senderId === "parent" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${m.senderId === "parent" ? "bg-[#4a7c59] text-white rounded-br-sm" : "bg-gray-100 text-gray-700 rounded-bl-sm"}`}>
                <p>{m.text}</p>
                <p className={`text-[10px] mt-1 ${m.senderId === "parent" ? "text-white/60" : "text-gray-400"}`}>{m.time}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="border-t border-gray-100 p-3 flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMsg()} placeholder="Type a message..." className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#4a7c59]" />
          <button onClick={sendMsg} className="p-2 rounded-xl bg-[#4a7c59] text-white cursor-pointer hover:bg-[#3d6b4f] transition-colors"><Send className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}

function CalendarPage() {
  const [month, setMonth] = useState(new Date(2026, 5, 1));
  const [program, setProgram] = useState<"summer" | "school-year">("summer");
  const [selectedEvent, setSelectedEvent] = useState<DemoEvent | null>(null);

  const year = month.getFullYear();
  const mon = month.getMonth();
  const firstDay = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const days = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });
  const monthName = month.toLocaleString("default", { month: "long", year: "numeric" });
  const eventsThisMonth = DEMO_EVENTS.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === mon && e.program === program;
  });
  const eventsForDay = (day: number) => eventsThisMonth.filter(e => new Date(e.date).getDate() === day);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {[{ val: "summer" as const, label: "Summer 2026" }, { val: "school-year" as const, label: "School Year 26–27" }].map(p => (
              <button key={p.val} onClick={() => setProgram(p.val)} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${program === p.val ? "bg-[#4a7c59] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{p.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMonth(new Date(year, mon - 1, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
            <span className="text-sm font-semibold text-gray-700 w-36 text-center">{monthName}</span>
            <button onClick={() => setMonth(new Date(year, mon + 1, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"><ChevronRight className="w-4 h-4 text-gray-500" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-center text-xs text-gray-400 font-medium py-2">{d}</div>
          ))}
          {days.map((day, i) => {
            const evs = day ? eventsForDay(day) : [];
            return (
              <div key={i} className={`min-h-[60px] p-1.5 rounded-lg ${day ? "hover:bg-gray-50 cursor-pointer" : ""}`}>
                {day && <p className="text-xs text-gray-600 font-medium mb-1">{day}</p>}
                {evs.slice(0, 2).map(e => (
                  <button key={e.id} onClick={() => setSelectedEvent(e)} className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium mb-0.5 truncate cursor-pointer" style={{ backgroundColor: e.color + "20", color: e.color }}>{e.title}</button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      {selectedEvent && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedEvent.color }} />
                <span className="text-xs text-gray-400">{selectedEvent.category}</span>
              </div>
              <h3 className="font-semibold text-gray-800">{selectedEvent.title}</h3>
              <p className="text-sm text-gray-400 mt-1">{new Date(selectedEvent.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}{selectedEvent.time ? ` · ${selectedEvent.time}` : ""}</p>
            </div>
            <button onClick={() => setSelectedEvent(null)} className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer"><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{selectedEvent.description}</p>
        </div>
      )}
    </div>
  );
}

function FeedPage() {
  const [reactions, setReactions] = useState<Record<string, string[]>>(DEMO_SEED_REACTIONS);
  const [comments, setComments] = useState<Record<string, string[]>>(DEMO_SEED_COMMENTS);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["p1"]));

  const toggleReaction = (postId: string, emoji: string) => {
    const cur = reactions[postId] || [];
    setReactions({ ...reactions, [postId]: cur.includes(emoji) ? cur.filter(e => e !== emoji) : [...cur, emoji] });
  };
  const addComment = (postId: string) => {
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;
    setComments({ ...comments, [postId]: [...(comments[postId] || []), text] });
    setCommentInputs({ ...commentInputs, [postId]: "" });
  };
  const toggleExpanded = (postId: string) => {
    const next = new Set(expanded);
    next.has(postId) ? next.delete(postId) : next.add(postId);
    setExpanded(next);
  };
  const EMOJIS = ["❤️", "👏", "😊", "🌱", "✨"];

  return (
    <div className="space-y-4">
      {DEMO_POSTS.map(post => (
        <div key={post.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <Avatar initials={post.author.split(" ").map(n => n[0]).join("").slice(0, 2)} color={post.color} />
            <div>
              <p className="text-sm font-semibold text-gray-800">{post.author}</p>
              <p className="text-xs text-gray-400">{post.role} · {post.time}</p>
            </div>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">{post.text}</p>
          <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
            {EMOJIS.map(emoji => {
              const active = (reactions[post.id] || []).includes(emoji);
              return (
                <button key={emoji} onClick={() => toggleReaction(post.id, emoji)} className={`px-2.5 py-1 rounded-full text-sm cursor-pointer transition-colors border ${active ? "bg-sage-50 border-sage-200" : "border-gray-100 hover:bg-gray-50"}`}>{emoji}</button>
              );
            })}
            <button onClick={() => toggleExpanded(post.id)} className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
              <MessageSquare className="w-3.5 h-3.5" />
              {(comments[post.id] || []).length} comment{(comments[post.id] || []).length !== 1 ? "s" : ""}
            </button>
          </div>
          {expanded.has(post.id) && (
            <div className="mt-3 space-y-2">
              {(comments[post.id] || []).map((c, i) => (
                <div key={i} className="flex gap-2 text-sm">
                  <Avatar initials="SM" color="#f29a8f" size="sm" />
                  <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1"><p className="text-xs font-medium text-gray-600 mb-0.5">Sarah Mitchell</p><p className="text-xs text-gray-600">{c}</p></div>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <Avatar initials="SM" color="#f29a8f" size="sm" />
                <input value={commentInputs[post.id] || ""} onChange={e => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })} onKeyDown={e => e.key === "Enter" && addComment(post.id)} placeholder="Add a comment..." className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#4a7c59]" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FormsPage({ completions, onOpen }: { completions: boolean[]; onOpen: (modal: ModalId) => void; }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50 shadow-sm overflow-hidden">
      {CHECKLIST_ITEMS.map((item) => {
        const done = completions[item.id - 1];
        const Icon = item.icon;
        return (
          <button key={item.id} onClick={() => onOpen(item.modal)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left cursor-pointer">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-emerald-100" : "bg-gray-100"}`}>
              {done ? <Check className="w-4 h-4 text-emerald-600" /> : <Icon className="w-4 h-4 text-gray-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{item.label}</p>
              {item.optional && <span className="text-xs text-gray-400">Optional</span>}
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${done ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{done ? "Complete" : "Pending"}</span>
          </button>
        );
      })}
    </div>
  );
}

function VolunteerPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 rounded-full bg-sage-50 flex items-center justify-center mb-4">
        <Heart className="w-7 h-7 text-[#4a7c59]" />
      </div>
      <h3 className="font-semibold text-gray-700 text-lg mb-2">No openings right now</h3>
      <p className="text-sm text-gray-400 text-center max-w-xs">We'll notify you when volunteer opportunities become available. Thank you for your willingness to support our community!</p>
      <button className="mt-6 px-5 py-2.5 rounded-xl bg-[#4a7c59] text-white text-sm font-medium cursor-pointer hover:bg-[#3d6b4f] transition-colors">Notify Me</button>
    </div>
  );
}

function EmergencyContactsPage({ activeChildId }: { activeChildId: ChildId }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const contacts = DEMO_CONTACTS[activeChildId];
  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val).catch(() => {});
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1500);
  };
  return (
    <div className="space-y-3">
      {contacts.map((c, ci) => (
        <div key={ci} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{c.label}</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-sage-100 flex items-center justify-center text-[#4a7c59] font-semibold text-sm">{c.name[0]}</div>
            <div><p className="text-sm font-medium text-gray-700">{c.name}</p><p className="text-xs text-gray-400">{c.relationship}</p></div>
          </div>
          <div className="space-y-2">
            {[{ icon: Phone, label: "Phone", val: c.phone, key: `${ci}-phone` }, { icon: Mail, label: "Email", val: c.email, key: `${ci}-email` }].map(({ icon: Icon, label, val, key }) => (
              <div key={key} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-xs text-gray-700 font-medium">{val}</span>
                </div>
                <button onClick={() => copy(val, key)} className="p-1 rounded cursor-pointer hover:bg-gray-200 transition-colors">
                  {copiedField === key ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── HEADER & NAV ─────────────────────────────────────────────────────────────

const PRIMARY_NAV: { id: NavTab; label: string; icon: typeof ClipboardCheck }[] = [
  { id: "enrollment", label: "Enrollment", icon: ClipboardCheck },
  { id: "children", label: "My Children", icon: Users },
  { id: "billing", label: "Tuition & Billing", icon: CreditCard },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "feed", label: "Feed", icon: Rss },
];

const MORE_NAV: { id: NavTab; label: string; icon: typeof FileText }[] = [
  { id: "forms", label: "Forms & Documents", icon: FileText },
  { id: "volunteer", label: "Volunteer Opportunities", icon: Heart },
  { id: "emergency-contacts", label: "Emergency Contacts", icon: Phone },
];

function DemoHeader({ activeTab, onTabChange }: { activeTab: NavTab; onTabChange: (t: NavTab) => void }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false); };
    if (moreOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreOpen]);

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2">
        <img src="/assets/Logo.png" alt="Sage Field" className="h-7 w-auto object-contain" />
        <span className="text-sm font-semibold text-gray-700">Sage Field</span>
        <span className="text-xs text-gray-300 ml-1">Parent Portal</span>
      </div>
      <nav className="flex items-center gap-1">
        {PRIMARY_NAV.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => onTabChange(id)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${activeTab === id ? "text-[#4a7c59] bg-[#4a7c59]/8 font-semibold" : "text-gray-500 hover:text-[#4a7c59] hover:bg-gray-50"}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
        <div className="relative" ref={moreRef}>
          <button onClick={() => setMoreOpen(v => !v)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-[#4a7c59] hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
            More <ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
          </button>
          {moreOpen && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1.5">
              {MORE_NAV.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => { onTabChange(id); setMoreOpen(false); }} className={`flex items-center gap-2 w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${activeTab === id ? "text-[#4a7c59] bg-sage-50 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-[#4a7c59]"}`}>
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="ml-2 flex items-center gap-2">
          <Avatar initials="SM" color="#f29a8f" size="sm" />
        </div>
      </nav>
    </header>
  );
}

function ChildTabStrip({ activeChildId, onSwitch }: { activeChildId: ChildId; onSwitch: (id: ChildId) => void }) {
  return (
    <div className="flex gap-2 mb-5">
      {(Object.values(DEMO_CHILDREN) as typeof DEMO_CHILDREN[ChildId][]).map(child => (
        <button key={child.id} onClick={() => onSwitch(child.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer border ${activeChildId === child.id ? "bg-white border-gray-200 text-gray-800 shadow-sm" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
          <Avatar initials={child.initials} color={child.color} size="sm" />
          {child.name}
        </button>
      ))}
      <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-[#4a7c59] font-medium border border-dashed border-[#4a7c59]/30 hover:bg-sage-50 transition-colors cursor-pointer">
        <Plus className="w-3.5 h-3.5" /> New Application
      </button>
    </div>
  );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

export default function ParentDashboardDemo() {
  const [activeNavTab, setActiveNavTab] = useState<NavTab>("enrollment");
  const [activeChildId, setActiveChildId] = useState<ChildId>("emma");
  const [openModal, setOpenModal] = useState<ModalId>(null);

  // Per-child signatures
  const [signaturesEmma, setSignaturesEmma] = useState<Record<string, string>>({});
  const [signaturesJake, setSignaturesJake] = useState<Record<string, string>>({});

  // Per-child form completion
  const [healthFormSaved, setHealthFormSaved] = useState<Record<ChildId, boolean>>({ emma: false, jake: false });
  const [medicationSaved, setMedicationSaved] = useState<Record<ChildId, boolean>>({ emma: false, jake: false });
  const [pickupSaved, setPickupSaved] = useState<Record<ChildId, boolean>>({ emma: false, jake: false });
  const [photoConsent, setPhotoConsent] = useState<Record<ChildId, "FULL" | "LIMITED" | "NO" | null>>({ emma: null, jake: null });
  const [healthStatement, setHealthStatement] = useState<Record<ChildId, "A" | "B" | null>>({ emma: null, jake: null });
  const [immunizationCount, setImmunizationCount] = useState<Record<ChildId, number>>({ emma: 0, jake: 0 });
  const [feePaid, setFeePaid] = useState<Record<ChildId, boolean>>({ emma: false, jake: false });
  const [medications, setMedications] = useState<Record<ChildId, DemoMedication[]>>({ emma: [], jake: [] });
  const [pickupPersons, setPickupPersons] = useState<Record<ChildId, DemoAuthorizedPerson[]>>({ emma: [], jake: [] });
  const [confettiFired, setConfettiFired] = useState<Record<ChildId, boolean>>({ emma: false, jake: false });

  // Billing
  const [paidInvoices, setPaidInvoices] = useState<Set<string>>(new Set());

  // Messages
  const [messageThreads, setMessageThreads] = useState<Record<string, DemoMessage[]>>(DEMO_THREADS);

  // Derived active signatures
  const activeSigs = activeChildId === "emma" ? signaturesEmma : signaturesJake;
  const setActiveSigs = activeChildId === "emma" ? setSignaturesEmma : setSignaturesJake;

  const handleSign = useCallback((key: string, name: string) => {
    setActiveSigs(prev => ({ ...prev, [key]: name }));
  }, [activeChildId]);

  // Completion logic
  const sigs = activeSigs;
  const completions = [
    C1_SECTIONS.every(s => sigs[s.id]),                                       // 1
    C2_SECTIONS.every(s => sigs[s.id]),                                       // 2
    healthFormSaved[activeChildId] && !!sigs["3-1"] && !!sigs["3-2"],         // 3
    !!sigs["4-1"],                                                             // 4 optional
    immunizationCount[activeChildId] > 0,                                     // 5
    !!healthStatement[activeChildId] && !!sigs["8-1"],                        // 6
    !!photoConsent[activeChildId] && !!sigs["5-3"],                           // 7
    !!sigs["6-1"],                                                             // 8
    pickupSaved[activeChildId] && !!sigs["7-1"],                              // 9 optional
    feePaid[activeChildId],                                                    // 10
  ];

  const requiredItems = [0, 1, 2, 4, 5, 6, 7, 9]; // 0-indexed positions that are required
  const isEnrolled = requiredItems.every(i => completions[i]);

  useEffect(() => {
    if (!isEnrolled || confettiFired[activeChildId]) return;
    setConfettiFired(prev => ({ ...prev, [activeChildId]: true }));
    const fire = async () => {
      const confetti = (await import("canvas-confetti")).default;
      const colors = ["#7FA888", "#f29a8f", "#4A6354", "#97C09B", "#BFD8C0", "#ffffff"];
      confetti({ particleCount: 60, spread: 70, colors, origin: { x: 0.3, y: 0.55 } });
      setTimeout(() => confetti({ particleCount: 60, spread: 70, colors, origin: { x: 0.7, y: 0.55 } }), 200);
      setTimeout(() => confetti({ particleCount: 80, spread: 90, colors, origin: { x: 0.5, y: 0.4 } }), 400);
    };
    fire();
  }, [isEnrolled, activeChildId]);

  const pageTitle: Record<NavTab, string> = {
    enrollment: "Enrollment",
    children: "My Children",
    billing: "Tuition & Billing",
    messages: "Messages",
    calendar: "Calendar",
    feed: "Feed",
    forms: "Forms & Documents",
    volunteer: "Volunteer Opportunities",
    "emergency-contacts": "Emergency Contacts",
  };

  const isJakePending = activeChildId === "jake";

  return (
    <div className="flex flex-col bg-welcome-bg" style={{ minHeight: "700px", fontFamily: "var(--font-body, system-ui, sans-serif)" }}>
      <DemoHeader activeTab={activeNavTab} onTabChange={setActiveNavTab} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* Page heading */}
          <div className="mb-5">
            <h1 className="text-xl font-semibold text-gray-800">{pageTitle[activeNavTab]}</h1>
            {activeNavTab === "enrollment" && <p className="text-sm text-gray-400 mt-0.5">Welcome back, Sarah — here's your enrollment progress.</p>}
          </div>

          {/* Child tab strip (shown on most pages) */}
          {activeNavTab !== "messages" && activeNavTab !== "calendar" && activeNavTab !== "feed" && activeNavTab !== "volunteer" && (
            <ChildTabStrip activeChildId={activeChildId} onSwitch={setActiveChildId} />
          )}

          {/* Page content */}
          {activeNavTab === "enrollment" && (
            isJakePending ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
                <Clock className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">Application Under Review</p>
                  <p className="text-sm text-amber-600 mt-1">Jake's application has been received and is currently being reviewed by the admissions team. You'll be notified by email once a decision has been made.</p>
                  <p className="text-xs text-amber-500 mt-3">Submitted: April 10, 2026</p>
                </div>
              </div>
            ) : (
              <ChecklistView completions={completions} onOpen={setOpenModal} enrolled={isEnrolled} />
            )
          )}

          {activeNavTab === "children" && <ChildrenPage activeChildId={activeChildId} />}

          {activeNavTab === "billing" && (
            <BillingPage activeChildId={activeChildId} paidInvoices={paidInvoices} onPay={id => setPaidInvoices(prev => new Set([...prev, id]))} />
          )}

          {activeNavTab === "messages" && (
            <MessagesPage threads={messageThreads} setThreads={setMessageThreads} />
          )}

          {activeNavTab === "calendar" && <CalendarPage />}

          {activeNavTab === "feed" && <FeedPage />}

          {activeNavTab === "forms" && (
            <FormsPage completions={completions} onOpen={setOpenModal} />
          )}

          {activeNavTab === "volunteer" && <VolunteerPage />}

          {activeNavTab === "emergency-contacts" && <EmergencyContactsPage activeChildId={activeChildId} />}
        </div>
      </main>

      {/* Modals */}
      {openModal === "contract-1" && (
        <ContractModal contractId="1" sections={C1_SECTIONS} title="Program Description & Key Policies" sigs={activeSigs} onSign={handleSign} onClose={() => setOpenModal(null)} />
      )}
      {openModal === "contract-2" && (
        <ContractModal contractId="2" sections={C2_SECTIONS} title="Community Agreement" sigs={activeSigs} onSign={handleSign} onClose={() => setOpenModal(null)} />
      )}
      {openModal === "health-form" && (
        <HealthFormModal sigs={activeSigs} onSign={handleSign} onClose={() => setOpenModal(null)} saved={healthFormSaved[activeChildId]} onSave={() => setHealthFormSaved(p => ({ ...p, [activeChildId]: true }))} />
      )}
      {openModal === "medication-plan" && (
        <MedicationPlanModal sigs={activeSigs} onSign={handleSign} onClose={() => setOpenModal(null)} meds={medications[activeChildId]} setMeds={m => setMedications(p => ({ ...p, [activeChildId]: m }))} saved={medicationSaved[activeChildId]} onSave={() => setMedicationSaved(p => ({ ...p, [activeChildId]: true }))} />
      )}
      {openModal === "immunization" && (
        <ImmunizationModal count={immunizationCount[activeChildId]} onUpload={() => setImmunizationCount(p => ({ ...p, [activeChildId]: p[activeChildId] + 1 }))} onClose={() => setOpenModal(null)} />
      )}
      {openModal === "photo-release" && (
        <PhotoReleaseModal sigs={activeSigs} onSign={handleSign} onClose={() => setOpenModal(null)} consent={photoConsent[activeChildId]} onConsentSave={c => setPhotoConsent(p => ({ ...p, [activeChildId]: c }))} />
      )}
      {openModal === "assumption-of-risk" && (
        <AssumptionOfRiskModal sigs={activeSigs} onSign={handleSign} onClose={() => setOpenModal(null)} />
      )}
      {openModal === "authorized-pickup" && (
        <AuthorizedPickupModal sigs={activeSigs} onSign={handleSign} onClose={() => setOpenModal(null)} persons={pickupPersons[activeChildId]} setPersons={p => setPickupPersons(prev => ({ ...prev, [activeChildId]: p }))} saved={pickupSaved[activeChildId]} onSave={() => setPickupSaved(p => ({ ...p, [activeChildId]: true }))} />
      )}
      {openModal === "health-statement" && (
        <HealthStatementModal sigs={activeSigs} onSign={handleSign} onClose={() => setOpenModal(null)} option={healthStatement[activeChildId]} onOptionSave={o => setHealthStatement(p => ({ ...p, [activeChildId]: o }))} />
      )}
      {openModal === "registration-fee" && (
        <RegistrationFeeModal onPay={() => { setFeePaid(p => ({ ...p, [activeChildId]: true })); setOpenModal(null); }} onClose={() => setOpenModal(null)} />
      )}
    </div>
  );
}
