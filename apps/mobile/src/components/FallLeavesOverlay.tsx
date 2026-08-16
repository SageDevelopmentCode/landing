import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const FALL_COLORS = ["#d97706", "#b45309", "#ca8a04", "#9a3412", "#c2410c"];
export const FALL_GREEN_COLORS = ["#5E7C68", "#6B8E5A", "#4A6354"];

const ALL_FALL_LEAF_COLORS = [...FALL_COLORS, ...FALL_GREEN_COLORS];
const LEAF_COUNT = 24;

let hasPlayedFallLeavesThisSession = false;

export function isFallSeason(_date = new Date()) {
  return true;
}

export function shouldPlayFallLeaves() {
  return isFallSeason() && !hasPlayedFallLeavesThisSession;
}

export function markFallLeavesPlayed() {
  hasPlayedFallLeavesThisSession = true;
}

type LeafConfig = {
  id: string;
  startX: number;
  delay: number;
  color: string;
  duration: number;
  size: number;
  sway: number;
  rotation: number;
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function buildLeafConfigs(): LeafConfig[] {
  return Array.from({ length: LEAF_COUNT }, (_, i) => ({
    id: `leaf-${i}`,
    startX: randomBetween(SCREEN_WIDTH * 0.02, SCREEN_WIDTH * 0.98),
    delay: randomBetween(0, 2000) + i * 60,
    color: ALL_FALL_LEAF_COLORS[i % ALL_FALL_LEAF_COLORS.length],
    duration: randomBetween(8000, 12000),
    size: randomBetween(12, 20),
    sway: randomBetween(18, 36),
    rotation: randomBetween(120, 300) * (Math.random() > 0.5 ? 1 : -1),
  }));
}

function FallingLeaf({
  startX,
  delay,
  color,
  duration,
  size,
  sway,
  rotation,
  onDone,
}: LeafConfig & { onDone: () => void }) {
  const translateY = useSharedValue(-40);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const swayDuration = 1400;
    const swayRepeats = Math.ceil(duration / (swayDuration * 2));

    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(0.45, { duration: 500 }),
        withDelay(
          Math.max(0, duration - 1400),
          withTiming(0, { duration: 900 }),
        ),
      ),
    );
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 60, { duration }, (finished) => {
        if (finished) runOnJS(onDoneRef.current)();
      }),
    );
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(sway, { duration: swayDuration }),
          withTiming(-sway, { duration: swayDuration }),
        ),
        swayRepeats,
        true,
      ),
    );
    rotate.value = withDelay(delay, withTiming(rotation, { duration }));
  }, [delay, duration, opacity, rotate, rotation, sway, translateX, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.leaf, { left: startX }, animStyle]}>
      <Ionicons name="leaf" size={size} color={color} />
    </Animated.View>
  );
}

type FallLeavesOverlayProps = {
  onComplete: () => void;
};

export function FallLeavesOverlay({ onComplete }: FallLeavesOverlayProps) {
  const leaves = useMemo(() => buildLeafConfigs(), []);
  const doneCount = useRef(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const handleLeafDone = useCallback(() => {
    doneCount.current += 1;
    if (doneCount.current >= leaves.length) {
      onCompleteRef.current();
    }
  }, [leaves.length]);

  return (
    <Animated.View style={styles.overlay} pointerEvents="none">
      {leaves.map((leaf) => (
        <FallingLeaf key={leaf.id} {...leaf} onDone={handleLeafDone} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  leaf: {
    position: "absolute",
    top: 0,
  },
});
