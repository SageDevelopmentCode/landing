import { Stack } from "expo-router";

export default function ParentFeedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[postId]" />
    </Stack>
  );
}
