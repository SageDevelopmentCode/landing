import { FontFamilies } from "@/constants/theme";
import { useEffect, useRef, useState } from "react";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import EmojiKeyboard from "rn-emoji-keyboard";
import type { EmojiType } from "rn-emoji-keyboard";
import type { PostReactionRow } from "./feedTypes";
import { FeedTheme } from "./feedTheme";

export const DEFAULT_FEED_REACTIONS = ["❤️", "🌱", "🌻", "🍍"];

interface ParticleData {
  id: string;
  emoji: string;
  x: number;
}

function EmojiParticle({
  emoji,
  x,
  onDone,
}: {
  emoji: string;
  x: number;
  onDone: () => void;
}) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue((Math.random() - 0.5) * 36);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.4);

  useEffect(() => {
    translateY.value = withTiming(-68, { duration: 850 });
    translateX.value = withTiming((Math.random() - 0.5) * 52, { duration: 850 });
    scale.value = withSequence(withTiming(1.4, { duration: 180 }), withTiming(1.0, { duration: 670 }));
    opacity.value = withDelay(
      320,
      withTiming(0, { duration: 530 }, (finished) => {
        if (finished) runOnJS(onDone)();
      }),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      style={[{ position: "absolute", bottom: 6, left: x, fontSize: 15, zIndex: 50 }, animStyle]}
    >
      {emoji}
    </Animated.Text>
  );
}

export function FeedReactionRow({
  reactions,
  currentUserId,
  onReact,
  onLongPressReaction,
}: {
  reactions: PostReactionRow[];
  currentUserId: string | null;
  onReact: (emoji: string) => void;
  onLongPressReaction?: (emoji: string) => void;
}) {
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pillX = useRef<Record<string, number>>({});

  const summary: Record<string, { count: number; mine: boolean }> = {};
  for (const r of reactions) {
    if (!summary[r.emoji]) summary[r.emoji] = { count: 0, mine: false };
    summary[r.emoji].count++;
    if (r.user_id === currentUserId) summary[r.emoji].mine = true;
  }

  const customEmojis = Object.keys(summary).filter((e) => !DEFAULT_FEED_REACTIONS.includes(e));
  const allEmojis = [...DEFAULT_FEED_REACTIONS, ...customEmojis];

  function handlePress(emoji: string) {
    onReact(emoji);
    const x = pillX.current[emoji] ?? 0;
    const burst: ParticleData[] = Array.from({ length: 5 }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      emoji,
      x,
    }));
    setParticles((prev) => [...prev, ...burst]);
  }

  return (
    <View style={{ overflow: "visible" }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          {allEmojis.map((emoji) => {
            const count = summary[emoji]?.count ?? 0;
            const mine = summary[emoji]?.mine ?? false;
            return (
              <TouchableOpacity
                key={emoji}
                onLayout={(e) => {
                  pillX.current[emoji] =
                    e.nativeEvent.layout.x + e.nativeEvent.layout.width / 2 - 8;
                }}
                style={{
                  minWidth: 40,
                  height: 40,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: mine ? "#C4D9C8" : "#E8E4DF",
                  backgroundColor: mine ? "#E8F3EC" : "#FFFFFF",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: count > 0 ? 8 : 0,
                  gap: 2,
                }}
                onPress={() => handlePress(emoji)}
                onLongPress={
                  count > 0 && onLongPressReaction ? () => onLongPressReaction(emoji) : undefined
                }
                delayLongPress={350}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 17 }}>{emoji}</Text>
                {count > 0 && (
                  <Text
                    style={{
                      fontFamily: FontFamilies.bodySemiBold,
                      fontSize: 12,
                      color: FeedTheme.authorName,
                    }}
                  >
                    {count}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#E8E4DF",
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => setPickerOpen(true)}
            activeOpacity={0.75}
          >
            <Text style={{ fontFamily: FontFamilies.body, fontSize: 18, color: "#8B9E8F" }}>+</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {particles.length > 0 && (
        <View
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "visible" }}
          pointerEvents="none"
        >
          {particles.map((p) => (
            <EmojiParticle
              key={p.id}
              emoji={p.emoji}
              x={p.x}
              onDone={() => setParticles((prev) => prev.filter((pp) => pp.id !== p.id))}
            />
          ))}
        </View>
      )}
      <EmojiKeyboard
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onEmojiSelected={(emojiObj: EmojiType) => {
          handlePress(emojiObj.emoji);
          setPickerOpen(false);
        }}
      />
    </View>
  );
}
