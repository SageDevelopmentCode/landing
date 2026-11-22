// Lightweight pastel confetti burst (no native deps). Skipped entirely when
// the OS "Reduce Motion" setting is on.
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { Garden } from "./gardenTheme";

const COLORS = [Garden.coral, Garden.butter, Garden.mint, Garden.sky, Garden.lav, Garden.peach];
const COUNT = 24;

type Piece = { id: number; x: number; dx: number; delay: number; color: string; w: number; h: number; spin: number };

function makePieces(seed: number): Piece[] {
  const { width } = Dimensions.get("window");
  return Array.from({ length: COUNT }, (_, i) => {
    const r = (n: number) => {
      const v = Math.sin(seed * 9301 + i * 49297 + n * 233) * 10000;
      return v - Math.floor(v);
    };
    return {
      id: i,
      x: width / 2 + (r(1) - 0.5) * 80,
      dx: (r(2) - 0.5) * width * 0.8,
      delay: r(3) * 120,
      color: COLORS[i % COLORS.length],
      w: 6 + r(4) * 6,
      h: 10 + r(5) * 8,
      spin: (r(6) - 0.5) * 400,
    };
  });
}

function ConfettiPiece({ p, onDone }: { p: Piece; onDone?: () => void }) {
  const t = useSharedValue(0);
  const { height } = Dimensions.get("window");
  useEffect(() => {
    t.value = withDelay(
      p.delay,
      withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }),
    );
    if (onDone) {
      const id = setTimeout(onDone, 1700);
      return () => clearTimeout(id);
    }
  }, [onDone, p.delay, t]);
  const s = useAnimatedStyle(() => {
    const v = t.value;
    // Up then down arc.
    const y = height * 0.55 - Math.sin(v * Math.PI * 0.85) * height * 0.32 + v * v * height * 0.35;
    return {
      opacity: v < 0.85 ? 1 : (1 - v) / 0.15,
      transform: [
        { translateX: p.x + p.dx * v },
        { translateY: y },
        { rotate: `${p.spin * v}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        { position: "absolute", left: 0, top: 0, width: p.w, height: p.h, borderRadius: 2, backgroundColor: p.color },
        s,
      ]}
    />
  );
}

export type ConfettiHandle = { fire: () => void };

export const Confetti = forwardRef<ConfettiHandle>(function Confetti(_props, ref) {
  const reduce = useReducedMotion();
  const [burst, setBurst] = useState<number | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      fire: () => {
        if (reduce) return;
        setBurst(Date.now());
      },
    }),
    [reduce],
  );

  if (burst == null) return null;
  const pieces = makePieces(burst % 1000);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden>
      {pieces.map((p, i) => (
        <ConfettiPiece
          key={`${burst}-${p.id}`}
          p={p}
          onDone={i === 0 ? () => setBurst(null) : undefined}
        />
      ))}
    </View>
  );
});
