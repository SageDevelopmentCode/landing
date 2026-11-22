// Shown while fonts load (usually underneath the native splash), so it uses
// no text — just the logo on Garden cream with a few pastel dots.
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { Garden, gardenShadow } from "@/components/garden/gardenTheme";

export default function SplashView() {
  return (
    <View style={styles.container}>
      <View style={[styles.dot, styles.dotButter]} />
      <View style={[styles.dot, styles.dotMint]} />
      <View style={[styles.dot, styles.dotSky]} />
      <View style={[styles.badge, gardenShadow]}>
        <Image
          source={require("@/assets/images/Logo.png")}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="Sage Field"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Garden.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: Garden.white,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 104, height: 88 },
  dot: { position: "absolute", borderRadius: 999 },
  dotButter: {
    width: 22,
    height: 22,
    backgroundColor: Garden.butter,
    top: "38%",
    left: "18%",
  },
  dotMint: {
    width: 30,
    height: 30,
    backgroundColor: Garden.mint,
    bottom: "36%",
    right: "16%",
  },
  dotSky: {
    width: 14,
    height: 14,
    backgroundColor: Garden.sky,
    top: "34%",
    right: "26%",
  },
});
