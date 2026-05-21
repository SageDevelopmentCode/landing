"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  FileEdit,
  Send,
  Plus,
  Bold,
  Italic,
  List,
  Image as ImageIcon,
  Users,
  CheckCircle2,
  Eye,
  EyeOff,
  Copy,
  ChevronRight,
  Newspaper,
  X,
  Upload,
  ExternalLink,
  History,
  ClipboardList,
  Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "editor" | "changelog" | "publish";

export interface Teacher {
  id: string;
  full_name: string | null;
  profile_image_url: string | null;
  role: string | null;
}

interface LocalImage {
  id: string;
  url: string;
  name: string;
}

interface TeacherUpdate {
  teacherId: string;
  body: string;
}

interface SectionData {
  id: string;
  label: string;
  body: string;
  images: LocalImage[];
  visible: boolean;
  isClassUpdates?: boolean;
  teacherUpdates?: TeacherUpdate[];
}

interface ChangeEntry {
  id: string;
  timestamp: Date;
  teacherName: string;
  teacherAvatar: string | null;
  action: string;
}

// ── Static data ───────────────────────────────────────────────────────────────

const HISTORY_ROWS = [
  { week: "May 12–16, 2026", title: "May 12–16 Weekly Update",   by: "Ms. Rivera", at: "May 16, 2026", views: 42 },
  { week: "May 5–9, 2026",   title: "May 5–9 Weekly Update",     by: "Ms. Rivera", at: "May 9, 2026",  views: 37 },
  { week: "Apr 28–May 2",    title: "Spring Wrap-Up Newsletter",  by: "Mr. Okafor", at: "May 2, 2026",  views: 61 },
  { week: "Apr 21–25, 2026", title: "Apr 21–25 Weekly Update",   by: "Ms. Chen",   at: "Apr 25, 2026", views: 29 },
];

const WEEK_KEY = "may-19-2026";
const DRAFT_STORAGE_KEY = `newsletter-draft-${WEEK_KEY}`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(id: string): string {
  const colors = [
    "bg-[#7FA888]", "bg-purple-400", "bg-amber-400",
    "bg-blue-400", "bg-rose-400", "bg-teal-400",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function TeacherAvatar({ teacher, size = "sm" }: { teacher: Teacher; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-7 h-7 text-xs" : "w-8 h-8 text-sm";
  if (teacher.profile_image_url) {
    return (
      <img
        src={teacher.profile_image_url}
        alt={teacher.full_name ?? ""}
        className={`${dim} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${dim} rounded-full ${getAvatarColor(teacher.id)} flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {getInitials(teacher.full_name)}
    </div>
  );
}

function relativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ── Editor Tab ────────────────────────────────────────────────────────────────

interface EditorTabProps {
  sections: SectionData[];
  teachers: Teacher[];
  currentUserId: string;
  patchSection: (id: string, patch: Partial<SectionData>) => void;
  addSection: () => void;
  newsletterTitle: string;
  setNewsletterTitle: (v: string) => void;
  viewMode: "traditional" | "slideshow";
  setViewMode: (v: "traditional" | "slideshow") => void;
  logChange: (action: string) => void;
  restoredAt: string | null;
  dismissRestore: () => void;
}

function EditorTab({
  sections,
  teachers,
  currentUserId,
  patchSection,
  addSection,
  newsletterTitle,
  setNewsletterTitle,
  viewMode,
  setViewMode,
  logChange,
  restoredAt,
  dismissRestore,
}: EditorTabProps) {
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeSection = sections.find((s) => s.id === activeSectionId) ?? sections[0];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [activeSection?.body]);

  useEffect(() => {
    if (!sections.find((s) => s.id === activeSectionId) && sections.length > 0) {
      setActiveSectionId(sections[sections.length - 1].id);
    }
  }, [sections, activeSectionId]);

  function wrapSelection(before: string, after: string = before) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.slice(start, end);
    const newVal = ta.value.slice(0, start) + before + selected + after + ta.value.slice(end);
    patchSection(activeSectionId, { body: newVal });
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, end + before.length);
    });
  }

  function insertBullet() {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const newVal = ta.value.slice(0, start) + "\n- " + ta.value.slice(start);
    patchSection(activeSectionId, { body: newVal });
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + 3, start + 3);
    });
  }

  function handleBodyChange(value: string) {
    patchSection(activeSectionId, { body: value });
    if (bodyDebounceRef.current) clearTimeout(bodyDebounceRef.current);
    bodyDebounceRef.current = setTimeout(() => {
      logChange(`Edited body in '${activeSection?.label || "section"}'`);
    }, 1200);
  }

  function handleImageFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const newImages: LocalImage[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(f),
      name: f.name,
    }));
    patchSection(activeSectionId, {
      images: [...(activeSection?.images ?? []), ...newImages],
    });
    logChange(`Added ${newImages.length} image${newImages.length > 1 ? "s" : ""} to '${activeSection?.label || "section"}'`);
  }

  function removeImage(imgId: string) {
    const img = activeSection?.images.find((i) => i.id === imgId);
    if (img) URL.revokeObjectURL(img.url);
    patchSection(activeSectionId, {
      images: (activeSection?.images ?? []).filter((i) => i.id !== imgId),
    });
    logChange(`Removed an image from '${activeSection?.label || "section"}'`);
  }

  function toggleVisibility(s: SectionData, e: React.MouseEvent) {
    e.stopPropagation();
    const next = !s.visible;
    patchSection(s.id, { visible: next });
    logChange(next ? `Showed '${s.label}'` : `Hid '${s.label}'`);
  }

  function patchTeacherUpdate(teacherId: string, body: string) {
    const current = activeSection?.teacherUpdates ?? [];
    const updated = current.map((tu) =>
      tu.teacherId === teacherId ? { ...tu, body } : tu
    );
    patchSection(activeSectionId, { teacherUpdates: updated });
    if (bodyDebounceRef.current) clearTimeout(bodyDebounceRef.current);
    bodyDebounceRef.current = setTimeout(() => {
      const t = teachers.find((t) => t.id === teacherId);
      logChange(`Edited class update for ${t?.full_name ?? "teacher"}`);
    }, 1200);
  }

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Left sidebar */}
      <aside className="w-60 border-r border-gray-100 bg-gray-50 flex flex-col">
        <div className="px-4 pt-5 pb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Current Draft</p>
          <p className="text-sm font-semibold text-gray-800 font-body">Week of May 19, 2026</p>
        </div>

        {/* Restore banner */}
        {restoredAt && (
          <div className="mx-3 mb-2 px-3 py-2 bg-[#4a7c59]/8 border border-[#4a7c59]/20 rounded-lg flex items-center gap-2">
            <p className="text-xs text-[#4a7c59] font-body flex-1">Draft restored from {restoredAt}</p>
            <button onClick={dismissRestore} className="text-[#4a7c59] hover:text-[#3d6b4a]">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="px-3 pb-2 flex-1 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1.5">Sections</p>
          <ul className="space-y-0.5">
            {sections.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setActiveSectionId(s.id)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body transition-colors ${
                    activeSectionId === s.id
                      ? "bg-[#4a7c59] text-white font-semibold"
                      : s.visible
                      ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      : "text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  <ChevronRight
                    className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${
                      activeSectionId === s.id ? "rotate-90 opacity-100" : "opacity-40"
                    }`}
                  />
                  <span className={`truncate flex-1 ${!s.visible && activeSectionId !== s.id ? "line-through opacity-60" : ""}`}>
                    {s.label || "Untitled"}
                  </span>
                  {/* Eye toggle */}
                  <span
                    onClick={(e) => toggleVisibility(s, e)}
                    className={`flex-shrink-0 p-0.5 rounded transition-colors ${
                      activeSectionId === s.id
                        ? "text-white/70 hover:text-white"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    title={s.visible ? "Hide from newsletter" : "Show in newsletter"}
                  >
                    {s.visible
                      ? <Eye className="w-3.5 h-3.5" />
                      : <EyeOff className="w-3.5 h-3.5" />
                    }
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-3 pb-4 pt-2">
          <button
            onClick={() => {
              addSection();
              logChange("Added a new section");
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#4a7c59] text-white text-sm font-body font-semibold rounded-xl hover:bg-[#3d6b4a] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Section
          </button>
        </div>
      </aside>

      {/* Center editor */}
      <div className="flex-1 flex flex-col overflow-y-auto px-8 py-6">
        {activeSection?.isClassUpdates ? (
          /* ── Class Updates: per-teacher cards ── */
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold font-heading text-gray-900">Class Updates</h2>
              {!activeSection.visible && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-body rounded-full">Hidden</span>
              )}
            </div>
            <p className="text-xs text-gray-400 font-body mb-4">Each teacher can add their own update for the week.</p>

            {teachers.map((teacher) => {
              const update = activeSection.teacherUpdates?.find((tu) => tu.teacherId === teacher.id);
              return (
                <div key={teacher.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-3">
                    <TeacherAvatar teacher={teacher} size="md" />
                    <span className="text-sm font-semibold font-body text-gray-800">
                      {teacher.full_name ?? "Unknown Teacher"}
                    </span>
                    {teacher.id === currentUserId && (
                      <span className="px-2 py-0.5 bg-[#4a7c59]/10 text-[#4a7c59] text-xs font-semibold font-body rounded-full">You</span>
                    )}
                  </div>
                  <textarea
                    value={update?.body ?? ""}
                    onChange={(e) => patchTeacherUpdate(teacher.id, e.target.value)}
                    placeholder={`${teacher.full_name?.split(" ")[0] ?? "Teacher"}'s update for this week…`}
                    className="w-full min-h-[100px] bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-700 font-body resize-none outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59] placeholder:text-gray-400 leading-relaxed"
                    rows={4}
                  />
                </div>
              );
            })}

            {/* Shared image upload for class updates */}
            <div className="mt-2">
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Section Images</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold font-body text-[#4a7c59] border border-[#4a7c59]/30 bg-[#4a7c59]/5 rounded-lg hover:bg-[#4a7c59]/10 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Add Images
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageFiles(e.target.files)} />
              {activeSection.images.length === 0 ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-5 flex flex-col items-center gap-2 text-gray-400 hover:border-[#4a7c59]/40 hover:text-[#4a7c59] transition-colors"
                >
                  <ImageIcon className="w-5 h-5" />
                  <p className="text-sm font-body">Click to upload images for this section</p>
                </button>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {activeSection.images.map((img) => (
                    <div key={img.id} className="relative group">
                      <img src={img.url} alt={img.name} className="w-20 h-20 object-cover rounded-xl border border-gray-100" />
                      <button onClick={() => removeImage(img.id)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => fileInputRef.current?.click()} className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#4a7c59]/40 hover:text-[#4a7c59] transition-colors">
                    <Plus className="w-4 h-4" />
                    <span className="text-xs">Add</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Regular section editor ── */
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-1 mb-5 p-1.5 bg-gray-50 border border-gray-100 rounded-xl w-fit">
              <button title="Bold" onClick={() => wrapSelection("**")} className="p-2 text-gray-500 hover:text-[#4a7c59] hover:bg-white rounded-lg transition-colors">
                <Bold className="w-4 h-4" />
              </button>
              <button title="Italic" onClick={() => wrapSelection("_")} className="p-2 text-gray-500 hover:text-[#4a7c59] hover:bg-white rounded-lg transition-colors">
                <Italic className="w-4 h-4" />
              </button>
              <button title="Bullet list" onClick={insertBullet} className="p-2 text-gray-500 hover:text-[#4a7c59] hover:bg-white rounded-lg transition-colors">
                <List className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <button title="Add images" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-[#4a7c59] hover:bg-white rounded-lg transition-colors">
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>

            {activeSection && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <input
                    key={activeSectionId + "-title"}
                    type="text"
                    value={activeSection.label}
                    onChange={(e) => {
                      patchSection(activeSectionId, { label: e.target.value });
                      logChange(`Renamed section to '${e.target.value}'`);
                    }}
                    className="text-2xl font-semibold font-heading text-gray-900 bg-transparent border-none outline-none flex-1 placeholder:text-gray-300"
                    placeholder="Section title…"
                  />
                  {!activeSection.visible && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-body rounded-full flex-shrink-0">Hidden</span>
                  )}
                </div>

                <textarea
                  key={activeSectionId + "-body"}
                  ref={textareaRef}
                  value={activeSection.body}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  placeholder="Start writing this section…"
                  className="w-full min-h-[200px] bg-gray-50 border border-gray-100 rounded-2xl p-5 text-sm text-gray-700 font-body resize-none outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59] placeholder:text-gray-400 leading-relaxed mb-5"
                  rows={8}
                />
              </>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageFiles(e.target.files)} />

            {activeSection && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Section Images</p>
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold font-body text-[#4a7c59] border border-[#4a7c59]/30 bg-[#4a7c59]/5 rounded-lg hover:bg-[#4a7c59]/10 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    Add Images
                  </button>
                </div>
                {activeSection.images.length === 0 ? (
                  <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-2 text-gray-400 hover:border-[#4a7c59]/40 hover:text-[#4a7c59] transition-colors">
                    <ImageIcon className="w-6 h-6" />
                    <p className="text-sm font-body">Click to upload images for this section</p>
                    <p className="text-xs">PNG, JPG, GIF — any size</p>
                  </button>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {activeSection.images.map((img) => (
                      <div key={img.id} className="relative group">
                        <img src={img.url} alt={img.name} className="w-20 h-20 object-cover rounded-xl border border-gray-100" />
                        <button onClick={() => removeImage(img.id)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => fileInputRef.current?.click()} className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#4a7c59]/40 hover:text-[#4a7c59] transition-colors">
                      <Plus className="w-4 h-4" />
                      <span className="text-xs">Add</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Right metadata panel */}
      <aside className="w-72 border-l border-gray-100 bg-white flex flex-col overflow-y-auto px-5 py-5 gap-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Newsletter Title</p>
          <input
            type="text"
            value={newsletterTitle}
            onChange={(e) => {
              setNewsletterTitle(e.target.value);
              logChange(`Updated newsletter title to '${e.target.value}'`);
            }}
            className="w-full text-sm font-body text-gray-800 border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Week</p>
          <div className="text-sm font-body text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
            May 19 – May 23, 2026
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Collaborators
          </p>
          <div className="flex flex-col gap-2">
            {teachers.map((t) => (
              <div key={t.id} className="flex items-center gap-2.5">
                <TeacherAvatar teacher={t} />
                <span className="text-sm font-body text-gray-700 flex-1 truncate">{t.full_name ?? "Unknown"}</span>
                {t.id === currentUserId && (
                  <span className="text-xs font-body text-[#4a7c59] font-semibold flex-shrink-0">You</span>
                )}
                <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-body text-gray-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          Auto-saved just now
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Parent View</p>
          <div className="flex rounded-xl overflow-hidden border border-gray-200 text-sm font-body">
            <button
              onClick={() => setViewMode("traditional")}
              className={`flex-1 py-2 transition-colors ${viewMode === "traditional" ? "bg-[#4a7c59] text-white font-semibold" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              Traditional
            </button>
            <button
              onClick={() => setViewMode("slideshow")}
              className={`flex-1 py-2 transition-colors ${viewMode === "slideshow" ? "bg-[#4a7c59] text-white font-semibold" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              Slideshow
            </button>
          </div>
          <p className="text-xs text-gray-400 font-body mt-1.5">Choose how parents see this newsletter.</p>
        </div>
      </aside>
    </div>
  );
}

// ── Change Log Tab ────────────────────────────────────────────────────────────

function ChangeLogTab({ changeLog }: { changeLog: ChangeEntry[] }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold font-heading text-gray-900">Change Log</h2>
        <p className="text-sm text-gray-500 font-body mt-0.5">A record of every edit made this session.</p>
      </div>

      {changeLog.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <ClipboardList className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold font-body text-gray-500 mb-1">No changes yet</p>
          <p className="text-xs text-gray-400 font-body">Start editing to track activity</p>
        </div>
      ) : (
        <div className="space-y-1">
          {[...changeLog].reverse().map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
              {entry.teacherAvatar ? (
                <img src={entry.teacherAvatar} alt={entry.teacherName} className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#7FA888] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-0.5">
                  {getInitials(entry.teacherName)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body text-gray-800">
                  <span className="font-semibold">{entry.teacherName}</span>{" "}
                  <span className="text-gray-600">{entry.action}</span>
                </p>
                <p className="text-xs text-gray-400 font-body mt-0.5" suppressHydrationWarning>
                  {relativeTime(entry.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Publish Tab ───────────────────────────────────────────────────────────────

interface PublishTabProps {
  sections: SectionData[];
  newsletterTitle: string;
  viewMode: "traditional" | "slideshow";
  setViewMode: (v: "traditional" | "slideshow") => void;
}

function PublishTab({ sections, newsletterTitle, viewMode, setViewMode }: PublishTabProps) {
  const [recipients, setRecipients] = useState<"all" | "program">("all");
  const [schedule, setSchedule] = useState<"now" | "later">("now");

  const visibleSections = sections.filter((s) => s.visible);

  function openPreview() {
    const payload = {
      title: newsletterTitle,
      weekLabel: "May 19 – May 23, 2026",
      viewMode,
      sections: visibleSections,
    };
    sessionStorage.setItem("newsletter-preview", JSON.stringify(payload));
    window.open("/teacher/dashboard/newsletter/preview", "_blank");
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold font-heading text-gray-900">Publish Newsletter</h2>
        <p className="text-sm text-gray-500 font-body mt-0.5">Review the parent-facing view and send it out.</p>
      </div>

      {visibleSections.length < sections.length && (
        <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-sm font-body text-amber-700">
          {sections.length - visibleSections.length} section{sections.length - visibleSections.length > 1 ? "s are" : " is"} hidden and won&apos;t appear in the published newsletter.
        </div>
      )}

      <div className="flex gap-6">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Parent View</p>

          <div className="flex gap-2 mb-4">
            {(["traditional", "slideshow"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-4 py-2 rounded-xl text-sm font-body font-semibold border transition-colors ${
                  viewMode === m
                    ? "bg-[#4a7c59] text-white border-[#4a7c59]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {m === "traditional" ? "Traditional View" : "Slideshow View"}
              </button>
            ))}
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-4">
            {viewMode === "traditional" ? (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4a7c59]/10 flex items-center justify-center flex-shrink-0">
                  <Newspaper className="w-5 h-5 text-[#4a7c59]" />
                </div>
                <div>
                  <p className="text-sm font-semibold font-body text-gray-800 mb-1">Traditional Newsletter</p>
                  <p className="text-xs text-gray-500 font-body leading-relaxed">
                    A classic school newsletter layout. Sections scroll vertically with headings, body text, and photo grids.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4a7c59]/10 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-5 h-5 text-[#4a7c59]" />
                </div>
                <div>
                  <p className="text-sm font-semibold font-body text-gray-800 mb-1">Slideshow Newsletter</p>
                  <p className="text-xs text-gray-500 font-body leading-relaxed">
                    Each section becomes a full-screen slide with a photo grid at the top.
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={openPreview}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 border-2 border-[#4a7c59] text-[#4a7c59] text-sm font-semibold font-body rounded-xl hover:bg-[#4a7c59]/5 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open Preview in New Tab
          </button>
          <p className="text-xs text-gray-400 font-body text-center mt-2">
            See exactly what parents will see when this is published
          </p>
        </div>

        <div className="w-80 flex flex-col gap-5">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Recipients</p>
            <div className="space-y-2">
              {[
                { value: "all",     label: "All Parents" },
                { value: "program", label: "By Program"  },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    onClick={() => setRecipients(opt.value as "all" | "program")}
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                      recipients === opt.value ? "border-[#4a7c59]" : "border-gray-300"
                    }`}
                  >
                    {recipients === opt.value && <div className="w-2 h-2 rounded-full bg-[#4a7c59]" />}
                  </div>
                  <span className="text-sm font-body text-gray-700 group-hover:text-gray-900">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Send</p>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 text-sm font-body">
              <button
                onClick={() => setSchedule("now")}
                className={`flex-1 py-2 transition-colors ${schedule === "now" ? "bg-[#4a7c59] text-white font-semibold" : "bg-white text-gray-500 hover:bg-gray-50"}`}
              >
                Now
              </button>
              <button
                onClick={() => setSchedule("later")}
                className={`flex-1 py-2 transition-colors ${schedule === "later" ? "bg-[#4a7c59] text-white font-semibold" : "bg-white text-gray-500 hover:bg-gray-50"}`}
              >
                Schedule
              </button>
            </div>
            {schedule === "later" && (
              <div className="mt-3 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-400 font-body">
                Date &amp; time picker — coming soon
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Notifications</p>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-[#4a7c59]" />
              <span className="text-sm font-body text-gray-700">Notify parents via email</span>
            </label>
          </div>

          <div className="space-y-2">
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#4a7c59] text-white text-sm font-semibold font-body rounded-xl opacity-50 cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              Publish Newsletter
            </button>
            <button className="w-full text-center text-sm font-body text-gray-400 hover:text-gray-600 transition-colors py-1">
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── History Drawer ────────────────────────────────────────────────────────────

function HistoryDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/20 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed right-0 top-0 bottom-0 w-[560px] bg-white shadow-xl z-50 flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold font-heading text-gray-900">Published Newsletters</h2>
                <p className="text-xs text-gray-400 font-body mt-0.5">History of sent newsletters</p>
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["Week", "Title", "By", "Published", "Views", ""].map((col) => (
                      <th key={col} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HISTORY_ROWS.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap text-xs">{row.week}</td>
                      <td className="px-5 py-3.5 text-gray-800 font-medium">{row.title}</td>
                      <td className="px-5 py-3.5 text-gray-600 text-xs">{row.by}</td>
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap text-xs">{row.at}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Eye className="w-3.5 h-3.5" />
                          {row.views}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Published</span>
                          <button className="p-1.5 text-gray-400 hover:text-[#4a7c59] hover:bg-gray-100 rounded-lg transition-colors" title="Duplicate">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "editor",    label: "Editor",     icon: FileEdit     },
  { id: "changelog", label: "Change Log", icon: ClipboardList },
  { id: "publish",   label: "Publish",    icon: Send         },
];

interface NewsletterPageClientProps {
  teachers: Teacher[];
  currentUserId: string;
}

export default function NewsletterPageClient({ teachers, currentUserId }: NewsletterPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("editor");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [savedStatus, setSavedStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [restoredAt, setRestoredAt] = useState<string | null>(null);
  const [changeLog, setChangeLog] = useState<ChangeEntry[]>([]);

  const currentTeacher = teachers.find((t) => t.id === currentUserId) ?? teachers[0];

  function buildInitialSections(teacherList: Teacher[]): SectionData[] {
    return [
      { id: "welcome",   label: "Welcome Message",  body: "", images: [], visible: true },
      {
        id: "class", label: "Class Updates", body: "", images: [], visible: true,
        isClassUpdates: true,
        teacherUpdates: teacherList.map((t) => ({ teacherId: t.id, body: "" })),
      },
      { id: "events",    label: "Upcoming Events",  body: "", images: [], visible: true },
      { id: "reminders", label: "Parent Reminders", body: "", images: [], visible: true },
      { id: "gallery",   label: "Photo Gallery",    body: "", images: [], visible: true },
    ];
  }

  const [sections, setSections] = useState<SectionData[]>(() => buildInitialSections(teachers));
  const [newsletterTitle, setNewsletterTitle] = useState("May 19–23 Weekly Update");
  const [viewMode, setViewMode] = useState<"traditional" | "slideshow">("traditional");

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.sections) setSections(draft.sections);
        if (draft.newsletterTitle) setNewsletterTitle(draft.newsletterTitle);
        if (draft.viewMode) setViewMode(draft.viewMode);
        if (draft.savedAt) {
          const d = new Date(draft.savedAt);
          setRestoredAt(d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }));
        }
      }
    } catch {
      // ignore malformed draft
    }
  }, []);

  const logChange = useCallback((action: string) => {
    setChangeLog((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        teacherName: currentTeacher?.full_name ?? "You",
        teacherAvatar: currentTeacher?.profile_image_url ?? null,
        action,
      },
    ]);
  }, [currentTeacher]);

  const patchSection = useCallback((id: string, patch: Partial<SectionData>) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const addSection = useCallback(() => {
    setSections((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: "New Section", body: "", images: [], visible: true },
    ]);
  }, []);

  function saveDraft() {
    setSavedStatus("saving");
    const draft = {
      sections,
      newsletterTitle,
      viewMode,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    logChange("Saved draft");
    setSavedStatus("saved");
    setTimeout(() => setSavedStatus("idle"), 1800);
  }

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      sections.forEach((s) => s.images.forEach((img) => URL.revokeObjectURL(img.url)));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Page header */}
        <div className="px-8 pt-6 pb-0 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#4a7c59]/10 flex items-center justify-center">
              <Newspaper className="w-4 h-4 text-[#4a7c59]" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold font-heading text-gray-900 leading-tight">Weekly Newsletter</h1>
              <p className="text-xs text-gray-400 font-body">Collaborate, design, and publish your class newsletter</p>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={saveDraft}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-body font-semibold rounded-lg border transition-colors ${
                  savedStatus === "saved"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800"
                }`}
              >
                {savedStatus === "saved" ? (
                  <><CheckCircle2 className="w-4 h-4" /> Saved</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Draft</>
                )}
              </button>
              <button
                onClick={() => setHistoryOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-body text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
              >
                <History className="w-4 h-4" />
                View History
              </button>
            </div>
          </div>

          <nav className="flex gap-0.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-body font-medium border-b-2 transition-colors ${
                  activeTab === id
                    ? "border-[#4a7c59] text-[#4a7c59] font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {id === "changelog" && changeLog.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-[#4a7c59]/10 text-[#4a7c59] text-xs font-semibold rounded-full">
                    {changeLog.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="flex flex-1 overflow-hidden">
          {activeTab === "editor" && (
            <EditorTab
              sections={sections}
              teachers={teachers}
              currentUserId={currentUserId}
              patchSection={patchSection}
              addSection={addSection}
              newsletterTitle={newsletterTitle}
              setNewsletterTitle={setNewsletterTitle}
              viewMode={viewMode}
              setViewMode={setViewMode}
              logChange={logChange}
              restoredAt={restoredAt}
              dismissRestore={() => setRestoredAt(null)}
            />
          )}
          {activeTab === "changelog" && <ChangeLogTab changeLog={changeLog} />}
          {activeTab === "publish" && (
            <PublishTab
              sections={sections}
              newsletterTitle={newsletterTitle}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          )}
        </div>
      </div>

      <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  );
}
