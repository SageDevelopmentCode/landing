import Constants from "expo-constants";
import { isExpoGo } from "@/lib/notifications";

const Updates = isExpoGo
  ? null
  : (require("expo-updates") as typeof import("expo-updates"));

export type AppUpdateInfo = {
  nativeAppVersion: string | null;
  nativeBuildVersion: string | null;
  runtimeVersion: string | null;
  updateId: string | null;
  channel: string | null;
  isEmbeddedLaunch: boolean | null;
};

export function getAppUpdateInfo(): AppUpdateInfo {
  return {
    nativeAppVersion: Constants.nativeApplicationVersion ?? null,
    nativeBuildVersion: Constants.nativeBuildVersion ?? null,
    runtimeVersion: Updates?.runtimeVersion ?? Constants.expoConfig?.runtimeVersion ?? null,
    updateId: Updates?.updateId ?? null,
    channel: Updates?.channel ?? null,
    isEmbeddedLaunch: Updates?.isEmbeddedLaunch ?? null,
  };
}
