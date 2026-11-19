// Live unread-message count for a tab bar's Messages badge. Shared by the parent
// tabs and the staff tabs.
// - Counts unread messages from others across every conversation the user is in.
// - Realtime: bumps on new inbound messages, re-fetches when messages are marked
//   read. Call `refresh()` when the Messages tab gains focus.
import * as Sentry from "@sentry/react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";

type Options = {
  /** The messaging identity. `null` falls back to the signed-in auth user. */
  userId: string | null;
  /** Unique realtime channel suffix per caller ("parent" / "staff"). */
  channelKey: string;
};

export function useUnreadMessages({ userId: givenUserId, channelKey }: Options) {
  const [unread, setUnread] = useState(0);
  const userIdRef = useRef<string | null>(null);
  const convIdsRef = useRef<string[]>([]);

  const refresh = useCallback(async () => {
    try {
      // Resolve the messaging identity and keep it in the ref: the realtime
      // handler below needs it to bump the badge on new messages.
      let userId = givenUserId ?? userIdRef.current;
      if (!userId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        userId = user.id;
      }
      userIdRef.current = userId;

      convIdsRef.current = [];
      const { data: participantRows } = await supabase
        .schema("messaging")
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId);
      convIdsRef.current =
        participantRows?.map((r: { conversation_id: string }) => r.conversation_id) ?? [];

      const ids = convIdsRef.current;
      if (!ids.length) {
        setUnread(0);
        return;
      }

      const { count } = await supabase
        .schema("messaging")
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", ids)
        .neq("sender_id", userId)
        .is("read_at", null);

      setUnread(count ?? 0);
    } catch (error) {
      Sentry.captureException(error, { tags: { area: "messaging-badge" } });
      notifyError("messaging-badge-fetch", error);
    }
  }, [givenUserId]);

  // Initial fetch
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Realtime: update badge on new messages (increment) or read receipts (re-fetch)
  useEffect(() => {
    const channel = supabase
      .channel(`tab-badge-updates-${channelKey}`)
      .on("postgres_changes", { event: "INSERT", schema: "messaging", table: "messages" }, (payload) => {
        const msg = payload.new as { conversation_id: string; sender_id: string };
        if (
          userIdRef.current &&
          msg.sender_id !== userIdRef.current &&
          convIdsRef.current.includes(msg.conversation_id)
        ) {
          setUnread((n) => n + 1);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "messaging", table: "messages" }, () => {
        // Messages were marked as read — re-fetch accurate count from DB
        void refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh, channelKey]);

  return { unread, refresh };
}
