import { forwardRef, useCallback } from "react";
import { StyleSheet } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from "expo-web-browser";
import { Brand } from "@/constants/theme";
import {
  MoreMenuGrid,
  MoreMenuHeader,
  type MoreMenuItem,
  type MoreMenuSection,
} from "@/components/MoreMenuGrid";

const MENU_SECTIONS: MoreMenuSection[] = [
  {
    title: "School",
    items: [
      {
        label: "Calendar",
        icon: "calendar-outline",
        route: "/(tabs)/calendar",
        iconColor: "#2563EB",
        iconBg: "rgba(37,99,235,0.12)",
      },
      {
        label: "Attendance",
        icon: "checkmark-done-outline",
        route: "/(tabs)/attendance",
        iconColor: "#16A34A",
        iconBg: "rgba(22,163,74,0.12)",
      },
      {
        label: "Forms & Docs",
        icon: "document-text-outline",
        route: "/(tabs)/forms",
        iconColor: "#D97706",
        iconBg: "rgba(217,119,6,0.12)",
      },
      {
        label: "Tuition",
        icon: "card-outline",
        route: "/(tabs)/tuition",
        iconColor: "#0D9488",
        iconBg: "rgba(13,148,136,0.12)",
      },
    ],
  },
  {
    title: "Community",
    items: [
      {
        label: "Photos",
        icon: "images-outline",
        route: "/(tabs)/photos",
        iconColor: "#DB2777",
        iconBg: "rgba(219,39,119,0.12)",
      },
      {
        label: "Newsletters",
        icon: "newspaper-outline",
        route: "/(tabs)/newsletters",
        iconColor: "#4F46E5",
        iconBg: "rgba(79,70,229,0.12)",
      },
      {
        label: "Volunteer",
        icon: "heart-outline",
        route: "/(tabs)/volunteer",
        iconColor: "#E11D48",
        iconBg: "rgba(225,29,72,0.12)",
      },
      {
        label: "Activities",
        icon: "ribbon-outline",
        route: "/(tabs)/preferences",
        iconColor: "#7C3AED",
        iconBg: "rgba(124,58,237,0.12)",
      },
      {
        label: "Rewards",
        icon: "gift-outline",
        route: "/(tabs)/rewards",
        iconColor: "#CA8A04",
        iconBg: "rgba(202,138,4,0.12)",
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
        label: "Help",
        icon: "help-circle-outline",
        route: "/(tabs)/help",
        iconColor: "#0284C7",
        iconBg: "rgba(2,132,199,0.12)",
      },
      {
        label: "Settings",
        icon: "settings-outline",
        route: "/(tabs)/settings",
        iconColor: Brand.sage700,
        iconBg: "rgba(94,124,104,0.12)",
      },
    ],
  },
];

export const MoreMenuSheet = forwardRef<BottomSheetModal>((_, ref) => {
  const router = useRouter();

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
        <MoreMenuHeader subtitle="Quick links" />
        <MoreMenuGrid sections={MENU_SECTIONS} onItemPress={handleItemPress} />
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
