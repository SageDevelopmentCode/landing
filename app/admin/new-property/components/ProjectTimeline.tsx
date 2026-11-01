"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { cssColors as colors, cssShadows as shadows } from "../../design-system";
import {
  PRIORITIES,
  PRIORITY_CODES,
  SCHEDULE_SCENARIOS,
  STATUSES,
  categoryColor,
  formatShortDate,
  formatWeekRange,
  openingWeek,
  timelineWeeks,
  weekEndDate,
  weekPosition,
  weekStartDate,
} from "../budget-math";
import type { BudgetItem, TimelinePhase } from "../types";
import type { EditTarget } from "./EditItemDrawer";
import { Card } from "./ui";

const LABEL_WIDTH = 260;
const WEEK_MIN_WIDTH = 30;
const PHASE_COLOR = "#5E7C68";
const WINDOW_COLORS: Record<string, string> = {
  fast: "#22C55E",
  working: "#F59E0B",
  delayed: "#EF4444",
};

type Hover = {
  x: number;
  y: number;
  title: string;
  lines: string[];
};

function TimelineRow({
  label,
  sublabel,
  indent = false,
  gridBackground,
  overlay,
  children,
}: {
  label: React.ReactNode;
  sublabel?: string;
  indent?: boolean;
  gridBackground: React.CSSProperties;
  overlay: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex" style={{ minHeight: 32 }}>
      <div
        className="sticky left-0 z-10 flex flex-col justify-center pr-3 py-1"
        style={{
          width: LABEL_WIDTH,
          minWidth: LABEL_WIDTH,
          paddingLeft: indent ? 16 : 0,
          backgroundColor: colors.surface,
        }}
      >
        <div className="truncate text-xs" style={{ color: colors.textPrimary }}>
          {label}
        </div>
        {sublabel && (
          <div
            className="truncate text-[10px]"
            style={{ color: colors.textTertiary }}
          >
            {sublabel}
          </div>
        )}
      </div>
      <div className="relative flex-1" style={gridBackground}>
        {overlay}
        {children}
      </div>
    </div>
  );
}

function GroupHeader({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex mt-3 mb-1">
      <div
        className="sticky left-0 z-10 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider"
        style={{
          width: LABEL_WIDTH,
          minWidth: LABEL_WIDTH,
          backgroundColor: colors.surface,
          color: colors.textTertiary,
        }}
      >
        <span
          className="h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: color }}
        />
        {label}
      </div>
      <div
        className="flex-1"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      />
    </div>
  );
}

export function ProjectTimeline({
  items,
  phases,
  projectStartDate,
  categoryFilter,
  onEdit,
}: {
  items: BudgetItem[];
  phases: TimelinePhase[];
  projectStartDate: string;
  categoryFilter: string | null;
  onEdit: (target: EditTarget) => void;
}) {
  const [hover, setHover] = useState<Hover | null>(null);
  const weeks = timelineWeeks(items, phases);
  const openWeek = openingWeek(phases);
  const pct = (week: number) => `${(week / weeks) * 100}%`;

  const months = useMemo(() => {
    const segments: { label: string; span: number }[] = [];
    let lastKey = "";
    for (let w = 1; w <= weeks; w++) {
      const date = weekStartDate(projectStartDate, w);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (key === lastKey) {
        segments[segments.length - 1].span += 1;
      } else {
        const showYear = segments.length === 0 || date.getMonth() === 0;
        segments.push({
          label: date.toLocaleDateString("en-US", {
            month: "short",
            ...(showYear ? { year: "numeric" } : {}),
          }),
          span: 1,
        });
        lastKey = key;
      }
    }
    return segments;
  }, [projectStartDate, weeks]);

  const groups = useMemo(() => {
    const visible = categoryFilter
      ? items.filter((item) => item.category === categoryFilter)
      : items;
    const map = new Map<string, BudgetItem[]>();
    for (const item of visible) {
      map.set(item.category, [...(map.get(item.category) ?? []), item]);
    }
    return Array.from(map.entries()).map(([category, list]) => ({
      category,
      items: [...list].sort(
        (a, b) => a.startWeek - b.startWeek || a.endWeek - b.endWeek,
      ),
    }));
  }, [items, categoryFilter]);

  const todayPos = weekPosition(projectStartDate, new Date());
  const todayInRange = todayPos >= 1 && todayPos <= weeks + 1;
  const weeksUntilStart = Math.ceil(1 - todayPos);

  const gridBackground = {
    backgroundImage: `linear-gradient(to right, ${colors.border} 1px, transparent 1px)`,
    backgroundSize: `calc(100% / ${weeks}) 100%`,
  };

  function showHover(
    e: React.MouseEvent,
    title: string,
    startWeek: number,
    endWeek: number,
    extra: (string | null)[],
  ) {
    setHover({
      x: e.clientX,
      y: e.clientY,
      title,
      lines: [
        `Weeks ${startWeek}–${endWeek} · ${formatWeekRange(projectStartDate, startWeek, endWeek, true)}`,
        ...extra.filter((line): line is string => Boolean(line)),
      ],
    });
  }

  const overlay = (
    <>
      <div
        className="absolute inset-y-0 pointer-events-none"
        style={{
          left: pct(openWeek),
          borderLeft: `2px dashed ${PHASE_COLOR}`,
          opacity: 0.55,
        }}
      />
      {todayInRange && (
        <div
          className="absolute inset-y-0 pointer-events-none"
          style={{
            left: pct(todayPos - 1),
            borderLeft: "2px solid #EF4444",
          }}
        />
      )}
    </>
  );

  const rowProps = { gridBackground, overlay };

  return (
    <Card
      title="Timeline"
      subtitle={`Week 1 begins ${formatShortDate(weekStartDate(projectStartDate, 1), true)}. Windows overlap on purpose: they are target windows, not active work days. Click any bar to edit.`}
      action={
        !todayInRange && weeksUntilStart > 0 ? (
          <span
            className="text-xs whitespace-nowrap"
            style={{ color: colors.textTertiary }}
          >
            Starts in {weeksUntilStart} {weeksUntilStart === 1 ? "week" : "weeks"}
          </span>
        ) : null
      }
    >
      <div className="overflow-x-auto" onMouseLeave={() => setHover(null)}>
        <div style={{ minWidth: LABEL_WIDTH + weeks * WEEK_MIN_WIDTH }}>
          {/* Month header */}
          <div className="flex">
            <div
              className="sticky left-0 z-10"
              style={{
                width: LABEL_WIDTH,
                minWidth: LABEL_WIDTH,
                backgroundColor: colors.surface,
              }}
            />
            <div className="flex flex-1">
              {months.map((month, i) => (
                <div
                  key={`${month.label}-${i}`}
                  className="text-[11px] font-semibold py-1 pl-1.5 truncate"
                  style={{
                    width: `${(month.span / weeks) * 100}%`,
                    color: colors.textSecondary,
                    borderLeft: `1px solid ${colors.borderStrong}`,
                  }}
                >
                  {month.label}
                </div>
              ))}
            </div>
          </div>

          {/* Week header */}
          <div className="flex">
            <div
              className="sticky left-0 z-10 flex items-end text-[10px] pb-1"
              style={{
                width: LABEL_WIDTH,
                minWidth: LABEL_WIDTH,
                backgroundColor: colors.surface,
                color: colors.textQuaternary,
              }}
            >
              Week / start date
            </div>
            <div
              className="flex flex-1"
              style={{ borderBottom: `1px solid ${colors.border}` }}
            >
              {Array.from({ length: weeks }, (_, i) => {
                const w = i + 1;
                return (
                  <div
                    key={w}
                    className="text-center py-1 leading-tight"
                    style={{
                      width: `${100 / weeks}%`,
                      borderLeft: `1px solid ${colors.border}`,
                      backgroundColor:
                        w === openWeek ? `${PHASE_COLOR}1A` : "transparent",
                    }}
                  >
                    <div
                      className="text-[10px] font-semibold"
                      style={{ color: colors.textSecondary }}
                    >
                      {w}
                    </div>
                    <div
                      className="text-[9px]"
                      style={{ color: colors.textQuaternary }}
                    >
                      {weekStartDate(projectStartDate, w).getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Opening windows */}
          <TimelineRow
            {...rowProps}
            label="Opening window"
            sublabel="When the campus could open"
          >
            {SCHEDULE_SCENARIOS.map((slot) => (
              <div
                key={slot.id}
                className="absolute top-1.5 bottom-1.5 flex items-center justify-center rounded text-[10px] font-semibold"
                style={{
                  left: pct(slot.startWeek),
                  width: pct(slot.endWeek - slot.startWeek),
                  backgroundColor: `${WINDOW_COLORS[slot.id]}26`,
                  border: `1px solid ${WINDOW_COLORS[slot.id]}66`,
                  color: WINDOW_COLORS[slot.id],
                }}
                onMouseMove={(e) =>
                  setHover({
                    x: e.clientX,
                    y: e.clientY,
                    title: slot.label,
                    lines: [
                      `Open between ${formatShortDate(weekEndDate(projectStartDate, slot.startWeek), true)} and ${formatShortDate(weekEndDate(projectStartDate, slot.endWeek), true)}`,
                      `${slot.startWeek}–${slot.endWeek} weeks from start`,
                      slot.note,
                    ],
                  })
                }
                onMouseLeave={() => setHover(null)}
              >
                {slot.label.replace(" case", "")}
              </div>
            ))}
          </TimelineRow>

          {/* Phases */}
          <GroupHeader label="Phases" color={PHASE_COLOR} />
          {phases.map((phase) => (
            <TimelineRow
              key={phase.id}
              {...rowProps}
              label={phase.name}
              sublabel={phase.code}
            >
              <button
                type="button"
                onClick={() => onEdit({ kind: "phase", id: phase.id })}
                onMouseMove={(e) =>
                  showHover(e, phase.name, phase.startWeek, phase.endWeek, [
                    phase.activities,
                    phase.completionGate ? `Done when: ${phase.completionGate}` : null,
                  ])
                }
                onMouseLeave={() => setHover(null)}
                className="absolute top-1.5 bottom-1.5 rounded-md text-[10px] font-semibold text-white px-2 text-left truncate cursor-pointer transition-transform hover:scale-y-110"
                style={{
                  left: pct(phase.startWeek - 1),
                  width: pct(phase.endWeek - phase.startWeek + 1),
                  backgroundColor: PHASE_COLOR,
                }}
              >
                {phase.name}
              </button>
            </TimelineRow>
          ))}

          {/* Line items by category */}
          {groups.map((group) => (
            <div key={group.category}>
              <GroupHeader
                label={group.category}
                color={categoryColor(group.category)}
              />
              {group.items.map((item) => {
                const priority = PRIORITIES[item.priorityCode];
                const done = item.status === "done";
                const deferred = item.status === "deferred";
                const excluded = !item.includedInBudget;
                return (
                  <TimelineRow
                    key={item.id}
                    {...rowProps}
                    indent
                    label={
                      <>
                        <span style={{ color: colors.textTertiary }}>
                          {item.code}
                        </span>{" "}
                        {item.scope}
                        {excluded && (
                          <span
                            className="ml-1.5 text-[10px] font-normal"
                            style={{ color: colors.textQuaternary }}
                          >
                            (excluded)
                          </span>
                        )}
                      </>
                    }
                  >
                    <button
                      type="button"
                      onClick={() => onEdit({ kind: "item", id: item.id })}
                      onMouseMove={(e) =>
                        showHover(
                          e,
                          `${item.code} · ${item.scope}`,
                          item.startWeek,
                          item.endWeek,
                          [
                            excluded
                              ? "Excluded from budget totals"
                              : null,
                            `${priority.label} · ${STATUSES[item.status].label}`,
                            item.activities,
                          ],
                        )
                      }
                      onMouseLeave={() => setHover(null)}
                      className="absolute top-2 bottom-2 flex items-center gap-1 rounded px-1.5 text-[10px] font-semibold text-white cursor-pointer transition-transform hover:scale-y-110 overflow-hidden"
                      style={{
                        left: pct(item.startWeek - 1),
                        width: pct(item.endWeek - item.startWeek + 1),
                        backgroundColor: priority.color,
                        opacity: excluded ? 0.35 : deferred ? 0.4 : 1,
                        backgroundImage:
                          excluded || deferred
                            ? "repeating-linear-gradient(135deg, rgba(255,255,255,0.35) 0 4px, transparent 4px 8px)"
                            : undefined,
                        boxShadow: done ? "inset 0 0 0 2px #22C55E" : undefined,
                        outline: excluded
                          ? "1px dashed rgba(255,255,255,0.5)"
                          : undefined,
                      }}
                    >
                      {done && <Check className="w-3 h-3 flex-shrink-0" />}
                      <span className="truncate">{item.code}</span>
                    </button>
                  </TimelineRow>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 pt-3 text-[11px]"
        style={{ borderTop: `1px solid ${colors.border}`, color: colors.textTertiary }}
      >
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-5 rounded-sm"
            style={{ backgroundColor: PHASE_COLOR }}
          />
          Phase
        </span>
        {PRIORITY_CODES.map((code) => (
          <span key={code} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-5 rounded-sm"
              style={{ backgroundColor: PRIORITIES[code].color }}
            />
            {code} · {PRIORITIES[code].label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-5 rounded-sm"
            style={{ boxShadow: "inset 0 0 0 2px #22C55E" }}
          />
          Done
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-0 w-5"
            style={{ borderTop: `2px dashed ${PHASE_COLOR}` }}
          />
          Target opening (end of week {openWeek})
        </span>
        {todayInRange && (
          <span className="flex items-center gap-1.5">
            <span className="h-0 w-5" style={{ borderTop: "2px solid #EF4444" }} />
            Today
          </span>
        )}
      </div>

      {hover && (
        <div
          className="fixed z-50 max-w-xs rounded-lg px-3 py-2 text-xs pointer-events-none"
          style={{
            left: Math.min(hover.x + 14, window.innerWidth - 300),
            top: hover.y + 14,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            boxShadow: shadows.large,
            color: colors.textSecondary,
          }}
        >
          <div className="font-semibold mb-1" style={{ color: colors.textPrimary }}>
            {hover.title}
          </div>
          {hover.lines.map((line, i) => (
            <div key={i} className="leading-snug">
              {line}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
