import { createAdminClient } from "@/app/lib/supabase-server";
import {
  geocodeAddressesWithCache,
  haversineDistanceMiles,
  SCHOOL_LOCATION,
} from "@/app/lib/geocode";
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

  const mapped: MappedFamilyPin[] = [];
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

    mapped.push({
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
      geocodeQuality: location.quality,
    });
  }

  mapped.sort((a, b) => a.distanceMiles - b.distanceMiles);

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
          School-year enrolled families with supply fee paid · relative to{" "}
          {SCHOOL_LOCATION.address}
        </p>
      </div>

      <FamilyMapClient
        school={SCHOOL_LOCATION}
        mappedFamilies={mapped}
        unmappedFamilies={unmapped}
        totalFamilies={families.length}
      />
    </div>
  );
}
