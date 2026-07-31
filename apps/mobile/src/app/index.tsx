import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { openBrowserAsync, WebBrowserPresentationStyle } from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { Brand, FontFamilies } from "@/constants/theme";

const SLIDES = [
  require("@/assets/images/stock/Stock1.webp"),
  require("@/assets/images/stock/Stock2.webp"),
  require("@/assets/images/stock/Stock3.webp"),
  require("@/assets/images/stock/Stock4.webp"),
  require("@/assets/images/stock/Stock5.webp"),
  require("@/assets/images/stock/Stock6.webp"),
  require("@/assets/images/stock/Stock7.webp"),
  require("@/assets/images/stock/Stock8.webp"),
  require("@/assets/images/stock/Stock9.webp"),
  require("@/assets/images/stock/Stock10.webp"),
  require("@/assets/images/stock/Stock11.webp"),
];

export default function LoginScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(
    () => Math.floor(Math.random() * SLIDES.length)
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    }, 7000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background slideshow */}
      <Image
        source={SLIDES[currentIndex]}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={{ duration: 800 }}
      />

      {/* Gradient overlay */}
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

      {/* Content */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Image
            source={require("@/assets/images/Logo.png")}
            style={styles.logo}
            contentFit="contain"
          />

          <Text style={styles.heading}>Welcome to{"\n"}Sage Field</Text>

          <Text style={styles.tagline}>A place where curiosity grows.</Text>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.buttonText}>Log in to continue</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.textLinkRow, pressed && { opacity: 0.6 }]}
            onPress={() => router.push("/interested")}
          >
            <Text style={styles.textLink}>Interested in Sage Field?</Text>
            <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>

        <View style={styles.legalRow}>
          <Pressable
            onPress={() =>
              openBrowserAsync("https://sagefield.co/privacy", {
                presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
              })
            }
          >
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable
            onPress={() =>
              openBrowserAsync("https://sagefield.co/terms", {
                presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
              })
            }
          >
            <Text style={styles.legalLink}>Terms of Use</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  safeArea: {
    flex: 1,
    justifyContent: "flex-end",
  },
  content: {
    paddingHorizontal: 32,
    paddingBottom: 24,
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 120,
    height: 60,
    marginBottom: 4,
  },
  heading: {
    fontFamily: FontFamilies.heading,
    fontSize: 34,
    color: "#ffffff",
    textAlign: "center",
    lineHeight: 44,
  },
  tagline: {
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 4,
  },
  button: {
    backgroundColor: Brand.coral,
    borderRadius: 12,
    paddingVertical: 16,
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#ffffff",
  },
  textLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  textLink: {
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 12,
  },
  legalLink: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  legalDot: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
  },
});
