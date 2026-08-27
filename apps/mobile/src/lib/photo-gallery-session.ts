import type { TeacherPhoto } from "@/lib/photos-actions";

let sessionPhotos: TeacherPhoto[] = [];

export function setPhotoGallerySession(photos: TeacherPhoto[]) {
  sessionPhotos = photos;
}

export function getPhotoGallerySession(): TeacherPhoto[] {
  return sessionPhotos;
}

export function updatePhotoGallerySession(photos: TeacherPhoto[]) {
  sessionPhotos = photos;
}
