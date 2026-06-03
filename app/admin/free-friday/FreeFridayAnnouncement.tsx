"use client";

import { useState } from "react";
import { Mail, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cssColors as colors, radius } from "../design-system";

export function FreeFridayAnnouncement({ recipientCount }: { recipientCount: number }) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleSend = async () => {
    if (!confirm(`Send the Free Friday announcement to ${recipientCount} enrolled families?`)) return;
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/free-friday/send-announcement", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
      } else {
        setResult(json);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: colors.elevated, border: `1px solid ${colors.border}` }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: colors.accentLight }}
          >
            <Mail className="w-4 h-4" style={{ color: colors.accent }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>
              Announcement Email
            </p>
            <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
              {recipientCount} enrolled famil{recipientCount !== 1 ? "ies" : "y"} will receive this
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setPreviewOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            style={{ backgroundColor: colors.elevated, color: colors.textTertiary, border: `1px solid ${colors.border}` }}
          >
            Preview {previewOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {!result ? (
            <button
              onClick={handleSend}
              disabled={sending || recipientCount === 0}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              style={{
                backgroundColor: colors.accentLight,
                color: colors.accent,
                border: `1px solid ${colors.accent}`,
                opacity: sending || recipientCount === 0 ? 0.5 : 1,
              }}
            >
              <Mail className="w-3.5 h-3.5" />
              {sending ? "Sending…" : `Send to ${recipientCount} families`}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: "rgba(34,197,94,0.08)", color: colors.success }}>
              <CheckCircle className="w-3.5 h-3.5" />
              Sent to {result.sent} of {result.total}
              {result.failed > 0 && ` · ${result.failed} failed`}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: colors.error }}>
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Email preview */}
      {previewOpen && (
        <div
          className="mt-4 rounded-lg p-4 text-xs leading-relaxed space-y-2"
          style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}`, color: colors.textSecondary }}
        >
          <p className="font-semibold" style={{ color: colors.textTertiary }}>Subject: This Friday: Bring a Friend to Sage Field for Free 🌿</p>
          <p>Hi [Parent Name],</p>
          <p>This Friday, June 5th — we'd love for <strong>[Child Name]</strong> to bring a friend along for the day. Completely free, no strings attached.</p>
          <div style={{ borderLeft: `2px solid ${colors.accent}`, paddingLeft: "12px", color: colors.textTertiary }}>
            <p>📅 Friday, June 5, 2026</p>
            <p>🕗 Drop-off: 8:15 – 9:00 AM · 🕒 Pick-up: 1:00 PM</p>
            <p>📍 2760 Gattis School Rd, Round Rock TX · Ages 4–11 · Free</p>
          </div>
          <p>…with a CTA button → sagefield.co/free</p>
          <p style={{ color: colors.textTertiary }}>+ packing list, phone/email contact info, signed by Sabrina</p>
        </div>
      )}
    </div>
  );
}
