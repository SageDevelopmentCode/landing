import { saveImageToLibrary } from "@/utils/saveMedia";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FeedTheme } from "./feedTheme";
import type { PostMediaRow } from "./feedTypes";

function MediaItem({
  item,
  style,
}: {
  item: PostMediaRow;
  style?: object;
}) {
  const uri = item.signed_url;
  const [viewerVisible, setViewerVisible] = useState(false);
  return (
    <>
      <Pressable
        style={[{ overflow: "hidden", borderRadius: FeedTheme.mediaRadius }, style]}
        onPress={() => {
          if (uri && item.kind === "image") setViewerVisible(true);
        }}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            recyclingKey={item.id}
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#e5e7eb" }]} />
        )}
        {item.kind === "video" && (
          <View style={styles.playOverlay}>
            <Ionicons name="play-circle" size={36} color="rgba(255,255,255,0.9)" />
          </View>
        )}
      </Pressable>
      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.92)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setViewerVisible(false)}
        >
          <Image source={{ uri: uri! }} style={{ width: "100%", height: "100%" }} contentFit="contain" />
        </Pressable>
        <Pressable
          style={{
            position: "absolute",
            top: 56,
            right: 20,
            backgroundColor: "rgba(0,0,0,0.5)",
            borderRadius: 20,
            padding: 6,
          }}
          onPress={() => setViewerVisible(false)}
          hitSlop={12}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <View style={{ position: "absolute", bottom: 60, left: 0, right: 0, alignItems: "center" }}>
          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: "rgba(0,0,0,0.75)",
              borderRadius: 24,
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
            onPress={() => {
              if (uri) saveImageToLibrary(uri);
            }}
            hitSlop={12}
          >
            <Ionicons name="download-outline" size={22} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>Save</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

export function FeedMediaGrid({ media }: { media: PostMediaRow[] }) {
  if (media.length === 0) return null;
  const sorted = [...media].sort((a, b) => a.display_order - b.display_order);

  if (sorted.length === 1) {
    return (
      <View style={styles.wrap}>
        <View style={styles.mediaGrid1}>
          <MediaItem item={sorted[0]} style={StyleSheet.absoluteFillObject} />
        </View>
      </View>
    );
  }
  if (sorted.length === 2) {
    return (
      <View style={styles.wrap}>
        <View style={styles.mediaGrid2}>
          {sorted.map((m) => (
            <MediaItem key={m.id} item={m} style={{ flex: 1 }} />
          ))}
        </View>
      </View>
    );
  }
  const top = sorted.slice(0, 2);
  const bottom = sorted.slice(2, 5);
  const extraCount = sorted.length - 5;
  return (
    <View style={styles.wrap}>
      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: "row", height: 180, gap: 4 }}>
          {top.map((m) => (
            <MediaItem key={m.id} item={m} style={{ flex: 1 }} />
          ))}
        </View>
        <View style={{ flexDirection: "row", height: 120, gap: 4 }}>
          {bottom.map((m, idx) => {
            const isLast = idx === bottom.length - 1;
            return (
              <View key={m.id} style={{ flex: 1, overflow: "hidden", position: "relative" }}>
                <MediaItem item={m} style={StyleSheet.absoluteFillObject} />
                {isLast && extraCount > 0 && (
                  <View style={styles.overlayBadge}>
                    <Text style={styles.overlayText}>+{extraCount}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: FeedTheme.cardPaddingH,
    marginTop: 4,
  },
  mediaGrid1: {
    height: 220,
    overflow: "hidden",
    borderRadius: FeedTheme.mediaRadius,
  },
  mediaGrid2: {
    flexDirection: "row",
    height: 180,
    gap: 4,
    overflow: "hidden",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  overlayBadge: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
  },
});
