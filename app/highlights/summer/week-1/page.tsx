import GardenRoot from "@/app/_garden/GardenRoot";
import WeekHighlightsPage from "@/app/highlights/_shared/WeekHighlightsPage";
import { WEEK } from "./content";

export default function Page() {
  return (
    <GardenRoot>
      <WeekHighlightsPage week={WEEK} />
    </GardenRoot>
  );
}
