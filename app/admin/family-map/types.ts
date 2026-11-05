export type MappedFamilyPin = {
  parentId: string;
  parentName: string | null;
  parentEmail: string | null;
  students: Array<{
    name: string;
    grade: string | null;
    applicationId: string;
  }>;
  formattedAddress: string;
  lat: number;
  lng: number;
  distanceMiles: number;
  newCampusDistanceMiles: number;
  driveMinutesToCurrentCampus: number;
  driveMinutesToNewCampus: number;
  driveTimeQuality: "traffic" | "osrm" | "estimated";
  geocodeQuality: "exact" | "approximate";
};

export type UnmappedFamily = {
  parentId: string;
  parentName: string | null;
  parentEmail: string | null;
  students: string[];
  formattedAddress: string;
  reason: string;
};

export type SchoolLocation = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};
