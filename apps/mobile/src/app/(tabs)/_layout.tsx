import { useCallback, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { BottomSheetModal, BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { floatingTabBarStyle } from "@/constants/theme";
import { MoreSheet, MORE_ROUTE_NAMES } from "@/features/more/garden/MoreSheet";
import { useUnreadMessages } from "@/features/messages/useUnreadMessages";
import { GardenTabBar, PARENT_TABS } from "@/features/navigation/garden/GardenTabBar";
import { AdminPreviewBanner } from "@/components/AdminPreviewBanner";
import { GardenToastProvider } from "@/components/garden/GardenToast";
import { useAuth } from "@/contexts/AuthContext";

export default function TabsLayout() {
  const router = useRouter();
  const { isImpersonating, parentViewUserId, stopImpersonation } = useAuth();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const { unread: totalUnread, refresh: fetchTotalUnread } = useUnreadMessages({
    userId: parentViewUserId,
    channelKey: "parent",
  });

  const handleExitPreview = useCallback(async () => {
    await stopImpersonation();
    router.replace("/(staff)/home");
  }, [stopImpersonation, router]);

  const openMoreSheet = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

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
              tabs={PARENT_TABS}
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
            focus: () => void fetchTotalUnread(),
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
