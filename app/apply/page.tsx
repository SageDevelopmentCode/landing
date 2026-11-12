import GardenRoot from "@/app/_garden/GardenRoot";
import ApplyPage from "./ApplyPage";
import type { ApplyTab } from "./content";

const TABS: ApplyTab[] = ["school-year", "homeschool"];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[]; ref?: string | string[] }>;
}) {
  const params = await searchParams;
  const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
  const tab = first(params.tab);
  const ref = first(params.ref);
  const initialTab: ApplyTab = TABS.includes(tab as ApplyTab) ? (tab as ApplyTab) : "school-year";

  return (
    <GardenRoot>
      <ApplyPage initialTab={initialTab} refCode={ref || undefined} />
    </GardenRoot>
  );
}
