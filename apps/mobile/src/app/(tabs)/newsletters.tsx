// Parent Newsletters — Garden. The screen body is shared with staff and lives
// in src/features/newsletters/garden/NewslettersReaderScreen.tsx.
import { NewslettersReaderScreen } from "@/features/newsletters/garden/NewslettersReaderScreen";

export default function NewslettersScreen() {
  return <NewslettersReaderScreen fallbackHref="/(tabs)/home" />;
}
