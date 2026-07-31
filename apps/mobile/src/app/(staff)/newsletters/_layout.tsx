import { Stack } from "expo-router";

export default function NewslettersLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[newsletterId]" />
      <Stack.Screen name="section" />
      <Stack.Screen name="preview" />
    </Stack>
  );
}
