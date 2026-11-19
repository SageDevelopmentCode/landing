import * as FileSystem from "expo-file-system/legacy";
import { Share, Alert, Platform } from "react-native";

/**
 * Downloads the image and opens the share sheet (Save Image lives there).
 * With `{ throwOnError: true }` errors are re-thrown instead of shown as an
 * Alert, so Garden screens can show a toast with Retry.
 */
export async function saveImageToLibrary(
  uri: string,
  options?: { throwOnError?: boolean },
): Promise<void> {
  const localUri = `${FileSystem.cacheDirectory}sagefield_${Date.now()}.jpg`;
  try {
    await FileSystem.downloadAsync(uri, localUri);
    await Share.share(
      Platform.OS === "ios" ? { url: localUri } : { message: localUri }
    );
  } catch (err) {
    if (options?.throwOnError) throw err;
    console.error("[saveImageToLibrary] error:", err);
    Alert.alert("Error", "Could not save the photo. Please try again.");
  } finally {
    await FileSystem.deleteAsync(localUri, { idempotent: true });
  }
}
