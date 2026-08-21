import { Alert } from "react-native";
import { isExpoGo } from "@/lib/notifications";

const Updates =
  __DEV__ || isExpoGo
    ? null
    : (require("expo-updates") as typeof import("expo-updates"));

let checkInFlight = false;
let lastCheckAt = 0;
let promptedManifestId: string | null = null;

const CHECK_THROTTLE_MS = 30_000;

export async function checkAndPromptForAppUpdate(): Promise<void> {
  if (!Updates?.isEnabled) return;

  const now = Date.now();
  if (checkInFlight || now - lastCheckAt < CHECK_THROTTLE_MS) return;

  checkInFlight = true;
  lastCheckAt = now;

  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) return;

    const fetched = await Updates.fetchUpdateAsync();
    if (!fetched.isNew) return;

    const manifestId =
      (fetched.manifest && "id" in fetched.manifest
        ? String(fetched.manifest.id)
        : null) ?? `update-${now}`;

    if (promptedManifestId === manifestId) return;
    promptedManifestId = manifestId;

    Alert.alert(
      "Update ready",
      "A new version of Sage Field is ready. Restart now to get the latest fixes and improvements.",
      [
        { text: "Later", style: "cancel" },
        {
          text: "Restart now",
          onPress: () => {
            void Updates.reloadAsync();
          },
        },
      ],
    );
  } catch {
    // Network or update errors should not block app usage.
  } finally {
    checkInFlight = false;
  }
}
