"use client";

import { useState, useEffect } from "react";
import { getSummerStudentsForWeek } from "@/app/actions/summerAttendance";
import type { SummerDayData } from "@/app/actions/summerAttendance";
import SummerPageClient from "./SummerPageClient";

// Week 1 anchor = Monday May 25, 2026
const SUMMER_WEEK1_MONDAY = new Date(2026, 4, 25);
const TOTAL_WEEKS = 12;

function getCurrentSummerWeek(): number {
  const today = new Date();
  const diffDays = Math.floor(
    (today.getTime() - SUMMER_WEEK1_MONDAY.getTime()) / 86400000
  );
  if (diffDays < 0) return 1;
  const w = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(w, 1), TOTAL_WEEKS);
}

function weekNumToMonday(weekNum: number): string {
  const d = new Date(SUMMER_WEEK1_MONDAY);
  d.setDate(d.getDate() + (weekNum - 1) * 7);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function LoadingSkeleton() {
  return (
    <div className="flex-1 px-6 py-6 overflow-y-auto w-full">
      <div className="animate-pulse space-y-3">
        <div className="h-8 bg-gray-100 rounded-lg w-64" />
        <div className="h-4 bg-gray-100 rounded w-48" />
        <div className="h-px bg-gray-100 w-full mt-4" />
        <div className="grid grid-cols-5 gap-3 mt-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-48" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SummerLazyLoader() {
  const [data, setData] = useState<{
    weekData: SummerDayData[];
    weekNum: number;
  } | null>(null);

  useEffect(() => {
    const weekNum = getCurrentSummerWeek();
    const monday = weekNumToMonday(weekNum);
    getSummerStudentsForWeek(monday).then((weekData) => {
      setData({ weekData, weekNum });
    });
  }, []);

  if (!data) return <LoadingSkeleton />;
  return (
    <SummerPageClient
      initialWeekData={data.weekData}
      initialWeekNum={data.weekNum}
    />
  );
}
