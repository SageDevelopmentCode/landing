// Data hook for the Teacher Favorites screen (parent + staff). The favorites are
// static (teacherFavorites.ts); this tracks the selected teacher, shares the
// photo lookup and marks the Home "New!" badge as seen.
import { useAuth } from "@/contexts/AuthContext";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  TEACHER_FAVORITES,
  findTeacherFavorites,
  markTeacherFavoritesSeen,
} from "./teacherFavorites";
import { useTeacherPhotos } from "./useTeacherPhotos";

export function useTeacherFavorites() {
  const { teacher } = useLocalSearchParams<{ teacher?: string }>();
  const { isReadOnlyPreview } = useAuth();
  const photoFor = useTeacherPhotos();

  const [selectedName, setSelectedName] = useState<string>(
    () => findTeacherFavorites(teacher)?.fullName ?? TEACHER_FAVORITES[0].fullName,
  );

  // Deep link (?teacher=Full Name) can change while the screen stays mounted.
  useEffect(() => {
    const match = findTeacherFavorites(teacher);
    if (match) setSelectedName(match.fullName);
  }, [teacher]);

  useEffect(() => {
    if (!isReadOnlyPreview) void markTeacherFavoritesSeen();
  }, [isReadOnlyPreview]);

  const selected = useMemo(
    () => findTeacherFavorites(selectedName) ?? TEACHER_FAVORITES[0],
    [selectedName],
  );

  return {
    teachers: TEACHER_FAVORITES,
    selected,
    select: setSelectedName,
    photoFor,
  };
}

export type TeacherFavoritesState = ReturnType<typeof useTeacherFavorites>;
