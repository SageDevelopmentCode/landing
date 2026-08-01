import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { openBrowserAsync, WebBrowserPresentationStyle } from "expo-web-browser";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Brand, FontFamilies } from "@/constants/theme";

export default function NotEnrolledScreen() {
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  function handleEnroll() {
    openBrowserAsync("https://sagefield.co/parent/dashboard", {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Image
        source={require("@/assets/images/Interior.webp")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />

      <View
        style={[
          StyleSheet.absoluteFill,
          // @ts-ignore
          {
            experimental_backgroundImage:
              "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.2) 75%, transparent 100%)",
          },
        ]}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Image
            source={require("@/assets/images/Logo.png")}
            style={styles.logo}
            contentFit="contain"
          />

          <Text style={styles.heading}>Enrollment{"\n"}Required</Text>

          <Text style={styles.body}>
            Complete your enrollment to access the Sage Field parent app —
            best experienced on a laptop or desktop.
          </Text>

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={handleEnroll}
          >
            <Text style={styles.primaryButtonText}>Complete Enrollment</Text>
          </Pressable>

          <Pressable onPress={handleSignOut} style={({ pressed }) => [pressed && styles.pressed]}>
            <Text style={styles.signOutText}>Sign out</Text>
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
    paddingBottom: 48,
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
  body: {
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 4,
  },
primaryButton: {
    backgroundColor: Brand.coral,
    borderRadius: 12,
    paddingVertical: 16,
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#ffffff",
  },
signOutText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "rgba(255,255,255,0.45)",
    marginTop: 4,
  },
  pressed: {
    opacity: 0.75,
  },
});
