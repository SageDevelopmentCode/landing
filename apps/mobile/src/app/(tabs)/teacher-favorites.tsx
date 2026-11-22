// Parent Teacher Favorites — Garden. A little gift guide: each teacher's
// favorite drinks, treats, shops and more. Shared screen body lives in
// src/features/teacher-favorites/garden/TeacherFavoritesScreen.tsx.
import { TeacherFavoritesScreen } from "@/features/teacher-favorites/garden/TeacherFavoritesScreen";

export default function ParentTeacherFavoritesRoute() {
  return <TeacherFavoritesScreen fallbackHref="/(tabs)/home" />;
}
