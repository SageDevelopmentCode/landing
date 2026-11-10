export type Livery = {
  id: string;
  name: string;
  body: string;
  trim: string;
  helmet: string;
};

export const LIVERIES: Livery[] = [
  { id: "red", name: "Rocket Red", body: "#E3241B", trim: "#FFC800", helmet: "#FFFDF5" },
  { id: "blue", name: "Bolt Blue", body: "#1456F0", trim: "#FFFDF5", helmet: "#FFC800" },
  { id: "green", name: "Go Green", body: "#17B169", trim: "#FFC800", helmet: "#E3241B" },
  { id: "pink", name: "Turbo Pink", body: "#FF3D9A", trim: "#FFFDF5", helmet: "#1456F0" },
  { id: "purple", name: "Nitro Purple", body: "#7A3CF0", trim: "#FFC800", helmet: "#FFFDF5" },
];

export type CarChoice = { liveryIndex: number; number: number };

const CAR_STORAGE_KEY = "friday-race-car";

/** Remembers the car through the Stripe redirect so it can appear on the success page. */
export function saveCarChoice(car: CarChoice) {
  try {
    sessionStorage.setItem(CAR_STORAGE_KEY, JSON.stringify(car));
  } catch {
    // Storage can be blocked; the success page falls back to the default car.
  }
}

export function loadCarChoice(): CarChoice {
  const fallback: CarChoice = { liveryIndex: 0, number: 7 };
  try {
    const saved = JSON.parse(sessionStorage.getItem(CAR_STORAGE_KEY) ?? "null");
    if (Number.isInteger(saved?.liveryIndex) && Number.isInteger(saved?.number)) {
      return { liveryIndex: saved.liveryIndex, number: saved.number };
    }
  } catch {
    // Fall through to the default car.
  }
  return fallback;
}

export const liveryFor = (index: number) =>
  LIVERIES[((index % LIVERIES.length) + LIVERIES.length) % LIVERIES.length];

const WEEK_FOUR = "/assets/highlights/school_week_four";

export const PHOTOS = [
  `${WEEK_FOUR}/818F2757-ACE1-41D0-A62F-52F47C9C59E2.JPG`,
  `${WEEK_FOUR}/189F9697-2F44-41CB-BF88-F45CFBDCD90A.JPG`,
  `${WEEK_FOUR}/9C5DFF55-97C6-4FEE-A82C-44A4BFB9BF5D.JPG`,
  `${WEEK_FOUR}/070B83EA-9BF5-4BAA-8818-544F74A17D7D.JPG`,
  `${WEEK_FOUR}/264087A9-CBD5-4099-95FC-1B49CC9517E7.JPG`,
  `${WEEK_FOUR}/43B558AD-2EDC-4E8F-B1ED-7CCFD765F730.JPG`,
  `${WEEK_FOUR}/6F80F35B-3B69-4D26-8868-92A93A382AE1.JPG`,
  `${WEEK_FOUR}/A6DB1350-9D81-456C-87DE-8FF7C4727661.JPG`,
  `${WEEK_FOUR}/B52828BB-4A7E-4F36-A133-1172281D5E59.JPG`,
  `${WEEK_FOUR}/C1390CB2-0CD0-4B86-8360-32B658D5E5E2.JPG`,
  `${WEEK_FOUR}/E10B5084-3A5E-44CC-B113-2CD6FD96A460.JPG`,
];

export type StationId = "relay" | "cardboard" | "trials" | "art";

export const STATIONS: {
  id: StationId;
  title: string;
  waypoint: string;
  desc: string;
  color: string;
}[] = [
  {
    id: "relay",
    title: "Pit Crew Relay",
    waypoint: "Pit Lane",
    desc: "Team up for a pit-stop relay: swap “tires,” grab a flag, and send your speedster back out.",
    color: "#FFC800",
  },
  {
    id: "cardboard",
    title: "Cardboard Speedsters",
    waypoint: "Garage Bay",
    desc: "Decorate a cardboard race car, add a number, and take it for a roll.",
    color: "#8FC7FF",
  },
  {
    id: "trials",
    title: "Speed Trials",
    waypoint: "Time Trials",
    desc: "Friendly timed dashes and rolling races across the field.",
    color: "#FF9A8F",
  },
  {
    id: "art",
    title: "Checkered Flag Art",
    waypoint: "Art Bay",
    desc: "Paint flags, numbers, and racing stripes to wave or wear.",
    color: "#7FE0B4",
  },
];

export const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=2760+Gattis+School+Rd%2C+Round+Rock+TX";
export const ADDRESS = "2760 Gattis School Rd, Round Rock TX";
