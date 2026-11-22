import { useCallback, useRef, useState } from "react";
import { Tabs, router } from "expo-router";
import { BottomSheetModal, BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { floatingTabBarStyle } from "@/constants/theme";
import { GardenToastProvider } from "@/components/garden/GardenToast";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessages } from "@/features/messages/useUnreadMessages";
import { GardenTabBar, STAFF_TABS } from "@/features/navigation/garden/GardenTabBar";
import { StaffMoreSheet, STAFF_MORE_ROUTE_NAMES } from "@/features/staff-more/garden/StaffMoreSheet";

export default function StaffLayout() {
  const { userId } = useAuth();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const { unread, refresh: refreshUnread } = useUnreadMessages({ userId, channelKey: "staff" });

  const openMoreSheet = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  return (
    <GardenToastProvider>
    <BottomSheetModalProvider>
      <Tabs
        safeAreaInsets={{ bottom: 0 }}
        tabBar={(props) => (
          <GardenTabBar
            {...props}
            tabs={STAFF_TABS}
            unread={unread}
            moreOpen={moreOpen}
            moreRoutes={STAFF_MORE_ROUTE_NAMES}
          />
        )}
        screenOptions={{
          headerShown: false,
          tabBarStyle: floatingTabBarStyle,
          sceneStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Tabs.Screen name="home" options={{ title: "Home" }} />
        <Tabs.Screen
          name="students"
          options={{ title: "Students" }}
          listeners={{
            tabPress: () => {
              router.navigate("/(staff)/students" as any);
            },
          }}
        />
        <Tabs.Screen name="attendance" options={{ title: "Attendance" }} />
        <Tabs.Screen
          name="messages"
          options={{ title: "Messages" }}
          listeners={{
            // Re-fetch the badge whenever Messages is focused (handles "read").
            focus: () => void refreshUnread(),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{ title: "More" }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              openMoreSheet();
            },
          }}
        />
        {/* Hidden screens — accessible via the More sheet */}
        <Tabs.Screen name="feed" options={{ href: null }} />
        <Tabs.Screen name="teacher" options={{ href: null }} />
        <Tabs.Screen name="teacher-favorites" options={{ href: null }} />
        <Tabs.Screen name="calendar" options={{ href: null }} />
        <Tabs.Screen name="hours" options={{ href: null }} />
        <Tabs.Screen name="class-updates" options={{ href: null }} />
        <Tabs.Screen name="payroll" options={{ href: null }} />
        <Tabs.Screen name="payroll-history" options={{ href: null }} />
        <Tabs.Screen name="forms" options={{ href: null }} />
        <Tabs.Screen name="edit-profile" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="inventory" options={{ href: null }} />
        <Tabs.Screen name="care-log" options={{ href: null }} />
        <Tabs.Screen name="activities" options={{ href: null }} />
        <Tabs.Screen name="newsletters" options={{ href: null }} />
        <Tabs.Screen name="school-newsletters" options={{ href: null }} />
        <Tabs.Screen name="photos" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="teacher-ids" options={{ href: null }} />
        <Tabs.Screen name="admin/tours" options={{ href: null }} />
        <Tabs.Screen name="admin/employee-hours" options={{ href: null }} />
      </Tabs>
      <StaffMoreSheet ref={bottomSheetRef} onChange={(i) => setMoreOpen(i >= 0)} />
    </BottomSheetModalProvider>
    </GardenToastProvider>
  );
}
