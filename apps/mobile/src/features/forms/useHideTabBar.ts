// Hides the floating tab bar while a form detail screen is focused and
// restores it on blur (unchanged from the original per-screen code).
import { floatingTabBarStyle } from "@/constants/theme";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { useCallback } from "react";

export function useHideTabBar() {
  const navigation = useNavigation();
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
      };
    }, [navigation]),
  );
}
