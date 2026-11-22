// A small stack of taped polaroids that slowly cycles through the school
// photos on the Welcome screen. Decorative only — hidden from screen readers.
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { Garden, gardenEnter, gardenShadow, gardenShadowSm } from "@/components/garden";

const SLIDES = [
  require("@/assets/images/stock/Stock1.webp"),
  require("@/assets/images/stock/Stock2.webp"),
  require("@/assets/images/stock/Stock3.webp"),
  require("@/assets/images/stock/Stock4.webp"),
  require("@/assets/images/stock/Stock5.webp"),
  require("@/assets/images/stock/Stock6.webp"),
  require("@/assets/images/stock/Stock7.webp"),
  require("@/assets/images/stock/Stock8.webp"),
  require("@/assets/images/stock/Stock9.webp"),
  require("@/assets/images/stock/Stock10.webp"),
  require("@/assets/images/stock/Stock11.webp"),
];

const ROTATE_MS = 7000;

export function WelcomePhotoStack() {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(() => Math.floor(Math.random() * SLIDES.length));

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const front = Math.round(Math.min(width * 0.6, height * 0.26));
  const back = Math.round(front * 0.8);
  const spread = Math.round(front * 0.28);
  const transition = reduceMotion ? 0 : 700;

  const frames = [
    // Back left, back right, then the front photo on top.
    { key: "left", size: back, tilt: -2, dx: -spread, dy: 4, tape: Garden.sky, slide: index + 1 },
    { key: "right", size: back, tilt: 2, dx: spread, dy: 14, tape: Garden.peach, slide: index + 2 },
    { key: "front", size: front, tilt: -1, dx: 0, dy: 26, tape: Garden.butter, slide: index },
  ];

  return (
    <View
      style={[styles.wrap, { height: front + 72 }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {frames.map((f, i) => (
        <Animated.View
          key={f.key}
          entering={gardenEnter(i, { max: 8 })}
          style={[styles.slot, { top: f.dy, marginLeft: f.dx - (f.size + 16) / 2 }]}
        >
          {/* Tilt lives on the inner view so it doesn't fight the entrance transform. */}
          <View
            style={[
              styles.frame,
              f.key === "front" ? gardenShadow : gardenShadowSm,
              { transform: [{ rotate: `${f.tilt}deg` }] },
            ]}
          >
            <View pointerEvents="none" style={[styles.tape, { backgroundColor: f.tape }]} />
            <Image
              source={SLIDES[f.slide % SLIDES.length]}
              style={{ width: f.size, height: f.size, borderRadius: 3 }}
              contentFit="cover"
              transition={transition}
            />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "stretch",
    position: "relative",
  },
  slot: {
    position: "absolute",
    left: "50%",
  },
  frame: {
    backgroundColor: Garden.white,
    padding: 8,
    paddingBottom: 26,
    borderRadius: 4,
  },
  tape: {
    position: "absolute",
    top: -9,
    alignSelf: "center",
    width: 64,
    height: 18,
    borderRadius: 2,
    opacity: 0.9,
    zIndex: 2,
    transform: [{ rotate: "-4deg" }],
  },
});
