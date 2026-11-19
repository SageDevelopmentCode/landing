// One place for Garden haptics so every surface "feels" the same.
import * as Haptics from "expo-haptics";

function safe(fn: () => Promise<void>) {
  fn().catch(() => {});
}

export const haptic = {
  /** Taps on cards, chips, tiles. */
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Segment / tab / toggle changes. */
  select: () => safe(() => Haptics.selectionAsync()),
  /** Primary button presses. */
  press: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: () =>
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () =>
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () =>
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
