import { forwardRef, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { openBrowserAsync, WebBrowserPresentationStyle } from "expo-web-browser";
import { Brand } from "@/constants/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface MenuItem {
  label: string;
  icon: IoniconName;
  route?: string;
  url?: string;
}

const MENU_ITEMS: MenuItem[] = [
  { label: "Feed",           icon: "newspaper-outline",          route: "/(staff)/feed" },
  { label: "Calendar",       icon: "calendar-outline",           route: "/(staff)/calendar" },
  { label: "Hours",          icon: "time-outline",               route: "/(staff)/hours" },
  { label: "Payroll",        icon: "cash-outline",               route: "/(staff)/payroll" },
  { label: "Forms & Docs",   icon: "document-text-outline",      route: "/(staff)/forms" },
  { label: "Inventory",      icon: "cube-outline",               route: "/(staff)/inventory" },
  { label: "Care Log",       icon: "medkit-outline",             route: "/(staff)/care-log" },
  { label: "Activities",     icon: "ribbon-outline",             route: "/(staff)/activities" },
  { label: "Newsletter",     icon: "newspaper-outline",          route: "/(staff)/newsletters" },
  { label: "Photos",         icon: "images-outline",             route: "/(staff)/photos" },
  { label: "Notify Parents", icon: "notifications-outline",      route: "/(staff)/notifications" },
  { label: "Privacy",        icon: "shield-checkmark-outline",   url: "https://sagefield.co/privacy" },
  { label: "Terms",          icon: "document-outline",           url: "https://sagefield.co/terms" },
  { label: "Settings",       icon: "settings-outline",           route: "/(staff)/settings" },
];

export const StaffMoreMenuSheet = forwardRef<BottomSheetModal>((_, ref) => {
  const router = useRouter();

  const handleItemPress = useCallback(
    (item: MenuItem) => {
      (ref as React.RefObject<BottomSheetModal>).current?.dismiss();
      if (item.url) {
        openBrowserAsync(item.url, {
          presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
        });
      } else if (item.route) {
        router.push(item.route as any);
      }
    },
    [ref, router]
  );

  const rows: MenuItem[][] = [];
  for (let i = 0; i < MENU_ITEMS.length; i += 3) {
    rows.push(MENU_ITEMS.slice(i, i + 3));
  }

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={["55%"]}
      enablePanDownToClose
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
        />
      )}
    >
      <BottomSheetView style={styles.container}>
        <Text style={styles.title}>More</Text>
        <View style={styles.grid}>
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {row.map((item) => (
                <Pressable
                  key={item.label}
                  style={({ pressed }) => [
                    styles.cell,
                    pressed && styles.cellPressed,
                  ]}
                  onPress={() => handleItemPress(item)}
                >
                  <View style={styles.iconWrap}>
                    <Ionicons name={item.icon} size={28} color={Brand.sage700} />
                  </View>
                  <Text style={styles.label}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 18,
    color: "#1f2937",
    marginBottom: 20,
    marginTop: 4,
  },
  grid: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  cell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F7F3",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  cellPressed: {
    opacity: 0.7,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#4b5563",
    textAlign: "center",
  },
});
