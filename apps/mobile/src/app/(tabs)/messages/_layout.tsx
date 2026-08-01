import { Stack } from "expo-router";

export default function MessagesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="compose" options={{ presentation: "modal" }} />
      <Stack.Screen name="channel/[channelId]" />
    </Stack>
  );
}
