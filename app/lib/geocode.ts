import type { SupabaseClient } from "@supabase/supabase-js";
import type { NormalizedAddress } from "@/app/lib/school-year-enrolled-families";
import { stripUnitFromStreet } from "@/app/lib/school-year-enrolled-families";
import { formatAddress } from "@/app/lib/application-display";

export const SCHOOL_LOCATION = {
  name: "Sage Field",
  address: "2760 Gattis School Rd, Round Rock, TX 78665",
  lat: 30.5167,
  lng: -97.6792,
};

export type GeocodeQuality = "exact" | "approximate";

export type GeocodedLocation = {
  lat: number;
  lng: number;
  formattedAddress: string;
  quality: GeocodeQuality;
  source: string;
};

type AddressGeocodeRow = {
  address_key: string;
  formatted_address: string;
  lat: number;
  lng: number;
  source: string;
};

type NominatimAddressDetails = {
  postcode?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddressDetails;
};

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const GEOCODE_DELAY_MS = 1100;
const APPROXIMATE_SOURCE = "nominatim_zip_centroid";
const CENTRAL_TX_VIEWBOX = "-98.2,31.0,-97.2,30.0";
const MAX_DISTANCE_FROM_SCHOOL_MILES = 80;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function qualityFromSource(source: string): GeocodeQuality {
  return source === APPROXIMATE_SOURCE ? "approximate" : "exact";
}

export function haversineDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function extractZipsFromText(text: string): string[] {
  return [...text.matchAll(/\b(\d{5})\b/g)].map((match) => match[1]);
}

function getResultPostcode(match: NominatimResult): string | null {
  const postcode = match.address?.postcode;
  if (postcode) {
    const zip = postcode.match(/\b(\d{5})\b/)?.[1];
    if (zip) return zip;
  }

  const zips = extractZipsFromText(match.display_name);
  return zips[0] ?? null;
}

function getResultCity(match: NominatimResult): string | null {
  const addr = match.address;
  return addr?.city ?? addr?.town ?? addr?.village ?? null;
}

function isValidGeocodeResult(
  match: NominatimResult,
  address: NormalizedAddress,
  source: string,
): boolean {
  const lat = Number(match.lat);
  const lng = Number(match.lon);

  if (
    haversineDistanceMiles(
      SCHOOL_LOCATION.lat,
      SCHOOL_LOCATION.lng,
      lat,
      lng,
    ) > MAX_DISTANCE_FROM_SCHOOL_MILES
  ) {
    return false;
  }

  if (source === APPROXIMATE_SOURCE) {
    const resultZip = getResultPostcode(match);
    return (
      resultZip === address.zip || match.display_name.includes(address.zip)
    );
  }

  const resultZip = getResultPostcode(match);
  const displayZips = extractZipsFromText(match.display_name);

  if (resultZip && resultZip !== address.zip) {
    return false;
  }

  if (displayZips.length > 0 && !displayZips.includes(address.zip)) {
    return false;
  }

  const city = address.city.toLowerCase();
  const display = match.display_name.toLowerCase();
  const resultCity = getResultCity(match)?.toLowerCase();

  if (!display.includes(city) && resultCity !== city) {
    return false;
  }

  return true;
}

function isValidCachedGeocode(
  location: GeocodedLocation,
  address: NormalizedAddress,
): boolean {
  const cachedMatch: NominatimResult = {
    lat: String(location.lat),
    lon: String(location.lng),
    display_name: location.formattedAddress,
  };

  return isValidGeocodeResult(cachedMatch, address, location.source);
}

async function nominatimSearch(
  params: Record<string, string>,
): Promise<NominatimResult | null> {
  const url = new URL(NOMINATIM_BASE_URL);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "us");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("viewbox", CENTRAL_TX_VIEWBOX);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

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

  const results = (await response.json()) as NominatimResult[];
  return results[0] ?? null;
}

function toGeocodedLocation(
  match: NominatimResult,
  source: string,
): GeocodedLocation {
  return {
    lat: Number(match.lat),
    lng: Number(match.lon),
    formattedAddress: match.display_name,
    quality: qualityFromSource(source),
    source,
  };
}

export async function geocodeAddress(
  address: string,
): Promise<GeocodedLocation | null> {
  const match = await nominatimSearch({ q: address });
  if (!match) return null;
  return toGeocodedLocation(match, "nominatim_full");
}

export async function geocodeAddressWithFallbacks(
  address: NormalizedAddress,
): Promise<GeocodedLocation | null> {
  const formatted = formatAddress(address);
  const streetWithoutUnit = stripUnitFromStreet(address.street);

  const strategies: Array<{
    source: string;
    run: () => Promise<NominatimResult | null>;
  }> = [
    {
      source: "nominatim_full",
      run: () => nominatimSearch({ q: formatted }),
    },
    {
      source: "nominatim_structured",
      run: () =>
        nominatimSearch({
          street: streetWithoutUnit,
          city: address.city,
          state: address.state,
          postalcode: address.zip,
          country: "US",
        }),
    },
    {
      source: "nominatim_street_zip",
      run: () =>
        nominatimSearch({
          q: `${streetWithoutUnit}, ${address.city}, ${address.state} ${address.zip}`,
        }),
    },
    {
      source: APPROXIMATE_SOURCE,
      run: () =>
        nominatimSearch({
          q: `${address.zip}, ${address.state}, US`,
        }),
    },
  ];

  let usedRemote = false;

  for (const strategy of strategies) {
    if (usedRemote) {
      await sleep(GEOCODE_DELAY_MS);
    }

    const match = await strategy.run();
    usedRemote = true;

    if (match && isValidGeocodeResult(match, address, strategy.source)) {
      return toGeocodedLocation(match, strategy.source);
    }
  }

  return null;
}

async function readGeocodeCache(
  db: SupabaseClient,
  addressKey: string,
  address: NormalizedAddress,
): Promise<GeocodedLocation | null> {
  const { data, error } = await db
    .schema("admin")
    .from("address_geocodes")
    .select("formatted_address, lat, lng, source")
    .eq("address_key", addressKey)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as AddressGeocodeRow;
  const location: GeocodedLocation = {
    lat: row.lat,
    lng: row.lng,
    formattedAddress: row.formatted_address,
    source: row.source,
    quality: qualityFromSource(row.source),
  };

  if (!isValidCachedGeocode(location, address)) {
    return null;
  }

  return location;
}

async function writeGeocodeCache(
  db: SupabaseClient,
  addressKey: string,
  location: GeocodedLocation,
): Promise<void> {
  const { error } = await db.schema("admin").from("address_geocodes").upsert({
    address_key: addressKey,
    formatted_address: location.formattedAddress,
    lat: location.lat,
    lng: location.lng,
    source: location.source,
    geocoded_at: new Date().toISOString(),
  });

  if (error) {
    console.warn("Failed to write geocode cache:", error.message);
  }
}

export async function geocodeWithCache(
  db: SupabaseClient,
  addressKey: string,
  address: NormalizedAddress,
): Promise<GeocodedLocation | null> {
  const cached = await readGeocodeCache(db, addressKey, address);
  if (cached) {
    return cached;
  }

  const geocoded = await geocodeAddressWithFallbacks(address);
  if (!geocoded) {
    return null;
  }

  await writeGeocodeCache(db, addressKey, geocoded);
  return geocoded;
}

export async function geocodeAddressesWithCache(
  db: SupabaseClient,
  entries: Array<{ addressKey: string; address: NormalizedAddress }>,
): Promise<Map<string, GeocodedLocation>> {
  const results = new Map<string, GeocodedLocation>();
  let usedRemoteGeocoder = false;

  for (const entry of entries) {
    const cached = await readGeocodeCache(db, entry.addressKey, entry.address);
    if (cached) {
      results.set(entry.addressKey, cached);
      continue;
    }

    if (usedRemoteGeocoder) {
      await sleep(GEOCODE_DELAY_MS);
    }

    const geocoded = await geocodeAddressWithFallbacks(entry.address);
    usedRemoteGeocoder = true;

    if (!geocoded) {
      continue;
    }

    await writeGeocodeCache(db, entry.addressKey, geocoded);
    results.set(entry.addressKey, geocoded);
  }

  return results;
}
