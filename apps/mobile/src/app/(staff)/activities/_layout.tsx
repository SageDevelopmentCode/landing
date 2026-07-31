import { Stack } from "expo-router";

export default function ActivitiesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[activityId]" />
      <Stack.Screen name="form" />
      <Stack.Screen name="changelog" />
    </Stack>
  );
}
