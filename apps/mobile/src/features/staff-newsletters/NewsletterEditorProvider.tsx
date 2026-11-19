// Live editing state for ONE newsletter, shared by the editor, section editor
// and preview (mounted in app/(staff)/newsletters/_layout.tsx). Replaces the
// old module-level "pending edits" globals, which could leak a Class Updates
// edit into a different newsletter and were lost on back.
//
// - Text edits (title, week, view mode, section bodies, my class update,
//   visibility) stay local until Save; `dirty` drives the discard guard.
// - Section images write straight to storage (as before) and update this
//   state at once, so counts and previews are never stale.
// - Save only writes sections that actually changed, so it doesn't clobber
//   another teacher's edits to sections you didn't touch.
// Writes return { ok } — screens turn them into feedback.
import { useStaffRole } from "@/features/staff-shared/useStaffRole";
import { notifyError } from "@/lib/discord";
import {
  deleteSectionImage,
  getNewsletter,
  publishNewsletter,
  saveDraft,
  softDeleteNewsletter,
  uploadSectionImage,
  type Newsletter,
  type NewsletterSectionImage,
} from "@/lib/newsletters-actions";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

export type ViewMode = "traditional" | "slideshow";
export type Result = { ok: boolean; error?: string };

export type EditableSection = {
  id: string;
  label: string;
  body: string;
  visible: boolean;
  sort_order: number;
  is_class_updates: boolean;
  images: NewsletterSectionImage[];
};

type Draft = {
  title: string;
  weekRange: string;
  viewMode: ViewMode;
  sections: EditableSection[];
  myUpdate: string;
};

type LoadState = "idle" | "loading" | "ready" | "error";

function draftFrom(nl: Newsletter, userId: string | null): Draft {
  const cls = nl.sections.find((s) => s.is_class_updates);
  return {
    title: nl.title,
    weekRange: nl.week_range,
    viewMode: nl.view_mode,
    sections: nl.sections.map((s) => ({
      id: s.id,
      label: s.label,
      body: s.body,
      visible: s.visible,
      sort_order: s.sort_order,
      is_class_updates: s.is_class_updates,
      images: s.images,
    })),
    myUpdate: cls?.teacher_updates.find((t) => t.teacher_id === userId)?.body ?? "",
  };
}

function useEditorState() {
  const { userId } = useStaffRole();
  const [id, setId] = useState<string | null>(null);
  const [server, setServer] = useState<Newsletter | null>(null);
  const [base, setBase] = useState<Draft | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const seq = useRef(0);
  const writeLock = useRef(false);

  const load = useCallback(
    async (newsletterId: string, { keepEdits = false } = {}): Promise<Result> => {
      const my = ++seq.current;
      if (!keepEdits) setLoadState("loading");
      try {
        const nl = await getNewsletter(newsletterId);
        if (my !== seq.current) return { ok: true };
        const d = draftFrom(nl, userId);
        setServer(nl);
        setBase(d);
        if (!keepEdits) setDraft(d);
        setLoadState("ready");
        return { ok: true };
      } catch (e) {
        if (my !== seq.current) return { ok: true };
        notifyError("staff-newsletter-load", e);
        if (!keepEdits) setLoadState("error");
        return { ok: false, error: e instanceof Error ? e.message : "Failed to load newsletter" };
      }
    },
    [userId],
  );

  /**
   * Called when the editor screen mounts. Every visit starts from the saved
   * newsletter (a discarded draft never comes back, and another teacher's
   * saved changes show up).
   */
  const open = useCallback(
    (newsletterId: string) => {
      setId(newsletterId);
      setServer(null);
      setBase(null);
      setDraft(null);
      void load(newsletterId);
    },
    [load],
  );

  /** Throw away local edits (after a confirmed discard). */
  const discard = useCallback(() => {
    setDraft(base);
  }, [base]);

  const reload = useCallback(async (): Promise<Result> => (id ? load(id) : { ok: false }), [id, load]);

  // ── Text edits ────────────────────────────────────────────────────────────
  const patch = useCallback((p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d)), []);
  const patchSection = useCallback(
    (sectionId: string, p: Partial<EditableSection>) =>
      setDraft((d) => (d ? { ...d, sections: d.sections.map((s) => (s.id === sectionId ? { ...s, ...p } : s)) } : d)),
    [],
  );
  const toggleVisible = useCallback(
    (sectionId: string) =>
      setDraft((d) =>
        d ? { ...d, sections: d.sections.map((s) => (s.id === sectionId ? { ...s, visible: !s.visible } : s)) } : d,
      ),
    [],
  );

  // ── Images (immediate writes, as before) ──────────────────────────────────
  const setImages = (sectionId: string, fn: (imgs: NewsletterSectionImage[]) => NewsletterSectionImage[]) => {
    const apply = (d: Draft | null) =>
      d ? { ...d, sections: d.sections.map((s) => (s.id === sectionId ? { ...s, images: fn(s.images) } : s)) } : d;
    setDraft(apply);
    setBase(apply);
  };

  const addImage = useCallback(async (sectionId: string, uri: string): Promise<Result> => {
    setUploading((u) => ({ ...u, [sectionId]: true }));
    try {
      const count = draft?.sections.find((s) => s.id === sectionId)?.images.length ?? 0;
      const img = await uploadSectionImage(sectionId, uri, count);
      setImages(sectionId, (imgs) => [...imgs, img]);
      return { ok: true };
    } catch (e) {
      notifyError("staff-newsletter-image-upload", e);
      return { ok: false, error: e instanceof Error ? e.message : "Could not upload image" };
    } finally {
      setUploading(({ [sectionId]: _, ...rest }) => rest);
    }
  }, [draft]);

  const removeImage = useCallback(async (sectionId: string, img: NewsletterSectionImage): Promise<Result> => {
    try {
      await deleteSectionImage(img.id, img.storage_path, img.source_bucket);
      setImages(sectionId, (imgs) => imgs.filter((i) => i.id !== img.id));
      return { ok: true };
    } catch (e) {
      notifyError("staff-newsletter-image-delete", e);
      return { ok: false, error: e instanceof Error ? e.message : "Failed to remove image" };
    }
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const changes = useMemo(() => {
    if (!draft || !base) return [] as string[];
    const out: string[] = [];
    if (draft.title !== base.title) out.push("Updated title");
    if (draft.weekRange !== base.weekRange) out.push("Updated week range");
    if (draft.viewMode !== base.viewMode) out.push(`Changed view mode to ${draft.viewMode}`);
    for (const s of draft.sections) {
      const o = base.sections.find((x) => x.id === s.id);
      if (!o) continue;
      if (!s.is_class_updates && s.body !== o.body) out.push(`Updated '${s.label}' body`);
      if (s.visible !== o.visible) out.push(`Toggled '${s.label}' visibility ${s.visible ? "on" : "off"}`);
    }
    if (draft.myUpdate !== base.myUpdate) out.push("Updated Class Updates");
    return out;
  }, [draft, base]);
  const dirty = changes.length > 0;
  const isPublished = server?.status === "published";

  /** Section ids with unsaved text edits (for "edited" dots). */
  const editedSections = useMemo(() => {
    const set = new Set<string>();
    if (!draft || !base) return set;
    for (const s of draft.sections) {
      const o = base.sections.find((x) => x.id === s.id);
      if (!o) continue;
      if (s.is_class_updates ? draft.myUpdate !== base.myUpdate : s.body !== o.body || s.visible !== o.visible)
        set.add(s.id);
      else if (s.visible !== o.visible) set.add(s.id);
    }
    return set;
  }, [draft, base]);

  // ── Save / publish / delete ───────────────────────────────────────────────
  const save = useCallback(async (): Promise<Result> => {
    if (!id || !draft || !base || isPublished) return { ok: false, error: "Nothing to save." };
    if (!dirty) return { ok: true };
    if (writeLock.current) return { ok: false, error: "Already saving." };
    writeLock.current = true;
    setSaving(true);
    try {
      const changedSections = draft.sections.filter((s) => {
        const o = base.sections.find((x) => x.id === s.id);
        return !o || s.body !== o.body || s.visible !== o.visible || s.label !== o.label;
      });
      const cls = draft.sections.find((s) => s.is_class_updates);
      await saveDraft(id, {
        title: draft.title,
        week_range: draft.weekRange,
        view_mode: draft.viewMode,
        sections: changedSections.map((s) => ({ id: s.id, label: s.label, body: s.body, visible: s.visible })),
        classUpdatesSectionId: cls && draft.myUpdate !== base.myUpdate ? cls.id : null,
        myTeacherUpdateBody: draft.myUpdate,
        changeSummary: changes,
      });
      // Saved: what's on screen is now the baseline; refresh quietly for the change log.
      setBase(draft);
      void load(id, { keepEdits: true });
      return { ok: true };
    } catch (e) {
      notifyError("staff-newsletter-save", e);
      return { ok: false, error: e instanceof Error ? e.message : "Failed to save draft" };
    } finally {
      writeLock.current = false;
      setSaving(false);
    }
  }, [id, draft, base, isPublished, dirty, changes, load]);

  /** Saves unsaved edits first, then publishes — what you see is what goes out. */
  const publish = useCallback(async (): Promise<Result & { savedFirst?: boolean }> => {
    if (!id || isPublished) return { ok: false };
    let savedFirst = false;
    if (dirty) {
      const r = await save();
      if (!r.ok) return { ok: false, error: r.error ?? "Couldn't save your changes first." };
      savedFirst = true;
    }
    setPublishing(true);
    try {
      await publishNewsletter(id);
      await load(id, { keepEdits: false });
      return { ok: true, savedFirst };
    } catch (e) {
      notifyError("staff-newsletter-publish", e);
      return { ok: false, error: e instanceof Error ? e.message : "Failed to publish" };
    } finally {
      setPublishing(false);
    }
  }, [id, isPublished, dirty, save, load]);

  const remove = useCallback(async (): Promise<Result> => {
    if (!id) return { ok: false };
    try {
      await softDeleteNewsletter(id);
      return { ok: true };
    } catch (e) {
      notifyError("staff-newsletter-delete", e);
      return { ok: false, error: e instanceof Error ? e.message : "Failed to delete" };
    }
  }, [id]);

  return {
    id,
    server,
    draft,
    loadState,
    isPublished,
    dirty,
    changes,
    editedSections,
    saving,
    publishing,
    uploading,
    open,
    reload,
    discard,
    patch,
    patchSection,
    toggleVisible,
    addImage,
    removeImage,
    save,
    publish,
    remove,
  };
}

export type NewsletterEditor = ReturnType<typeof useEditorState>;

const Ctx = createContext<NewsletterEditor | null>(null);

export function NewsletterEditorProvider({ children }: { children: ReactNode }) {
  const value = useEditorState();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNewsletterEditor() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNewsletterEditor must be used inside NewsletterEditorProvider");
  return v;
}
