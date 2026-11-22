// Teacher photos for the favorites section + screen. One shared fetch per app
// session (module-level cache) so Home and the screen don't both hit Supabase.
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { TEACHER_FAVORITES } from "./teacherFavorites";

type PhotoMap = Record<string, string | null>;

let cache: Promise<PhotoMap> | null = null;

function loadPhotos(): Promise<PhotoMap> {
  if (!cache) {
    cache = (async () => {
      const { data, error } = await supabase
        .schema("admin")
        .from("users")
        .select("full_name, profile_image_url")
        .in(
          "full_name",
          TEACHER_FAVORITES.map((t) => t.fullName),
        );
      if (error || !data) throw error ?? new Error("No teacher photos");
      const map: PhotoMap = {};
      for (const row of data as { full_name: string; profile_image_url: string | null }[]) {
        map[row.full_name.toLowerCase()] = row.profile_image_url;
      }
      return map;
    })().catch((e) => {
      cache = null; // allow a retry on the next mount
      throw e;
    });
  }
  return cache;
}

export function useTeacherPhotos() {
  const [photos, setPhotos] = useState<PhotoMap>({});

  useEffect(() => {
    let cancelled = false;
    loadPhotos()
      .then((map) => {
        if (!cancelled) setPhotos(map);
      })
      .catch(() => {
        // Photos are decorative; avatars fall back to initials.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (fullName: string) => photos[fullName.toLowerCase()] ?? null;
}
