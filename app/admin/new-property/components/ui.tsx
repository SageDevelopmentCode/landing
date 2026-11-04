import type { ReactNode } from "react";
import { cssColors as colors, cssShadows as shadows } from "../../design-system";

export function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl p-5 ${className}`}
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        boxShadow: shadows.soft,
      }}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            {title && (
              <h2
                className="text-sm font-semibold"
                style={{ color: colors.textPrimary }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                {subtitle}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Pill({
  color,
  children,
  solid = false,
}: {
  color: string;
  children: ReactNode;
  solid?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{
        backgroundColor: solid ? color : `${color}1F`,
        color: solid ? "#FFFFFF" : color,
        border: solid ? "none" : `1px solid ${color}40`,
      }}
    >
      {!solid && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  max,
  color,
  height = 6,
}: {
  value: number;
  max: number;
  color: string;
  height?: number;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = max > 0 && value > max;
  return (
    <div
      className="w-full overflow-hidden rounded-full"
      style={{ height, backgroundColor: colors.elevated }}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${pct}%`,
          backgroundColor: over ? "#EF4444" : color,
        }}
      />
    </div>
  );
}
