import { forwardRef, useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { openBrowserAsync, WebBrowserPresentationStyle } from "expo-web-browser";
import { Brand } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import {
  MoreMenuGrid,
  MoreMenuHeader,
  type MoreMenuItem,
  type MoreMenuSection,
} from "@/components/MoreMenuGrid";

const MENU_SECTIONS: MoreMenuSection[] = [
  {
    title: "Work",
    items: [
      {
        label: "Feed",
        icon: "newspaper-outline",
        route: "/(staff)/feed",
        iconColor: "#2563EB",
        iconBg: "rgba(37,99,235,0.12)",
      },
      {
        label: "Calendar",
        icon: "calendar-outline",
        route: "/(staff)/calendar",
        iconColor: "#2563EB",
        iconBg: "rgba(37,99,235,0.12)",
      },
      {
        label: "Hours",
        icon: "time-outline",
        route: "/(staff)/hours",
        iconColor: "#0891B2",
        iconBg: "rgba(8,145,178,0.12)",
      },
      {
        label: "Payroll",
        icon: "cash-outline",
        route: "/(staff)/payroll",
        iconColor: "#059669",
        iconBg: "rgba(5,150,105,0.12)",
      },
    ],
  },
  {
    title: "Classroom",
    items: [
      {
        label: "Forms & Docs",
        icon: "document-text-outline",
        route: "/(staff)/forms",
        iconColor: "#D97706",
        iconBg: "rgba(217,119,6,0.12)",
      },
      {
        label: "Inventory",
        icon: "cube-outline",
        route: "/(staff)/inventory",
        iconColor: "#EA580C",
        iconBg: "rgba(234,88,12,0.12)",
      },
      {
        label: "Care Log",
        icon: "medkit-outline",
        route: "/(staff)/care-log",
        iconColor: "#DC2626",
        iconBg: "rgba(220,38,38,0.12)",
      },
      {
        label: "Activities",
        icon: "ribbon-outline",
        route: "/(staff)/activities",
        iconColor: "#7C3AED",
        iconBg: "rgba(124,58,237,0.12)",
      },
    ],
  },
  {
    title: "Community",
    items: [
      {
        label: "Newsletter",
        icon: "newspaper-outline",
        route: "/(staff)/newsletters",
        iconColor: "#4F46E5",
        iconBg: "rgba(79,70,229,0.12)",
      },
      {
        label: "Photos",
        icon: "images-outline",
        route: "/(staff)/photos",
        iconColor: "#DB2777",
        iconBg: "rgba(219,39,119,0.12)",
      },
      {
        label: "Notify Parents",
        icon: "notifications-outline",
        route: "/(staff)/notifications",
        iconColor: "#F59E0B",
        iconBg: "rgba(245,158,11,0.12)",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        label: "Privacy",
        icon: "shield-checkmark-outline",
        url: "https://sagefield.co/privacy",
        iconColor: "#475569",
        iconBg: "rgba(71,85,105,0.12)",
      },
      {
        label: "Terms",
        icon: "document-outline",
        url: "https://sagefield.co/terms",
        iconColor: "#6B7280",
        iconBg: "rgba(107,114,128,0.12)",
      },
      {
        label: "Settings",
        icon: "settings-outline",
        route: "/(staff)/settings",
        iconColor: Brand.sage700,
        iconBg: "rgba(94,124,104,0.12)",
      },
    ],
  },
];

const ADMIN_SECTION: MoreMenuSection = {
  title: "Admin",
  items: [
    {
      label: "Impersonate Parent",
      icon: "eye-outline",
      route: "/impersonate-parent",
      iconColor: "#F97316",
      iconBg: "rgba(249,115,22,0.12)",
    },
    {
      label: "Teacher IDs",
      icon: "card-outline",
      route: "/(staff)/teacher-ids",
      iconColor: "#5E7C68",
      iconBg: "rgba(94,124,104,0.12)",
    },
  ],
};

export const StaffMoreMenuSheet = forwardRef<BottomSheetModal>((_, ref) => {
  const router = useRouter();
  const { userRole } = useAuth();

  const menuSections = useMemo(() => {
    if (userRole !== "super_admin") return MENU_SECTIONS;
    return [ADMIN_SECTION, ...MENU_SECTIONS];
  }, [userRole]);

  const handleItemPress = useCallback(
    (item: MoreMenuItem) => {
      (ref as React.RefObject<BottomSheetModal>).current?.dismiss();
      if (item.url) {
        openBrowserAsync(item.url, {
          presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
        });
      } else if (item.route) {
        router.push(item.route as any);
      }
    },
    [ref, router],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={["72%"]}
      enablePanDownToClose
      handleIndicatorStyle={styles.handle}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
        />
      )}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <MoreMenuHeader subtitle="Staff tools" />
        <MoreMenuGrid sections={menuSections} onItemPress={handleItemPress} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  handle: {
    backgroundColor: "#d1d5db",
    width: 36,
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
});
