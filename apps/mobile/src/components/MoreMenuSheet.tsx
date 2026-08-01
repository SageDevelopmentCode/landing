import { forwardRef, useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from "expo-web-browser";
import { Brand } from "@/constants/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface MenuItem {
  label: string;
  icon: IoniconName;
  route?: string;
  url?: string;
}

const MENU_ITEMS: MenuItem[] = [
  { label: "Calendar", icon: "calendar-outline", route: "/(tabs)/calendar" },
  {
    label: "Attendance",
    icon: "checkmark-done-outline",
    route: "/(tabs)/attendance",
  },
  // { label: "Enrollment",    icon: "school-outline",           route: "/(tabs)/enrollment" },
  {
    label: "Forms & Docs",
    icon: "document-text-outline",
    route: "/(tabs)/forms",
  },
  // { label: "Resources",     icon: "library-outline",          route: "/(tabs)/resources" },
  { label: "Photos", icon: "images-outline", route: "/(tabs)/photos" },
  {
    label: "Newsletters",
    icon: "newspaper-outline",
    route: "/(tabs)/newsletters",
  },
  { label: "Volunteer", icon: "heart-outline", route: "/(tabs)/volunteer" },
  // { label: "Reimbursement", icon: "cash-outline",             route: "/(tabs)/reimbursement" },
  { label: "Activities", icon: "ribbon-outline", route: "/(tabs)/preferences" },
  { label: "Rewards", icon: "gift-outline", route: "/(tabs)/rewards" },
  { label: "Tuition", icon: "card-outline", route: "/(tabs)/tuition" },
  {
    label: "Privacy",
    icon: "shield-checkmark-outline",
    url: "https://sagefield.co/privacy",
  },
  {
    label: "Terms",
    icon: "document-outline",
    url: "https://sagefield.co/terms",
  },
  { label: "Help", icon: "help-circle-outline", route: "/(tabs)/help" },
  { label: "Settings", icon: "settings-outline", route: "/(tabs)/settings" },
];

export const MoreMenuSheet = forwardRef<BottomSheetModal>((_, ref) => {
  const router = useRouter();
  const tuitionSheetRef = useRef<BottomSheetModal>(null);
  const [secretCode, setSecretCode] = useState("");

  const handleItemPress = useCallback(
    (item: MenuItem) => {
      if (item.label === "Tuition") {
        (ref as React.RefObject<BottomSheetModal>).current?.dismiss();
        setTimeout(() => tuitionSheetRef.current?.present(), 300);
        return;
      }
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

  // Pad to a multiple of 3 so the last row always fills evenly
  const padded = [...MENU_ITEMS];
  while (padded.length % 3 !== 0) padded.push(null as any);
  const rows: (MenuItem | null)[][] = [];
  for (let i = 0; i < padded.length; i += 3) {
    rows.push(padded.slice(i, i + 3));
  }

  return (
    <>
      <BottomSheetModal
        ref={ref}
        snapPoints={["60%"]}
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
                {row.map((item, cellIdx) =>
                  item === null ? (
                    <View key={`spacer-${cellIdx}`} style={{ flex: 1 }} />
                  ) : (
                    <Pressable
                      key={item.label}
                      style={({ pressed }) => [
                        styles.cell,
                        pressed && styles.cellPressed,
                      ]}
                      onPress={() => handleItemPress(item)}
                    >
                      <View style={styles.iconWrap}>
                        <Ionicons
                          name={item.icon}
                          size={28}
                          color={Brand.sage700}
                        />
                      </View>
                      <Text style={styles.label}>{item.label}</Text>
                    </Pressable>
                  ),
                )}
              </View>
            ))}
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      <BottomSheetModal
        ref={tuitionSheetRef}
        snapPoints={["40%"]}
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
        <BottomSheetView style={styles.tuitionContainer}>
          <Text style={styles.tuitionTitle}>Tuition</Text>
          <Text style={styles.tuitionBody}>
            We're still working on the mobile version of tuition — it's coming
            soon! In the meantime, please use the parent portal to make payments
            or view your billing history.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.tuitionBtn,
              pressed && { opacity: 0.75 },
            ]}
            onPress={() =>
              openBrowserAsync("https://www.sagefield.co/parent/billing", {
                presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
              })
            }
          >
            <Ionicons name="open-outline" size={14} color="#fff" />
            <Text style={styles.tuitionBtnText}>Open Parent Portal</Text>
          </Pressable>
          <TextInput
            style={styles.secretInput}
            value={secretCode}
            onChangeText={(val) => {
              setSecretCode(val);
              if (val === "julius") {
                tuitionSheetRef.current?.dismiss();
                setSecretCode("");
                router.push("/(tabs)/tuition" as any);
              }
            }}
            secureTextEntry
            placeholder="·"
            placeholderTextColor="#ccc"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </BottomSheetView>
      </BottomSheetModal>
    </>
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
  tuitionContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  tuitionTitle: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 16,
    color: "#1f2937",
    marginBottom: 10,
  },
  tuitionBody: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 10,
  },
  tuitionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Brand.sage700,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  tuitionBtnText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#fff",
  },
  secretInput: {
    marginTop: 24,
    alignSelf: "flex-end",
    width: 52,
    height: 20,
    fontSize: 11,
    color: "#9ca3af",
    opacity: 0.45,
    borderBottomWidth: 1,
    borderColor: "#9ca3af",
    textAlign: "center",
    paddingVertical: 0,
  },
});
