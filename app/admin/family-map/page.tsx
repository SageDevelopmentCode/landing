import { createAdminClient } from "@/app/lib/supabase-server";
import {
  geocodeAddressesWithCache,
  haversineDistanceMiles,
  NEW_CAMPUS_LOCATION,
  SCHOOL_LOCATION,
} from "@/app/lib/geocode";
import { resolveFamilyDriveTimes } from "@/app/lib/family-map-drive-times";
import { fetchSchoolYearEnrolledFamilies } from "@/app/lib/school-year-enrolled-families";
import { FamilyMapClient } from "./FamilyMapClient";
import type { MappedFamilyPin, UnmappedFamily } from "./types";

export default async function FamilyMapPage() {
  const db = createAdminClient();
  const families = await fetchSchoolYearEnrolledFamilies(db);

  const geocodeEntries = families
    .filter((family) => family.addressKey && family.address)
    .map((family) => ({
      addressKey: family.addressKey!,
      address: family.address!,
    }));

  const uniqueEntries = Array.from(
    new Map(geocodeEntries.map((entry) => [entry.addressKey, entry])).values(),
  );

  const geocodedByKey = await geocodeAddressesWithCache(db, uniqueEntries);

  const mappedDrafts: Array<
    Omit<
      MappedFamilyPin,
      | "driveMinutesToCurrentCampus"
      | "driveMinutesToNewCampus"
      | "driveTimeQuality"
    > & { addressKey: string }
  > = [];
  const unmapped: UnmappedFamily[] = [];

  for (const family of families) {
    if (!family.address || !family.addressKey) {
      unmapped.push({
        parentId: family.parentId,
        parentName: family.parentName,
        parentEmail: family.parentEmail,
        students: family.students.map((student) => student.name),
        formattedAddress: family.formattedAddress,
        reason: "Incomplete address",
      });
      continue;
    }

    const location = geocodedByKey.get(family.addressKey);
    if (!location) {
      unmapped.push({
        parentId: family.parentId,
        parentName: family.parentName,
        parentEmail: family.parentEmail,
        students: family.students.map((student) => student.name),
        formattedAddress: family.formattedAddress,
        reason: "Could not geocode address",
      });
      continue;
    }

    mappedDrafts.push({
      addressKey: family.addressKey,
      parentId: family.parentId,
      parentName: family.parentName,
      parentEmail: family.parentEmail,
      students: family.students.map((student) => ({
        name: student.name,
        grade: student.grade,
        applicationId: student.applicationId,
      })),
      formattedAddress: family.formattedAddress,
      lat: location.lat,
      lng: location.lng,
      distanceMiles: haversineDistanceMiles(
        SCHOOL_LOCATION.lat,
        SCHOOL_LOCATION.lng,
        location.lat,
        location.lng,
      ),
      newCampusDistanceMiles: haversineDistanceMiles(
        NEW_CAMPUS_LOCATION.lat,
        NEW_CAMPUS_LOCATION.lng,
        location.lat,
        location.lng,
      ),
      geocodeQuality: location.quality,
    });
  }

  const driveTimesByKey = await resolveFamilyDriveTimes(
    db,
    mappedDrafts.map((draft) => ({
      addressKey: draft.addressKey,
      lat: draft.lat,
      lng: draft.lng,
      distanceMiles: draft.distanceMiles,
      newCampusDistanceMiles: draft.newCampusDistanceMiles,
    })),
  );

  const mapped: MappedFamilyPin[] = mappedDrafts.map(
    ({ addressKey, ...pin }) => {
      const drive =
        driveTimesByKey.get(addressKey) ??
        ({
          driveMinutesToCurrentCampus: Math.round(
            (pin.distanceMiles / 32) * 60,
          ),
          driveMinutesToNewCampus: Math.round(
            (pin.newCampusDistanceMiles / 32) * 60,
          ),
          driveTimeQuality: "estimated" as const,
        });

      return {
        ...pin,
        driveMinutesToCurrentCampus: drive.driveMinutesToCurrentCampus,
        driveMinutesToNewCampus: drive.driveMinutesToNewCampus,
        driveTimeQuality: drive.driveTimeQuality,
      };
    },
  );

  mapped.sort(
    (a, b) => a.driveMinutesToNewCampus - b.driveMinutesToNewCampus,
  );

  return (
    <div className="space-y-4 pt-6 h-[calc(100vh-2rem)] flex flex-col">
      <div>
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--admin-text-primary)" }}
        >
          Family Map
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--admin-text-tertiary)" }}>
          School-year enrolled families with supply fee paid · drive time (OSRM)
          to future campus {NEW_CAMPUS_LOCATION.address} · current{" "}
          {SCHOOL_LOCATION.address}
        </p>
      </div>

      <FamilyMapClient
        currentCampus={SCHOOL_LOCATION}
        newCampus={NEW_CAMPUS_LOCATION}
        mappedFamilies={mapped}
        unmappedFamilies={unmapped}
        totalFamilies={families.length}
      />
    </div>
  );
}
