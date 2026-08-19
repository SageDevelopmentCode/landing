import {
  getEmergencySnackLabel,
  getSharedFoodLabel,
} from "@/components/SchoolDayFoodPreferencesSheet";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { Brand, FontFamilies } from "@/constants/theme";
import type { StaffSchoolDayFoodPref } from "@/lib/staff-food-and-activity-prefs";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { forwardRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const AVATAR_PALETTE = [
  "#6b7c9b",
  "#7b8ca3",
  "#8b9c7e",
  "#9c7e8b",
  "#7e8b9c",
  "#a07060",
  "#707ea0",
  "#608070",
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Props = {
  prefs: StaffSchoolDayFoodPref[];
  loading: boolean;
};

export const StaffSchoolDayFoodPrefsSheet = forwardRef<BottomSheetModal, Props>(
  function StaffSchoolDayFoodPrefsSheet({ prefs, loading }, ref) {
    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={["50%", "85%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
        backgroundStyle={{ backgroundColor: "#ffffff" }}
        handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>School Day Food Preferences</Text>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={Brand.sage700} />
              <SkeletonBox width="100%" height={72} borderRadius={12} />
              <SkeletonBox width="100%" height={72} borderRadius={12} />
            </View>
          ) : prefs.length === 0 ? (
            <Text style={styles.emptyText}>
              No school day food preferences saved yet.
            </Text>
          ) : (
            prefs.map((pref) => (
              <View key={pref.studentId} style={styles.row}>
                {pref.photo ? (
                  <Image
                    source={{ uri: pref.photo }}
                    style={[styles.avatar, styles.avatarImg]}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: avatarColor(pref.studentId) },
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {getInitials(pref.name)}
                    </Text>
                  </View>
                )}
                <View style={styles.info}>
                  <Text style={styles.name}>{pref.name}</Text>
                  <View style={styles.chipRow}>
                    <View style={[styles.chip, styles.chipEmergency]}>
                      <Text style={styles.chipText} numberOfLines={3}>
                        {getEmergencySnackLabel(pref.emergencySnack)}
                      </Text>
                    </View>
                    <View style={[styles.chip, styles.chipShared]}>
                      <Text style={styles.chipText} numberOfLines={3}>
                        {getSharedFoodLabel(pref.sharedFood)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 10,
  },
  title: {
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: "#1f2937",
    marginBottom: 4,
    marginTop: 4,
  },
  loadingWrap: {
    gap: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
    paddingVertical: 24,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  avatarImg: {
    backgroundColor: "transparent",
  },
  avatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#fff",
  },
  info: {
    flex: 1,
    gap: 8,
  },
  name: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  chipRow: {
    gap: 6,
  },
  chip: {
    alignSelf: "stretch",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  chipEmergency: {
    backgroundColor: "#fff7ed",
  },
  chipShared: {
    backgroundColor: "#f0fdf4",
  },
  chipText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#374151",
    lineHeight: 16,
  },
});
