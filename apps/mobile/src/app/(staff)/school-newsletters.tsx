// Staff Newsletters reader — Garden. The same published-issues screen parents
// see, opened from the staff Home's "View all". The pencil jumps to the
// newsletter editor at (staff)/newsletters. Body in
// src/features/newsletters/garden/NewslettersReaderScreen.tsx.
import { GardenIconButton } from "@/components/garden";
import { NewslettersReaderScreen } from "@/features/newsletters/garden/NewslettersReaderScreen";
import { useRouter } from "expo-router";

export default function StaffSchoolNewslettersScreen() {
  const router = useRouter();
  return (
    <NewslettersReaderScreen
      fallbackHref="/(staff)/home"
      heroRight={
        <GardenIconButton
          icon="create-outline"
          label="Edit newsletters"
          onPress={() => router.push("/(staff)/newsletters" as never)}
        />
      }
    />
  );
}
