// Garden pieces for the Login screen: inline auth error, field label,
// password eye toggle and the 6-box code input.
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, type MutableRefObject } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  Garden,
  GardenFonts,
  GardenRadii,
  GardenTints,
  MIN_TAP,
  haptic,
} from "@/components/garden";

// ─── Inline auth error ───────────────────────────────────────────────────────
export function AuthError({ message }: { message: string }) {
  useEffect(() => {
    if (message) AccessibilityInfo.announceForAccessibility(message);
  }, [message]);
  if (!message) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      style={styles.error}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name="alert-circle" size={18} color={GardenTints.coral.fg} />
      <Text maxFontSizeMultiplier={1.4} style={styles.errorText}>
        {message}
      </Text>
    </Animated.View>
  );
}

// ─── Field label ─────────────────────────────────────────────────────────────
export function FieldLabel({ children }: { children: string }) {
  return (
    <Text maxFontSizeMultiplier={1.4} style={styles.label}>
      {children}
    </Text>
  );
}

// ─── Password show/hide ──────────────────────────────────────────────────────
export function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <Pressable
      onPress={() => {
        haptic.select();
        onToggle();
      }}
      accessibilityRole="button"
      accessibilityLabel={shown ? "Hide password" : "Show password"}
      style={styles.eye}
    >
      <Ionicons name={shown ? "eye-off-outline" : "eye-outline"} size={20} color={Garden.muted} />
    </Pressable>
  );
}

// ─── 6-box code input ────────────────────────────────────────────────────────
export function OtpBoxes({
  otp,
  inputRefs,
  onChange,
  onKeyPress,
  onSubmit,
}: {
  otp: string[];
  inputRefs: MutableRefObject<(TextInput | null)[]>;
  onChange: (value: string, index: number) => void;
  onKeyPress: (key: string, index: number) => void;
  onSubmit: () => void;
}) {
  const [focused, setFocused] = useState<number | null>(null);
  return (
    <View style={styles.otpRow}>
      {otp.map((digit, i) => (
        <TextInput
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          style={[
            styles.otpBox,
            digit ? styles.otpFilled : null,
            focused === i ? styles.otpFocused : null,
          ]}
          value={digit}
          onChangeText={(v) => onChange(v, i)}
          onKeyPress={({ nativeEvent }) => onKeyPress(nativeEvent.key, i)}
          onFocus={() => setFocused(i)}
          onBlur={() => setFocused((f) => (f === i ? null : f))}
          onSubmitEditing={onSubmit}
          maxLength={6}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          textAlign="center"
          selectTextOnFocus
          maxFontSizeMultiplier={1.2}
          accessibilityLabel={`Digit ${i + 1} of 6`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: GardenTints.coral.bg,
    borderRadius: GardenRadii.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  errorText: {
    flex: 1,
    fontFamily: GardenFonts.bodySemi,
    fontSize: 14,
    lineHeight: 20,
    color: GardenTints.coral.fg,
  },
  label: {
    fontFamily: GardenFonts.bodyBold,
    fontSize: 14,
    color: Garden.soft,
    marginBottom: 8,
    marginLeft: 4,
  },
  eye: {
    width: MIN_TAP,
    height: MIN_TAP,
    marginRight: -10,
    alignItems: "center",
    justifyContent: "center",
  },
  otpRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
  },
  otpBox: {
    flex: 1,
    height: 58,
    backgroundColor: Garden.white,
    borderWidth: 1.5,
    borderColor: Garden.line,
    borderRadius: GardenRadii.sm,
    fontFamily: GardenFonts.display,
    fontSize: 24,
    color: Garden.ink,
    padding: 0,
  },
  otpFilled: {
    backgroundColor: GardenTints.sage.bg,
    borderColor: GardenTints.sage.bg,
  },
  otpFocused: {
    borderColor: Garden.sage,
  },
});
