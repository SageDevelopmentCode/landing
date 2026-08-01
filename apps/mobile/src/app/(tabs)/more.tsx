import { View } from "react-native";

// This screen is intentionally never shown — the More tab press is intercepted
// in _layout.tsx to open the MoreMenuSheet bottom sheet instead.
export default function MoreScreen() {
  return <View style={{ flex: 1 }} />;
}
