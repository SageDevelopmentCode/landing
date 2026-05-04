"use client";

import { useState, useEffect } from "react";
import { Sun, Leaf } from "lucide-react";
import AftercarePageClient from "../aftercare/AftercarePageClient";
import FieldFridayPageClient from "../field-friday/FieldFridayPageClient";
import { getFieldFridayStudentsForDate } from "@/app/actions/fieldFridayAttendance";
import type { AftercareStudentRow } from "@/app/actions/aftercareAttendance";
import type { FieldFridayStudentRow } from "@/app/actions/fieldFridayAttendance";

type Program = "aftercare" | "field-friday";

interface Props {
  initialAftercareStudents: AftercareStudentRow[];
  initialAftercareDate: string;
}

function getInitialFriday(): string {
  const d = new Date();
  const day = d.getDay();
  if (day !== 5) {
    const daysUntilFriday = day === 6 ? 6 : 5 - day;
    d.setDate(d.getDate() + daysUntilFriday);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function LoadingSkeleton() {
  return (
    <div className="flex-1 px-6 py-6 overflow-y-auto w-full">
      <div className="animate-pulse space-y-3">
        <div className="h-8 bg-gray-100 rounded-lg w-48" />
        <div className="h-px bg-gray-100 w-full" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg w-full" />
        ))}
      </div>
    </div>
  );
}

function FieldFridayLazyLoader() {
  const [data, setData] = useState<{ students: FieldFridayStudentRow[]; date: string } | null>(null);

  useEffect(() => {
    const initialFriday = getInitialFriday();
    getFieldFridayStudentsForDate(initialFriday).then((students) => {
      setData({ students, date: initialFriday });
    });
  }, []);

  if (!data) return <LoadingSkeleton />;
  return <FieldFridayPageClient initialStudents={data.students} initialDate={data.date} />;
}

const programs: { id: Program; label: string; icon: React.ElementType }[] = [
  { id: "aftercare", label: "Aftercare", icon: Sun },
  { id: "field-friday", label: "Field Fun Fridays", icon: Leaf },
];

export default function AttendancePageClient({ initialAftercareStudents, initialAftercareDate }: Props) {
  const [activeProgram, setActiveProgram] = useState<Program>("aftercare");

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-52 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col py-6 px-3 gap-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 mb-2 font-body">
          Programs
        </p>
        {programs.map(({ id, label, icon: Icon }) => {
          const isActive = activeProgram === id;
          return (
            <button
              key={id}
              onClick={() => setActiveProgram(id)}
              className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-sm font-body rounded-xl transition-colors ${
                isActive
                  ? "bg-[#4a7c59]/8 text-[#4a7c59] font-semibold border-l-2 border-[#4a7c59]"
                  : "text-gray-600 hover:text-[#4a7c59] hover:bg-gray-50 border-l-2 border-transparent"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          );
        })}
      </aside>

      <div className="flex-1 overflow-hidden flex">
        {activeProgram === "aftercare" && (
          <AftercarePageClient
            initialStudents={initialAftercareStudents}
            initialDate={initialAftercareDate}
          />
        )}
        {activeProgram === "field-friday" && <FieldFridayLazyLoader />}
      </div>
    </div>
  );
}
