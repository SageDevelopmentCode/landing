"use server";

import { createAdminClient } from "@/app/lib/supabase-server";

export type ActiveSession = {
  id: string;
  clock_in_at: string;
  full_name: string | null;
  profile_image_url: string | null;
};

export type EnrollmentRow = {
  program: string;
  count: number;
};

export type Financials = {
  revenue: number;
  expenses: number;
};

export type UpcomingTour = {
  id: string;
  first_name: string;
  last_name: string;
  tour_date: string;
  tour_time: string;
  status: string;
  num_children: number;
};

export type DashboardSnapshot = {
  active_sessions: ActiveSession[];
  enrollment: EnrollmentRow[];
  financials: Financials;
  upcoming_tours: UpcomingTour[];
};

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("get_dashboard_snapshot");
  if (error) throw error;
  return data as DashboardSnapshot;
}
