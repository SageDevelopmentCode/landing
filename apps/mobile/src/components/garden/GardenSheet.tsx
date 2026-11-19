// Shared Garden bottom-sheet chrome: cream panel, soft handle, 0.35 backdrop
// that closes on press. Spread onto any BottomSheetModal:
//   <BottomSheetModal ref={ref} {...gardenSheetChrome} enableDynamicSizing>
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Garden, GardenRadii } from "./gardenTheme";

export function GardenSheetBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      pressBehavior="close"
      opacity={0.35}
    />
  );
}

export const gardenSheetChrome = {
  backgroundStyle: { backgroundColor: Garden.cream, borderRadius: GardenRadii.panel },
  handleIndicatorStyle: { backgroundColor: "rgba(43,42,38,0.25)", width: 44 },
  backdropComponent: GardenSheetBackdrop,
  enablePanDownToClose: true,
} as const;
