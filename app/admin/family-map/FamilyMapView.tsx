"use client";

import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { SCHOOL_LOCATION } from "@/app/lib/geocode";
import type { MappedFamilyPin, SchoolLocation } from "./types";

type FamilyMapViewProps = {
  school: SchoolLocation;
  mappedFamilies: MappedFamilyPin[];
  selectedParentId: string | null;
  onSelectFamily: (parentId: string) => void;
};

function FitBounds({
  points,
}: {
  points: LatLngExpression[];
}) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      map.setView([SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng], 11);
      return;
    }

    map.fitBounds(points as LatLngBoundsExpression, { padding: [48, 48] });
  }, [map, points]);

  return null;
}

function FlyToSelection({
  selectedParentId,
  mappedFamilies,
}: {
  selectedParentId: string | null;
  mappedFamilies: MappedFamilyPin[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedParentId) return;

    const family = mappedFamilies.find(
      (entry) => entry.parentId === selectedParentId,
    );
    if (!family) return;

    map.flyTo([family.lat, family.lng], 13, { duration: 0.8 });
  }, [map, mappedFamilies, selectedParentId]);

  return null;
}

function formatDistance(distanceMiles: number): string {
  return `${distanceMiles.toFixed(1)} mi`;
}

export function FamilyMapView({
  school,
  mappedFamilies,
  selectedParentId,
  onSelectFamily,
}: FamilyMapViewProps) {
  const points = useMemo(
    () => [
      [school.lat, school.lng] as LatLngExpression,
      ...mappedFamilies.map(
        (family) => [family.lat, family.lng] as LatLngExpression,
      ),
    ],
    [mappedFamilies, school.lat, school.lng],
  );

  return (
    <MapContainer
      center={[school.lat, school.lng]}
      zoom={11}
      className="h-full w-full rounded-xl"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} />
      <FlyToSelection
        selectedParentId={selectedParentId}
        mappedFamilies={mappedFamilies}
      />

      <CircleMarker
        center={[school.lat, school.lng]}
        radius={18}
        pathOptions={{
          color: "#F59E0B",
          fillColor: "#F59E0B",
          fillOpacity: 0.2,
          weight: 1,
        }}
      />
      <CircleMarker
        center={[school.lat, school.lng]}
        radius={14}
        pathOptions={{
          color: "#FFFFFF",
          fillColor: "#F59E0B",
          fillOpacity: 1,
          weight: 4,
        }}
      >
        <Tooltip direction="top" offset={[0, -8]} opacity={1}>
          {school.name}
        </Tooltip>
        <Popup>
          <div className="text-sm space-y-1">
            <p className="font-semibold">{school.name}</p>
            <p>{school.address}</p>
          </div>
        </Popup>
      </CircleMarker>

      {mappedFamilies.map((family) => {
        const isSelected = family.parentId === selectedParentId;

        return (
          <CircleMarker
            key={family.parentId}
            center={[family.lat, family.lng]}
            radius={isSelected ? 12 : 10}
            pathOptions={{
              color: "#FFFFFF",
              fillColor: isSelected ? "#2563EB" : "#3B82F6",
              fillOpacity: 1,
              weight: isSelected ? 4 : 3,
            }}
            eventHandlers={{
              click: () => onSelectFamily(family.parentId),
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              {family.parentName ?? "Family"} · {formatDistance(family.distanceMiles)}
              {family.geocodeQuality === "approximate" ? " (approx.)" : ""}
            </Tooltip>
            <Popup>
              <div className="text-sm space-y-2 min-w-[220px]">
                <div>
                  <p className="font-semibold">{family.parentName ?? "Family"}</p>
                  {family.parentEmail && (
                    <p className="text-gray-600">{family.parentEmail}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium">Students</p>
                  <ul className="list-disc pl-4">
                    {family.students.map((student) => (
                      <li key={student.applicationId}>
                        {student.name}
                        {student.grade ? ` (${student.grade})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
                <p>{family.formattedAddress}</p>
                <p className="font-medium">
                  {formatDistance(family.distanceMiles)} from school
                  {family.geocodeQuality === "approximate"
                    ? " (approximate location)"
                    : ""}
                </p>
                <a
                  href={`/admin/enrollment-summary/${family.students[0]?.applicationId}`}
                  className="text-[#5E7C68] underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  View enrollment summary
                </a>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
