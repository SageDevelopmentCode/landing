import { Clock, Users, DollarSign, MapPin } from "lucide-react";
import { cssColors as colors, radius, cssShadows as shadows } from "../design-system";
import type { DashboardSnapshot } from "@/app/actions/getDashboardSnapshot";

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
  // time is "HH:MM" or "HH:MM:SS"
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
  });
}

function fmtClockIn(isoTs: string) {
  return new Date(isoTs).toLocaleTimeString("en-US", {
    hour:   "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function WidgetCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col gap-3 p-5"
      style={{
        backgroundColor: colors.elevated,
        borderRadius: radius.lg,
        border: `1px solid ${colors.border}`,
        boxShadow: shadows.card,
      }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: colors.accent }}>{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="text-xs" style={{ color: colors.textQuaternary }}>
      {label}
    </p>
  );
}

// --- Individual widgets ---

function ClockedInWidget({ sessions }: { sessions: DashboardSnapshot["active_sessions"] }) {
  return (
    <WidgetCard icon={<Clock className="w-4 h-4" />} title="Clocked In">
      {sessions.length === 0 ? (
        <EmptyState label="No one clocked in today" />
      ) : (
        <div className="space-y-2">
          <div
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: colors.successBg, color: colors.success }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: colors.success }}
            />
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
    <WidgetCard icon={<Users className="w-4 h-4" />} title="Enrolled Students">
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
    <WidgetCard icon={<DollarSign className="w-4 h-4" />} title="This Month">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: colors.textTertiary }}>Revenue</span>
          <span className="text-sm font-semibold" style={{ color: colors.success }}>
            {fmtCurrency(financials.revenue)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: colors.textTertiary }}>Expenses</span>
          <span className="text-sm font-semibold" style={{ color: colors.error }}>
            {fmtCurrency(financials.expenses)}
          </span>
        </div>
        <div
          style={{ height: 1, backgroundColor: colors.border, margin: "4px 0" }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
            {isProfit ? "Net Profit" : "Net Loss"}
          </span>
          <span
            className="text-sm font-bold"
            style={{ color: isProfit ? colors.success : colors.error }}
          >
            {isProfit ? "+" : ""}{fmtCurrency(net)}
          </span>
        </div>
      </div>
    </WidgetCard>
  );
}

function ToursWidget({ tours }: { tours: DashboardSnapshot["upcoming_tours"] }) {
  return (
    <WidgetCard icon={<MapPin className="w-4 h-4" />} title="Upcoming Tours">
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

// --- Main export ---

export function DashboardWidgets({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <ClockedInWidget  sessions={snapshot.active_sessions} />
      <EnrollmentWidget rows={snapshot.enrollment} />
      <FinancialsWidget financials={snapshot.financials} />
      <ToursWidget      tours={snapshot.upcoming_tours} />
    </div>
  );
}
