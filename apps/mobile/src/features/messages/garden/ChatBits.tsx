// Garden chat building blocks shared by the DM and channel threads.
import { LinkableText } from "@/components/LinkableText";
import {
  Garden,
  GardenFonts,
  GardenIconButton,
  GardenRadii,
  PressableScale,
  gardenEnter,
  haptic,
} from "@/components/garden";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PendingFile, PendingImage } from "../chatShared";

export function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const a = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setOpen(true));
    const b = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setOpen(false));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);
  return open;
}

// ─── Header ──────────────────────────────────────────────────────────────────
export function ChatHeader({
  onBack,
  left,
  right,
}: {
  onBack: () => void;
  left: ReactNode;
  right?: ReactNode;
}) {
  return (
    <View style={h.wrap}>
      <GardenIconButton icon="chevron-back" label="Back" onPress={onBack} />
      <View style={{ flex: 1 }}>{left}</View>
      {right}
    </View>
  );
}

const h = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Garden.line,
    backgroundColor: Garden.cream,
  },
});

// ─── Day separator ───────────────────────────────────────────────────────────
export function DaySeparator({ label }: { label: string }) {
  return (
    <View style={d.wrap} accessibilityRole="header">
      <View style={d.pill}>
        <Text style={d.text}>{label}</Text>
      </View>
    </View>
  );
}

const d = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 10 },
  pill: { backgroundColor: "#f3eadc", borderRadius: GardenRadii.pill, paddingHorizontal: 12, paddingVertical: 4 },
  text: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11.5, color: Garden.soft, letterSpacing: 0.3 },
});

// ─── Bubble ──────────────────────────────────────────────────────────────────
export function Bubble({
  mine,
  body,
  imageUrl,
  fileUrl,
  fileName,
  faded,
  failed,
  groupStart = true,
  groupEnd = true,
  onImagePress,
  onFilePress,
  onLongPress,
  onPress,
  accessibilityLabel,
}: {
  mine: boolean;
  body: string;
  imageUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  faded?: boolean;
  failed?: boolean;
  groupStart?: boolean;
  groupEnd?: boolean;
  onImagePress?: () => void;
  onFilePress?: () => void;
  onLongPress?: () => void;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const { width } = useWindowDimensions();
  const imgW = Math.min(240, width * 0.62);
  const onlyImage = !!imageUrl && !body;
  const r = 20;
  const radius = mine
    ? { borderTopRightRadius: groupStart ? r : 8, borderBottomRightRadius: groupEnd ? r : 8 }
    : { borderTopLeftRadius: groupStart ? r : 8, borderBottomLeftRadius: groupEnd ? r : 8 };
  return (
    <Pressable
      onLongPress={onLongPress}
      onPress={onPress}
      delayLongPress={350}
      accessibilityLabel={accessibilityLabel}
      style={[
        b.bubble,
        mine ? b.mine : b.theirs,
        radius,
        onlyImage && { padding: 4 },
        faded && { opacity: 0.6 },
        failed && b.failed,
      ]}
    >
      {imageUrl ? (
        <Pressable onPress={onImagePress} onLongPress={onLongPress} accessibilityRole="imagebutton" accessibilityLabel="Photo. Opens full screen">
          <Image
            source={{ uri: imageUrl }}
            style={{ width: imgW, height: imgW * 0.75, borderRadius: 16 }}
            contentFit="cover"
            transition={150}
          />
        </Pressable>
      ) : null}
      {fileUrl || fileName ? (
        <Pressable
          onPress={onFilePress}
          onLongPress={onLongPress}
          accessibilityRole="link"
          accessibilityLabel={`File ${fileName ?? ""}. Opens the file`}
          style={[b.file, mine ? b.fileMine : b.fileTheirs]}
        >
          <Ionicons name="document-text-outline" size={18} color={mine ? Garden.white : Garden.sageDeep} />
          <Text style={[b.fileName, { color: mine ? Garden.white : Garden.ink }]} numberOfLines={1}>
            {fileName ?? "File"}
          </Text>
          <Ionicons name="download-outline" size={15} color={mine ? "rgba(255,255,255,0.8)" : Garden.muted} />
        </Pressable>
      ) : null}
      {body ? (
        <LinkableText
          style={[b.text, { color: mine ? Garden.white : Garden.ink }, (imageUrl || fileUrl) ? { marginTop: 6 } : null] as never}
          linkStyle={[b.link, { color: mine ? Garden.white : Garden.sageDeep }] as never}
        >
          {body}
        </LinkableText>
      ) : null}
    </Pressable>
  );
}

const b = StyleSheet.create({
  bubble: { maxWidth: "82%", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  mine: { backgroundColor: Garden.sageDeep, alignSelf: "flex-end" },
  theirs: {
    backgroundColor: Garden.white,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: Garden.line,
  },
  failed: { backgroundColor: "#b9554a" },
  text: { fontFamily: GardenFonts.body, fontSize: 15.5, lineHeight: 21.5 },
  link: { textDecorationLine: "underline", fontFamily: GardenFonts.bodyBold },
  file: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 40,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  fileMine: { backgroundColor: "rgba(255,255,255,0.14)" },
  fileTheirs: { backgroundColor: "#f6f0e6" },
  fileName: { flexShrink: 1, fontFamily: GardenFonts.bodyBold, fontSize: 14 },
});

// ─── Message status under the last bubble ────────────────────────────────────
export function MessageMeta({
  mine,
  text,
  failed,
  onRetry,
}: {
  mine: boolean;
  text?: string;
  failed?: boolean;
  onRetry?: () => void;
}) {
  if (failed) {
    return (
      <Pressable
        onPress={onRetry}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Message didn't send. Tap to retry"
        style={[m.wrap, { alignSelf: "flex-end" }]}
      >
        <Ionicons name="alert-circle" size={14} color={Garden.danger} />
        <Text style={[m.text, { color: Garden.danger, fontFamily: GardenFonts.bodyHeavy }]}>
          Didn&apos;t send · Tap to retry
        </Text>
      </Pressable>
    );
  }
  return (
    <Animated.View entering={FadeIn.duration(160)} style={[m.wrap, { alignSelf: mine ? "flex-end" : "flex-start" }]}>
      <Text style={m.text}>{text}</Text>
    </Animated.View>
  );
}

const m = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, marginTop: 3 },
  text: { fontFamily: GardenFonts.bodySemi, fontSize: 11.5, color: Garden.muted },
});

// ─── Composer ────────────────────────────────────────────────────────────────
export function Composer({
  value,
  onChangeText,
  placeholder,
  onSend,
  sending,
  canSend,
  onAttachPhoto,
  onAttachFile,
  pendingImage,
  pendingFile,
  onClearImage,
  onClearFile,
  disabledReason,
  inputRef,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  onSend: () => void;
  sending: boolean;
  canSend: boolean;
  onAttachPhoto: () => void;
  onAttachFile: () => void;
  pendingImage: PendingImage | null;
  pendingFile: PendingFile | null;
  onClearImage: () => void;
  onClearFile: () => void;
  /** Called instead of editing when writes are blocked (preview). */
  disabledReason?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
}) {
  const insets = useSafeAreaInsets();
  const kb = useKeyboardOpen();
  const [menuOpen, setMenuOpen] = useState(false);
  const sc = useSharedValue(1);
  const sendStyle = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));

  return (
    <View style={[c.wrap, { paddingBottom: kb ? 10 : Math.max(insets.bottom, 12) }]}>
      {pendingImage || pendingFile ? (
        <Animated.View entering={FadeInDown.duration(180)} style={c.preview}>
          {pendingImage ? (
            <View>
              <Image source={{ uri: pendingImage.uri }} style={c.previewImg} contentFit="cover" />
              <Pressable onPress={onClearImage} hitSlop={10} accessibilityRole="button" accessibilityLabel="Remove photo" style={c.previewX}>
                <Ionicons name="close" size={14} color={Garden.white} />
              </Pressable>
            </View>
          ) : null}
          {pendingFile ? (
            <View style={c.filePill}>
              <Ionicons name="document-text-outline" size={16} color={Garden.sageDeep} />
              <Text style={c.filePillText} numberOfLines={1}>
                {pendingFile.name}
              </Text>
              <Pressable onPress={onClearFile} hitSlop={10} accessibilityRole="button" accessibilityLabel="Remove file">
                <Ionicons name="close-circle" size={18} color={Garden.muted} />
              </Pressable>
            </View>
          ) : null}
          <Text style={c.previewNote}>ready to send</Text>
        </Animated.View>
      ) : null}

      {menuOpen ? (
        <Animated.View entering={gardenEnter()} exiting={FadeOut.duration(120)} style={c.menu}>
          <PressableScale
            onPress={() => {
              setMenuOpen(false);
              onAttachPhoto();
            }}
            accessibilityLabel="Upload Photo"
            style={c.menuItem}
          >
            <View style={[c.menuIcon, { backgroundColor: Garden.sky }]}>
              <Ionicons name="image-outline" size={19} color="#2f5f8a" />
            </View>
            <Text style={c.menuText}>Upload Photo</Text>
          </PressableScale>
          <PressableScale
            onPress={() => {
              setMenuOpen(false);
              onAttachFile();
            }}
            accessibilityLabel="Upload File"
            style={c.menuItem}
          >
            <View style={[c.menuIcon, { backgroundColor: Garden.peach }]}>
              <Ionicons name="attach-outline" size={19} color="#a2522a" />
            </View>
            <Text style={c.menuText}>Upload File</Text>
          </PressableScale>
        </Animated.View>
      ) : null}

      <View style={c.row}>
        <PressableScale
          onPress={() => {
            if (disabledReason) return disabledReason();
            haptic.select();
            setMenuOpen((v) => !v);
          }}
          accessibilityLabel={menuOpen ? "Close attachments" : "Add a photo or file"}
          accessibilityState={{ expanded: menuOpen }}
          style={[c.plus, menuOpen && { backgroundColor: Garden.sageDeep }]}
        >
          <Ionicons name={menuOpen ? "close" : "add"} size={22} color={menuOpen ? Garden.white : Garden.sageDeep} />
        </PressableScale>
        <TextInput
          ref={inputRef}
          style={c.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Garden.muted}
          multiline
          maxLength={2000}
          maxFontSizeMultiplier={1.4}
          editable={!disabledReason}
          onPressIn={disabledReason}
          onFocus={() => setMenuOpen(false)}
          accessibilityLabel={placeholder}
        />
        <Animated.View style={sendStyle}>
          <Pressable
            onPress={() => {
              if (!canSend) return;
              sc.value = withSequence(withTiming(0.92, { duration: 90 }), withTiming(1, { duration: 200 }));
              onSend();
            }}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel={sending ? "Sending" : "Send message"}
            accessibilityState={{ disabled: !canSend, busy: sending }}
            style={[c.send, !canSend && { backgroundColor: "#d9d2c5" }]}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Garden.white} />
            ) : (
              <Ionicons name="arrow-up" size={20} color={Garden.white} />
            )}
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const c = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
    backgroundColor: Garden.cream,
    borderTopWidth: 1,
    borderTopColor: Garden.line,
  },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  plus: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e1eee3",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 130,
    borderRadius: 22,
    backgroundColor: Garden.white,
    borderWidth: 1.5,
    borderColor: Garden.line,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontFamily: GardenFonts.bodySemi,
    fontSize: 15.5,
    color: Garden.ink,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Garden.coralDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  menu: { flexDirection: "row", gap: 10 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    paddingRight: 14,
    paddingLeft: 6,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
  },
  menuIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  menuText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13.5, color: Garden.ink },
  preview: { flexDirection: "row", alignItems: "center", gap: 10 },
  previewImg: { width: 64, height: 64, borderRadius: 14 },
  previewX: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Garden.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  filePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "70%",
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
  },
  filePillText: { flexShrink: 1, fontFamily: GardenFonts.bodyBold, fontSize: 13.5, color: Garden.ink },
  previewNote: { fontFamily: GardenFonts.hand, fontSize: 15, color: Garden.sageDeep },
});

// ─── Full-screen image viewer ────────────────────────────────────────────────
export function ImageViewer({ url, onClose }: { url: string | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  return (
    <Modal visible={!!url} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={iv.root} onPress={onClose} accessibilityLabel="Close photo">
        {url ? <Image source={{ uri: url }} style={{ width, height: height * 0.8 }} contentFit="contain" /> : null}
        <View style={[iv.close, { top: insets.top + 10 }]}>
          <Ionicons name="close" size={22} color={Garden.white} />
        </View>
      </Pressable>
    </Modal>
  );
}

const iv = StyleSheet.create({
  root: { flex: 1, backgroundColor: "rgba(20,19,17,0.96)", alignItems: "center", justifyContent: "center" },
  close: {
    position: "absolute",
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── "New messages" pill ─────────────────────────────────────────────────────
export function NewMessagesPill({ count, onPress }: { count: number; onPress: () => void }) {
  if (count <= 0) return null;
  return (
    <Animated.View entering={gardenEnter()} exiting={FadeOut.duration(120)} style={nm.wrap} pointerEvents="box-none">
      <PressableScale onPress={onPress} accessibilityLabel={`${count} new messages. Jump to latest`} style={nm.pill}>
        <Text style={nm.text}>{count === 1 ? "1 new message" : `${count} new messages`}</Text>
        <Ionicons name="arrow-down" size={15} color={Garden.white} />
      </PressableScale>
    </Animated.View>
  );
}

const nm = StyleSheet.create({
  wrap: { position: "absolute", bottom: 12, alignSelf: "center" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.sageDeep,
  },
  text: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13.5, color: Garden.white },
});
