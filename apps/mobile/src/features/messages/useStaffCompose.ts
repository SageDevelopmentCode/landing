// Staff "New Message": pick households / parents, write once, send to each.
// Handlers return results; StaffComposeScreen gives the feedback.
import { notifyError } from "@/lib/discord";
import {
  getConversationListMeta,
  resolveHouseholdConversation,
  startHouseholdConversation,
} from "@/lib/household-messaging";
import { supabase } from "@/lib/supabase";
import {
  composeTargetKey,
  composeTargetLabel,
  getHouseholdsForCompose,
  getParentsForTeacher,
  type ComposeTarget,
  type HouseholdComposeRow,
  type ParentWithChildren,
  type ParentsForTeacher,
} from "@/lib/teacher-messaging";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { uploadDmAttachment, type PendingImage } from "./chatShared";
import type { Result } from "./messagingApi";

export type SendResult = Result & {
  canceled?: boolean;
  /** Image upload failed: nothing was sent. */
  imageFailed?: boolean;
  /** Some recipients got it, some didn't (they stay selected for "Retry failed"). */
  partial?: boolean;
  failedNames?: string[];
  sentCount?: number;
};

function filterDirectory(dir: ParentsForTeacher, query: string): ParentsForTeacher {
  if (!query.trim()) return dir;
  const q = query.toLowerCase();
  const match = (p: ParentWithChildren) =>
    (p.full_name ?? "").toLowerCase().includes(q) ||
    p.children.some((c) => c.child_legal_name.toLowerCase().includes(q));
  return { myStudentsParents: dir.myStudentsParents.filter(match), allParents: dir.allParents.filter(match) };
}

function filterHouseholds(list: HouseholdComposeRow[], query: string): HouseholdComposeRow[] {
  if (!query.trim()) return list;
  const q = query.toLowerCase();
  return list.filter(
    (h) =>
      h.studentName.toLowerCase().includes(q) ||
      h.primaryParentName.toLowerCase().includes(q) ||
      h.guardianNames.some((n) => n.toLowerCase().includes(q)),
  );
}

export function useStaffCompose() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  // Directory
  const [directory, setDirectory] = useState<ParentsForTeacher | null>(null);
  const [households, setHouseholds] = useState<HouseholdComposeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Selection + draft
  const [selected, setSelected] = useState<ComposeTarget[]>([]);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [sending, setSending] = useState(false);
  /** Names that failed on the last send (shown inline on step 2). */
  const [failedNames, setFailedNames] = useState<string[]>([]);

  const sendingRef = useRef(false);
  /** Image already uploaded for this draft, so "Retry failed" doesn't re-upload. */
  const uploadedRef = useRef<{ uri: string; url: string } | null>(null);

  const loadDirectory = useCallback(async (): Promise<Result> => {
    setLoading(true);
    setLoadError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      setUserId(user.id);
      const [dir, rows] = await Promise.all([getParentsForTeacher(user.id), getHouseholdsForCompose()]);
      setDirectory(dir);
      setHouseholds(rows);
      return { ok: true };
    } catch (e) {
      notifyError("staff-compose-directory", e);
      const msg = e instanceof Error ? e.message : "Couldn't load parents";
      setLoadError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDirectory();
  }, [loadDirectory]);

  // ── Selection ──────────────────────────────────────────────────────────────
  const selectedKeys = useMemo(() => new Set(selected.map(composeTargetKey)), [selected]);

  const toggle = useCallback((target: ComposeTarget) => {
    const key = composeTargetKey(target);
    setSelected((prev) =>
      prev.some((t) => composeTargetKey(t) === key) ? prev.filter((t) => composeTargetKey(t) !== key) : [...prev, target],
    );
    setFailedNames([]);
  }, []);

  const toggleParent = useCallback(
    (parent: ParentWithChildren, section: "mine" | "all") => toggle({ kind: "parent", section, parent }),
    [toggle],
  );
  const toggleHousehold = useCallback((household: HouseholdComposeRow) => toggle({ kind: "household", household }), [toggle]);

  const remove = useCallback((key: string) => {
    setSelected((prev) => prev.filter((t) => composeTargetKey(t) !== key));
    setFailedNames([]);
  }, []);

  const setImage = useCallback((img: PendingImage | null) => {
    setPendingImage(img);
    uploadedRef.current = null;
  }, []);

  const filteredHouseholds = useMemo(() => filterHouseholds(households, search), [households, search]);
  const filteredDirectory = useMemo(() => (directory ? filterDirectory(directory, search) : null), [directory, search]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const resolveTarget = useCallback(
    async (target: ComposeTarget, uid: string): Promise<string | null> => {
      try {
        if (target.kind === "household") return await startHouseholdConversation(target.household.studentId, uid);
        if (target.section === "mine") return await resolveHouseholdConversation(target.parent.id, uid, directory);
        const { data, error } = await supabase.rpc("find_or_create_conversation", { other_user_id: target.parent.id });
        if (error) throw error;
        return (data as string | null) ?? null;
      } catch (e) {
        notifyError("staff-compose-resolve", e);
        return null;
      }
    },
    [directory],
  );

  const send = useCallback(async (): Promise<SendResult> => {
    const body = draft.trim();
    if (!userId || selected.length === 0 || (!body && !pendingImage) || sendingRef.current) {
      return { ok: false, canceled: true };
    }
    sendingRef.current = true;
    setSending(true);
    setFailedNames([]);
    try {
      // 1. Find or create every conversation in parallel.
      const resolved = await Promise.all(
        selected.map(async (target) => ({ target, conversationId: await resolveTarget(target, userId) })),
      );
      const failed: ComposeTarget[] = resolved.filter((r) => !r.conversationId).map((r) => r.target);

      // 2. Several picks can land in the same conversation (a household and its parent): send once.
      const byConversation = new Map<string, ComposeTarget[]>();
      for (const r of resolved) {
        if (!r.conversationId) continue;
        byConversation.set(r.conversationId, [...(byConversation.get(r.conversationId) ?? []), r.target]);
      }
      if (byConversation.size === 0) {
        setSelected(failed);
        const names = failed.map(composeTargetLabel);
        setFailedNames(names);
        return { ok: false, failedNames: names, sentCount: 0 };
      }

      // 3. Upload the photo once. If it fails, send nothing.
      let imageUrl: string | null = null;
      if (pendingImage) {
        if (uploadedRef.current?.uri === pendingImage.uri) {
          imageUrl = uploadedRef.current.url;
        } else {
          try {
            const firstId = byConversation.keys().next().value as string;
            imageUrl = await uploadDmAttachment(
              "message-images",
              userId,
              firstId,
              pendingImage.uri,
              pendingImage.fileName,
              pendingImage.mimeType,
            );
            uploadedRef.current = { uri: pendingImage.uri, url: imageUrl };
          } catch (e) {
            notifyError("staff-compose-upload", e);
            return { ok: false, imageFailed: true };
          }
        }
      }

      // 4. Insert into each conversation and bump it to the top of the list.
      let lastId: string | null = null;
      let lastTarget: ComposeTarget | null = null;
      let sentConversations = 0;
      for (const [conversationId, targets] of byConversation) {
        const { error } = await supabase
          .schema("messaging")
          .from("messages")
          .insert({ conversation_id: conversationId, sender_id: userId, body, image_url: imageUrl });
        if (error) {
          notifyError("staff-compose-send", error);
          failed.push(...targets);
          continue;
        }
        await supabase
          .schema("messaging")
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);
        sentConversations += 1;
        lastId = conversationId;
        lastTarget = targets[targets.length - 1];
      }

      if (failed.length > 0) {
        // Keep only the failed recipients selected so "Retry failed" sends to just them.
        setSelected(failed);
        const names = failed.map(composeTargetLabel);
        setFailedNames(names);
        return { ok: false, partial: sentConversations > 0, failedNames: names, sentCount: sentConversations };
      }

      // 5. All delivered: open the (last) thread in place of compose.
      if (lastId) {
        const meta = await getConversationListMeta(userId, lastId);
        const isGroup = Boolean(meta?.is_group);
        router.replace({
          pathname: "/(staff)/messages/[id]",
          params: {
            id: lastId,
            otherUserName:
              meta?.other_user_name ?? meta?.display_name ?? (lastTarget ? composeTargetLabel(lastTarget) : "Conversation"),
            otherUserAvatar: isGroup ? "" : lastTarget?.kind === "parent" ? (lastTarget.parent.profile_image_url ?? "") : "",
            otherUserId: isGroup || lastTarget?.kind !== "parent" ? "" : lastTarget.parent.id,
            isGroup: isGroup ? "true" : "false",
          },
        });
      }
      return { ok: true, sentCount: byConversation.size };
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }, [draft, pendingImage, resolveTarget, router, selected, userId]);

  const canSend = selected.length > 0 && (!!draft.trim() || !!pendingImage) && !sending;

  return {
    router,
    step,
    setStep,
    loading,
    loadError,
    loadDirectory,
    directory,
    filteredDirectory,
    filteredHouseholds,
    search,
    setSearch,
    selected,
    selectedKeys,
    toggleParent,
    toggleHousehold,
    remove,
    draft,
    setDraft,
    pendingImage,
    setImage,
    sending,
    canSend,
    failedNames,
    send,
  };
}

export type StaffCompose = ReturnType<typeof useStaffCompose>;
