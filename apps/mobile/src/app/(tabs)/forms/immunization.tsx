// Proof of Immunizations — read-only Garden viewer of the files in the
// `immunization-records` bucket. Signed URLs are made in one batch, refreshed
// whenever the screen regains focus, and re-signed on tap if they've gone stale.
import {
  Garden,
  GardenFonts,
  GardenRadii,
  GardenTints,
  HandNote,
  PressableScale,
  gardenCard,
  haptic,
  useToast,
} from "@/components/garden";
import {
  formatFileSize,
  formatShortDate,
  isRealStorageFile,
  MissingParamsError,
  unwrap,
} from "@/features/forms/formsUtils";
import { FormDetailScreen, FormListHeading } from "@/features/forms/garden/FormParts";
import { useFormDetail } from "@/features/forms/useFormDetail";
import { useHideTabBar } from "@/features/forms/useHideTabBar";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, Text, View } from "react-native";

const BUCKET = "immunization-records";
const URL_TTL_S = 3600;
/** Re-sign on tap once a URL is older than this (they expire after 1h). */
const STALE_MS = 50 * 60 * 1000;

interface ImmunizationFile {
  name: string;
  path: string;
  signedUrl: string | null;
  sizeBytes: number | null;
  updatedAt: string | null;
}

type FilesData = { files: ImmunizationFile[]; signedAt: number };

function useOpenFile(signedAt: number | null) {
  const toast = useToast();
  const [opening, setOpening] = useState<string | null>(null);
  const openRef = useRef<((f: ImmunizationFile) => Promise<void>) | null>(null);

  const open = useCallback(
    async (file: ImmunizationFile) => {
      setOpening(file.path);
      try {
        let url = file.signedUrl;
        if (!url || signedAt === null || Date.now() - signedAt > STALE_MS) {
          const res = await supabase.storage.from(BUCKET).createSignedUrl(file.path, URL_TTL_S);
          url = unwrap(res)?.signedUrl ?? null;
        }
        if (!url) throw new Error("no-url");
        await Linking.openURL(url);
      } catch {
        toast.show({
          tone: "error",
          title: "Couldn't open that file",
          message: "Check your connection and try again.",
          action: { label: "Retry", onPress: () => void openRef.current?.(file) },
        });
      } finally {
        setOpening(null);
      }
    },
    [signedAt, toast],
  );

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  return { opening, open };
}

function FileRow({
  file,
  opening,
  onOpen,
}: {
  file: ImmunizationFile;
  opening: boolean;
  onOpen: () => void;
}) {
  const ext = file.name.includes(".") ? (file.name.split(".").pop()?.toUpperCase() ?? "FILE") : "FILE";
  const meta = [formatFileSize(file.sizeBytes), formatShortDate(file.updatedAt)].filter(Boolean).join(" · ");
  return (
    <PressableScale
      onPress={onOpen}
      disabled={opening}
      accessibilityLabel={`Open ${file.name}`}
      accessibilityHint="Opens the file in your browser"
      accessibilityState={{ busy: opening }}
      style={st.row}
    >
      <View style={st.extTile}>
        <Ionicons name="document-outline" size={18} color={GardenTints.sky.fg} />
        <Text style={st.ext} maxFontSizeMultiplier={1.1} numberOfLines={1}>
          {ext}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={st.name} numberOfLines={2} maxFontSizeMultiplier={1.4}>
          {file.name}
        </Text>
        {meta ? (
          <Text style={st.meta} maxFontSizeMultiplier={1.4}>
            {opening ? "Opening…" : meta}
          </Text>
        ) : opening ? (
          <Text style={st.meta}>Opening…</Text>
        ) : null}
      </View>
      {opening ? (
        <ActivityIndicator color={Garden.sage} />
      ) : (
        <Ionicons name="open-outline" size={20} color={Garden.sageDeep} />
      )}
    </PressableScale>
  );
}

export default function ImmunizationScreen() {
  const { studentId, parentId, userId, storageStudentId } = useLocalSearchParams<{
    studentId: string;
    parentId: string;
    userId: string;
    storageStudentId: string;
  }>();
  useHideTabBar();

  // storageStudentId is admin.students.id (the storage path key)
  // falls back to studentId if not provided
  const owner = parentId || userId;
  const pathStudentId = storageStudentId || studentId;
  const base = owner && pathStudentId ? `${owner}/${pathStudentId}` : null;

  const detail = useFormDetail<FilesData>(
    base,
    async () => {
      if (!base) throw new MissingParamsError();
      const list = unwrap(await supabase.storage.from(BUCKET).list(`${base}/`)) ?? [];
      const real = list.filter(isRealStorageFile);
      const paths = real.map((f) => `${base}/${f.name}`);
      const signed = paths.length
        ? (unwrap(await supabase.storage.from(BUCKET).createSignedUrls(paths, URL_TTL_S)) ?? [])
        : [];
      const urlByPath = new Map(signed.map((s) => [s.path, s.signedUrl]));
      return {
        signedAt: Date.now(),
        files: real.map((f, idx) => ({
          name: f.name,
          path: paths[idx],
          signedUrl: urlByPath.get(paths[idx]) ?? signed[idx]?.signedUrl ?? null,
          sizeBytes: (f.metadata?.size as number | undefined) ?? null,
          updatedAt: f.updated_at ?? null,
        })),
      };
    },
    "parent-forms-immunization",
  );

  const { opening, open } = useOpenFile(detail.data?.signedAt ?? null);

  return (
    <FormDetailScreen title="Immunization Records" detail={detail} isEmpty={(d) => d.files.length === 0}
      emptyTitle="No Files Found"
      emptyBody="No immunization records have been uploaded yet."
    >
      {({ files }) => (
        <>
          <View style={st.countRow}>
            <FormListHeading>{`${files.length} ${files.length === 1 ? "file" : "files"}`}</FormListHeading>
            <HandNote size={16} color={Garden.muted}>
              Links expire after 1 hour
            </HandNote>
          </View>
          {files.map((f) => (
            <FileRow
              key={f.path}
              file={f}
              opening={opening === f.path}
              onOpen={() => {
                haptic.press();
                void open(f);
              }}
            />
          ))}
        </>
      )}
    </FormDetailScreen>
  );
}

const st = StyleSheet.create({
  countRow: { gap: 2 },
  row: {
    ...gardenCard,
    borderRadius: GardenRadii.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    minHeight: 72,
  },
  extTile: {
    width: 48,
    height: 48,
    borderRadius: GardenRadii.sm,
    backgroundColor: GardenTints.sky.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  ext: { fontFamily: GardenFonts.bodyHeavy, fontSize: 10, color: GardenTints.sky.fg },
  name: { fontFamily: GardenFonts.bodyBold, fontSize: 15, color: Garden.ink },
  meta: { fontFamily: GardenFonts.bodySemi, fontSize: 13, color: Garden.muted },
});
