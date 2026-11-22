// Garden building blocks shared by the parent feed list and post detail:
// post-type pill, reaction bar (with burst), media mosaic, photo viewer,
// attachment rows.
import { DEFAULT_FEED_REACTIONS } from "@/components/feed/FeedReactionRow";
import type { PostAttachmentRow, PostMediaRow, PostReactionRow } from "@/components/feed/feedTypes";
import { attachmentIcon, formatFileSize } from "@/components/feed/feedUtils";
import {
  Garden,
  GardenFonts,
  GardenRadii,
  PressableScale,
  haptic,
} from "@/components/garden";
import { getPostTypeDisplay } from "@/lib/feedPostTypeDisplay";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EmojiKeyboard, { type EmojiType } from "rn-emoji-keyboard";

// ─── Post type pill ──────────────────────────────────────────────────────────
export function PostTypePill({ value }: { value: string | null }) {
  const d = getPostTypeDisplay(value);
  if (!d) return null;
  return (
    <View style={[bits.typePill, { backgroundColor: d.bg }]}>
      <Text style={[bits.typeText, { color: d.text }]} maxFontSizeMultiplier={1.25}>
        {d.labelUpper}
      </Text>
    </View>
  );
}

// ─── Reaction bar ────────────────────────────────────────────────────────────
function Particle({ emoji, x, onDone }: { emoji: string; x: number; onDone: () => void }) {
  const ty = useSharedValue(0);
  const tx = useSharedValue(0);
  const o = useSharedValue(1);
  const sc = useSharedValue(0.8);
  useEffect(() => {
    const drift = (Math.random() - 0.5) * 28;
    ty.value = withTiming(-44, { duration: 760 });
    tx.value = withTiming(drift, { duration: 760 });
    sc.value = withSequence(withTiming(1.1, { duration: 200 }), withTiming(1, { duration: 560 }));
    o.value = withDelay(
      240,
      withTiming(0, { duration: 500 }, (fin) => {
        if (fin) runOnJS(onDone)();
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once
  }, []);
  const st = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: sc.value }],
  }));
  return <Animated.Text style={[bits.particle, { left: x }, st]}>{emoji}</Animated.Text>;
}

function ReactionPill({
  emoji,
  count,
  mine,
  onPress,
  onLongPress,
  onLayoutX,
}: {
  emoji: string;
  count: number;
  mine: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  onLayoutX: (x: number) => void;
}) {
  const reduce = useReducedMotion();
  const pop = useSharedValue(1);
  const prevMine = useRef(mine);
  useEffect(() => {
    if (mine && !prevMine.current && !reduce) {
      pop.value = withSequence(withTiming(1.08, { duration: 140 }), withTiming(1, { duration: 220 }));
    }
    prevMine.current = mine;
  }, [mine, pop, reduce]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return (
    <Animated.View style={st} onLayout={(e) => onLayoutX(e.nativeEvent.layout.x + e.nativeEvent.layout.width / 2 - 8)}>
      <PressableScale
        haptics={false}
        pressedScale={0.9}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={350}
        accessibilityLabel={`${emoji} ${count} reaction${count === 1 ? "" : "s"}${mine ? ", you reacted" : ""}`}
        accessibilityHint={onLongPress && count > 0 ? "Double tap to react. Hold to see who reacted." : "Double tap to react"}
        accessibilityState={{ selected: mine }}
        style={[bits.pill, mine && bits.pillMine, count > 0 && { paddingHorizontal: 10 }]}
      >
        <Text style={bits.pillEmoji}>{emoji}</Text>
        {count > 0 ? (
          <Text style={[bits.pillCount, mine && { color: Garden.sageDeep }]} maxFontSizeMultiplier={1.2}>
            {count}
          </Text>
        ) : null}
      </PressableScale>
    </Animated.View>
  );
}

export function ReactionBar({
  reactions,
  currentUserId,
  onReact,
  onLongPress,
}: {
  reactions: PostReactionRow[];
  currentUserId: string | null;
  /** Resolve true when the reaction was added (plays the burst). */
  onReact: (emoji: string) => Promise<boolean>;
  onLongPress?: (emoji: string) => void;
}) {
  const reduce = useReducedMotion();
  const [particles, setParticles] = useState<{ id: string; emoji: string; x: number }[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const xs = useRef<Record<string, number>>({});

  const summary: Record<string, { count: number; mine: boolean }> = {};
  for (const r of reactions) {
    const s = (summary[r.emoji] ??= { count: 0, mine: false });
    s.count++;
    if (r.user_id === currentUserId) s.mine = true;
  }
  const custom = Object.keys(summary).filter((e) => !DEFAULT_FEED_REACTIONS.includes(e));
  const all = [...DEFAULT_FEED_REACTIONS, ...custom];

  const press = async (emoji: string) => {
    const added = await onReact(emoji);
    if (!added || reduce) return;
    const x = xs.current[emoji] ?? 0;
    const stamp = Date.now();
    setParticles((p) => [...p, ...Array.from({ length: 5 }, (_, i) => ({ id: `${stamp}-${i}`, emoji, x }))]);
  };

  return (
    <View style={{ overflow: "visible" }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, alignItems: "center", paddingVertical: 4, paddingHorizontal: 4 }}>
        {all.map((emoji) => (
          <ReactionPill
            key={emoji}
            emoji={emoji}
            count={summary[emoji]?.count ?? 0}
            mine={summary[emoji]?.mine ?? false}
            onPress={() => void press(emoji)}
            onLongPress={onLongPress && (summary[emoji]?.count ?? 0) > 0 ? () => onLongPress(emoji) : undefined}
            onLayoutX={(x) => (xs.current[emoji] = x)}
          />
        ))}
        <PressableScale
          haptics="tap"
          pressedScale={0.9}
          onPress={() => setPickerOpen(true)}
          accessibilityLabel="Add a different reaction"
          style={[bits.pill, { borderStyle: "dashed" }]}
        >
          <Ionicons name="add" size={18} color={Garden.sageDeep} />
        </PressableScale>
      </ScrollView>
      {particles.length > 0 ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {particles.map((p) => (
            <Particle
              key={p.id}
              emoji={p.emoji}
              x={p.x}
              onDone={() => setParticles((prev) => prev.filter((q) => q.id !== p.id))}
            />
          ))}
        </View>
      ) : null}
      <EmojiKeyboard
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onEmojiSelected={(e: EmojiType) => {
          setPickerOpen(false);
          void press(e.emoji);
        }}
      />
    </View>
  );
}

// ─── Media mosaic ────────────────────────────────────────────────────────────
function Tile({
  m,
  w,
  h,
  onPress,
  overlay,
  label,
}: {
  m: PostMediaRow;
  w: number;
  h: number;
  onPress: () => void;
  overlay?: string;
  label: string;
}) {
  return (
    <PressableScale
      pressedScale={0.97}
      haptics="tap"
      onPress={onPress}
      accessibilityLabel={label}
      style={{ width: w, height: h, borderRadius: 14, overflow: "hidden", backgroundColor: "#f1e7d8" }}
    >
      {m.signed_url ? (
        <Image
          source={{ uri: m.signed_url }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={180}
          recyclingKey={m.id}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
          <Ionicons name="image-outline" size={22} color={Garden.muted} />
        </View>
      )}
      {m.kind === "video" ? (
        <View style={bits.play}>
          <Ionicons name="play" size={18} color={Garden.white} />
        </View>
      ) : null}
      {overlay ? (
        <View style={bits.moreOverlay}>
          <Text style={bits.moreText}>{overlay}</Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

export function MediaMosaic({
  media,
  width,
  onOpen,
}: {
  media: PostMediaRow[];
  width: number;
  onOpen: (index: number) => void;
}) {
  if (media.length === 0) return null;
  const gap = 4;
  const n = media.length;
  const label = (i: number) =>
    `${media[i].kind === "video" ? "Video" : "Photo"} ${i + 1} of ${n}. Opens full screen`;
  if (n === 1) {
    return <Tile m={media[0]} w={width} h={Math.round(width * 0.75)} onPress={() => onOpen(0)} label={label(0)} />;
  }
  if (n === 2) {
    const w = (width - gap) / 2;
    return (
      <View style={{ flexDirection: "row", gap }}>
        {media.map((m, i) => (
          <Tile key={m.id} m={m} w={w} h={w * 1.15} onPress={() => onOpen(i)} label={label(i)} />
        ))}
      </View>
    );
  }
  if (n === 3) {
    const w = (width - gap) / 2;
    return (
      <View style={{ gap }}>
        <Tile m={media[0]} w={width} h={width * 0.6} onPress={() => onOpen(0)} label={label(0)} />
        <View style={{ flexDirection: "row", gap }}>
          <Tile m={media[1]} w={w} h={w * 0.8} onPress={() => onOpen(1)} label={label(1)} />
          <Tile m={media[2]} w={w} h={w * 0.8} onPress={() => onOpen(2)} label={label(2)} />
        </View>
      </View>
    );
  }
  const topW = (width - gap) / 2;
  const bottom = media.slice(2, 5);
  const botW = (width - gap * (bottom.length - 1)) / bottom.length;
  const extra = n - 5;
  return (
    <View style={{ gap }}>
      <View style={{ flexDirection: "row", gap }}>
        <Tile m={media[0]} w={topW} h={topW} onPress={() => onOpen(0)} label={label(0)} />
        <Tile m={media[1]} w={topW} h={topW} onPress={() => onOpen(1)} label={label(1)} />
      </View>
      <View style={{ flexDirection: "row", gap }}>
        {bottom.map((m, i) => {
          const idx = i + 2;
          const isLast = idx === 4 && extra > 0;
          return (
            <Tile
              key={m.id}
              m={m}
              w={botW}
              h={botW}
              onPress={() => onOpen(idx)}
              overlay={isLast ? `+${extra}` : undefined}
              label={isLast ? `${extra} more photos. Opens full screen` : label(idx)}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── Full-screen photo viewer ────────────────────────────────────────────────
export function PhotoViewer({
  media,
  startIndex,
  visible,
  onClose,
  onSave,
  onOpenVideo,
}: {
  media: PostMediaRow[];
  startIndex: number;
  visible: boolean;
  onClose: () => void;
  onSave: (uri: string) => void;
  onOpenVideo: (uri: string) => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(startIndex);
  useEffect(() => {
    if (visible) setIndex(startIndex);
  }, [visible, startIndex]);
  const current = media[index];

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={viewer.root}>
        <FlatList
          data={media}
          keyExtractor={(m) => m.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={Math.min(startIndex, Math.max(0, media.length - 1))}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / width);
            if (i !== index) {
              haptic.select();
              setIndex(i);
            }
          }}
          renderItem={({ item }) => (
            <View style={{ width, height, alignItems: "center", justifyContent: "center" }}>
              {item.signed_url ? (
                <Image
                  source={{ uri: item.signed_url }}
                  style={{ width, height: height * 0.78 }}
                  contentFit="contain"
                  transition={160}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <Ionicons name="image-outline" size={40} color="rgba(255,255,255,0.5)" />
              )}
              {item.kind === "video" && item.signed_url ? (
                <PressableScale
                  onPress={() => onOpenVideo(item.signed_url!)}
                  accessibilityLabel="Play video"
                  style={viewer.playBig}
                >
                  <Ionicons name="play" size={34} color={Garden.white} />
                </PressableScale>
              ) : null}
            </View>
          )}
        />
        <View style={[viewer.top, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close photo"
            style={viewer.round}
          >
            <Ionicons name="close" size={22} color={Garden.white} />
          </Pressable>
          {media.length > 1 ? (
            <Animated.View entering={FadeIn} style={viewer.counter}>
              <Text style={viewer.counterText}>{`${index + 1} / ${media.length}`}</Text>
            </Animated.View>
          ) : (
            <View />
          )}
          {current?.kind === "image" && current.signed_url ? (
            <Pressable
              onPress={() => onSave(current.signed_url!)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Save photo"
              style={[viewer.round, { width: undefined, paddingHorizontal: 14, flexDirection: "row", gap: 6 }]}
            >
              <Ionicons name="download-outline" size={18} color={Garden.white} />
              <Text style={viewer.saveText}>Save</Text>
            </Pressable>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Attachment row ──────────────────────────────────────────────────────────
export function AttachmentRow({
  att,
  onPress,
  hint,
}: {
  att: PostAttachmentRow;
  onPress?: () => void;
  hint?: string;
}) {
  return (
    <PressableScale
      pressedScale={0.98}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="link"
      accessibilityLabel={`${att.file_name}${att.file_size_bytes ? `, ${formatFileSize(att.file_size_bytes)}` : ""}`}
      accessibilityHint={hint}
      style={bits.attach}
    >
      <View style={bits.attachIcon}>
        <Ionicons name={attachmentIcon(att.kind) as never} size={17} color="#2f5f8a" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={bits.attachName} numberOfLines={1}>
          {att.file_name}
        </Text>
        {att.file_size_bytes != null ? (
          <Text style={bits.attachSize}>{formatFileSize(att.file_size_bytes)}</Text>
        ) : null}
      </View>
      <Ionicons name="open-outline" size={15} color={Garden.muted} />
    </PressableScale>
  );
}

const bits = StyleSheet.create({
  typePill: { alignSelf: "flex-start", borderRadius: GardenRadii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  typeText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 10.5, letterSpacing: 0.6 },
  pill: {
    minWidth: 44,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Garden.line,
    backgroundColor: Garden.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  pillMine: { borderColor: "#b9d3bf", backgroundColor: "#e1eee3" },
  pillEmoji: { fontSize: 17 },
  pillCount: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13, color: Garden.soft },
  particle: { position: "absolute", bottom: 8, fontSize: 16, zIndex: 50 },
  play: {
    position: "absolute",
    alignSelf: "center",
    top: "50%",
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(43,42,38,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(43,42,38,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: { fontFamily: GardenFonts.display, fontSize: 26, color: Garden.white },
  attach: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
  },
  attachIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Garden.sky,
    alignItems: "center",
    justifyContent: "center",
  },
  attachName: { fontFamily: GardenFonts.bodyBold, fontSize: 14, color: Garden.ink },
  attachSize: { fontFamily: GardenFonts.body, fontSize: 12, color: Garden.muted },
});

const viewer = StyleSheet.create({
  root: { flex: 1, backgroundColor: "rgba(20,19,17,0.96)" },
  top: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  counterText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13, color: Garden.white },
  saveText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: Garden.white },
  playBig: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
});
