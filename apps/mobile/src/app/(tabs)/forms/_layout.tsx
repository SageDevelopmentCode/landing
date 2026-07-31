import { Stack } from "expo-router";

export default function FormsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="contract" />
      <Stack.Screen name="health-form" />
      <Stack.Screen name="medication-plan" />
      <Stack.Screen name="photo-release" />
      <Stack.Screen name="assumption-of-risk" />
      <Stack.Screen name="authorized-pickup" />
      <Stack.Screen name="health-statement" />
      <Stack.Screen name="immunization" />
    </Stack>
  );
}
