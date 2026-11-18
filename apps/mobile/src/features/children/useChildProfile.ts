// Child profile writes: photo upload + editable sections. Data only.
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useRef, useState } from "react";
import { fieldsFromDraft, PROFILE_SECTIONS, rpcParams, type SectionDraft } from "./profileSections";
import type { ProfileSectionKind, Result, Student } from "./types";

export function useChildProfile(
  student: Student | null,
  updateStudent: (id: string, fields: Partial<Student>) => void,
) {
  const [uploading, setUploading] = useState(false);
  const [sectionKind, setSectionKind] = useState<ProfileSectionKind>("medical");
  const [sectionSession, setSectionSession] = useState(0);
  const sectionSheetRef = useRef<BottomSheetModal>(null);

  const openSection = useCallback((kind: ProfileSectionKind) => {
    setSectionKind(kind);
    setSectionSession((n) => n + 1);
    sectionSheetRef.current?.present();
  }, []);

  const saveSection = useCallback(
    async (kind: ProfileSectionKind, draft: SectionDraft): Promise<Result> => {
      if (!student) return { ok: false };
      const fields = fieldsFromDraft(kind, draft);
      const { data, error } = await supabase.rpc("update_student_profile_fields", rpcParams(student.id, fields));
      const rpcErr = (data as { error?: string } | null)?.error;
      if (error || rpcErr) {
        notifyError(PROFILE_SECTIONS[kind].logKey, error ?? data);
        return { ok: false, error: error?.message ?? rpcErr };
      }
      updateStudent(student.id, fields);
      sectionSheetRef.current?.dismiss();
      return { ok: true };
    },
    [student, updateStudent],
  );

  /** Same pick → compress → upload → RPC flow as before, now reporting failures. */
  const uploadPhoto = useCallback(
    async (opts?: { onUploadStart?: () => void }): Promise<Result> => {
      if (!student) return { ok: false };
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets[0]) return { ok: false, canceled: true };

      setUploading(true);
      opts?.onUploadStart?.();
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return { ok: false, error: "Not signed in" };

        const asset = result.assets[0];
        const compressed = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 600 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
        );
        const storagePath = `students/${student.id}/profile.jpg`;
        const fileRes = await fetch(compressed.uri);
        const blob = await fileRes.blob();
        const uploadRes = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/profile-images/${storagePath}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "image/jpeg",
              "x-upsert": "true",
            },
            body: blob,
          },
        );
        if (!uploadRes.ok) {
          notifyError("parent-children-photo-upload", new Error(`Upload failed: ${uploadRes.status}`));
          return { ok: false, error: `Upload failed (${uploadRes.status})` };
        }

        const publicUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-images/${storagePath}`;
        // Write URL back via RPC (bypasses admin schema RLS)
        const { error } = await supabase.rpc("update_student_profile_image", {
          p_student_id: student.id,
          p_image_url: publicUrl,
        });
        if (error) {
          notifyError("parent-children-photo-save", error);
          return { ok: false, error: error.message };
        }
        // Same storage path is reused, so bust the image cache for the new photo.
        updateStudent(student.id, { profile_image_url: `${publicUrl}?v=${Date.now()}` });
        return { ok: true };
      } catch (e) {
        notifyError("parent-children-photo-upload", e);
        return { ok: false, error: e instanceof Error ? e.message : undefined };
      } finally {
        setUploading(false);
      }
    },
    [student, updateStudent],
  );

  return {
    uploading,
    uploadPhoto,
    sectionSheetRef,
    sectionKind,
    sectionSession,
    openSection,
    saveSection,
  };
}

export type ChildProfile = ReturnType<typeof useChildProfile>;
