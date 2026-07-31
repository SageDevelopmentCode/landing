import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Brand, FontFamilies, floatingTabBarStyle } from "@/constants/theme";
import {
  NewsletterSectionImage,
  deleteSectionImage,
  pendingSectionEdits,
  setPendingTeacherUpdateEdit,
  uploadSectionImage,
} from "@/lib/newsletters-actions";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMG_SIZE = 80;

export default function SectionEditorScreen() {
  const {
    sectionId,
    sectionLabel,
    isClassUpdates,
    initialBody,
    existingImages,
  } = useLocalSearchParams<{
    newsletterId: string;
    sectionId: string;
    sectionLabel: string;
    isClassUpdates: string;
    initialBody: string;
    existingImages: string;
  }>();

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
      };
    }, [navigation])
  );

  const isClass = isClassUpdates === "true";

  const [body, setBody] = useState(initialBody ?? "");
  const [images, setImages] = useState<NewsletterSectionImage[]>(() => {
    try {
      return existingImages ? JSON.parse(existingImages) : [];
    } catch {
      return [];
    }
  });
  const [uploading, setUploading] = useState(false);

  const handleDone = useCallback(() => {
    if (isClass) {
      setPendingTeacherUpdateEdit(body);
    } else if (sectionId) {
      pendingSectionEdits.set(sectionId, body);
    }
    router.back();
  }, [isClass, sectionId, body, router]);

  const handlePickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const uploaded = await uploadSectionImage(sectionId!, result.assets[0].uri);
      setImages((prev) => [...prev, uploaded]);
    } catch (e: any) {
      Alert.alert("Upload Failed", e.message ?? "Could not upload image");
    } finally {
      setUploading(false);
    }
  }, [sectionId]);

  const handleDeleteImage = useCallback((img: NewsletterSectionImage) => {
    Alert.alert("Remove Image", "Remove this image from the section?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSectionImage(img.id, img.storage_path);
            setImages((prev) => prev.filter((i) => i.id !== img.id));
          } catch (e: any) {
            Alert.alert("Error", e.message ?? "Failed to remove image");
          }
        },
      },
    ]);
  }, []);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Brand.sage700} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{sectionLabel}</Text>
        <Pressable
          style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.7 }]}
          onPress={handleDone}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </Pressable>
      </View>

      {isClass ? (
        // Class Updates — show only current teacher's textarea
        <View style={styles.flex}>
          <View style={styles.classLabelRow}>
            <Text style={styles.classLabel}>Your Update</Text>
          </View>
          <TextInput
            style={styles.bodyInput}
            value={body}
            onChangeText={setBody}
            multiline
            placeholder="Write your class update here…"
            placeholderTextColor="#9ca3af"
            textAlignVertical="top"
          />
        </View>
      ) : (
        // Regular section — body + image strip
        <View style={styles.flex}>
          <TextInput
            style={styles.bodyInput}
            value={body}
            onChangeText={setBody}
            multiline
            placeholder={`Write content for ${sectionLabel}…`}
            placeholderTextColor="#9ca3af"
            textAlignVertical="top"
          />

          {/* Image strip */}
          <View style={styles.imageStripContainer}>
            <View style={styles.imageStripHeader}>
              <Text style={styles.imageStripTitle}>Images ({images.length})</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imageStrip}
            >
              {images.map((img) => (
                <Pressable
                  key={img.id}
                  style={({ pressed }) => [styles.imageTile, pressed && { opacity: 0.8 }]}
                  onLongPress={() => handleDeleteImage(img)}
                  onPress={() =>
                    Alert.alert("Image", "Long-press to remove this image.", [
                      { text: "Remove", style: "destructive", onPress: () => handleDeleteImage(img) },
                      { text: "Cancel", style: "cancel" },
                    ])
                  }
                >
                  <Image
                    source={{ uri: img.signed_url ?? undefined }}
                    style={styles.imageThumb}
                    contentFit="cover"
                  />
                </Pressable>
              ))}
              <Pressable
                style={({ pressed }) => [styles.addImageBtn, pressed && { opacity: 0.7 }]}
                onPress={handlePickImage}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={Brand.sage700} />
                ) : (
                  <Ionicons name="add" size={28} color={Brand.sage700} />
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
    gap: 8,
  },
  backBtn: { width: 32, alignItems: "flex-start" },
  headerTitle: { flex: 1, fontFamily: FontFamilies.heading, fontSize: 16, color: "#1f2937" },
  doneBtn: {
    backgroundColor: Brand.sage700,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  doneBtnText: { fontFamily: FontFamilies.bodySemiBold, fontSize: 13, color: "#fff" },
  classLabelRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  classLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bodyInput: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: "#111827",
    lineHeight: 24,
    padding: 16,
  },
  imageStripContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
    paddingBottom: 20,
  },
  imageStripHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  imageStripTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  imageStrip: { paddingHorizontal: 16, gap: 10, alignItems: "center" },
  imageTile: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    borderRadius: 8,
    overflow: "hidden",
  },
  imageThumb: { width: IMG_SIZE, height: IMG_SIZE },
  addImageBtn: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
  },
});
