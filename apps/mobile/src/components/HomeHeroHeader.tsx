import { FALL_COLORS, FALL_GREEN_COLORS } from "@/components/FallLeavesOverlay";
import { FontFamilies } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FallHeroColors = {
  gradientStart: "#F0DFC4",
  gradientMid: "#FFF4E8",
  gradientEnd: "#ffffff",
  greeting: "#8B7355",
  name: "#5C4033",
  dateLine: "#A08B6E",
  rolePillBg: "#F5E6C8",
  rolePillText: "#B45309",
  actionBorder: "#E8D0B0",
  icon: "#B45309",
  avatarBg: "#FFF4E8",
  avatarBorder: "#D97706",
  avatarText: "#B45309",
} as const;

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Good evening";
}

function roleLabel(role: string) {
  if (role === "super_admin") return "Super Admin";
  if (role === "teacher") return "Teacher";
  return role;
}

function formatTodayDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

type HomeHeroHeaderProps = {
  name: string;
  avatarUrl?: string | null;
  initials: string;
  onAvatarPress: () => void;
  role?: string;
  checklist?: {
    onPress: () => void;
    showBadge: boolean;
  };
  notifications?: {
    onPress: () => void;
    count: number;
  };
};

function FallHeroBackdrop() {
  return (
    <View style={styles.backdrop} pointerEvents="none">
      <View style={styles.glowTopRight} />
      <View style={styles.glowLowerLeft} />
      <View style={[styles.leaf, styles.leafTopLeft]}>
        <Ionicons name="leaf" size={14} color={FALL_GREEN_COLORS[0]} />
      </View>
      <View style={[styles.leaf, styles.leafLowerLeft]}>
        <Ionicons name="leaf" size={18} color={FALL_COLORS[1]} />
      </View>
      <View style={[styles.leaf, styles.leafLowerLeftSmall]}>
        <Ionicons name="leaf" size={16} color={FALL_GREEN_COLORS[1]} />
      </View>
      <View style={[styles.leaf, styles.leafTopRightLarge]}>
        <Ionicons name="leaf" size={26} color={FALL_COLORS[0]} />
      </View>
      <View style={[styles.leaf, styles.leafTopRightSmall]}>
        <Ionicons name="leaf" size={22} color={FALL_COLORS[4]} />
      </View>
    </View>
  );
}

export function HomeHeroHeader({
  name,
  avatarUrl,
  initials,
  onAvatarPress,
  role,
  checklist,
  notifications,
}: HomeHeroHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[
        FallHeroColors.gradientStart,
        FallHeroColors.gradientMid,
        FallHeroColors.gradientEnd,
      ]}
      locations={[0, 0.55, 1]}
      style={[styles.gradient, { paddingTop: insets.top + 12 }]}
    >
      <StatusBar style="dark" />
      <FallHeroBackdrop />
      <View style={styles.row}>
        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {role ? (
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>{roleLabel(role)}</Text>
            </View>
          ) : (
            <Text style={styles.dateLine}>{formatTodayDate()}</Text>
          )}
        </View>

        <View style={styles.actions}>
          {checklist && (
            <Pressable
              onPress={checklist.onPress}
              hitSlop={8}
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.badgeAnchor}>
                <Ionicons
                  name="checkbox-outline"
                  size={20}
                  color={FallHeroColors.icon}
                />
                {checklist.showBadge && <View style={styles.checklistBadge} />}
              </View>
            </Pressable>
          )}

          {notifications && (
            <Pressable
              onPress={notifications.onPress}
              hitSlop={8}
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.badgeAnchor}>
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={FallHeroColors.icon}
                />
                {notifications.count > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>
                      {notifications.count > 9 ? "9+" : String(notifications.count)}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          )}

          <Pressable
            onPress={onAvatarPress}
            hitSlop={8}
            style={({ pressed }) => [
              styles.avatar,
              pressed && styles.pressed,
            ]}
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  glowTopRight: {
    position: "absolute",
    top: -20,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#D97706",
    opacity: 0.06,
  },
  glowLowerLeft: {
    position: "absolute",
    bottom: -10,
    left: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#CA8A04",
    opacity: 0.05,
  },
  leaf: {
    position: "absolute",
    opacity: 0.15,
  },
  leafTopLeft: {
    top: 8,
    left: 4,
    transform: [{ rotate: "-30deg" }],
  },
  leafLowerLeft: {
    bottom: 6,
    left: 28,
    transform: [{ rotate: "45deg" }],
    opacity: 0.14,
  },
  leafLowerLeftSmall: {
    bottom: 18,
    left: 72,
    transform: [{ rotate: "-15deg" }],
    opacity: 0.12,
  },
  leafTopRightLarge: {
    top: 12,
    right: 88,
    transform: [{ rotate: "15deg" }],
    opacity: 0.16,
  },
  leafTopRightSmall: {
    top: 36,
    right: 24,
    transform: [{ rotate: "-25deg" }],
    opacity: 0.14,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    zIndex: 1,
  },
  greetingBlock: {
    flex: 1,
    gap: 2,
  },
  greeting: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: FallHeroColors.greeting,
  },
  name: {
    fontFamily: FontFamilies.heading,
    fontSize: 30,
    color: FallHeroColors.name,
    lineHeight: 36,
  },
  dateLine: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: FallHeroColors.dateLine,
    marginTop: 2,
  },
  rolePill: {
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: FallHeroColors.rolePillBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  rolePillText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: FallHeroColors.rolePillText,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 4,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: FallHeroColors.actionBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  badgeAnchor: {
    position: "relative",
  },
  checklistBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  notifBadge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: "#ef4444",
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  notifBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 9,
    color: "#fff",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: FallHeroColors.avatarBg,
    borderWidth: 2,
    borderColor: FallHeroColors.avatarBorder,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: FallHeroColors.avatarText,
  },
});
