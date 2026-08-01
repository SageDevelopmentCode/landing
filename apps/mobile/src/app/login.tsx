import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { supabase } from "@/lib/supabase";
import { notifyDiscordAnon } from "@/lib/discord";
import { Brand, FontFamilies } from "@/constants/theme";

export default function LoginScreen() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [authMethod, setAuthMethod] = useState<"otp" | "password">("otp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const sectionAnims = useRef(
    Array.from({ length: 5 }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(16),
    }))
  ).current;

  useEffect(() => {
    sectionAnims.forEach((anim) => {
      anim.opacity.setValue(0);
      anim.translateY.setValue(16);
    });
    Animated.stagger(
      70,
      sectionAnims.map((anim) =>
        Animated.parallel([
          Animated.timing(anim.opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(anim.translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      )
    ).start();
  }, [step]);

  async function handleSendOtp() {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      notifyDiscordAnon({ type: 'login_otp_sent', data: { email: email.trim() } });
      setStep("code");
    }
  }

  async function routeByRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .schema("admin")
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (data?.role === "parent") {
      const { data: grant } = await supabase
        .schema("parent_app")
        .from("dashboard_access_grants")
        .select("owner_id")
        .eq("grantee_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      if (grant) {
        router.replace("/(tabs)/home");
        return;
      }
      const { data: enrolled } = await supabase
        .schema("parent_app")
        .from("applications")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "enrolled")
        .limit(1);
      if ((enrolled?.length ?? 0) > 0) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/not-enrolled");
      }
    } else {
      router.replace("/(staff)/home");
    }
  }

  async function handleSignInWithPassword() {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      await routeByRole();
    }
  }

  async function handleVerifyOtp() {
    const token = otp.join("");
    if (token.length < 6) return;
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      await routeByRole();
    }
  }

  function handleOtpChange(value: string, index: number) {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const next = [...otp];
      digits.forEach((d, i) => { next[i] = d; });
      setOtp(next);
      inputRefs.current[Math.min(digits.length - 1, 5)]?.focus();
      return;
    }
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyPress(key: string, index: number) {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleBack() {
    setStep("email");
    setOtp(["", "", "", "", "", ""]);
    setError("");
  }

  function handleAuthMethodChange(method: "otp" | "password") {
    setAuthMethod(method);
    setError("");
    setPassword("");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: sectionAnims[0].opacity, transform: [{ translateY: sectionAnims[0].translateY }] }}>
            <Pressable onPress={() => router.replace("/")} style={styles.topBack}>
              <Text style={styles.topBackText}>← Back</Text>
            </Pressable>
          </Animated.View>

          {step === "email" ? (
            <>
              <Animated.View style={{ opacity: sectionAnims[1].opacity, transform: [{ translateY: sectionAnims[1].translateY }] }}>
                <Text style={styles.heading}>Welcome Back</Text>
                <Text style={styles.subtitle}>
                  {authMethod === "otp"
                    ? "Enter your email and we'll send a 6-digit code — no password needed."
                    : "Sign in with your email and password."}
                </Text>
              </Animated.View>

              <Animated.View style={{ opacity: sectionAnims[2].opacity, transform: [{ translateY: sectionAnims[2].translateY }] }}>
                {!!error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <View style={styles.field}>
                  <Text style={styles.label}>Email address</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                  />
                </View>

                {authMethod === "password" && (
                  <View style={styles.field}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={[styles.input, styles.inputWithIcon]}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        placeholderTextColor="#9ca3af"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete="password"
                        autoCorrect={false}
                      />
                      <Pressable
                        style={styles.eyeButton}
                        onPress={() => setShowPassword((v) => !v)}
                        hitSlop={8}
                      >
                        <SymbolView
                          name={
                            showPassword
                              ? { ios: "eye.slash", android: "visibility_off", web: "visibility_off" }
                              : { ios: "eye", android: "visibility", web: "visibility" }
                          }
                          size={18}
                          tintColor="#9ca3af"
                        />
                      </Pressable>
                    </View>
                  </View>
                )}
              </Animated.View>

              <Animated.View style={{ opacity: sectionAnims[3].opacity, transform: [{ translateY: sectionAnims[3].translateY }] }}>
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    (pressed || loading) && styles.buttonPressed,
                  ]}
                  onPress={authMethod === "otp" ? handleSendOtp : handleSignInWithPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {authMethod === "otp" ? "Send code" : "Sign in"}
                    </Text>
                  )}
                </Pressable>
              </Animated.View>

              <Animated.View style={{ flex: 1, justifyContent: "flex-end", opacity: sectionAnims[4].opacity, transform: [{ translateY: sectionAnims[4].translateY }] }}>
                <Pressable
                  style={styles.switchMethodButton}
                  onPress={() =>
                    handleAuthMethodChange(authMethod === "otp" ? "password" : "otp")
                  }
                >
                  <Text style={styles.switchMethodText}>
                    {authMethod === "otp" ? "Sign in with password" : "Sign in with magic link"}
                  </Text>
                </Pressable>
              </Animated.View>
            </>
          ) : (
            <>
              <Animated.View style={{ opacity: sectionAnims[1].opacity, transform: [{ translateY: sectionAnims[1].translateY }] }}>
                <Pressable onPress={handleBack} style={styles.backLink}>
                  <Text style={styles.backLinkText}>← Back</Text>
                </Pressable>
                <Text style={styles.heading}>Check your inbox</Text>
                <Text style={styles.subtitle}>
                  We sent a 6-digit code to{" "}
                  <Text style={styles.emailHighlight}>{email}</Text>. Check your
                  inbox and enter it below.
                </Text>
              </Animated.View>

              <Animated.View style={{ opacity: sectionAnims[2].opacity, transform: [{ translateY: sectionAnims[2].translateY }] }}>
                {!!error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
                <Text style={styles.otpLabel}>Verification code</Text>
                <View style={styles.otpRow}>
                  {otp.map((digit, i) => (
                    <TextInput
                      key={i}
                      ref={(el) => {
                        inputRefs.current[i] = el;
                      }}
                      style={styles.otpInput}
                      value={digit}
                      onChangeText={(v) => handleOtpChange(v, i)}
                      onKeyPress={({ nativeEvent }) =>
                        handleOtpKeyPress(nativeEvent.key, i)
                      }
                      maxLength={6}
                      keyboardType="number-pad"
                      textContentType="oneTimeCode"
                      autoComplete="one-time-code"
                      textAlign="center"
                      selectTextOnFocus
                    />
                  ))}
                </View>
              </Animated.View>

              <Animated.View style={{ opacity: sectionAnims[3].opacity, transform: [{ translateY: sectionAnims[3].translateY }] }}>
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    (pressed || loading) && styles.buttonPressed,
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Verify code</Text>
                  )}
                </Pressable>
              </Animated.View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Brand.welcomeBg,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
  },

  // Top back button
  topBack: {
    alignSelf: "flex-start",
    marginBottom: 32,
  },
  topBackText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
  },

  // Headings
  heading: {
    fontFamily: FontFamilies.heading,
    fontSize: 30,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 22,
    marginBottom: 28,
  },
  emailHighlight: {
    fontFamily: FontFamilies.bodySemiBold,
    color: "#374151",
  },

  // Error box
  errorBox: {
    backgroundColor: "#F2C6C6",
    borderWidth: 1,
    borderColor: "#E6B7B2",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  errorText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#A55858",
  },

  // Form
  field: {
    marginBottom: 20,
  },
  label: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#1f2937",
  },
  inputWrapper: {
    position: "relative",
  },
  inputWithIcon: {
    paddingRight: 44,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  // Button
  button: {
    backgroundColor: Brand.coral,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#ffffff",
  },

  // Bottom switch method link
  switchMethodButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  switchMethodText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
  },

  // OTP
  otpLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  otpRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  otpInput: {
    flex: 1,
    height: 52,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    fontSize: 18,
    fontFamily: FontFamilies.bodySemiBold,
    fontWeight: "600",
    color: "#1f2937",
  },

  // Back link
  backLink: {
    marginBottom: 24,
    alignSelf: "flex-start",
  },
  backLinkText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
  },
});
