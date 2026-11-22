// Staff Teacher Favorites — Garden. Same screen as the parent app, with Back
// falling through to the staff Home. Body lives in
// src/features/teacher-favorites/garden/TeacherFavoritesScreen.tsx.
import { TeacherFavoritesScreen } from "@/features/teacher-favorites/garden/TeacherFavoritesScreen";

export default function StaffTeacherFavoritesRoute() {
  return <TeacherFavoritesScreen fallbackHref="/(staff)/home" />;
}
