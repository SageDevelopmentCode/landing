// State + handlers for the Login screen. The UI only reacts to the
// `{ ok, error? }` results these return (haptics, inline error).
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import type { TextInput } from "react-native";
import { supabase } from "@/lib/supabase";
import { notifyDiscordAnon } from "@/lib/discord";

export type AuthStep = "email" | "code";
export type AuthMethod = "otp" | "password";
export type AuthResult = { ok: boolean; error?: string };

const EMPTY_OTP = ["", "", "", "", "", ""];

export function useLogin() {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>("email");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("otp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState<string[]>(EMPTY_OTP);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const otpRefs = useRef<(TextInput | null)[]>([]);

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

  async function sendOtp(): Promise<AuthResult | null> {
    if (!email.trim()) return null;
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return { ok: false, error: err.message };
    }
    notifyDiscordAnon({ type: "login_otp_sent", data: { email: email.trim() } });
    setStep("code");
    return { ok: true };
  }

  async function signInWithPassword(onSignedIn?: () => void): Promise<AuthResult | null> {
    if (!email.trim() || !password) return null;
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (err) {
      setLoading(false);
      setError(err.message);
      return { ok: false, error: err.message };
    }
    onSignedIn?.();
    // Stay busy while we look up the role so the button can't be tapped twice.
    try {
      await routeByRole();
    } finally {
      setLoading(false);
    }
    return { ok: true };
  }

  async function verifyOtp(onSignedIn?: () => void): Promise<AuthResult | null> {
    const token = otp.join("");
    if (token.length < 6) return null;
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (err) {
      setLoading(false);
      setError(err.message);
      return { ok: false, error: err.message };
    }
    onSignedIn?.();
    try {
      await routeByRole();
    } finally {
      setLoading(false);
    }
    return { ok: true };
  }

  function handleOtpChange(value: string, index: number) {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const next = [...otp];
      digits.forEach((d, i) => {
        next[i] = d;
      });
      setOtp(next);
      otpRefs.current[Math.min(digits.length - 1, 5)]?.focus();
      return;
    }
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyPress(key: string, index: number) {
    if (key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function back() {
    setStep("email");
    setOtp(EMPTY_OTP);
    setError("");
  }

  function switchMethod() {
    setAuthMethod((m) => (m === "otp" ? "password" : "otp"));
    setError("");
    setPassword("");
  }

  return {
    step,
    authMethod,
    email,
    setEmail,
    password,
    setPassword,
    otp,
    otpRefs,
    loading,
    error,
    sendOtp,
    signInWithPassword,
    verifyOtp,
    handleOtpChange,
    handleOtpKeyPress,
    back,
    switchMethod,
  };
}

export type LoginState = ReturnType<typeof useLogin>;
