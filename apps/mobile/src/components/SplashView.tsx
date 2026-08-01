import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

export default function SplashView() {
  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/ImageOne.webp")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          // @ts-ignore — experimental_backgroundImage is available in RN 0.83+
          {
            experimental_backgroundImage:
              "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.50) 45%, rgba(0,0,0,0.15) 75%, transparent 100%)",
          },
        ]}
      />
      <View style={styles.logoContainer}>
        <Image
          source={require("@/assets/images/Logo.png")}
          style={styles.logo}
          contentFit="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  logoContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: { width: 120, height: 60 },
});
