"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  FileEdit,
  Send,
  Plus,
  Bold,
  Italic,
  List,
  Link,
  Minus,
  Image as ImageIcon,
  Users,
  CheckCircle2,
  Eye,
  EyeOff,
  ChevronRight,
  Newspaper,
  X,
  Upload,
  ExternalLink,
  ClipboardList,
  Save,
  Lock,
  Loader2,
  Library,
} from "lucide-react";
import {
  createNewsletter,
  saveDraft,
  publishNewsletter,
  uploadSectionImage,
  deleteSectionImage,
  type DBNewsletter,
} from "@/app/actions/newsletter";
import PhotoLibraryPickerModal from "./PhotoLibraryPickerModal";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "editor" | "changelog" | "publish";

export interface Teacher {
  id: string;
  full_name: string | null;
  profile_image_url: string | null;
  role: string | null;
}

interface LocalImage {
  id: string;        // local React key (crypto.randomUUID or dbId)
  dbId?: string;     // newsletters.section_images.id — set after upload completes
  storagePath?: string;
  url: string;       // signed URL (from DB) or blob URL (during upload)
  name: string;
  uploading?: boolean;
  sourceBucket?: string;
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

interface PendingChange {
  type: "body" | "title_rename" | "image_add" | "image_remove" | "section_add" | "visibility" | "newsletter_title" | "teacher_update";
  sectionLabel?: string;
  detail?: string;
}

interface ChangeEntry {
  id: string;
  savedAt: Date;
  teacherName: string;
  teacherAvatar: string | null;
  summary: string[];
}

type NewsletterStatus = "published" | "draft";

interface Newsletter {
  id: string;
  title: string;
  weekRange: string;
  status: NewsletterStatus;
  publishedAt?: string | null;
  sections: SectionData[];
  newsletterTitle: string;
  viewMode: "traditional" | "slideshow";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function dbToNewsletter(db: DBNewsletter): Newsletter {
  return {
    id: db.id,
    title: db.title,
    weekRange: db.week_range,
    status: db.status,
    publishedAt: db.published_at,
    newsletterTitle: db.title,
    viewMode: db.view_mode,
    sections: db.sections.map((s) => ({
      id: s.id,
      label: s.label,
      body: s.body,
      images: s.images.map((img) => ({
        id: img.id,
        dbId: img.id,
        storagePath: img.storage_path,
        url: img.signed_url ?? '',
        name: img.storage_path.split('/').pop() ?? '',
        sourceBucket: img.source_bucket,
      })),
      visible: s.visible,
      isClassUpdates: s.is_class_updates,
      teacherUpdates: s.teacher_updates.map((tu) => ({
        teacherId: tu.teacher_id,
        body: tu.body,
      })),
    })),
  };
}

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
  replaceSectionImage: (sectionId: string, placeholderId: string, replacement: LocalImage | null) => void;
  addSection: () => void;
  newsletterTitle: string;
  setNewsletterTitle: (v: string) => void;
  viewMode: "traditional" | "slideshow";
  setViewMode: (v: "traditional" | "slideshow") => void;
  recordChange: (change: PendingChange) => void;
  isReadOnly: boolean;
  selectedWeekRange: string;
  onToggleVisibility: (s: SectionData) => void;
}

function EditorTab({
  sections,
  teachers,
  currentUserId,
  patchSection,
  replaceSectionImage,
  addSection,
  newsletterTitle,
  setNewsletterTitle,
  viewMode,
  setViewMode,
  recordChange,
  isReadOnly,
  selectedWeekRange,
  onToggleVisibility,
}: EditorTabProps) {
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? "");
  const [libraryPickerForSection, setLibraryPickerForSection] = useState<string | null>(null);
const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function insertLink() {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.slice(start, end) || "link text";
    const url = window.prompt("Enter URL:", "https://");
    if (!url) return;
    const insertion = `[${selected}](${url})`;
    const newVal = ta.value.slice(0, start) + insertion + ta.value.slice(end);
    patchSection(activeSectionId, { body: newVal });
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + insertion.length, start + insertion.length);
    });
  }

  function insertDivider() {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const insertion = "\n---\n";
    const newVal = ta.value.slice(0, start) + insertion + ta.value.slice(start);
    patchSection(activeSectionId, { body: newVal });
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + insertion.length, start + insertion.length);
    });
  }

  function handleBodyChange(value: string) {
    patchSection(activeSectionId, { body: value });
    recordChange({ type: "body", sectionLabel: activeSection?.label || "section" });
  }

  async function handleImageFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const { compressImage } = await import("@/app/utils/compressImage");
    const compressed = await Promise.all(Array.from(files).map((f) => compressImage(f)));

    // Add optimistic placeholders immediately so the user sees something
    const placeholders: LocalImage[] = compressed.map((f) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(f),
      name: f.name,
      uploading: true,
    }));
    patchSection(activeSectionId, {
      images: [...(activeSection?.images ?? []), ...placeholders],
    });

    // Upload each file and replace placeholder with persisted record
    const sectionId = activeSectionId;
    await Promise.all(
      compressed.map(async (file, i) => {
        const placeholder = placeholders[i];
        const fd = new FormData();
        fd.append("sectionId", sectionId);
        fd.append("file", file);
        const result = await uploadSectionImage(fd);
        if (result.data) {
          replaceSectionImage(sectionId, placeholder.id, {
            id: result.data.id,
            dbId: result.data.id,
            storagePath: result.data.storage_path,
            url: result.data.signed_url,
            name: file.name,
            uploading: false,
          });
          URL.revokeObjectURL(placeholder.url);
        } else {
          replaceSectionImage(sectionId, placeholder.id, null);
          URL.revokeObjectURL(placeholder.url);
          console.error("Image upload failed:", result.error);
        }
      })
    );

    recordChange({ type: "image_add", sectionLabel: activeSection?.label || "section", detail: String(compressed.length) });
  }

  function removeImage(imgId: string) {
    const img = activeSection?.images.find((i) => i.id === imgId);
    if (!img) return;
    // Revoke blob URL if it's a local one (uploading state)
    if (img.uploading) URL.revokeObjectURL(img.url);
    patchSection(activeSectionId, {
      images: (activeSection?.images ?? []).filter((i) => i.id !== imgId),
    });
    // Delete from storage if already persisted
    if (img.dbId) {
      deleteSectionImage(img.dbId).catch((err) => console.error("deleteSectionImage error:", err));
    }
    recordChange({ type: "image_remove", sectionLabel: activeSection?.label || "section" });
  }

  function handleLibraryConfirm(newImages: LocalImage[]) {
    if (!libraryPickerForSection) return;
    const targetId = libraryPickerForSection;
    const targetSection = sections.find((s) => s.id === targetId);
    patchSection(targetId, {
      images: [...(targetSection?.images ?? []), ...newImages],
    });
    recordChange({ type: "image_add", sectionLabel: targetSection?.label || "section", detail: String(newImages.length) });
    setLibraryPickerForSection(null);
  }

  function toggleVisibility(s: SectionData, e: React.MouseEvent) {
    e.stopPropagation();
    const next = !s.visible;
    patchSection(s.id, { visible: next });
    recordChange({ type: "visibility", sectionLabel: s.label, detail: next ? "shown" : "hidden" });
    onToggleVisibility({ ...s, visible: next });
  }

  function patchTeacherUpdate(teacherId: string, body: string) {
    const current = activeSection?.teacherUpdates ?? [];
    const updated = current.map((tu) =>
      tu.teacherId === teacherId ? { ...tu, body } : tu
    );
    patchSection(activeSectionId, { teacherUpdates: updated });
    recordChange({ type: "teacher_update", sectionLabel: activeSection?.label || "Class Updates" });
  }

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Left sidebar */}
      <aside className="w-60 border-r border-gray-100 bg-gray-50 flex flex-col">
        <div className="px-4 pt-5 pb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            {isReadOnly ? "Published" : "Current Draft"}
          </p>
          <p className="text-sm font-semibold text-gray-800 font-body">{selectedWeekRange}</p>
        </div>

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
                  {!isReadOnly && (
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
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {!isReadOnly && (
          <div className="px-3 pb-4 pt-2">
            <button
              onClick={() => {
                addSection();
                recordChange({ type: "section_add" });
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#4a7c59] text-white text-sm font-body font-semibold rounded-xl hover:bg-[#3d6b4a] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </button>
          </div>
        )}
      </aside>

      {/* Center editor */}
      <div className="flex-1 flex flex-col overflow-y-auto px-8 py-6">
        {isReadOnly && (
          <div className="mb-5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2.5 text-sm font-body text-gray-500">
            <Lock className="w-4 h-4 flex-shrink-0 text-gray-400" />
            This newsletter has been published and is read-only.
          </div>
        )}

        {activeSection?.isClassUpdates ? (
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
                    ref={(el) => {
                      if (el) {
                        el.style.height = "auto";
                        el.style.height = el.scrollHeight + "px";
                      }
                    }}
                    value={update?.body ?? ""}
                    onChange={(e) => !isReadOnly && patchTeacherUpdate(teacher.id, e.target.value)}
                    onInput={(e) => {
                      const el = e.currentTarget;
                      el.style.height = "auto";
                      el.style.height = el.scrollHeight + "px";
                    }}
                    readOnly={isReadOnly}
                    placeholder={`${teacher.full_name?.split(" ")[0] ?? "Teacher"}'s update for this week…`}
                    className={`w-full border border-gray-100 rounded-xl p-3 text-sm text-gray-700 font-body resize-none outline-none leading-relaxed overflow-hidden ${
                      isReadOnly
                        ? "bg-gray-50 cursor-default"
                        : "bg-gray-50 focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59] placeholder:text-gray-400"
                    }`}
                  />
                </div>
              );
            })}

            {!isReadOnly && (
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
                  <button
                    onClick={() => setLibraryPickerForSection(activeSection?.id ?? "")}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold font-body text-[#4a7c59] border border-[#4a7c59]/30 bg-[#4a7c59]/5 rounded-lg hover:bg-[#4a7c59]/10 transition-colors"
                  >
                    <Library className="w-3.5 h-3.5" />
                    From Library
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
                        <img src={img.url} alt={img.name} className={`w-20 h-20 object-cover rounded-xl border border-gray-100 ${img.uploading ? "opacity-50" : ""}`} />
                        {img.uploading && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-white animate-spin drop-shadow" />
                          </div>
                        )}
                        {!img.uploading && (
                          <button onClick={() => removeImage(img.id)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        )}
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
          </div>
        ) : (
          <>
            {!isReadOnly && (
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
                <button title="Insert link" onClick={insertLink} className="p-2 text-gray-500 hover:text-[#4a7c59] hover:bg-white rounded-lg transition-colors">
                  <Link className="w-4 h-4" />
                </button>
                <button title="Divider" onClick={insertDivider} className="p-2 text-gray-500 hover:text-[#4a7c59] hover:bg-white rounded-lg transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <button title="Add images" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-[#4a7c59] hover:bg-white rounded-lg transition-colors">
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            {activeSection && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <input
                    key={activeSectionId + "-title"}
                    type="text"
                    value={activeSection.label}
                    readOnly={isReadOnly}
                    onChange={(e) => {
                      if (isReadOnly) return;
                      patchSection(activeSectionId, { label: e.target.value });
                      recordChange({ type: "title_rename", sectionLabel: activeSection?.label, detail: e.target.value });
                    }}
                    className={`text-2xl font-semibold font-heading text-gray-900 bg-transparent border-none outline-none flex-1 placeholder:text-gray-300 ${isReadOnly ? "cursor-default" : ""}`}
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
                  readOnly={isReadOnly}
                  onChange={(e) => { if (!isReadOnly) handleBodyChange(e.target.value); }}
                  placeholder="Start writing this section…"
                  className={`w-full min-h-[200px] border border-gray-100 rounded-2xl p-5 text-sm text-gray-700 font-body resize-none outline-none placeholder:text-gray-400 leading-relaxed mb-5 ${
                    isReadOnly
                      ? "bg-gray-50 cursor-default"
                      : "bg-gray-50 focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59]"
                  }`}
                  rows={8}
                />
              </>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageFiles(e.target.files)} />

            {activeSection && !isReadOnly && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Section Images</p>
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold font-body text-[#4a7c59] border border-[#4a7c59]/30 bg-[#4a7c59]/5 rounded-lg hover:bg-[#4a7c59]/10 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    Add Images
                  </button>
                  <button onClick={() => setLibraryPickerForSection(activeSection.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold font-body text-[#4a7c59] border border-[#4a7c59]/30 bg-[#4a7c59]/5 rounded-lg hover:bg-[#4a7c59]/10 transition-colors">
                    <Library className="w-3.5 h-3.5" />
                    From Library
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
                        <img src={img.url} alt={img.name} className={`w-20 h-20 object-cover rounded-xl border border-gray-100 ${img.uploading ? "opacity-50" : ""}`} />
                        {img.uploading && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-white animate-spin drop-shadow" />
                          </div>
                        )}
                        {!img.uploading && (
                          <button onClick={() => removeImage(img.id)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        )}
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
            readOnly={isReadOnly}
            onChange={(e) => {
              if (isReadOnly) return;
              setNewsletterTitle(e.target.value);
              recordChange({ type: "newsletter_title", detail: e.target.value });
            }}
            className={`w-full text-sm font-body text-gray-800 border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 outline-none ${
              isReadOnly ? "cursor-default" : "focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
            }`}
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Week</p>
          <div className="text-sm font-body text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
            {selectedWeekRange}
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

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Parent View</p>
          <div className={`flex rounded-xl overflow-hidden border border-gray-200 text-sm font-body ${isReadOnly ? "opacity-60 pointer-events-none" : ""}`}>
            <button
              onClick={() => !isReadOnly && setViewMode("traditional")}
              className={`flex-1 py-2 transition-colors ${viewMode === "traditional" ? "bg-[#4a7c59] text-white font-semibold" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              Traditional
            </button>
            <button
              onClick={() => !isReadOnly && setViewMode("slideshow")}
              className={`flex-1 py-2 transition-colors ${viewMode === "slideshow" ? "bg-[#4a7c59] text-white font-semibold" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              Slideshow
            </button>
          </div>
          <p className="text-xs text-gray-400 font-body mt-1.5">Choose how parents see this newsletter.</p>
        </div>
      </aside>

      {libraryPickerForSection && (
        <PhotoLibraryPickerModal
          sectionId={libraryPickerForSection}
          onConfirm={handleLibraryConfirm}
          onClose={() => setLibraryPickerForSection(null)}
        />
      )}
    </div>
  );
}

// ── Change Log Tab ────────────────────────────────────────────────────────────

function ChangeLogTab({ changeLog }: { changeLog: ChangeEntry[] }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, [tick]);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold font-heading text-gray-900">Change Log</h2>
        <p className="text-sm text-gray-500 font-body mt-0.5">Changes are recorded each time you save a draft.</p>
      </div>

      {changeLog.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <ClipboardList className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold font-body text-gray-500 mb-1">No saves yet</p>
          <p className="text-xs text-gray-400 font-body">Click Save Draft to record your changes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...changeLog].reverse().map((entry) => (
            <div key={entry.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2.5 mb-3">
                {entry.teacherAvatar ? (
                  <img src={entry.teacherAvatar} alt={entry.teacherName} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#7FA888] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {getInitials(entry.teacherName)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold font-body text-gray-800">{entry.teacherName}</span>
                  <span className="text-xs text-gray-400 font-body ml-2" suppressHydrationWarning>
                    Saved {relativeTime(entry.savedAt)}
                  </span>
                </div>
                <Save className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              </div>
              <ul className="space-y-1 pl-1">
                {entry.summary.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm font-body text-gray-600">
                    <span className="text-[#4a7c59] mt-0.5 flex-shrink-0">•</span>
                    {line}
                  </li>
                ))}
              </ul>
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
  newsletterId: string;
  onPublished: () => void;
  openPreview: () => void;
}

function PublishTab({ sections, newsletterId, onPublished, openPreview }: PublishTabProps) {
  const [recipients, setRecipients] = useState<"all" | "program">("all");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const visibleSections = sections.filter((s) => s.visible);

  async function handlePublish() {
    setPublishing(true);
    setPublishError(null);
    const result = await publishNewsletter(newsletterId);
    setPublishing(false);
    if (result.error) {
      setPublishError(result.error);
    } else {
      onPublished();
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8">
      <div className="max-w-lg mx-auto flex flex-col gap-5">
        {visibleSections.length < sections.length && (
          <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-sm font-body text-amber-700">
            {sections.length - visibleSections.length} section{sections.length - visibleSections.length > 1 ? "s are" : " is"} hidden and won&apos;t appear in the published newsletter.
          </div>
        )}

        {publishError && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm font-body text-red-700">
            {publishError}
          </div>
        )}

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

        <div className="flex gap-3">
          <button
            onClick={openPreview}
            className="flex items-center gap-1.5 px-4 py-3 text-sm font-body font-semibold rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Preview
          </button>

          <button
            onClick={handlePublish}
            disabled={publishing}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#4a7c59] text-white text-sm font-semibold font-body rounded-xl hover:bg-[#3d6b4a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {publishing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</>
            ) : (
              <><Send className="w-4 h-4" /> Publish Newsletter</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Newsletter Sidebar ────────────────────────────────────────────────────────

interface NewsletterSidebarProps {
  newsletters: Newsletter[];
  selectedId: string;
  onSelect: (id: string) => void;
  onNew: () => Promise<void>;
  isCreating: boolean;
}

function StatusBadge({ status }: { status: NewsletterStatus }) {
  if (status === "draft") {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold font-body text-gray-400">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
        Draft
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-semibold font-body text-green-600">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
      Published
    </span>
  );
}

function NewsletterSidebar({ newsletters, selectedId, onSelect, onNew, isCreating }: NewsletterSidebarProps) {
  const drafts = newsletters.filter((n) => n.status === "draft");
  const published = newsletters.filter((n) => n.status === "published");

  function SidebarItem({ newsletter }: { newsletter: Newsletter }) {
    const isSelected = newsletter.id === selectedId;
    return (
      <button
        onClick={() => onSelect(newsletter.id)}
        className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors border ${
          isSelected
            ? "bg-[#4a7c59]/8 border-[#4a7c59]/20 text-gray-900"
            : "border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800"
        }`}
      >
        <p className={`text-sm font-body truncate mb-0.5 ${isSelected ? "font-semibold" : "font-medium"}`}>
          {newsletter.title}
        </p>
        <p className="text-xs text-gray-400 font-body truncate mb-1">{newsletter.weekRange}</p>
        <StatusBadge status={newsletter.status} />
      </button>
    );
  }

  function SidebarGroup({ label, items }: { label: string; items: Newsletter[] }) {
    if (items.length === 0) return null;
    return (
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 mb-1">{label}</p>
        <div className="space-y-0.5">
          {items.map((n) => <SidebarItem key={n.id} newsletter={n} />)}
        </div>
      </div>
    );
  }

  return (
    <aside className="w-64 border-r border-gray-100 bg-gray-50 flex flex-col flex-shrink-0">
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <h2 className="text-sm font-semibold font-heading text-gray-800">Newsletters</h2>
        <button
          onClick={onNew}
          disabled={isCreating}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold font-body text-[#4a7c59] border border-[#4a7c59]/30 bg-[#4a7c59]/5 rounded-lg hover:bg-[#4a7c59]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {newsletters.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-xs text-gray-400 font-body">No newsletters yet. Click New to create one.</p>
          </div>
        ) : (
          <>
            <SidebarGroup label="Drafts" items={drafts} />
            <SidebarGroup label="Published" items={published} />
          </>
        )}
      </div>
    </aside>
  );
}

// ── New Newsletter Modal ───────────────────────────────────────────────────────

interface NewNewsletterModalProps {
  onConfirm: (title: string, weekRange: string) => Promise<void>;
  onCancel: () => void;
  isCreating: boolean;
}

function NewNewsletterModal({ onConfirm, onCancel, isCreating }: NewNewsletterModalProps) {
  const [title, setTitle] = useState("");
  const [weekRange, setWeekRange] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !weekRange.trim()) return;
    await onConfirm(title.trim(), weekRange.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold font-heading text-gray-900 mb-4">New Newsletter</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. May 26–30 Weekly Update"
              className="w-full text-sm font-body text-gray-900 placeholder:text-gray-400 border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">Week Range</label>
            <input
              type="text"
              value={weekRange}
              onChange={(e) => setWeekRange(e.target.value)}
              placeholder="e.g. May 26 – May 30, 2026"
              className="w-full text-sm font-body text-gray-900 placeholder:text-gray-400 border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 text-sm font-body font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !weekRange.trim() || isCreating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4a7c59] text-white text-sm font-body font-semibold rounded-xl hover:bg-[#3d6b4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const EDITABLE_TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "editor",    label: "Editor",     icon: FileEdit     },
  { id: "changelog", label: "Change Log", icon: ClipboardList },
  { id: "publish",   label: "Publish",    icon: Send         },
];

const READONLY_TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "editor",    label: "Editor",     icon: FileEdit     },
  { id: "changelog", label: "Change Log", icon: ClipboardList },
];

interface NewsletterPageClientProps {
  teachers: Teacher[];
  currentUserId: string;
  initialNewsletters: DBNewsletter[];
}

export default function NewsletterPageClient({ teachers, currentUserId, initialNewsletters }: NewsletterPageClientProps) {
  const [newsletters, setNewsletters] = useState<Newsletter[]>(() =>
    initialNewsletters.map(dbToNewsletter)
  );
  const [activeTab, setActiveTab] = useState<Tab>("editor");
  const [savedStatus, setSavedStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [changeLog, setChangeLog] = useState<ChangeEntry[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const firstDraft = newsletters.find((n) => n.status === "draft");
  const defaultSelected = firstDraft ?? newsletters[0];

  const [selectedNewsletterId, setSelectedNewsletterId] = useState<string>(defaultSelected?.id ?? "");

  const currentTeacher = teachers.find((t) => t.id === currentUserId) ?? teachers[0];
  const pendingChanges = useRef<PendingChange[]>([]);

  // Derive sections/title/viewMode from the selected newsletter
  const selectedNewsletter = newsletters.find((n) => n.id === selectedNewsletterId);

  const [sections, setSections] = useState<SectionData[]>(selectedNewsletter?.sections ?? []);
  const [newsletterTitle, setNewsletterTitle] = useState(selectedNewsletter?.newsletterTitle ?? "");
  const [viewMode, setViewMode] = useState<"traditional" | "slideshow">(selectedNewsletter?.viewMode ?? "traditional");

  // Sync sections/title/viewMode into the newsletters list when they change
  const syncToList = useCallback(() => {
    setNewsletters((prev) =>
      prev.map((n) =>
        n.id === selectedNewsletterId
          ? { ...n, title: newsletterTitle, newsletterTitle, viewMode, sections }
          : n
      )
    );
  }, [selectedNewsletterId, newsletterTitle, viewMode, sections]);

  // Load initial change log from DB data
  useEffect(() => {
    const nl = initialNewsletters.find((n) => n.id === selectedNewsletterId);
    if (nl) {
      setChangeLog(
        nl.change_log.map((entry) => ({
          id: entry.id,
          savedAt: new Date(entry.created_at),
          teacherName: entry.teacher_name ?? "Unknown",
          teacherAvatar: entry.teacher_avatar,
          summary: entry.summary,
        }))
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNewsletterId]);

  function selectNewsletter(id: string) {
    syncToList();
    const nl = newsletters.find((n) => n.id === id);
    if (!nl) return;

    setSelectedNewsletterId(id);
    setSections(nl.sections);
    setNewsletterTitle(nl.newsletterTitle);
    setViewMode(nl.viewMode);
    setIsReadOnly(nl.status === "published");
    setActiveTab("editor");
    pendingChanges.current = [];

    // Load change log for the newly selected newsletter
    const dbNl = initialNewsletters.find((n) => n.id === id);
    if (dbNl) {
      setChangeLog(
        dbNl.change_log.map((entry) => ({
          id: entry.id,
          savedAt: new Date(entry.created_at),
          teacherName: entry.teacher_name ?? "Unknown",
          teacherAvatar: entry.teacher_avatar,
          summary: entry.summary,
        }))
      );
    } else {
      setChangeLog([]);
    }
  }

  const recordChange = useCallback((change: PendingChange) => {
    pendingChanges.current.push(change);
  }, []);

  const patchSection = useCallback((id: string, patch: Partial<SectionData>) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const replaceSectionImage = useCallback((sectionId: string, placeholderId: string, replacement: LocalImage | null) => {
    setSections((prev) => prev.map((s) => {
      if (s.id !== sectionId) return s;
      const filtered = s.images.filter((img) => img.id !== placeholderId);
      return { ...s, images: replacement ? [...filtered, replacement] : filtered };
    }));
  }, []);

  const addSection = useCallback(() => {
    setSections((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: "New Section", body: "", images: [], visible: true },
    ]);
  }, []);

  async function handleToggleVisibility(updatedSection: SectionData) {
    if (isReadOnly || !selectedNewsletterId) return;
    const updatedSections = sections.map((s) =>
      s.id === updatedSection.id ? updatedSection : s
    );
    await saveDraft({
      newsletterId: selectedNewsletterId,
      title: newsletterTitle,
      viewMode,
      sections: updatedSections.map((s, i) => ({
        id: s.id,
        label: s.label,
        body: s.body,
        visible: s.visible,
        sort_order: i,
        is_class_updates: s.isClassUpdates ?? false,
        teacher_updates: (s.teacherUpdates ?? []).map((tu) => ({
          teacher_id: tu.teacherId,
          body: tu.body,
        })),
      })),
      summary: [],
    });
  }

  async function handleSaveDraft() {
    if (isReadOnly || !selectedNewsletterId) return;
    setSavedStatus("saving");

    const pending = pendingChanges.current;
    const summary = pending.length > 0 ? buildSummary(pending) : [];

    const payload = {
      newsletterId: selectedNewsletterId,
      title: newsletterTitle,
      viewMode,
      sections: sections.map((s, i) => ({
        id: s.id,
        label: s.label,
        body: s.body,
        visible: s.visible,
        sort_order: i,
        is_class_updates: s.isClassUpdates ?? false,
        teacher_updates: (s.teacherUpdates ?? []).map((tu) => ({
          teacher_id: tu.teacherId,
          body: tu.body,
        })),
      })),
      summary,
    };

    const result = await saveDraft(payload);

    if (result.error) {
      console.error("saveDraft error:", result.error);
      setSavedStatus("idle");
      return;
    }

    if (summary.length > 0) {
      const entry: ChangeEntry = {
        id: crypto.randomUUID(),
        savedAt: new Date(),
        teacherName: currentTeacher?.full_name ?? "You",
        teacherAvatar: currentTeacher?.profile_image_url ?? null,
        summary,
      };
      setChangeLog((prev) => [...prev, entry]);
    }

    pendingChanges.current = [];
    setSavedStatus("saved");
    setTimeout(() => setSavedStatus("idle"), 1800);
  }

  function buildSummary(changes: PendingChange[]): string[] {
    const lines: string[] = [];
    const editedSections = new Set<string>();
    const renamedSections = new Map<string, string>();
    let titleChanged = false;
    let titleFinal = "";

    for (const c of changes) {
      if (c.type === "body" && c.sectionLabel) editedSections.add(c.sectionLabel);
      if (c.type === "teacher_update" && c.sectionLabel) editedSections.add(c.sectionLabel);
      if (c.type === "title_rename" && c.sectionLabel && c.detail) renamedSections.set(c.sectionLabel, c.detail);
      if (c.type === "newsletter_title" && c.detail) { titleChanged = true; titleFinal = c.detail; }
      if (c.type === "section_add") lines.push("Added a new section");
      if (c.type === "visibility" && c.sectionLabel) lines.push(`Section "${c.sectionLabel}" ${c.detail ?? "toggled"}`);
      if (c.type === "image_add" && c.sectionLabel && c.detail) lines.push(`Added ${c.detail} image${Number(c.detail) !== 1 ? "s" : ""} to "${c.sectionLabel}"`);
      if (c.type === "image_remove" && c.sectionLabel) lines.push(`Removed an image from "${c.sectionLabel}"`);
    }

    for (const section of editedSections) lines.push(`Edited body in "${section}"`);
    for (const [, name] of renamedSections) lines.push(`Renamed section to "${name}"`);
    if (titleChanged) lines.push(`Updated newsletter title to "${titleFinal}"`);

    return lines;
  }

  function openPreview() {
    window.open(`/teacher/dashboard/newsletter/${selectedNewsletterId}/preview`, "_blank");
  }

  async function handleNew() {
    setShowNewModal(true);
  }

  async function handleCreateNewsletter(title: string, weekRange: string) {
    setIsCreating(true);
    const result = await createNewsletter({
      title,
      weekRange,
      teacherIds: teachers.map((t) => t.id),
    });
    setIsCreating(false);

    if (result.error || !result.data) {
      console.error("createNewsletter error:", result.error);
      return;
    }

    const newNl = dbToNewsletter(result.data);
    setNewsletters((prev) => [newNl, ...prev]);
    setShowNewModal(false);

    // Select the new newsletter
    setSelectedNewsletterId(newNl.id);
    setSections(newNl.sections);
    setNewsletterTitle(newNl.newsletterTitle);
    setViewMode(newNl.viewMode);
    setIsReadOnly(false);
    setActiveTab("editor");
    setChangeLog([]);
    pendingChanges.current = [];
  }

  function handlePublished() {
    setIsReadOnly(true);
    setActiveTab("editor");
    setNewsletters((prev) =>
      prev.map((n) =>
        n.id === selectedNewsletterId
          ? { ...n, status: "published" as NewsletterStatus, publishedAt: new Date().toISOString() }
          : n
      )
    );
  }

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      sections.forEach((s) => s.images.forEach((img) => URL.revokeObjectURL(img.url)));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const TABS = isReadOnly ? READONLY_TABS : EDITABLE_TABS;

  if (!selectedNewsletter && newsletters.length === 0) {
    return (
      <div className="flex flex-1 overflow-hidden">
        <NewsletterSidebar
          newsletters={newsletters}
          selectedId=""
          onSelect={() => {}}
          onNew={handleNew}
          isCreating={isCreating}
        />
        <div className="flex-1 flex items-center justify-center text-center px-8">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Newspaper className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-base font-semibold font-heading text-gray-700 mb-1">No newsletters yet</p>
            <p className="text-sm text-gray-400 font-body mb-4">Click New to create your first newsletter.</p>
            <button
              onClick={handleNew}
              disabled={isCreating}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#4a7c59] text-white text-sm font-semibold font-body rounded-xl hover:bg-[#3d6b4a] transition-colors mx-auto disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              New Newsletter
            </button>
          </div>
        </div>
        {showNewModal && (
          <NewNewsletterModal
            onConfirm={handleCreateNewsletter}
            onCancel={() => setShowNewModal(false)}
            isCreating={isCreating}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <NewsletterSidebar
        newsletters={newsletters}
        selectedId={selectedNewsletterId}
        onSelect={selectNewsletter}
        onNew={handleNew}
        isCreating={isCreating}
      />

      {/* Right column: header + tab content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Right header */}
        <div className="px-8 pt-6 pb-0 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#4a7c59]/10 flex items-center justify-center">
              <Newspaper className="w-4 h-4 text-[#4a7c59]" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold font-heading text-gray-900 leading-tight truncate">{selectedNewsletter?.title}</h1>
              <p className="text-xs text-gray-400 font-body">{selectedNewsletter?.weekRange}</p>
            </div>

            {!isReadOnly && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveDraft}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-body font-semibold rounded-lg border transition-colors ${
                    savedStatus === "saved"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : savedStatus === "saving"
                      ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800"
                  }`}
                  disabled={savedStatus === "saving"}
                >
                  {savedStatus === "saved" ? (
                    <><CheckCircle2 className="w-4 h-4" /> Saved</>
                  ) : savedStatus === "saving" ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Draft</>
                  )}
                </button>
              </div>
            )}
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
              replaceSectionImage={replaceSectionImage}
              addSection={addSection}
              newsletterTitle={newsletterTitle}
              setNewsletterTitle={setNewsletterTitle}
              viewMode={viewMode}
              setViewMode={setViewMode}
              recordChange={recordChange}
              isReadOnly={isReadOnly}
              selectedWeekRange={selectedNewsletter?.weekRange ?? ""}
              onToggleVisibility={handleToggleVisibility}
            />
          )}
          {activeTab === "changelog" && <ChangeLogTab changeLog={changeLog} />}
          {activeTab === "publish" && !isReadOnly && selectedNewsletterId && (
            <PublishTab
              sections={sections}
              newsletterId={selectedNewsletterId}
              onPublished={handlePublished}
              openPreview={openPreview}
            />
          )}
        </div>
      </div>

      {showNewModal && (
        <NewNewsletterModal
          onConfirm={handleCreateNewsletter}
          onCancel={() => setShowNewModal(false)}
          isCreating={isCreating}
        />
      )}
    </div>
  );
}
