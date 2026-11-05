"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MappedFamilyPin, SchoolLocation } from "./types";
import styles from "./FamilyMapView.module.css";

type FamilyMapViewProps = {
  usesTrafficDriveTimes: boolean;
  currentCampus: SchoolLocation;
  newCampus: SchoolLocation;
  mappedFamilies: MappedFamilyPin[];
  selectedParentId: string | null;
  onSelectFamily: (parentId: string) => void;
};

function FitBounds({
  points,
  fallbackCenter,
}: {
  points: LatLngExpression[];
  fallbackCenter: LatLngExpression;
}) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      map.setView(fallbackCenter, 11);
      return;
    }

    map.fitBounds(points as LatLngBoundsExpression, { padding: [48, 48] });
  }, [map, points, fallbackCenter]);

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

function formatDriveMinutes(minutes: number): string {
  return `${minutes} min`;
}

function driveQualitySuffix(
  family: MappedFamilyPin,
  usesTrafficDriveTimes: boolean,
): string {
  if (family.driveTimeQuality === "estimated") return " (est.)";
  if (usesTrafficDriveTimes && family.driveTimeQuality === "osrm") {
    return " (no traffic)";
  }
  return "";
}

function createFamilyMarkerIcon(
  family: MappedFamilyPin,
  isSelected: boolean,
): L.DivIcon {
  const estSuffix =
    family.driveTimeQuality === "estimated" ? " ~" : "";

  return L.divIcon({
    className: styles.pinWrapper,
    html: `
      <div class="${styles.pin}">
        <div class="${styles.labels}">
          <span class="${styles.labelHutto}">${family.driveMinutesToNewCampus} min Hutto${estSuffix}</span>
          <span class="${styles.labelGattis}">${family.driveMinutesToCurrentCampus} min Gattis${estSuffix}</span>
        </div>
        <div class="${styles.dot}${isSelected ? ` ${styles.dotSelected}` : ""}"></div>
      </div>
    `,
    iconSize: [96, 54],
    iconAnchor: [48, 46],
  });
}

function CampusMarker({
  campus,
  color,
}: {
  campus: SchoolLocation;
  color: string;
}) {
  return (
    <>
      <CircleMarker
        center={[campus.lat, campus.lng]}
        radius={18}
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: 0.2,
          weight: 1,
        }}
      />
      <CircleMarker
        center={[campus.lat, campus.lng]}
        radius={14}
        pathOptions={{
          color: "#FFFFFF",
          fillColor: color,
          fillOpacity: 1,
          weight: 4,
        }}
      >
        <Tooltip direction="top" offset={[0, -8]} opacity={1}>
          {campus.name}
        </Tooltip>
        <Popup>
          <div className="text-sm space-y-1">
            <p className="font-semibold">{campus.name}</p>
            <p>{campus.address}</p>
          </div>
        </Popup>
      </CircleMarker>
    </>
  );
}

export function FamilyMapView({
  usesTrafficDriveTimes,
  currentCampus,
  newCampus,
  mappedFamilies,
  selectedParentId,
  onSelectFamily,
}: FamilyMapViewProps) {
  const fallbackCenter = useMemo(
    () =>
      [
        (currentCampus.lat + newCampus.lat) / 2,
        (currentCampus.lng + newCampus.lng) / 2,
      ] as LatLngExpression,
    [currentCampus.lat, currentCampus.lng, newCampus.lat, newCampus.lng],
  );

  const points = useMemo(
    () => [
      [currentCampus.lat, currentCampus.lng] as LatLngExpression,
      [newCampus.lat, newCampus.lng] as LatLngExpression,
      ...mappedFamilies.map(
        (family) => [family.lat, family.lng] as LatLngExpression,
      ),
    ],
    [
      mappedFamilies,
      currentCampus.lat,
      currentCampus.lng,
      newCampus.lat,
      newCampus.lng,
    ],
  );

  return (
    <MapContainer
      center={fallbackCenter}
      zoom={11}
      className={`h-full w-full rounded-xl ${styles.map}`}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} fallbackCenter={fallbackCenter} />
      <FlyToSelection
        selectedParentId={selectedParentId}
        mappedFamilies={mappedFamilies}
      />

      <CampusMarker campus={currentCampus} color="#F59E0B" />
      <CampusMarker campus={newCampus} color="#10B981" />

      {mappedFamilies.map((family) => {
        const isSelected = family.parentId === selectedParentId;

        return (
          <Marker
            key={family.parentId}
            position={[family.lat, family.lng]}
            icon={createFamilyMarkerIcon(family, isSelected)}
            eventHandlers={{
              click: () => onSelectFamily(family.parentId),
            }}
          >
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
                  {formatDriveMinutes(family.driveMinutesToNewCampus)} drive to
                  future campus (Hutto)
                  {driveQualitySuffix(family, usesTrafficDriveTimes)}
                  {family.geocodeQuality === "approximate"
                    ? " · approximate location"
                    : ""}
                </p>
                <p className="text-gray-600">
                  {formatDriveMinutes(family.driveMinutesToCurrentCampus)} drive
                  to current campus (Gattis)
                  {driveQualitySuffix(family, usesTrafficDriveTimes)}
                </p>
                <p className="text-gray-500 text-xs">
                  {formatDistance(family.newCampusDistanceMiles)} straight-line
                  to Hutto · {formatDistance(family.distanceMiles)} to Gattis
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
          </Marker>
        );
      })}
    </MapContainer>
  );
}
