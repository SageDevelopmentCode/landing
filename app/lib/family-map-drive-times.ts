import type { SupabaseClient } from "@supabase/supabase-js";
import {
  NEW_CAMPUS_LOCATION,
  SCHOOL_LOCATION,
} from "@/app/lib/geocode";

export type CampusId = "gattis" | "hutto";

export type DriveTimeInput = {
  addressKey: string;
  lat: number;
  lng: number;
  distanceMiles: number;
  newCampusDistanceMiles: number;
};

export type ResolvedDriveTimes = {
  driveMinutesToCurrentCampus: number;
  driveMinutesToNewCampus: number;
  driveTimeQuality: "osrm" | "estimated";
};

type DriveTimeRow = {
  address_key: string;
  campus_id: CampusId;
  duration_seconds: number;
  source: string;
};

const OSRM_TABLE_BASE = "https://router.project-osrm.org/table/v1/driving";
const ESTIMATED_MPH = 32;

function secondsToMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}

function estimatedMinutesFromMiles(miles: number): number {
  return Math.round((miles / ESTIMATED_MPH) * 60);
}

function formatLonLat(lng: number, lat: number): string {
  return `${lng},${lat}`;
}

async function fetchOsrmDurationMatrix(
  coordinates: Array<{ lng: number; lat: number }>,
  sourceIndices: number[],
  destinationIndices: number[],
): Promise<(number | null)[][] | null> {
  if (destinationIndices.length === 0) {
    return [];
  }

  const path = coordinates.map((c) => formatLonLat(c.lng, c.lat)).join(";");
  const url = new URL(`${OSRM_TABLE_BASE}/${path}`);
  url.searchParams.set("sources", sourceIndices.join(";"));
  url.searchParams.set("destinations", destinationIndices.join(";"));
  url.searchParams.set("annotations", "duration");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "SageFieldSchoolAdmin/1.0 (family-map)",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { durations?: (number | null)[][] };
  return data.durations ?? null;
}

async function readDriveTimeCache(
  db: SupabaseClient,
  addressKeys: string[],
): Promise<Map<string, Partial<Record<CampusId, DriveTimeRow>>>> {
  const byKey = new Map<string, Partial<Record<CampusId, DriveTimeRow>>>();

  if (addressKeys.length === 0) {
    return byKey;
  }

  const { data, error } = await db
    .schema("admin")
    .from("family_map_drive_times")
    .select("address_key, campus_id, duration_seconds, source")
    .in("address_key", addressKeys);

  if (error) {
    console.warn("Drive time cache read failed:", error.message);
    return byKey;
  }

  for (const row of (data ?? []) as DriveTimeRow[]) {
    const campusId = row.campus_id;
    if (campusId !== "gattis" && campusId !== "hutto") continue;

    const existing = byKey.get(row.address_key) ?? {};
    existing[campusId] = row;
    byKey.set(row.address_key, existing);
  }

  return byKey;
}

async function writeDriveTimeCache(
  db: SupabaseClient,
  addressKey: string,
  campusId: CampusId,
  durationSeconds: number,
  source: string,
): Promise<void> {
  const { error } = await db.schema("admin").from("family_map_drive_times").upsert({
    address_key: addressKey,
    campus_id: campusId,
    duration_seconds: durationSeconds,
    source,
    routed_at: new Date().toISOString(),
  });

  if (error) {
    console.warn("Drive time cache write failed:", error.message);
  }
}

function resolveFromCache(
  cached: Partial<Record<CampusId, DriveTimeRow>> | undefined,
  input: DriveTimeInput,
): ResolvedDriveTimes | null {
  const gattis = cached?.gattis;
  const hutto = cached?.hutto;
  if (!gattis || !hutto) {
    return null;
  }

  const usedEstimate =
    gattis.source === "estimated" || hutto.source === "estimated";

  return {
    driveMinutesToCurrentCampus: secondsToMinutes(gattis.duration_seconds),
    driveMinutesToNewCampus: secondsToMinutes(hutto.duration_seconds),
    driveTimeQuality: usedEstimate ? "estimated" : "osrm",
  };
}

function resolveEstimated(input: DriveTimeInput): ResolvedDriveTimes {
  return {
    driveMinutesToCurrentCampus: estimatedMinutesFromMiles(input.distanceMiles),
    driveMinutesToNewCampus: estimatedMinutesFromMiles(
      input.newCampusDistanceMiles,
    ),
    driveTimeQuality: "estimated",
  };
}

export async function resolveFamilyDriveTimes(
  db: SupabaseClient,
  entries: DriveTimeInput[],
): Promise<Map<string, ResolvedDriveTimes>> {
  const results = new Map<string, ResolvedDriveTimes>();

  const uniqueByKey = new Map<string, DriveTimeInput>();
  for (const entry of entries) {
    if (!uniqueByKey.has(entry.addressKey)) {
      uniqueByKey.set(entry.addressKey, entry);
    }
  }

  const addressKeys = [...uniqueByKey.keys()];
  const cache = await readDriveTimeCache(db, addressKeys);

  const needsOsrm: DriveTimeInput[] = [];
  for (const [addressKey, input] of uniqueByKey) {
    const resolved = resolveFromCache(cache.get(addressKey), input);
    if (resolved) {
      results.set(addressKey, resolved);
    } else {
      needsOsrm.push(input);
    }
  }

  if (needsOsrm.length > 0) {
    const coordinates = [
      { lng: SCHOOL_LOCATION.lng, lat: SCHOOL_LOCATION.lat },
      { lng: NEW_CAMPUS_LOCATION.lng, lat: NEW_CAMPUS_LOCATION.lat },
      ...needsOsrm.map((entry) => ({ lng: entry.lng, lat: entry.lat })),
    ];

    const destinationIndices = needsOsrm.map((_, index) => index + 2);
    const matrix = await fetchOsrmDurationMatrix(
      coordinates,
      [0, 1],
      destinationIndices,
    );

    for (let j = 0; j < needsOsrm.length; j++) {
      const input = needsOsrm[j];
      const gattisSeconds = matrix?.[0]?.[j] ?? null;
      const huttoSeconds = matrix?.[1]?.[j] ?? null;

      if (
        gattisSeconds != null &&
        huttoSeconds != null &&
        gattisSeconds >= 0 &&
        huttoSeconds >= 0
      ) {
        const resolved: ResolvedDriveTimes = {
          driveMinutesToCurrentCampus: secondsToMinutes(gattisSeconds),
          driveMinutesToNewCampus: secondsToMinutes(huttoSeconds),
          driveTimeQuality: "osrm",
        };
        results.set(input.addressKey, resolved);

        await Promise.all([
          writeDriveTimeCache(
            db,
            input.addressKey,
            "gattis",
            Math.round(gattisSeconds),
            "osrm",
          ),
          writeDriveTimeCache(
            db,
            input.addressKey,
            "hutto",
            Math.round(huttoSeconds),
            "osrm",
          ),
        ]);
      } else {
        results.set(input.addressKey, resolveEstimated(input));
      }
    }
  }

  for (const entry of entries) {
    if (!results.has(entry.addressKey)) {
      results.set(entry.addressKey, resolveEstimated(entry));
    }
  }

  return results;
}
