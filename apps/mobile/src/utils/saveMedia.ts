import * as FileSystem from "expo-file-system/legacy";
import { Share, Alert, Platform } from "react-native";

export async function saveImageToLibrary(uri: string): Promise<void> {
  const localUri = `${FileSystem.cacheDirectory}sagefield_${Date.now()}.jpg`;
  try {
    await FileSystem.downloadAsync(uri, localUri);
    await Share.share(
      Platform.OS === "ios" ? { url: localUri } : { message: localUri }
    );
  } catch (err) {
    console.error("[saveImageToLibrary] error:", err);
    Alert.alert("Error", "Could not save the photo. Please try again.");
  } finally {
    await FileSystem.deleteAsync(localUri, { idempotent: true });
  }
}
