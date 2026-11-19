// Garden toasts: friendly, tactile status messages that slide in from the top.
//   const toast = useToast();
//   const id = toast.show({ tone: "loading", title: "Uploading photo…" });
//   toast.update(id, { tone: "success", title: "Photo updated" });
import { Ionicons } from "@expo/vector-icons";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeOutUp,
  LinearTransition,
  SlideInUp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Garden, GardenFonts, GardenRadii, gardenShadow } from "./gardenTheme";
import { haptic } from "./haptics";

export type ToastTone = "success" | "info" | "error" | "loading";

export type ToastOptions = {
  tone?: ToastTone;
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void };
  /** ms; loading toasts stay until updated. Default 3200 (error 5000). */
  duration?: number;
  /** Skip the haptic for this toast. */
  silent?: boolean;
};

type ToastItem = ToastOptions & { id: number; tone: ToastTone };

type ToastApi = {
  show: (opts: ToastOptions) => number;
  update: (id: number, opts: Partial<ToastOptions>) => void;
  dismiss: (id: number) => void;
};

const noop: ToastApi = { show: () => -1, update: () => {}, dismiss: () => {} };
const ToastContext = createContext<ToastApi>(noop);

export function useToast() {
  return useContext(ToastContext);
}

const TONE_STYLE: Record<ToastTone, { bg: string; fg: string; icon: React.ComponentProps<typeof Ionicons>["name"] }> = {
  success: { bg: Garden.mint, fg: "#245a37", icon: "checkmark-circle" },
  info: { bg: Garden.sky, fg: "#24527c", icon: "sparkles" },
  error: { bg: Garden.dangerTint, fg: Garden.danger, icon: "alert-circle" },
  loading: { bg: Garden.butter, fg: "#5c4500", icon: "time" },
};

const MAX_VISIBLE = 3;

function fireHaptic(tone: ToastTone) {
  if (tone === "success") haptic.success();
  else if (tone === "error") haptic.error();
  else if (tone === "info") haptic.select();
}

export function GardenToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const itemsRef = useRef<ToastItem[]>([]);
  const commit = useCallback((next: ToastItem[]) => {
    itemsRef.current = next;
    setToasts(next);
  }, []);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    commit(itemsRef.current.filter((x) => x.id !== id));
  }, [commit]);

  const schedule = useCallback(
    (item: ToastItem) => {
      const existing = timers.current.get(item.id);
      if (existing) clearTimeout(existing);
      if (item.tone === "loading") return;
      const ms = item.duration ?? (item.tone === "error" ? 5000 : 3200);
      timers.current.set(
        item.id,
        setTimeout(() => dismiss(item.id), ms),
      );
    },
    [dismiss],
  );

  const announce = (item: ToastItem) => {
    AccessibilityInfo.announceForAccessibility(
      item.message ? `${item.title}. ${item.message}` : item.title,
    );
  };

  const show = useCallback(
    (opts: ToastOptions) => {
      const item: ToastItem = { ...opts, tone: opts.tone ?? "info", id: nextId.current++ };
      const next = [...itemsRef.current, item];
      commit(next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next);
      schedule(item);
      if (!opts.silent) fireHaptic(item.tone);
      announce(item);
      return item.id;
    },
    [schedule, commit],
  );

  const update = useCallback(
    (id: number, opts: Partial<ToastOptions>) => {
      const current = itemsRef.current.find((x) => x.id === id);
      if (!current) {
        // Already dismissed (e.g. swiped away) — surface the result as a fresh toast.
        if (opts.title) show({ ...opts, title: opts.title });
        return;
      }
      const merged: ToastItem = { ...current, ...opts, tone: opts.tone ?? current.tone };
      commit(itemsRef.current.map((x) => (x.id === id ? merged : x)));
      schedule(merged);
      if (!opts.silent && opts.tone) fireHaptic(merged.tone);
      if (opts.title) announce(merged);
    },
    [schedule, show, commit],
  );

  const api = useMemo(() => ({ show, update, dismiss }), [show, update, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      <View style={{ flex: 1 }}>
        {children}
        <ToastHost toasts={toasts} onDismiss={dismiss} />
      </View>
    </ToastContext.Provider>
  );
}

function ToastHost({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, { paddingTop: insets.top + 6, zIndex: 9999, elevation: 9999 }]}
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </View>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const tone = TONE_STYLE[item.tone];
  const y = useSharedValue(0);
  const pan = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .onUpdate((e) => {
      y.value = Math.min(e.translationY, 12);
    })
    .onEnd((e) => {
      if (e.translationY < -24 || e.velocityY < -500) {
        runOnJS(onDismiss)();
      } else {
        y.value = withSpring(0);
      }
    });
  const s = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        entering={SlideInUp.springify().damping(16)}
        exiting={FadeOutUp.duration(180)}
        layout={LinearTransition.springify()}
        style={[styles.wrap, s]}
      >
        <Pressable
          onPress={onDismiss}
          accessibilityRole="alert"
          accessibilityLabel={item.message ? `${item.title}. ${item.message}` : item.title}
          accessibilityHint="Tap to dismiss"
          style={[styles.card, { backgroundColor: tone.bg }]}
        >
          <View style={styles.iconWrap}>
            {item.tone === "loading" ? (
              <ActivityIndicator size="small" color={tone.fg} />
            ) : (
              <Ionicons name={tone.icon} size={20} color={tone.fg} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: tone.fg }]} maxFontSizeMultiplier={1.4}>
              {item.title}
            </Text>
            {item.message ? (
              <Text style={styles.message} maxFontSizeMultiplier={1.4}>
                {item.message}
              </Text>
            ) : null}
          </View>
          {item.action ? (
            <Pressable
              hitSlop={10}
              onPress={() => {
                item.action?.onPress();
                onDismiss();
              }}
              accessibilityRole="button"
              style={({ pressed }) => [styles.action, pressed && { opacity: 0.6 }]}
            >
              <Text style={[styles.actionText, { color: tone.fg }]}>{item.action.label}</Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 14,
    marginBottom: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: GardenRadii.md,
    borderWidth: 1,
    borderColor: "rgba(43,42,38,0.08)",
    ...gardenShadow,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 14,
  },
  message: {
    fontFamily: GardenFonts.body,
    fontSize: 13,
    color: Garden.soft,
    marginTop: 1,
  },
  action: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: GardenRadii.pill,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  actionText: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 13,
  },
});
