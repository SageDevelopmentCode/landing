// Garden feedback for the parent feed list.
import { haptic, READ_ONLY_TOAST, useToast } from "@/components/garden";
import type { PostWithMeta } from "@/components/feed/feedTypes";
import { saveImageToLibrary } from "@/utils/saveMedia";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking } from "react-native";
import type { ParentFeed } from "../useParentFeed";

export function useFeedFeedback(f: ParentFeed) {
  const toast = useToast();
  const [retrying, setRetrying] = useState(false);
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const saveRef = useRef<((uri: string) => Promise<void>) | null>(null);

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

  useEffect(() => {
    refreshRef.current = refresh;
    saveRef.current = savePhoto;
  }, [refresh, savePhoto]);

  return { toast, retrying, refresh, retryLoad, react, savePhoto, openLink };
}

export type FeedFeedback = ReturnType<typeof useFeedFeedback>;
