import { Stack } from "expo-router";

export default function StaffFeedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[postId]" />
      <Stack.Screen name="compose" options={{ presentation: "modal" }} />
    </Stack>
  );
}
