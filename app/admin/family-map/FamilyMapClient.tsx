"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { AlertTriangle, MapPin } from "lucide-react";
import { cssColors as colors, radius } from "../design-system";
import type { MappedFamilyPin, SchoolLocation, UnmappedFamily } from "./types";

const FamilyMapView = dynamic(
  () => import("./FamilyMapView").then((mod) => mod.FamilyMapView),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-full w-full flex items-center justify-center rounded-xl"
        style={{
          backgroundColor: colors.elevated,
          color: colors.textSecondary,
          border: `1px solid ${colors.border}`,
        }}
      >
        Loading map…
      </div>
    ),
  },
);

type FamilyMapClientProps = {
  school: SchoolLocation;
  mappedFamilies: MappedFamilyPin[];
  unmappedFamilies: UnmappedFamily[];
  totalFamilies: number;
};

function formatDistance(distanceMiles: number): string {
  return `${distanceMiles.toFixed(1)} mi`;
}

export function FamilyMapClient({
  school,
  mappedFamilies,
  unmappedFamilies,
  totalFamilies,
}: FamilyMapClientProps) {
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  return (
    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
      <aside
        className="min-h-0 flex flex-col rounded-xl overflow-hidden"
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div
          className="px-4 py-3 border-b text-sm"
          style={{
            borderColor: colors.border,
            color: colors.textSecondary,
          }}
        >
          {totalFamilies} families · {mappedFamilies.length} mapped ·{" "}
          {unmappedFamilies.length} unmapped
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {mappedFamilies.map((family) => {
            const isSelected = family.parentId === selectedParentId;

            return (
              <button
                key={family.parentId}
                type="button"
                onClick={() => setSelectedParentId(family.parentId)}
                className="w-full text-left px-4 py-3 border-b transition-colors"
                style={{
                  borderColor: colors.border,
                  backgroundColor: isSelected ? colors.accentLight : "transparent",
                  color: colors.textPrimary,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {family.parentName ?? "Family"}
                    </p>
                    <p
                      className="text-sm truncate"
                      style={{ color: colors.textSecondary }}
                    >
                      {family.students.map((student) => student.name).join(", ")}
                    </p>
                    <p
                      className="text-xs mt-1 truncate"
                      style={{ color: colors.textTertiary }}
                    >
                      {family.formattedAddress}
                    </p>
                  </div>
                  <span
                    className="text-xs font-medium shrink-0 text-right"
                    style={{ color: colors.accentBright }}
                  >
                    {formatDistance(family.distanceMiles)}
                    {family.geocodeQuality === "approximate" && (
                      <span
                        className="block text-[10px]"
                        style={{ color: colors.warning }}
                      >
                        approx.
                      </span>
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {unmappedFamilies.length > 0 && (
          <div
            className="border-t"
            style={{ borderColor: colors.border, backgroundColor: colors.elevated }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: colors.border }}>
              <div
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: colors.warning }}
              >
                <AlertTriangle className="w-4 h-4" />
                Unmapped ({unmappedFamilies.length})
              </div>
              <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                Fix the address in Applications, or run the SQL in{" "}
                <code className="text-[11px]">scripts/family-map-address-fixes.sql</code>
              </p>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {unmappedFamilies.map((family) => (
                <div
                  key={family.parentId}
                  className="px-4 py-3 border-t text-sm"
                  style={{ borderColor: colors.border, color: colors.textSecondary }}
                >
                  <p className="font-medium" style={{ color: colors.textPrimary }}>
                    {family.parentName ?? "Family"}
                  </p>
                  <p>{family.students.join(", ")}</p>
                  <p className="text-xs mt-1">{family.formattedAddress || "—"}</p>
                  <p className="text-xs mt-1" style={{ color: colors.warning }}>
                    {family.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      <section
        className="min-h-[420px] lg:min-h-0 rounded-xl overflow-hidden relative"
        style={{
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.elevated,
        }}
      >
        <div
          className="absolute top-3 left-3 z-[1000] px-3 py-2 rounded-lg text-xs flex items-center gap-2"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            color: colors.textSecondary,
            borderRadius: radius.md,
          }}
        >
          <MapPin className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />
          School
          <span style={{ color: colors.textTertiary }}>·</span>
          <MapPin className="w-3.5 h-3.5" style={{ color: "#3B82F6" }} />
          Families
        </div>

        <FamilyMapView
          school={school}
          mappedFamilies={mappedFamilies}
          selectedParentId={selectedParentId}
          onSelectFamily={setSelectedParentId}
        />
      </section>
    </div>
  );
}
