import { useCallback, useRef } from "react";
import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Brand, BottomTabInset, floatingTabBarStyle } from "@/constants/theme";
import { StaffMoreMenuSheet } from "@/components/StaffMoreMenuSheet";

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

export default function StaffLayout() {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const openMoreSheet = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

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
          name="students"
          options={{
            title: "Students",
            tabBarIcon: ({ focused }) =>
              tabIcon(focused, "people", "people-outline"),
          }}
          listeners={{
            tabPress: () => {
              router.navigate("/(staff)/students" as any);
            },
          }}
        />
        <Tabs.Screen
          name="attendance"
          options={{
            title: "Attendance",
            tabBarIcon: ({ focused }) =>
              tabIcon(focused, "checkmark-done", "checkmark-done-outline"),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: "Messages",
            tabBarIcon: ({ focused }) =>
              tabIcon(focused, "chatbubbles", "chatbubbles-outline"),
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
        {/* Hidden screens — accessible via the More sheet */}
        <Tabs.Screen name="feed" options={{ href: null }} />
        <Tabs.Screen name="teacher" options={{ href: null }} />
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
        <Tabs.Screen name="photos" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="teacher-ids" options={{ href: null }} />
      </Tabs>
      <StaffMoreMenuSheet ref={bottomSheetRef} />
    </BottomSheetModalProvider>
  );
}
