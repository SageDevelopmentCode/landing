// Garden feedback for the feed list (parent + staff).
import { haptic, READ_ONLY_TOAST, useToast, type GardenActionSheetHandle } from "@/components/garden";
import type { PostWithMeta } from "@/components/feed/feedTypes";
import { saveImageToLibrary } from "@/utils/saveMedia";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Linking } from "react-native";
import type { ParentFeed } from "../useParentFeed";

export function useFeedFeedback(f: ParentFeed) {
  const toast = useToast();
  const [retrying, setRetrying] = useState(false);
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const saveRef = useRef<((uri: string) => Promise<void>) | null>(null);
  const deleteRef = useRef<((post: PostWithMeta) => Promise<void>) | null>(null);
  /** Staff post menu (⋮). Mounted once by the screen. */
  const menuRef = useRef<GardenActionSheetHandle>(null);

  const refresh = useCallback(async () => {
    const r = await f.handleRefresh();
    if (r.ok) {
      toast.show({ tone: "success", title: "You're up to date", duration: 1600, silent: true });
      haptic.tap();
    } else {
      toast.show({
        tone: "error",
        title: "Couldn't refresh",
        message: "Check your connection and try again.",
        action: { label: "Retry", onPress: () => void refreshRef.current?.() },
      });
    }
  }, [f, toast]);

  const retryLoad = useCallback(async () => {
    setRetrying(true);
    await f.reload();
    setRetrying(false);
  }, [f]);

  /** Returns true when the reaction was added (drives the burst). */
  const react = useCallback(
    async (post: PostWithMeta, emoji: string): Promise<boolean> => {
      if (f.isReadOnlyPreview) {
        toast.show(READ_ONLY_TOAST);
        return false;
      }
      haptic.select();
      const r = await f.toggleReactionForPost(post.id, emoji);
      if (!r.ok) {
        toast.show({
          tone: "error",
          title: "Couldn't save your reaction",
          message: "Please try again.",
        });
        return false;
      }
      return !!r.added;
    },
    [f, toast],
  );

  const savePhoto = useCallback(
    async (uri: string) => {
      const id = toast.show({ tone: "loading", title: "Getting your photo ready…" });
      try {
        await saveImageToLibrary(uri, { throwOnError: true });
        toast.dismiss(id);
      } catch {
        toast.update(id, {
          tone: "error",
          title: "Error",
          message: "Could not save the photo. Please try again.",
          action: { label: "Retry", onPress: () => void saveRef.current?.(uri) },
        });
      }
    },
    [toast],
  );

  const openLink = useCallback(
    async (url: string) => {
      try {
        await Linking.openURL(url);
      } catch {
        toast.show({ tone: "error", title: "Couldn't open that link", message: "Please try again." });
      }
    },
    [toast],
  );

  // ── Staff: delete a post ───────────────────────────────────────────────────
  // Deleting removes it for every family and can't be undone, so it confirms.
  const runDelete = useCallback(
    async (post: PostWithMeta) => {
      const id = toast.show({ tone: "loading", title: "Deleting post…" });
      const r = await f.deletePost(post);
      if (r.ok) {
        toast.update(id, { tone: "success", title: "Post deleted", message: "Families won't see it anymore." });
      } else {
        toast.update(id, {
          tone: "error",
          title: "Couldn't delete the post",
          message: "Check your connection and try again.",
          action: { label: "Retry", onPress: () => void deleteRef.current?.(post) },
        });
      }
    },
    [f, toast],
  );

  const confirmDelete = useCallback(
    (post: PostWithMeta) => {
      haptic.warning();
      Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => void runDelete(post) },
      ]);
    },
    [runDelete],
  );

  const openPostMenu = useCallback(
    (post: PostWithMeta) => {
      const auto = !!post.source_type;
      menuRef.current?.present({
        title: "Post options",
        subtitle: auto ? "This post was added automatically." : undefined,
        actions: [
          { label: "Open post", icon: "chatbubble-outline", onPress: () => f.openPost(post) },
          {
            label: "Delete post",
            icon: "trash-outline",
            destructive: true,
            hint: "Removes it for every family",
            onPress: () => confirmDelete(post),
          },
        ],
      });
    },
    [f, confirmDelete],
  );

  useEffect(() => {
    refreshRef.current = refresh;
    saveRef.current = savePhoto;
    deleteRef.current = runDelete;
  }, [refresh, savePhoto, runDelete]);

  return { toast, retrying, refresh, retryLoad, react, savePhoto, openLink, menuRef, openPostMenu, confirmDelete };
}

export type FeedFeedback = ReturnType<typeof useFeedFeedback>;
