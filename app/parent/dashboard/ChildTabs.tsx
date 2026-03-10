"use client";

import { useState } from "react";
import {
  FileText,
  Users,
  Heart,
  Pill,
  ShieldCheck,
  Camera,
  AlertTriangle,
  UserPlus,
  PenLine,
  CreditCard,
} from "lucide-react";
import type { Database } from "@/app/types/database.types";

type Application = Database["parent_app"]["Tables"]["applications"]["Row"];

const checklistItems = [
  {
    id: 1,
    title: "Program Description, Parent Responsibilities, and Key Policies",
    subtitle: "Review and sign the program contract",
    icon: <FileText className="w-4 h-4" />,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    required: true,
    isContract: true,
  },
  {
    id: 2,
    title: "Community Agreement for Families and Staff",
    subtitle: "Review and sign the community agreement",
    icon: <Users className="w-4 h-4" />,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
    required: true,
    isContract: true,
  },
  {
    id: 3,
    title: "Emergency Contact, Health, and Immunization Form",
    subtitle: "Complete and sign the health and emergency form",
    icon: <Heart className="w-4 h-4" />,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
    required: true,
    isContract: true,
  },
  {
    id: 4,
    title: "Emergency Medication Plan on File",
    subtitle: "Submit if your child requires emergency medication",
    icon: <Pill className="w-4 h-4" />,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-400",
    required: false,
    isContract: false,
  },
  {
    id: 5,
    title: "Submit Proof of Immunizations",
    subtitle: "Upload current immunization records",
    icon: <ShieldCheck className="w-4 h-4" />,
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    required: true,
    isContract: false,
  },
  {
    id: 6,
    title: "Photo Release Form",
    subtitle: "Review and sign the photo and media release",
    icon: <Camera className="w-4 h-4" />,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-500",
    required: true,
    isContract: true,
  },
  {
    id: 7,
    title: "Assumption of Risk and Liability Release",
    subtitle: "Review and sign the liability release",
    icon: <AlertTriangle className="w-4 h-4" />,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    required: true,
    isContract: true,
  },
  {
    id: 8,
    title: "Additional Authorized Pickup Person",
    subtitle: "Add authorized pickup contacts and sign",
    icon: <UserPlus className="w-4 h-4" />,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-500",
    required: true,
    isContract: true,
  },
  {
    id: 9,
    title: "Pay Registration Fee",
    subtitle: "Submit the registration fee to complete enrollment",
    icon: <CreditCard className="w-4 h-4" />,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    required: true,
    isContract: false,
  },
];

const completedCount = 0;
const totalCount = checklistItems.length;
const progressPercent = Math.round((completedCount / totalCount) * 100);

function Checklist({ childName }: { childName: string }) {
  return (
    <div>
      <div className="mb-5 bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="text-xl font-semibold font-heading text-gray-800 mb-0.5">
              Enrollment Checklist
            </h2>
            <p className="text-xs text-gray-400 font-body">
              {childName} is enrolled at Sage Field Academy.
            </p>
            <p className="text-xs text-gray-400 font-body mt-0.5">
              {completedCount} of {totalCount} steps completed
            </p>
          </div>
          <button className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-body bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
            Get Started
          </button>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-400 font-body">
          {completedCount === totalCount
            ? "All steps complete — enrollment is finalized!"
            : `${totalCount - completedCount} step${totalCount - completedCount !== 1 ? "s" : ""} remaining`}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {checklistItems.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm flex items-center gap-4"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.iconBg} ${item.iconColor}`}
            >
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold font-heading text-gray-800 truncate">
                {item.title}
              </p>
              <p className="text-xs text-gray-400 font-body truncate">
                {item.subtitle}
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              {item.isContract && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                  <PenLine className="w-3 h-3" />
                  Sign
                </span>
              )}
              {!item.required && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-500 border-gray-200">
                  Optional
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChildTabs({ apps }: { apps: Application[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (apps.length === 0) {
    return (
      <p className="text-sm text-gray-500 font-body">No enrolled students.</p>
    );
  }

  const activeApp = apps[activeIndex];
  const childName =
    activeApp.preferred_name ?? activeApp.child_legal_name ?? "Student";

  if (apps.length === 1) {
    return <Checklist childName={childName} />;
  }

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {apps.map((app, index) => {
          const label =
            app.preferred_name ?? app.child_legal_name ?? "Student";
          const isActive = index === activeIndex;
          return (
            <button
              key={app.id}
              onClick={() => setActiveIndex(index)}
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold font-heading transition-colors ${
                isActive
                  ? "bg-gray-800 text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <Checklist childName={childName} />
    </div>
  );
}
