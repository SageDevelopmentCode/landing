import { useCallback, useEffect, useRef, useState } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as Sentry from "@sentry/react-native";
import { notifyError } from "@/lib/discord";
import { Brand, BottomTabInset, floatingTabBarStyle } from "@/constants/theme";
import { MoreMenuSheet } from "@/components/MoreMenuSheet";
import { supabase } from "@/lib/supabase";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(focused: boolean, active: IoniconName, inactive: IoniconName) {
  return (
    <Ionicons
      name={focused ? active : inactive}
      size={24}
      color={focused ? Brand.sage700 : "#9ca3af"}
    />
  );
}

export default function TabsLayout() {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const userIdRef = useRef<string | null>(null);
  const convIdsRef = useRef<string[]>([]);

  const openMoreSheet = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  const fetchTotalUnread = useCallback(async () => {
    try {
      // Resolve user once and cache
      if (!userIdRef.current) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        userIdRef.current = user.id;
      }
      const userId = userIdRef.current;

      // Resolve conversation IDs once and cache
      if (!convIdsRef.current.length) {
        const { data: participantRows } = await supabase
          .schema("messaging")
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", userId);
        convIdsRef.current =
          participantRows?.map((r: { conversation_id: string }) => r.conversation_id) ?? [];
      }
      const ids = convIdsRef.current;
      if (!ids.length) return;

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
  }, []);

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
    <BottomSheetModalProvider>
      <Tabs
        safeAreaInsets={{ bottom: 0 }}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Brand.sage700,
          tabBarInactiveTintColor: "#9ca3af",
          tabBarStyle: floatingTabBarStyle,
          tabBarLabelStyle: { fontSize: 11 },
          tabBarItemStyle: { paddingVertical: 4 },
          sceneStyle: { backgroundColor: 'transparent' },
          tabBarBackground: () => null,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) =>
              tabIcon(focused, "home", "home-outline"),
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            title: "Feed",
            tabBarIcon: ({ focused }) =>
              tabIcon(focused, "newspaper", "newspaper-outline"),
          }}
        />
        <Tabs.Screen
          name="children"
          options={{
            title: "Children",
            tabBarIcon: ({ focused }) =>
              tabIcon(focused, "people", "people-outline"),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: "Messages",
            tabBarIcon: ({ focused }) =>
              tabIcon(focused, "chatbubbles", "chatbubbles-outline"),
            tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
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
            tabBarIcon: ({ focused }) =>
              tabIcon(
                focused,
                "ellipsis-horizontal-circle",
                "ellipsis-horizontal-circle-outline"
              ),
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
        <Tabs.Screen name="calendar" options={{ href: null }} />
        <Tabs.Screen name="attendance" options={{ href: null }} />
        <Tabs.Screen name="teacher" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="rewards" options={{ href: null }} />
        <Tabs.Screen name="newsletters" options={{ href: null }} />
      </Tabs>
      <MoreMenuSheet ref={bottomSheetRef} />
    </BottomSheetModalProvider>
  );
}
