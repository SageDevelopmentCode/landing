// Gentle, tactile press — the mobile stand-in for Garden hover effects.
import { forwardRef, type ReactNode } from "react";
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type View,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { GardenSprings } from "./gardenTheme";
import { haptic } from "./haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, "style" | "children"> & {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Scale when pressed. Default 0.97. */
  pressedScale?: number;
  /** Haptic on press-in. Default "tap". Pass false to disable. */
  haptics?: false | keyof typeof haptic;
};

export const PressableScale = forwardRef<View, PressableScaleProps>(
  function PressableScale(
    {
      children,
      style,
      pressedScale = 0.97,
      haptics = "tap",
      onPressIn,
      onPressOut,
      disabled,
      accessibilityRole = "button",
      ...rest
    },
    ref,
  ) {
    const reduce = useReducedMotion();
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <AnimatedPressable
        ref={ref}
        accessibilityRole={accessibilityRole}
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPressIn={(e) => {
          if (!reduce) scale.value = withSpring(pressedScale, GardenSprings.press);
          if (haptics) haptic[haptics]();
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          scale.value = withSpring(1, GardenSprings.pop);
          onPressOut?.(e);
        }}
        style={[style, animatedStyle, disabled && { opacity: 0.55 }]}
        {...rest}
      >
        {children}
      </AnimatedPressable>
    );
  },
);
