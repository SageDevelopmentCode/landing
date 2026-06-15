"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Globe,
  EyeOff,
  Upload,
  Library,
  X,
  Bold,
  Italic,
  List,
  Link,
  Minus,
  Loader2,
  Image as ImageIcon,
  ExternalLink,
  Eye,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  saveBlogDraft,
  publishPost,
  unpublishPost,
  uploadBlogCoverImage,
  addLibraryCoverToBlog,
  deleteBlogCoverImage,
  type BlogPost,
} from "@/app/actions/blog";
import PhotoLibraryPickerModal from "@/app/teacher/dashboard/newsletter/PhotoLibraryPickerModal";
import { type TeacherPhoto } from "@/app/actions/photos";

interface Props {
  post: BlogPost;
  currentUserId: string;
}

export default function BlogEditorClient({ post, currentUserId }: Props) {
  const router = useRouter();

  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body);
  const [excerpt, setExcerpt] = useState(post.excerpt ?? "");
  const [metaDescription, setMetaDescription] = useState(post.meta_description ?? "");
  const [status, setStatus] = useState<"draft" | "published">(post.status);
  const [publishedAt, setPublishedAt] = useState<string | null>(post.published_at);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(post.cover_image_signed_url);
  const [coverUploading, setCoverUploading] = useState(false);
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-resize textarea without jumping scroll position
  useEffect(() => {
    const ta = textareaRef.current;
    const scroller = editorScrollRef.current;
    if (!ta) return;
    const scrollTop = scroller?.scrollTop ?? 0;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
    if (scroller) scroller.scrollTop = scrollTop;
  }, [body]);

  // Auto-save on change (debounced 2s)
  const scheduleAutoSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await saveBlogDraft({ postId: post.id, title, body, excerpt, meta_description: metaDescription });
    }, 2000);
  }, [post.id, title, body, excerpt, metaDescription]);

  useEffect(() => {
    scheduleAutoSave();
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [title, body, excerpt, metaDescription, scheduleAutoSave]);


  async function handleSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaving(true);
    const result = await saveBlogDraft({ postId: post.id, title, body, excerpt, meta_description: metaDescription });
    setSaving(false);
    setSaveMsg(result.error ? "Failed to save" : "Saved");
    setTimeout(() => setSaveMsg(null), 2000);
  }

  async function handlePublish() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setPublishing(true);
    await saveBlogDraft({ postId: post.id, title, body, excerpt, meta_description: metaDescription });
    const result = await publishPost(post.id);
    setPublishing(false);
    if (!result.error) {
      setStatus("published");
      setPublishedAt(new Date().toISOString());
    }
  }

  async function handleUnpublish() {
    setPublishing(true);
    const result = await unpublishPost(post.id);
    setPublishing(false);
    if (!result.error) {
      setStatus("draft");
      setPublishedAt(null);
    }
  }

  async function handleCoverFile(file: File | null) {
    if (!file) return;
    const { compressImage } = await import("@/app/utils/compressImage");
    const compressed = await compressImage(file);
    const blobUrl = URL.createObjectURL(compressed);
    setCoverImageUrl(blobUrl);
    setCoverUploading(true);
    const fd = new FormData();
    fd.append("postId", post.id);
    fd.append("file", compressed);
    const result = await uploadBlogCoverImage(fd);
    setCoverUploading(false);
    URL.revokeObjectURL(blobUrl);
    if (result.data) {
      setCoverImageUrl(result.data.signedUrl);
    } else {
      setCoverImageUrl(null);
    }
  }

  async function handleLibraryPick(photos: TeacherPhoto[]) {
    const photo = photos[0];
    if (!photo) return;
    setShowLibraryPicker(false);
    setCoverImageUrl(photo.signed_url ?? null);
    const result = await addLibraryCoverToBlog(post.id, photo.id);
    if (result.data) {
      setCoverImageUrl(result.data.signedUrl);
    } else {
      setCoverImageUrl(null);
    }
  }

  async function handleRemoveCover() {
    setCoverImageUrl(null);
    await deleteBlogCoverImage(post.id);
  }

  // Toolbar helpers
  function wrapSelection(before: string, after: string = before) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.slice(start, end);
    const newVal = ta.value.slice(0, start) + before + selected + after + ta.value.slice(end);
    setBody(newVal);
    requestAnimationFrame(() => {
      ta.focus({ preventScroll: true });
      ta.setSelectionRange(start + before.length, end + before.length);
    });
  }

  function insertBullet() {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const newVal = ta.value.slice(0, start) + "\n- " + ta.value.slice(start);
    setBody(newVal);
    requestAnimationFrame(() => {
      ta.focus({ preventScroll: true });
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
    setBody(newVal);
    requestAnimationFrame(() => {
      ta.focus({ preventScroll: true });
      ta.setSelectionRange(start + insertion.length, start + insertion.length);
    });
  }

  function insertDivider() {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const insertion = "\n---\n";
    const newVal = ta.value.slice(0, start) + insertion + ta.value.slice(start);
    setBody(newVal);
    requestAnimationFrame(() => {
      ta.focus({ preventScroll: true });
      ta.setSelectionRange(start + insertion.length, start + insertion.length);
    });
  }

  function insertHeading(level: 1 | 2 | 3) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const before = ta.value.slice(0, start);
    const lineStart = before.lastIndexOf("\n") + 1;
    const prefix = "#".repeat(level) + " ";
    const newVal = ta.value.slice(0, lineStart) + prefix + ta.value.slice(lineStart);
    setBody(newVal);
    requestAnimationFrame(() => {
      ta.focus({ preventScroll: true });
      ta.setSelectionRange(start + prefix.length, start + prefix.length);
    });
  }

  const slug = post.slug;
  const publicUrl = `/blog/${slug}`;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-5 py-2 border-b border-gray-100 bg-white">
          <button
            onClick={() => router.push("/teacher/dashboard/blog")}
            className="flex items-center gap-1 text-sm font-body text-gray-500 hover:text-gray-800 transition-colors mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="h-4 w-px bg-gray-200 mx-1" />

          <button onClick={() => insertHeading(1)} disabled={previewing} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors text-xs font-bold leading-none disabled:opacity-40 disabled:pointer-events-none" title="Heading 1">H1</button>
          <button onClick={() => insertHeading(2)} disabled={previewing} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors text-xs font-bold leading-none disabled:opacity-40 disabled:pointer-events-none" title="Heading 2">H2</button>
          <button onClick={() => insertHeading(3)} disabled={previewing} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors text-xs font-bold leading-none disabled:opacity-40 disabled:pointer-events-none" title="Heading 3">H3</button>

          <div className="h-4 w-px bg-gray-200 mx-1" />

          <button onClick={() => wrapSelection("**")} disabled={previewing} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-40 disabled:pointer-events-none" title="Bold">
            <Bold className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <button onClick={() => wrapSelection("_")} disabled={previewing} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-40 disabled:pointer-events-none" title="Italic">
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={insertBullet} disabled={previewing} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-40 disabled:pointer-events-none" title="Bullet list">
            <List className="w-4 h-4" />
          </button>
          <button onClick={insertLink} disabled={previewing} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-40 disabled:pointer-events-none" title="Insert link">
            <Link className="w-4 h-4" />
          </button>
          <button onClick={insertDivider} disabled={previewing} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-40 disabled:pointer-events-none" title="Divider">
            <Minus className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-gray-200 mx-1" />

          <button
            onClick={() => setPreviewing((v) => !v)}
            className={`flex items-center gap-1 p-1.5 rounded text-xs font-semibold font-body transition-colors ${
              previewing ? "bg-[#4a7c59]/10 text-[#4a7c59]" : "hover:bg-gray-100 text-gray-600"
            }`}
            title={previewing ? "Back to editing" : "Preview"}
          >
            <Eye className="w-4 h-4" />
            {previewing ? "Editing" : "Preview"}
          </button>

          <div className="flex-1" />

          {saveMsg && (
            <span className="text-xs font-body text-gray-400">{saveMsg}</span>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-body font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>

          {status === "published" ? (
            <button
              onClick={handleUnpublish}
              disabled={publishing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-body font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <EyeOff className="w-3.5 h-3.5" />}
              Unpublish
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-body font-semibold text-white bg-[#4a7c59] hover:bg-[#3d6b4a] rounded-lg transition-colors disabled:opacity-50"
            >
              {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
              Publish
            </button>
          )}
        </div>

        {/* Editor area */}
        <div ref={editorScrollRef} className="flex-1 overflow-y-auto px-10 py-8 max-w-3xl w-full mx-auto">
          {previewing ? (
            <article className="font-body text-gray-700 leading-relaxed">
              {coverImageUrl && (
                <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden mb-8 bg-[#f5f2ed]">
                  <img src={coverImageUrl} alt={title} className="w-full h-full object-cover" />
                </div>
              )}
              <h1 className="text-3xl font-bold font-heading text-gray-900 leading-tight mb-8">
                {title || <span className="text-gray-300">No title</span>}
              </h1>
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-2xl font-bold font-heading text-gray-900 mt-8 mb-3">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-bold font-heading text-gray-900 mt-7 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-semibold font-heading text-gray-900 mt-6 mb-2">{children}</h3>,
                  p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  a: ({ href, children }) => <a href={href} className="text-[#4a7c59] hover:underline" target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}>{children}</a>,
                  hr: () => <hr className="my-8 border-gray-200" />,
                  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-[#4a7c59]/30 pl-4 italic text-gray-500 my-4">{children}</blockquote>,
                }}
              >
                {body || "_Nothing written yet._"}
              </ReactMarkdown>
            </article>
          ) : (
            <>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title"
                className="w-full text-3xl font-semibold font-heading text-gray-900 border-none outline-none bg-transparent placeholder:text-gray-300 mb-6"
              />
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Start writing your post... (Markdown supported: **bold**, _italic_, - lists)"
                className="w-full resize-none text-base font-body text-gray-800 leading-relaxed border-none outline-none bg-transparent placeholder:text-gray-300 overflow-hidden"
                style={{ minHeight: "50vh" }}
              />
            </>
          )}
        </div>
      </div>

      {/* Right panel */}
      <aside className="w-64 border-l border-gray-100 bg-white flex flex-col overflow-y-auto px-4 py-5 gap-5 flex-shrink-0">
        {/* Status */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Status</p>
          <div className={`inline-flex items-center gap-1.5 text-xs font-semibold font-body px-2.5 py-1 rounded-full ${
            status === "published"
              ? "text-[#4a7c59] bg-[#4a7c59]/10"
              : "text-gray-500 bg-gray-100"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === "published" ? "bg-[#4a7c59]" : "bg-gray-400"}`} />
            {status === "published" ? "Published" : "Draft"}
          </div>
          {status === "published" && publishedAt && (
            <p className="text-xs font-body text-gray-400 mt-1">
              {new Date(publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
          {status === "published" && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 mt-1.5 text-xs font-body text-[#4a7c59] hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              View live post
            </a>
          )}
        </div>

        {/* Slug */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">URL Slug</p>
          <p className="text-xs font-body text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-2 break-all">/blog/{slug}</p>
        </div>

        {/* Excerpt */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Excerpt</p>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short description shown on the blog listing page…"
            rows={3}
            className="w-full text-xs font-body text-gray-700 border border-gray-200 bg-gray-50 rounded-lg px-2.5 py-2 outline-none resize-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59] placeholder:text-gray-300"
          />
        </div>

        {/* Meta Description */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Meta Description</p>
          <p className="text-[10px] font-body text-gray-400 mb-1.5">For search engines &amp; social sharing. Leave blank to use the excerpt.</p>
          <textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="Leave blank to use the excerpt…"
            rows={3}
            maxLength={160}
            className="w-full text-xs font-body text-gray-700 border border-gray-200 bg-gray-50 rounded-lg px-2.5 py-2 outline-none resize-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59] placeholder:text-gray-300"
          />
          <p className={`text-[10px] font-body mt-0.5 text-right ${metaDescription.length > 155 ? "text-amber-500" : "text-gray-300"}`}>
            {metaDescription.length}/160
          </p>
        </div>

        {/* Cover Image */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> Cover Image
          </p>
          {coverImageUrl ? (
            <div className="relative group rounded-xl overflow-hidden border border-gray-100 mb-2">
              <img
                src={coverImageUrl}
                alt="Cover"
                className={`w-full h-28 object-cover ${coverUploading ? "opacity-60" : ""}`}
              />
              {coverUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
              {!coverUploading && (
                <button
                  onClick={handleRemoveCover}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-gray-900/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="w-full h-20 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-300 mb-2">
              <ImageIcon className="w-6 h-6" />
            </div>
          )}
          <div className="flex gap-1.5">
            <button
              onClick={() => coverFileInputRef.current?.click()}
              disabled={coverUploading}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold font-body text-[#4a7c59] border border-[#4a7c59]/30 bg-[#4a7c59]/5 rounded-lg hover:bg-[#4a7c59]/10 transition-colors disabled:opacity-50"
            >
              <Upload className="w-3 h-3" />
              Upload
            </button>
            <button
              onClick={() => setShowLibraryPicker(true)}
              disabled={coverUploading}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold font-body text-[#4a7c59] border border-[#4a7c59]/30 bg-[#4a7c59]/5 rounded-lg hover:bg-[#4a7c59]/10 transition-colors disabled:opacity-50"
            >
              <Library className="w-3 h-3" />
              Library
            </button>
          </div>
          <input
            ref={coverFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleCoverFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </aside>

      {/* Photo library picker (for cover image) */}
      {showLibraryPicker && (
        <PhotoLibraryPickerModal
          sectionId={post.id}
          onConfirm={() => {}}
          onClose={() => setShowLibraryPicker(false)}
          onSelectRaw={handleLibraryPick}
        />
      )}
    </div>
  );
}
