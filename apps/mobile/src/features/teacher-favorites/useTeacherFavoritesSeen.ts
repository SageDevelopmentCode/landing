// "New!" state + opener for the Teacher Favorites section on the parent and
// staff Homes. The flag lives on the device (AsyncStorage) and is re-read on
// focus, so coming back from the screen clears the badge.
import { useAuth } from "@/contexts/AuthContext";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { markTeacherFavoritesSeen, readTeacherFavoritesSeen } from "./teacherFavorites";

const ROUTES = {
  parent: "/(tabs)/teacher-favorites",
  staff: "/(staff)/teacher-favorites",
} as const;

export function useTeacherFavoritesSeen(area: keyof typeof ROUTES) {
  const router = useRouter();
  const { isReadOnlyPreview } = useAuth();
  // null until read, so the badge never flickers in.
  const [seen, setSeen] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void readTeacherFavoritesSeen().then((v) => {
        if (active) setSeen(v);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const open = useCallback(
    (teacher?: string) => {
      // Don't drop the badge mid-transition; the focus re-read hides it on return.
      if (!isReadOnlyPreview) void markTeacherFavoritesSeen();
      router.push(
        (teacher
          ? { pathname: ROUTES[area], params: { teacher } }
          : ROUTES[area]) as never,
      );
    },
    [area, isReadOnlyPreview, router],
  );

  return { seen, open };
}
