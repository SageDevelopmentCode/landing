// Pill text / search input with a focus ring and a clear button.
import { Ionicons } from "@expo/vector-icons";
import { forwardRef, useState, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Garden, GardenFonts, GardenRadii, MIN_TAP } from "./gardenTheme";
import { haptic } from "./haptics";

export type GardenFieldProps = TextInputProps & {
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  /** Show an ✕ that clears the value. */
  clearable?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  /** Rounded rectangle instead of a pill (multiline notes). */
  boxed?: boolean;
  /** Trailing slot after the input, e.g. a show/hide password toggle. */
  right?: ReactNode;
  /** Swap the input, e.g. BottomSheetTextInput inside sheets. */
  InputComponent?: React.ComponentType<TextInputProps & { ref?: React.Ref<TextInput> }>;
};

export const GardenField = forwardRef<TextInput, GardenFieldProps>(function GardenField(
  { icon, clearable, containerStyle, boxed, right, InputComponent, value, onChangeText, onFocus, onBlur, style, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const Input = InputComponent ?? TextInput;
  return (
    <View
      style={[
        styles.wrap,
        boxed && styles.boxed,
        focused && styles.focused,
        containerStyle,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={focused ? Garden.sageDeep : Garden.muted} /> : null}
      <Input
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={Garden.muted}
        maxFontSizeMultiplier={1.4}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[styles.input, boxed && { textAlignVertical: "top" }, style]}
        {...rest}
      />
      {clearable && value ? (
        <Pressable
          onPress={() => {
            haptic.tap();
            onChangeText?.("");
          }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Clear"
        >
          <Ionicons name="close-circle" size={18} color={Garden.muted} />
        </Pressable>
      ) : null}
      {right ?? null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: MIN_TAP + 4,
    paddingHorizontal: 16,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.white,
    borderWidth: 1.5,
    borderColor: Garden.line,
  },
  boxed: {
    borderRadius: GardenRadii.sm,
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  focused: { borderColor: Garden.sage },
  input: {
    flex: 1,
    fontFamily: GardenFonts.bodySemi,
    fontSize: 15.5,
    color: Garden.ink,
    paddingVertical: 10,
  },
});
