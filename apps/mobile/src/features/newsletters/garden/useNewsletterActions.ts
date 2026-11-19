// Opening a newsletter and copying its password, with Garden feedback. A
// locked newsletter's password is copied first so the parent can paste it.
import { haptic, useToast } from "@/components/garden";
import { API_BASE_URL } from "@/constants/config";
import type { ParentNewsletterListItem } from "@/lib/newsletters-actions";
import * as Clipboard from "expo-clipboard";
import { useCallback, useEffect, useRef } from "react";
import { Linking } from "react-native";

export function useNewsletterActions() {
  const toast = useToast();
  const openRef = useRef<((item: ParentNewsletterListItem) => Promise<void>) | null>(null);

  const copyPassword = useCallback(
    async (password: string) => {
      try {
        await Clipboard.setStringAsync(password);
        toast.show({ tone: "success", title: "Password copied", duration: 1800 });
      } catch {
        toast.show({ tone: "error", title: "Couldn't copy the password", message: password });
      }
    },
    [toast],
  );

  const open = useCallback(
    async (item: ParentNewsletterListItem) => {
      if (item.access_password) {
        try {
          await Clipboard.setStringAsync(item.access_password);
          haptic.success();
          toast.show({
            tone: "info",
            title: "Password copied",
            message: "Paste it when the page asks.",
            duration: 3600,
            silent: true,
          });
        } catch {
          // Opening still works; the password stays visible on the card.
        }
      }
      try {
        await Linking.openURL(`${API_BASE_URL}/newsletter/${item.id}`);
      } catch {
        toast.show({
          tone: "error",
          title: "Couldn't open the newsletter",
          message: "Check your connection and try again.",
          action: { label: "Retry", onPress: () => void openRef.current?.(item) },
        });
      }
    },
    [toast],
  );

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  return { open, copyPassword };
}

export type NewsletterActions = ReturnType<typeof useNewsletterActions>;
