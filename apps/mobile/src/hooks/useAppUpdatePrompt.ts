import { checkAndPromptForAppUpdate } from "@/lib/app-updates";
import { isExpoGo } from "@/lib/notifications";
import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";

const INITIAL_CHECK_DELAY_MS = 2_000;

export function useAppUpdatePrompt() {
  useEffect(() => {
    if (__DEV__ || isExpoGo) return;

    const initialTimer = setTimeout(() => {
      void checkAndPromptForAppUpdate();
    }, INITIAL_CHECK_DELAY_MS);

    const subscription = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "active") {
          void checkAndPromptForAppUpdate();
        }
      },
    );

    return () => {
      clearTimeout(initialTimer);
      subscription.remove();
    };
  }, []);
}
