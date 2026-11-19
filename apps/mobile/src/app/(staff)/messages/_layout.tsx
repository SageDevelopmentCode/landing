import { MessagingRoutesProvider, STAFF_MESSAGING_ROUTES } from "@/features/messages/messagingRoutes";
import { Stack } from "expo-router";

export default function StaffMessagesLayout() {
  return (
    <MessagingRoutesProvider value={STAFF_MESSAGING_ROUTES}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="[id]" />
        <Stack.Screen name="compose" options={{ presentation: "modal" }} />
        <Stack.Screen name="channel/[channelId]" />
      </Stack>
    </MessagingRoutesProvider>
  );
}
