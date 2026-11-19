// Stops a screen with unsaved edits from closing by swipe-back, Android back,
// or the hero back button without asking first.
//   const guard = useDiscardGuard(isDirty);
//   <GardenScreenHero onBack={guard.back} … />
//   after a successful save: guard.leave(() => router.back());
import { usePreventRemove, useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";
import { haptic } from "./haptics";

export function useDiscardGuard(
  dirty: boolean,
  {
    title = "Discard changes?",
    message = "You have unsaved changes. If you leave now they'll be lost.",
    keepLabel = "Keep editing",
    discardLabel = "Discard",
    fallbackHref,
  }: {
    title?: string;
    message?: string;
    keepLabel?: string;
    discardLabel?: string;
    /** Where back goes when there's no history. */
    fallbackHref?: string;
  } = {},
) {
  const router = useRouter();
  const navigation = useNavigation();
  // Once the screen decides to leave (after a save or a confirmed discard)
  // the guard steps aside — setState is async, so a flag drives it.
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else if (fallbackHref) router.replace(fallbackHref as never);
  }, [router, fallbackHref]);

  usePreventRemove(dirty && !leaving, ({ data }) => {
    if (leavingRef.current) {
      navigation.dispatch(data.action);
      return;
    }
    haptic.warning();
    Alert.alert(title, message, [
      { text: keepLabel, style: "cancel" },
      {
        text: discardLabel,
        style: "destructive",
        onPress: () => {
          leavingRef.current = true;
          setLeaving(true);
          navigation.dispatch(data.action);
        },
      },
    ]);
  });

  /** Leave without asking (e.g. right after a successful save). */
  const leave = useCallback(
    (fn: () => void = goBack) => {
      leavingRef.current = true;
      setLeaving(true);
      // Let the guard re-render off before navigating.
      requestAnimationFrame(fn);
    },
    [goBack],
  );

  /** Back press: asks first when dirty (via usePreventRemove). */
  const back = useCallback(() => {
    if (!router.canGoBack() && fallbackHref) {
      if (!dirty) return router.replace(fallbackHref as never);
      haptic.warning();
      Alert.alert(title, message, [
        { text: keepLabel, style: "cancel" },
        { text: discardLabel, style: "destructive", onPress: () => leave(() => router.replace(fallbackHref as never)) },
      ]);
      return;
    }
    router.back();
  }, [router, fallbackHref, dirty, title, message, keepLabel, discardLabel, leave]);

  return { back, leave };
}
