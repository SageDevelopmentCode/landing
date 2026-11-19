import { NewsletterEditorProvider } from "@/features/staff-newsletters/NewsletterEditorProvider";
import { Stack } from "expo-router";

export default function NewslettersLayout() {
  // The editor, section editor and preview share one live draft.
  return (
    <NewsletterEditorProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="[newsletterId]" />
        <Stack.Screen name="section" />
        <Stack.Screen name="preview" />
      </Stack>
    </NewsletterEditorProvider>
  );
}
