"use client";

import { useState } from "react";
import { SlidersHorizontal, Users, ChevronDown } from "lucide-react";
import Image from "next/image";
import type { Activity } from "@/app/actions/activities";
import type { PreferenceChild } from "./page";

type ParticipationLevel = "watch" | "cook_no_eat" | "full";

type ActivityPreference = {
  level: ParticipationLevel | null;
  notes: string;
};

type AllPreferences = Record<string, Record<string, ActivityPreference>>;

const LEVELS: { value: ParticipationLevel; label: string; emoji: string }[] = [
  { value: "watch", label: "Do not participate, just watch", emoji: "👀" },
  {
    value: "cook_no_eat",
    label: "Cook and interact with ingredients but do not consume",
    emoji: "🧑‍🍳",
  },
  { value: "full", label: "Okay for everything (cooking and eating)", emoji: "✅" },
];

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface Props {
  children: PreferenceChild[];
  activities: Activity[];
}

export default function PreferencesPageClient({ children, activities }: Props) {
  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id ?? "");
  const [expandedFoods, setExpandedFoods] = useState<Set<string>>(new Set());
  const [preferences, setPreferences] = useState<AllPreferences>(() => {
    const init: AllPreferences = {};
    for (const child of children) {
      init[child.id] = {};
      for (const activity of activities) {
        init[child.id][activity.id] = { level: null, notes: "" };
      }
    }
    return init;
  });

  function updatePreference(
    childId: string,
    activityId: string,
    patch: Partial<ActivityPreference>
  ) {
    setPreferences((prev) => ({
      ...prev,
      [childId]: {
        ...prev[childId],
        [activityId]: {
          ...prev[childId][activityId],
          ...patch,
        },
      },
    }));
  }

  if (children.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-5">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold font-heading text-gray-800 mb-3">
            No children found
          </h2>
          <p className="text-gray-500 font-body text-sm max-w-sm leading-relaxed">
            Once a child is added to your account, their activity preferences will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left sidebar — desktop only */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 overflow-y-auto px-3 pt-8 gap-1 bg-white border-r border-gray-100">
        <p className="text-xs font-semibold font-body text-gray-400 uppercase tracking-wider px-2 pb-2">
          Children
        </p>
        {children.map((child) => {
          const isActive = child.id === selectedChildId;
          return (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                isActive
                  ? "bg-[#4a7c59]/10 text-gray-800"
                  : "text-gray-400 hover:text-gray-600 hover:bg-black/5"
              }`}
            >
              {child.profile_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={child.profile_image_url}
                  alt={child.child_legal_name}
                  className="w-7 h-7 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0 bg-[#4a7c59]">
                  {getInitials(child.child_legal_name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-body font-medium truncate leading-tight">
                  {child.child_legal_name}
                </p>
              </div>
            </button>
          );
        })}
      </aside>

      {/* Right panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile: horizontal scrollable tab bar */}
        <div className="md:hidden flex gap-2 overflow-x-auto px-4 py-2 border-b border-gray-100 bg-white shrink-0">
          {children.map((child) => {
            const isActive = child.id === selectedChildId;
            return (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-body font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#4a7c59]/10 text-gray-800"
                    : "text-gray-400 hover:text-gray-600 hover:bg-black/5"
                }`}
              >
                {child.profile_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={child.profile_image_url}
                    alt={child.child_legal_name}
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0 bg-[#4a7c59]">
                    {getInitials(child.child_legal_name)}
                  </div>
                )}
                <span className="max-w-[10ch] truncate">{child.child_legal_name}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="mb-8">
              <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">
                Activity Preferences
              </h1>
              <p className="text-sm text-gray-500 font-body">
                Let us know how each child would like to participate in upcoming activities.
              </p>
            </div>

            {/* No activities state */}
            {activities.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-5">
                  <SlidersHorizontal className="w-8 h-8 text-[#4a7c59]" />
                </div>
                <h2 className="text-xl font-semibold font-heading text-gray-800 mb-3">
                  No activities yet
                </h2>
                <p className="text-gray-500 font-body text-sm max-w-sm leading-relaxed">
                  When teachers publish activities, they will appear here for you to set preferences.
                </p>
              </div>
            )}

            {/* Activity cards */}
            {activities.length > 0 && (
              <div className="flex flex-col gap-4">
                {activities.map((activity) => {
                  const pref = preferences[selectedChildId]?.[activity.id] ?? {
                    level: null,
                    notes: "",
                  };
                  return (
                    <div
                      key={activity.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                    >
                      {/* Activity header */}
                      <div className="flex items-start gap-4 mb-5">
                        {activity.images.length > 0 && (
                          <Image
                            src={activity.images[0].signed_url}
                            alt={activity.title}
                            width={80}
                            height={80}
                            className="rounded-xl object-cover w-20 h-20 flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold font-heading text-gray-800 mb-1">
                            {activity.title}
                          </h3>
                          {activity.description && (
                            <p className="text-sm text-gray-500 font-body leading-relaxed">
                              {activity.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Food items — collapsible */}
                      {activity.includes_food && activity.foods.length > 0 && (
                        <div className="mb-5 pt-5 border-t border-gray-100">
                          <button
                            onClick={() =>
                              setExpandedFoods((prev) => {
                                const next = new Set(prev);
                                if (next.has(activity.id)) next.delete(activity.id);
                                else next.add(activity.id);
                                return next;
                              })
                            }
                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#4a7c59] transition-colors cursor-pointer font-body uppercase tracking-wide"
                          >
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                expandedFoods.has(activity.id) ? "rotate-180" : ""
                              }`}
                              strokeWidth={2.5}
                            />
                            {expandedFoods.has(activity.id)
                              ? "Hide food items & ingredients"
                              : `See food items & ingredients (${activity.foods.length})`}
                          </button>

                          {expandedFoods.has(activity.id) && (
                            <div className="flex flex-col gap-2 mt-3">
                              {activity.foods.map((food) => (
                                <div key={food.id} className="bg-gray-50 rounded-xl p-3">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="text-sm font-semibold text-gray-800 font-body">
                                      {food.name}
                                    </span>
                                    {food.allergens && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-body">
                                        ⚠ {food.allergens}
                                      </span>
                                    )}
                                  </div>
                                  {food.ingredients.length > 0 && (
                                    <p className="text-xs text-gray-500 font-body">
                                      Ingredients:{" "}
                                      {food.ingredients
                                        .slice()
                                        .sort((a, b) => a.sort_order - b.sort_order)
                                        .map((i) => i.name)
                                        .join(", ")}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Preference selector */}
                      <div className="pt-5 border-t border-gray-100">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 font-body mb-3">
                          Participation Preference
                        </p>
                        <div className="flex flex-col gap-2">
                          {LEVELS.map(({ value, label, emoji }) => {
                            const isActive = pref.level === value;
                            return (
                              <button
                                key={value}
                                onClick={() =>
                                  updatePreference(selectedChildId, activity.id, {
                                    level: isActive ? null : value,
                                  })
                                }
                                className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border transition-colors cursor-pointer ${
                                  isActive
                                    ? "border-[#4a7c59] bg-[#4a7c59]/8 text-[#4a7c59] font-semibold"
                                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                <span
                                  className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                                    isActive
                                      ? "bg-[#4a7c59] border-[#4a7c59]"
                                      : "border-gray-400"
                                  }`}
                                />
                                <span className="text-base leading-none flex-shrink-0">
                                  {emoji}
                                </span>
                                <span className="text-sm font-body">{label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Notes textarea */}
                        {pref.level !== null && (
                          <div className="mt-3">
                            <label className="block text-xs font-semibold text-gray-500 font-body mb-1.5 uppercase tracking-wide">
                              Notes or special instructions (optional)
                            </label>
                            <textarea
                              value={pref.notes}
                              onChange={(e) =>
                                updatePreference(selectedChildId, activity.id, {
                                  notes: e.target.value,
                                })
                              }
                              placeholder="e.g. only eat one serving, bringing alternative ingredients: oat milk instead of dairy..."
                              rows={2}
                              className="w-full px-3 py-2 text-sm font-body border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59] placeholder-gray-400 text-gray-800"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Save button */}
                <div className="mt-4 pt-6 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-400 font-body">
                    Preferences are not yet saved to your account.
                  </p>
                  <div className="relative group">
                    <button
                      disabled
                      className="px-6 py-2.5 rounded-xl text-sm font-semibold font-body bg-gray-100 text-gray-400 cursor-not-allowed"
                    >
                      Save Preferences
                    </button>
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap pointer-events-none">
                      Coming soon
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
