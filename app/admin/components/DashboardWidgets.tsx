"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Users, DollarSign, MapPin, ChevronRight, RefreshCw, CalendarDays, Smartphone } from "lucide-react";
import { cssColors as colors } from "../design-system";
import type { DashboardSnapshot } from "@/app/actions/getDashboardSnapshot";
import { getDashboardSnapshot } from "@/app/actions/getDashboardSnapshot";

// --- Types ---

export type ProgramConfig = {
  name: string;
  date: string;
  accentColor: string;
};

// --- Helpers ---

const PROGRAM_LABELS: Record<string, string> = {
  summer_26:          "Summer '26",
  school_year_26_27:  "School Year '26–'27",
  both:               "Both Programs",
  homeschool_drop_in: "Homeschool Drop-In",
};

const TOUR_STATUS_COLORS: Record<string, string> = {
  pending:   colors.warning,
  confirmed: colors.success,
};

function fmt12h(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtClockIn(isoTs: string) {
  return new Date(isoTs).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function getDaysRemaining(isoDate: string): number {
  const target = new Date(isoDate);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatLongDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

// --- Shared primitives ---

function WidgetCard({ icon, iconColor, title, href, children }: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span style={{ color: iconColor }}>{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>
          {title}
        </span>
      </div>
      <div className="flex-1">{children}</div>
      <div style={{ height: 1, backgroundColor: colors.border }} />
      <Link
        href={href}
        className="flex items-center gap-1 text-xs font-medium transition-colors duration-150"
        style={{ color: colors.textTertiary }}
        onMouseOver={(e) => (e.currentTarget.style.color = iconColor)}
        onMouseOut={(e) => (e.currentTarget.style.color = colors.textTertiary)}
      >
        View all
        <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-xs" style={{ color: colors.textQuaternary }}>{label}</p>;
}

// --- Countdown cell (no card chrome) ---

function CountdownCell({ program }: { program: ProgramConfig }) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    setDays(getDaysRemaining(program.date));
  }, [program.date]);

  const started = days !== null && days <= 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span style={{ color: program.accentColor }}><CalendarDays className="w-4 h-4" /></span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>
          {program.name}
        </span>
      </div>
      <div className="flex-1">
        <p className="text-xs mb-2" style={{ color: colors.textQuaternary }}>{formatLongDate(program.date)}</p>
        {started ? (
          <p className="text-base font-semibold" style={{ color: program.accentColor }}>Program started</p>
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold" style={{ color: colors.textPrimary }}>{days ?? "—"}</span>
            <span className="text-sm font-medium" style={{ color: colors.textTertiary }}>days away</span>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Data widgets ---

function ClockedInWidget({ sessions }: { sessions: DashboardSnapshot["active_sessions"] }) {
  return (
    <WidgetCard icon={<Clock className="w-4 h-4" />} iconColor="#F59E0B" title="Clocked In" href="/admin/payroll">
      {sessions.length === 0 ? (
        <EmptyState label="No one clocked in today" />
      ) : (
        <div className="space-y-2">
          <div
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: colors.successBg, color: colors.success }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: colors.success }} />
            {sessions.length} active
          </div>
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between">
              <span className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                {s.full_name ?? "Unknown"}
              </span>
              <span className="text-xs flex-shrink-0 ml-2" style={{ color: colors.textTertiary }}>
                since {fmtClockIn(s.clock_in_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </WidgetCard>
  );
}

function EnrollmentWidget({ rows }: { rows: DashboardSnapshot["enrollment"] }) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <WidgetCard icon={<Users className="w-4 h-4" />} iconColor="#38BDF8" title="Enrolled Students" href="/admin/applications">
      {rows.length === 0 ? (
        <EmptyState label="No enrolled students" />
      ) : (
        <div className="space-y-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{total}</span>
            <span className="text-xs" style={{ color: colors.textTertiary }}>total</span>
          </div>
          {rows.map((r) => (
            <div key={r.program} className="flex items-center justify-between">
              <span className="text-xs truncate" style={{ color: colors.textSecondary }}>
                {PROGRAM_LABELS[r.program] ?? r.program}
              </span>
              <span
                className="text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2"
                style={{ backgroundColor: colors.accentLight, color: colors.accent }}
              >
                {r.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </WidgetCard>
  );
}

function FinancialsWidget({ financials }: { financials: DashboardSnapshot["financials"] }) {
  const net = financials.revenue - financials.expenses;
  const isProfit = net >= 0;
  return (
    <WidgetCard icon={<DollarSign className="w-4 h-4" />} iconColor="#22C55E" title="This Month" href="/admin/budget">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: colors.textTertiary }}>Revenue</span>
          <span className="text-sm font-semibold" style={{ color: colors.success }}>{fmtCurrency(financials.revenue)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: colors.textTertiary }}>Expenses</span>
          <span className="text-sm font-semibold" style={{ color: colors.error }}>{fmtCurrency(financials.expenses)}</span>
        </div>
        <div style={{ height: 1, backgroundColor: colors.border, margin: "4px 0" }} />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
            {isProfit ? "Net Profit" : "Net Loss"}
          </span>
          <span className="text-sm font-bold" style={{ color: isProfit ? colors.success : colors.error }}>
            {isProfit ? "+" : ""}{fmtCurrency(net)}
          </span>
        </div>
      </div>
    </WidgetCard>
  );
}

function ToursWidget({ tours }: { tours: DashboardSnapshot["upcoming_tours"] }) {
  return (
    <WidgetCard icon={<MapPin className="w-4 h-4" />} iconColor="#EC4899" title="Upcoming Tours" href="/admin/marketing">
      {tours.length === 0 ? (
        <EmptyState label="No upcoming tours" />
      ) : (
        <div className="space-y-2.5">
          {tours.map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                  {t.first_name} {t.last_name}
                </p>
                <p className="text-xs" style={{ color: colors.textTertiary }}>
                  {fmtDate(t.tour_date)} · {fmt12h(t.tour_time)}
                  {t.num_children > 0 && ` · ${t.num_children} child${t.num_children !== 1 ? "ren" : ""}`}
                </p>
              </div>
              <span
                className="text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 capitalize"
                style={{
                  backgroundColor: TOUR_STATUS_COLORS[t.status] ? `${TOUR_STATUS_COLORS[t.status]}20` : colors.elevated,
                  color: TOUR_STATUS_COLORS[t.status] ?? colors.textTertiary,
                  border: `1px solid ${TOUR_STATUS_COLORS[t.status] ?? colors.border}`,
                }}
              >
                {t.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </WidgetCard>
  );
}

function MobileAppWidget({ mobileAppUsers }: { mobileAppUsers: DashboardSnapshot["mobile_app_users"] }) {
  return (
    <WidgetCard icon={<Smartphone className="w-4 h-4" />} iconColor={colors.info} title="Mobile App Users" href="/admin/users">
      {mobileAppUsers.count === 0 ? (
        <EmptyState label="No users on the app" />
      ) : (
        <div className="space-y-2">
          <div
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: colors.infoBg, color: colors.info }}
          >
            {mobileAppUsers.count} on the app
          </div>
          {mobileAppUsers.users.map((u) => (
            <div key={u.id} className="flex items-center justify-between">
              <span className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                {u.full_name ?? u.email}
              </span>
              {u.role && (
                <span className="text-xs flex-shrink-0 ml-2 capitalize" style={{ color: colors.textTertiary }}>
                  {u.role}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </WidgetCard>
  );
}

// --- Main export ---

export function DashboardWidgets({
  initialSnapshot,
  programs,
}: {
  initialSnapshot: DashboardSnapshot;
  programs: ProgramConfig[];
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const fresh = await getDashboardSnapshot();
      setSnapshot(fresh);
    } finally {
      setRefreshing(false);
    }
  }

  const cell = (content: React.ReactNode, borderRight?: boolean, borderBottom?: boolean) => (
    <div style={{
      padding: "20px",
      borderRight: borderRight ? `1px solid var(--admin-border)` : undefined,
      borderBottom: borderBottom ? `1px solid var(--admin-border)` : undefined,
    }}>
      {content}
    </div>
  );

  return (
    <div>
      {/* Header with refresh button */}
      <div className="flex items-center justify-end mb-3">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh stats"
          className="flex items-center gap-1.5 text-xs font-medium transition-colors duration-150"
          style={{ color: colors.textTertiary, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}
          onMouseOver={(e) => (e.currentTarget.style.color = colors.textSecondary)}
          onMouseOut={(e) => (e.currentTarget.style.color = colors.textTertiary)}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Unified 3-row × 2-col grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2"
        style={{ border: `1px solid var(--admin-border)`, borderRadius: "12px", overflow: "hidden" }}
      >
        {/* Row 1: Countdowns */}
        {cell(<CountdownCell program={programs[0]} />, true, true)}
        {cell(<CountdownCell program={programs[1]} />, false, true)}

        {/* Row 2: Clocked In + Enrolled */}
        {cell(<ClockedInWidget sessions={snapshot.active_sessions} />, true, true)}
        {cell(<EnrollmentWidget rows={snapshot.enrollment} />, false, true)}

        {/* Row 3: Financials + Tours */}
        {cell(<FinancialsWidget financials={snapshot.financials} />, true, true)}
        {cell(<ToursWidget tours={snapshot.upcoming_tours} />, false, true)}

        {/* Row 4: Mobile App Users */}
        {cell(<MobileAppWidget mobileAppUsers={snapshot.mobile_app_users} />, true, false)}
        {cell(null, false, false)}
      </div>
    </div>
  );
}
