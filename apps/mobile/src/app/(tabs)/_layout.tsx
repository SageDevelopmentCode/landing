import { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { BottomSheetModal, BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as Sentry from "@sentry/react-native";
import { notifyError } from "@/lib/discord";
import { floatingTabBarStyle } from "@/constants/theme";
import { MoreSheet, MORE_ROUTE_NAMES } from "@/features/more/garden/MoreSheet";
import { GardenTabBar } from "@/features/navigation/garden/GardenTabBar";
import { AdminPreviewBanner } from "@/components/AdminPreviewBanner";
import { GardenToastProvider } from "@/components/garden/GardenToast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function TabsLayout() {
  const router = useRouter();
  const { isImpersonating, parentViewUserId, stopImpersonation } = useAuth();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const convIdsRef = useRef<string[]>([]);

  const handleExitPreview = useCallback(async () => {
    await stopImpersonation();
    router.replace("/(staff)/home");
  }, [stopImpersonation, router]);

  const openMoreSheet = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  const fetchTotalUnread = useCallback(async () => {
    try {
      // Resolve the messaging identity and keep it in the ref: the realtime
      // handler below needs it to bump the badge on new messages. (Previously
      // the ref was only filled when parentViewUserId was null, which never
      // happens for a signed-in parent, so live bumps never fired.)
      let userId = parentViewUserId ?? userIdRef.current;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
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
        setTotalUnread(0);
        return;
      }

      const { count } = await supabase
        .schema("messaging")
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", ids)
        .neq("sender_id", userId)
        .is("read_at", null);

      setTotalUnread(count ?? 0);
    } catch (error) {
      Sentry.captureException(error, { tags: { area: 'messaging-badge' } });
      notifyError('messaging-badge-fetch', error);
    }
  }, [parentViewUserId]);

  // Initial fetch
  useEffect(() => { fetchTotalUnread(); }, [fetchTotalUnread]);

  // Realtime: update badge on new messages (increment) or read receipts (re-fetch)
  useEffect(() => {
    const channel = supabase
      .channel("tab-badge-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "messaging", table: "messages" },
        (payload) => {
          const msg = payload.new as { conversation_id: string; sender_id: string };
          if (
            userIdRef.current &&
            msg.sender_id !== userIdRef.current &&
            convIdsRef.current.includes(msg.conversation_id)
          ) {
            setTotalUnread((n) => n + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "messaging", table: "messages" },
        () => {
          // Messages were marked as read — re-fetch accurate count from DB
          fetchTotalUnread();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTotalUnread]);

  return (
    <GardenToastProvider>
    <BottomSheetModalProvider>
      <View style={styles.root}>
        {isImpersonating && (
          <AdminPreviewBanner onExit={handleExitPreview} />
        )}
        <Tabs
          safeAreaInsets={{ bottom: 0 }}
          tabBar={(props) => (
            <GardenTabBar
              {...props}
              unread={totalUnread}
              moreOpen={moreOpen}
              moreRoutes={MORE_ROUTE_NAMES}
            />
          )}
          screenOptions={{
          headerShown: false,
          tabBarStyle: floatingTabBarStyle,
          sceneStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            title: "Feed",
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Calendar",
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: "Messages",
          }}
          listeners={{
            // Re-fetch accurate count whenever the messages tab is focused
            // (handles the "read" case — badge goes down after opening a chat)
            focus: () => fetchTotalUnread(),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: "More",
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              openMoreSheet();
            },
          }}
        />
        <Tabs.Screen name="photos" options={{ href: null }} />
        <Tabs.Screen name="preferences" options={{ href: null, tabBarStyle: { display: "none" } }} />
        <Tabs.Screen name="volunteer" options={{ href: null }} />
        <Tabs.Screen name="feedback" options={{ href: null }} />
        <Tabs.Screen name="help" options={{ href: null }} />
        <Tabs.Screen name="tuition" options={{ href: null }} />
        <Tabs.Screen name="forms" options={{ href: null }} />
        <Tabs.Screen name="children" options={{ href: null }} />
        <Tabs.Screen name="attendance" options={{ href: null }} />
        <Tabs.Screen name="teacher" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="rewards" options={{ href: null }} />
        <Tabs.Screen name="newsletters" options={{ href: null }} />
      </Tabs>
      <MoreSheet ref={bottomSheetRef} onChange={(i) => setMoreOpen(i >= 0)} />
      </View>
    </BottomSheetModalProvider>
    </GardenToastProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
});
