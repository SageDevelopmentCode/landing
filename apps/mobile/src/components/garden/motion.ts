// Garden motion: calm, eased, no overshoot. Use these instead of
// `.springify()` / `ZoomIn` so entrances and pops feel smooth, not jumpy.
//   <Animated.View entering={reduce ? undefined : gardenEnter(index)} />
//   <Animated.View entering={gardenPopIn()} />   // check icons, pills, dots
//   <Animated.View layout={gardenLayout()} />
import {
  Easing,
  FadeInDown,
  LinearTransition,
  withDelay,
  withTiming,
  type EntryExitAnimationFunction,
} from "react-native-reanimated";

export const GardenMotion = {
  fast: 160,
  base: 220,
  slow: 300,
  ease: Easing.out(Easing.cubic),
} as const;

/** Soft fade + 8px rise, with a short capped stagger. */
export function gardenEnter(
  index = 0,
  { step = 40, max = 6, base = 0 }: { step?: number; max?: number; base?: number } = {},
) {
  return FadeInDown.duration(260)
    .easing(GardenMotion.ease)
    .delay(base + Math.min(index, max) * step)
    .withInitialValues({ opacity: 0, transform: [{ translateY: 8 }] });
}

/** Gentle fade + scale from 0.85 for small confirmations (checks, pills, dots). */
export function gardenPopIn(delay = 0): EntryExitAnimationFunction {
  const ease = GardenMotion.ease;
  return () => {
    "worklet";
    return {
      initialValues: { opacity: 0, transform: [{ scale: 0.85 }] },
      animations: {
        opacity: withDelay(delay, withTiming(1, { duration: 180, easing: ease })),
        transform: [{ scale: withDelay(delay, withTiming(1, { duration: 220, easing: ease })) }],
      },
    };
  };
}

/** Eased layout glide for lists that reflow. */
export function gardenLayout() {
  return LinearTransition.duration(GardenMotion.base).easing(GardenMotion.ease);
}
