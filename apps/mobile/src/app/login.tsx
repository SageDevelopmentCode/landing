import { useState } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Display,
  Garden,
  GardenButton,
  GardenField,
  GardenFonts,
  GardenIconButton,
  GardenSpace,
  HandNote,
  MIN_TAP,
  gardenEnter,
  haptic,
} from "@/components/garden";
import { useLogin, type AuthResult } from "@/features/auth/useLogin";
import { AuthError, FieldLabel, OtpBoxes, PasswordToggle } from "@/features/auth/garden/LoginParts";

function enter(i: number) {
  return gardenEnter(i, { max: 8 });
}

function feedback(r: AuthResult | null) {
  if (r && !r.ok) haptic.error();
}

export default function LoginScreen() {
  const router = useRouter();
  const l = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const isOtp = l.authMethod === "otp";

  async function submitEmailStep() {
    if (isOtp) {
      const r = await l.sendOtp();
      if (r?.ok) haptic.success();
      feedback(r);
    } else {
      feedback(await l.signInWithPassword(() => haptic.success()));
    }
  }

  async function submitCode() {
    feedback(await l.verifyOtp(() => haptic.success()));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* key={step} replays the entrance when switching steps */}
          <View key={l.step} style={{ flexGrow: 1 }}>
            <Animated.View entering={enter(0)} style={styles.topRow}>
              <GardenIconButton
                icon="chevron-back"
                label="Back"
                onPress={l.step === "email" ? () => router.replace("/") : l.back}
              />
              <Image
                source={require("@/assets/images/Logo.png")}
                style={styles.logo}
                contentFit="contain"
                accessibilityLabel="Sage Field logo"
              />
            </Animated.View>

            {l.step === "email" ? (
              <>
                <Animated.View entering={enter(1)}>
                  <Display size={34}>Welcome Back</Display>
                  {isOtp ? <HandNote style={styles.stepNote}>step 1 of 2</HandNote> : null}
                  <Text maxFontSizeMultiplier={1.4} style={styles.subtitle}>
                    {isOtp
                      ? "Enter your email and we'll send a 6-digit code — no password needed."
                      : "Sign in with your email and password."}
                  </Text>
                </Animated.View>

                <Animated.View entering={enter(2)}>
                  <AuthError message={l.error} />

                  <View style={styles.field}>
                    <FieldLabel>Email address</FieldLabel>
                    <GardenField
                      icon="mail-outline"
                      value={l.email}
                      onChangeText={l.setEmail}
                      placeholder="you@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      textContentType="emailAddress"
                      autoCorrect={false}
                      returnKeyType={isOtp ? "go" : "next"}
                      onSubmitEditing={isOtp ? () => void submitEmailStep() : undefined}
                      accessibilityLabel="Email address"
                    />
                  </View>

                  {!isOtp ? (
                    <View style={styles.field}>
                      <FieldLabel>Password</FieldLabel>
                      <GardenField
                        icon="lock-closed-outline"
                        value={l.password}
                        onChangeText={l.setPassword}
                        placeholder="••••••••"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete="password"
                        textContentType="password"
                        autoCorrect={false}
                        returnKeyType="go"
                        onSubmitEditing={() => void submitEmailStep()}
                        accessibilityLabel="Password"
                        right={
                          <PasswordToggle
                            shown={showPassword}
                            onToggle={() => setShowPassword((v) => !v)}
                          />
                        }
                      />
                    </View>
                  ) : null}
                </Animated.View>

                <Animated.View entering={enter(3)} style={styles.primary}>
                  <GardenButton
                    label={isOtp ? "Send code" : "Sign in"}
                    loadingLabel={isOtp ? "Sending…" : "Signing in…"}
                    tone="coral"
                    fullWidth
                    loading={l.loading}
                    onPress={() => void submitEmailStep()}
                  />
                </Animated.View>

                <Animated.View entering={enter(4)} style={styles.footer}>
                  <Pressable
                    onPress={() => {
                      haptic.select();
                      l.switchMethod();
                      setShowPassword(false);
                    }}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.switchMethod, pressed && { opacity: 0.6 }]}
                  >
                    <Text maxFontSizeMultiplier={1.4} style={styles.switchMethodText}>
                      {isOtp ? "Sign in with password" : "Sign in with magic link"}
                    </Text>
                  </Pressable>
                </Animated.View>
              </>
            ) : (
              <>
                <Animated.View entering={enter(1)}>
                  <Display size={34}>Check your inbox</Display>
                  <HandNote style={styles.stepNote}>step 2 of 2</HandNote>
                  <Text maxFontSizeMultiplier={1.4} style={styles.subtitle}>
                    We sent a 6-digit code to{" "}
                    <Text style={styles.emailHighlight}>{l.email}</Text>. Check your
                    inbox and enter it below.
                  </Text>
                </Animated.View>

                <Animated.View entering={enter(2)}>
                  <AuthError message={l.error} />
                  <FieldLabel>Verification code</FieldLabel>
                  <OtpBoxes
                    otp={l.otp}
                    inputRefs={l.otpRefs}
                    onChange={l.handleOtpChange}
                    onKeyPress={l.handleOtpKeyPress}
                    onSubmit={() => void submitCode()}
                  />
                </Animated.View>

                <Animated.View entering={enter(3)}>
                  <GardenButton
                    label="Verify code"
                    loadingLabel="Checking…"
                    tone="coral"
                    fullWidth
                    loading={l.loading}
                    onPress={() => void submitCode()}
                  />
                </Animated.View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Garden.cream,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: GardenSpace.gutter + 4,
    paddingTop: 8,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  logo: {
    width: 44,
    height: 38,
  },
  stepNote: {
    marginTop: 6,
  },
  subtitle: {
    fontFamily: GardenFonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Garden.soft,
    marginTop: 10,
    marginBottom: 26,
  },
  emailHighlight: {
    fontFamily: GardenFonts.bodyBold,
    color: Garden.ink,
  },
  field: {
    marginBottom: 18,
  },
  primary: {
    marginTop: 6,
  },
  footer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingTop: 24,
  },
  switchMethod: {
    minHeight: MIN_TAP,
    alignSelf: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  switchMethodText: {
    fontFamily: GardenFonts.bodyBold,
    fontSize: 14.5,
    color: Garden.sageDeep,
  },
});
