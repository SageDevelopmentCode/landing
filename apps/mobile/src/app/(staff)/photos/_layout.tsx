import { Stack } from "expo-router";
import { UploadQueueProvider } from "@/contexts/UploadQueueContext";

export default function PhotosLayout() {
  return (
    <UploadQueueProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="[photoId]" />
        <Stack.Screen name="upload" />
        <Stack.Screen name="edit" />
      </Stack>
    </UploadQueueProvider>
  );
}
