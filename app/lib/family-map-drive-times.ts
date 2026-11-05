import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getGoogleMapsApiKey,
  NEW_CAMPUS_LOCATION,
  SCHOOL_LOCATION,
} from "@/app/lib/geocode";

export type CampusId = "gattis" | "hutto";

export type DriveTimeQuality = "traffic" | "osrm" | "estimated";

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
  driveTimeQuality: DriveTimeQuality;
};

type DriveTimeSource = "google_traffic" | "osrm";

type DriveTimeRow = {
  address_key: string;
  campus_id: CampusId;
  duration_seconds: number;
  source: string;
  routed_at: string;
  origin_lat: number | null;
  origin_lng: number | null;
  dest_lat: number | null;
  dest_lng: number | null;
};

type RoutedSeconds = Record<CampusId, number>;

const CAMPUS_IDS: CampusId[] = ["gattis", "hutto"];
const CAMPUS_COORDS: Record<CampusId, { lat: number; lng: number }> = {
  gattis: SCHOOL_LOCATION,
  hutto: NEW_CAMPUS_LOCATION,
};

const OSRM_TABLE_BASE = "https://router.project-osrm.org/table/v1/driving";
const GOOGLE_ROUTE_MATRIX_URL =
  "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";
/** TRAFFIC_AWARE_OPTIMAL allows at most 100 elements per request (origins × 2 campuses). */
const GOOGLE_MAX_ORIGINS_PER_REQUEST = 50;
const ESTIMATED_MPH = 32;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const COORD_TOLERANCE = 1e-5;

const DROP_OFF_TIME_ZONE = "America/Chicago";
const DROP_OFF_HOUR = 7;
const DROP_OFF_MINUTE = 45;

const SOURCE_RANK: Record<string, number> = {
  google_traffic: 2,
  osrm: 1,
};

function secondsToMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}

function estimatedMinutesFromMiles(miles: number): number {
  return Math.round((miles / ESTIMATED_MPH) * 60);
}

function formatLonLat(lng: number, lat: number): string {
  return `${lng},${lat}`;
}

function sameCoord(a: number | null, b: number): boolean {
  return a != null && Math.abs(a - b) < COORD_TOLERANCE;
}

function zonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DROP_OFF_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const zoned = zonedParts(new Date(guess));
  const zonedAsUtc = Date.UTC(
    zoned.year,
    zoned.month - 1,
    zoned.day,
    zoned.hour,
    zoned.minute,
  );
  return new Date(guess - (zonedAsUtc - guess));
}

/** Google only predicts traffic for future departures, so use the next weekday drop-off. */
export function nextWeekdayDropOff(now: Date = new Date()): Date {
  const today = zonedParts(now);

  for (let offset = 0; offset < 8; offset++) {
    const day = new Date(Date.UTC(today.year, today.month - 1, today.day + offset));
    const weekday = day.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;

    const departure = zonedWallTimeToUtc(
      day.getUTCFullYear(),
      day.getUTCMonth() + 1,
      day.getUTCDate(),
      DROP_OFF_HOUR,
      DROP_OFF_MINUTE,
    );
    if (departure.getTime() > now.getTime()) {
      return departure;
    }
  }

  return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}

function parseGoogleDurationSeconds(duration: string | undefined): number | null {
  if (!duration) return null;
  const seconds = Number.parseFloat(duration.replace(/s$/, ""));
  return Number.isFinite(seconds) ? seconds : null;
}

async function fetchGoogleDurations(
  apiKey: string,
  inputs: DriveTimeInput[],
): Promise<Map<string, RoutedSeconds>> {
  const results = new Map<string, RoutedSeconds>();
  const departureTime = nextWeekdayDropOff().toISOString();
  const destinations = CAMPUS_IDS.map((campusId) => ({
    waypoint: {
      location: {
        latLng: {
          latitude: CAMPUS_COORDS[campusId].lat,
          longitude: CAMPUS_COORDS[campusId].lng,
        },
      },
    },
  }));

  for (let start = 0; start < inputs.length; start += GOOGLE_MAX_ORIGINS_PER_REQUEST) {
    const chunk = inputs.slice(start, start + GOOGLE_MAX_ORIGINS_PER_REQUEST);

    const response = await fetch(GOOGLE_ROUTE_MATRIX_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "originIndex,destinationIndex,status,condition,duration",
      },
      body: JSON.stringify({
        origins: chunk.map((input) => ({
          waypoint: {
            location: { latLng: { latitude: input.lat, longitude: input.lng } },
          },
        })),
        destinations,
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE_OPTIMAL",
        trafficModel: "BEST_GUESS",
        departureTime,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn(
        "Google route matrix failed:",
        response.status,
        await response.text(),
      );
      continue;
    }

    const elements = (await response.json()) as Array<{
      originIndex?: number;
      destinationIndex?: number;
      status?: { code?: number };
      condition?: string;
      duration?: string;
    }>;

    const partial = new Map<string, Partial<RoutedSeconds>>();
    for (const element of elements) {
      if (element.status?.code || element.condition !== "ROUTE_EXISTS") continue;

      const input = chunk[element.originIndex ?? 0];
      const campusId = CAMPUS_IDS[element.destinationIndex ?? 0];
      const seconds = parseGoogleDurationSeconds(element.duration);
      if (!input || !campusId || seconds == null) continue;

      const existing = partial.get(input.addressKey) ?? {};
      existing[campusId] = seconds;
      partial.set(input.addressKey, existing);
    }

    for (const [addressKey, seconds] of partial) {
      if (seconds.gattis != null && seconds.hutto != null) {
        results.set(addressKey, { gattis: seconds.gattis, hutto: seconds.hutto });
      }
    }
  }

  return results;
}

async function fetchOsrmDurations(
  inputs: DriveTimeInput[],
): Promise<Map<string, RoutedSeconds>> {
  const results = new Map<string, RoutedSeconds>();
  if (inputs.length === 0) {
    return results;
  }

  const coordinates = [
    CAMPUS_COORDS.gattis,
    CAMPUS_COORDS.hutto,
    ...inputs.map((input) => ({ lat: input.lat, lng: input.lng })),
  ];
  const path = coordinates.map((c) => formatLonLat(c.lng, c.lat)).join(";");
  const url = new URL(`${OSRM_TABLE_BASE}/${path}`);
  url.searchParams.set("sources", inputs.map((_, index) => index + 2).join(";"));
  url.searchParams.set("destinations", "0;1");
  url.searchParams.set("annotations", "duration");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "SageFieldSchoolAdmin/1.0 (family-map)",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return results;
  }

  const data = (await response.json()) as { durations?: (number | null)[][] };
  inputs.forEach((input, index) => {
    const gattis = data.durations?.[index]?.[0];
    const hutto = data.durations?.[index]?.[1];
    if (gattis != null && hutto != null && gattis >= 0 && hutto >= 0) {
      results.set(input.addressKey, { gattis, hutto });
    }
  });

  return results;
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
    .select(
      "address_key, campus_id, duration_seconds, source, routed_at, origin_lat, origin_lng, dest_lat, dest_lng",
    )
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
  input: DriveTimeInput,
  seconds: RoutedSeconds,
  source: DriveTimeSource,
): Promise<void> {
  const routedAt = new Date().toISOString();
  const { error } = await db
    .schema("admin")
    .from("family_map_drive_times")
    .upsert(
      CAMPUS_IDS.map((campusId) => ({
        address_key: input.addressKey,
        campus_id: campusId,
        duration_seconds: Math.round(seconds[campusId]),
        source,
        routed_at: routedAt,
        origin_lat: input.lat,
        origin_lng: input.lng,
        dest_lat: CAMPUS_COORDS[campusId].lat,
        dest_lng: CAMPUS_COORDS[campusId].lng,
      })),
    );

  if (error) {
    console.warn("Drive time cache write failed:", error.message);
  }
}

function isFreshRow(
  row: DriveTimeRow | undefined,
  campusId: CampusId,
  input: DriveTimeInput,
  minimumSource: DriveTimeSource,
): row is DriveTimeRow {
  if (!row) return false;

  const destination = CAMPUS_COORDS[campusId];
  const ageMs = Date.now() - new Date(row.routed_at).getTime();

  return (
    sameCoord(row.dest_lat, destination.lat) &&
    sameCoord(row.dest_lng, destination.lng) &&
    sameCoord(row.origin_lat, input.lat) &&
    sameCoord(row.origin_lng, input.lng) &&
    ageMs < CACHE_TTL_MS &&
    (SOURCE_RANK[row.source] ?? 0) >= SOURCE_RANK[minimumSource]
  );
}

function qualityFromSource(source: string): DriveTimeQuality {
  return source === "google_traffic" ? "traffic" : "osrm";
}

function resolveFromCache(
  cached: Partial<Record<CampusId, DriveTimeRow>> | undefined,
  input: DriveTimeInput,
  minimumSource: DriveTimeSource,
): ResolvedDriveTimes | null {
  const gattis = cached?.gattis;
  const hutto = cached?.hutto;
  if (
    !isFreshRow(gattis, "gattis", input, minimumSource) ||
    !isFreshRow(hutto, "hutto", input, minimumSource)
  ) {
    return null;
  }

  const bothTraffic =
    gattis.source === "google_traffic" && hutto.source === "google_traffic";

  return {
    driveMinutesToCurrentCampus: secondsToMinutes(gattis.duration_seconds),
    driveMinutesToNewCampus: secondsToMinutes(hutto.duration_seconds),
    driveTimeQuality: bothTraffic ? "traffic" : "osrm",
  };
}

function resolveRouted(
  seconds: RoutedSeconds,
  source: DriveTimeSource,
): ResolvedDriveTimes {
  return {
    driveMinutesToCurrentCampus: secondsToMinutes(seconds.gattis),
    driveMinutesToNewCampus: secondsToMinutes(seconds.hutto),
    driveTimeQuality: qualityFromSource(source),
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
  const googleApiKey = getGoogleMapsApiKey();
  const minimumSource: DriveTimeSource = googleApiKey ? "google_traffic" : "osrm";

  const uniqueByKey = new Map<string, DriveTimeInput>();
  for (const entry of entries) {
    if (!uniqueByKey.has(entry.addressKey)) {
      uniqueByKey.set(entry.addressKey, entry);
    }
  }

  const cache = await readDriveTimeCache(db, [...uniqueByKey.keys()]);

  let needsRouting: DriveTimeInput[] = [];
  for (const [addressKey, input] of uniqueByKey) {
    const resolved = resolveFromCache(cache.get(addressKey), input, minimumSource);
    if (resolved) {
      results.set(addressKey, resolved);
    } else {
      needsRouting.push(input);
    }
  }

  const providers: Array<{
    source: DriveTimeSource;
    fetch: (inputs: DriveTimeInput[]) => Promise<Map<string, RoutedSeconds>>;
  }> = [
    ...(googleApiKey
      ? [
          {
            source: "google_traffic" as const,
            fetch: (inputs: DriveTimeInput[]) =>
              fetchGoogleDurations(googleApiKey, inputs),
          },
        ]
      : []),
    { source: "osrm", fetch: fetchOsrmDurations },
  ];

  for (const provider of providers) {
    if (needsRouting.length === 0) break;

    let routed: Map<string, RoutedSeconds>;
    try {
      routed = await provider.fetch(needsRouting);
    } catch (error) {
      console.warn(`Drive time provider ${provider.source} failed:`, error);
      continue;
    }

    await Promise.all(
      needsRouting
        .filter((input) => routed.has(input.addressKey))
        .map((input) => {
          const seconds = routed.get(input.addressKey)!;
          results.set(input.addressKey, resolveRouted(seconds, provider.source));
          return writeDriveTimeCache(db, input, seconds, provider.source);
        }),
    );

    needsRouting = needsRouting.filter((input) => !routed.has(input.addressKey));
  }

  for (const entry of entries) {
    if (!results.has(entry.addressKey)) {
      results.set(entry.addressKey, resolveEstimated(entry));
    }
  }

  return results;
}
