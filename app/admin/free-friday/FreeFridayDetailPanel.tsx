"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle } from "lucide-react";
import { cssColors as colors, radius, cssShadows as shadows } from "../design-system";
import { updateFreeFridayStatus, updateFreeFridayNotes, deleteFreeFridayRegistration } from "./actions";
import { sendFreeFridayAttendanceConfirmationEmail } from "../../actions/sendFreeFridayAttendanceConfirmationEmail";

export type FreeFridayRow = {
  id: string;
  track: "enrolled" | "new";
  agreement_signed: boolean;
  signature_name: string | null;
  // Track A
  enrolled_parent_name: string | null;
  enrolled_child_name: string | null;
  friend_child_name: string | null;
  friend_child_age: number | null;
  friend_parent_name: string | null;
  friend_parent_email: string | null;
  friend_parent_phone: string | null;
  track_a_emergency_name: string | null;
  track_a_emergency_phone: string | null;
  track_a_notes: string | null;
  track_a_photo_consent: boolean;
  // Track B
  parent_name: string | null;
  email: string | null;
  phone: string | null;
  child_name: string | null;
  child_age: number | null;
  referral_source: string | null;
  notes: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  consent_outdoor: boolean;
  consent_photo: boolean;
  interested_in_enrollment: boolean;
  // Admin
  status: string;
  admin_notes: string | null;
  tags: string[];
  is_deleted: boolean;
  created_at: string;
};

const STATUSES = ["new", "confirmed", "attended", "no_show", "cancelled"];

const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  new:       { bg: colors.infoBg,     color: colors.info,    border: colors.infoBorder },
  confirmed: { bg: colors.successBg,  color: colors.success, border: colors.successBorder },
  attended:  { bg: colors.accentLight, color: colors.accent,  border: colors.accent },
  no_show:   { bg: colors.warningBg,  color: colors.warning, border: colors.warningBorder },
  cancelled: { bg: colors.errorBg,    color: colors.error,   border: colors.errorBorder },
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: colors.textTertiary }}>
        {label}
      </p>
      <p className="text-sm" style={{ color: colors.textPrimary }}>
        {value || <span style={{ color: colors.textTertiary }}>—</span>}
      </p>
    </div>
  );
}

export function FreeFridayDetailPanel({
  row,
  onClose,
  onUpdated,
}: {
  row: FreeFridayRow | null;
  onClose: () => void;
  onUpdated: (updated: FreeFridayRow) => void;
}) {
  const [notes, setNotes] = useState(row?.admin_notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmSending, setConfirmSending] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Sync local notes when row changes
  const currentNotes = row?.admin_notes ?? "";
  if (notes !== currentNotes && !savingNotes) {
    setNotes(currentNotes);
    setNotesSaved(false);
  }

  if (!row) return null;

  const isEnrolled = row.track === "enrolled";
  const contactEmail = isEnrolled ? row.friend_parent_email : row.email;
  const childName = isEnrolled ? row.friend_child_name : row.child_name;
  const guardianName = isEnrolled ? row.friend_parent_name : row.parent_name;

  const handleStatusChange = async (status: string) => {
    setUpdatingStatus(true);
    await updateFreeFridayStatus(row.id, status);
    onUpdated({ ...row, status });
    setUpdatingStatus(false);
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await updateFreeFridayNotes(row.id, notes);
    onUpdated({ ...row, admin_notes: notes });
    setSavingNotes(false);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const handleSendConfirmation = async () => {
    if (confirmSending || !contactEmail) return;
    setConfirmSending(true);
    setConfirmError(null);
    const result = await sendFreeFridayAttendanceConfirmationEmail({
      parentName: guardianName ?? "",
      childName: childName ?? "",
      email: contactEmail,
    });
    setConfirmSending(false);
    if (result.success) {
      setConfirmSent(true);
      setTimeout(() => setConfirmSent(false), 3000);
    } else {
      setConfirmError(result.error ?? "Failed to send");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Remove this registration from the list?")) return;
    setDeleting(true);
    await deleteFreeFridayRegistration(row.id);
    onClose();
  };

  const style = statusStyles[row.status] ?? statusStyles["new"];

  return (
    <AnimatePresence>
      <motion.div
        key={row.id}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed inset-y-0 right-0 w-full max-w-md z-50 flex flex-col overflow-hidden"
        style={{ backgroundColor: colors.surface, borderLeft: `1px solid ${colors.border}`, boxShadow: shadows.large }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div>
            <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>{childName || "—"}</p>
            <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
              {isEnrolled ? "🤝 Enrolled Family" : "🌱 New Family"} · {new Date(row.created_at).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors" style={{ color: colors.textTertiary }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Status */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: colors.textTertiary }}>Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => {
                const st = statusStyles[s] ?? statusStyles["new"];
                return (
                  <button
                    key={s}
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange(s)}
                    className="px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer"
                    style={{
                      backgroundColor: row.status === s ? st.bg : "transparent",
                      color: row.status === s ? st.color : colors.textTertiary,
                      borderColor: row.status === s ? st.border : colors.border,
                    }}
                  >
                    {s.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Child & Contact */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Child Name" value={childName} />
            <Field label="Age" value={isEnrolled ? row.friend_child_age : row.child_age} />
            <Field label={isEnrolled ? "Friend's Parent" : "Parent / Guardian"} value={guardianName} />
            <Field label="Email" value={contactEmail} />
            {(isEnrolled ? row.friend_parent_phone : row.phone) && (
              <Field label="Phone" value={isEnrolled ? row.friend_parent_phone : row.phone} />
            )}
          </div>

          {/* Enrolled-only fields */}
          {isEnrolled && (
            <div className="rounded-lg px-4 py-3 space-y-3" style={{ backgroundColor: colors.elevated, border: `1px solid ${colors.border}` }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Enrolled Family</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Enrolled Parent" value={row.enrolled_parent_name} />
                <Field label="Enrolled Child" value={row.enrolled_child_name} />
              </div>
            </div>
          )}

          {/* New family — referral + enrollment interest */}
          {!isEnrolled && (
            <div className="grid grid-cols-2 gap-4">
              {row.referral_source && <Field label="How They Heard" value={row.referral_source.replace(/_/g, " ")} />}
              <Field label="Interested in Enrollment" value={row.interested_in_enrollment ? "✅ Yes" : "No"} />
            </div>
          )}

          {/* Consents */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Photo Consent"
              value={(isEnrolled ? row.track_a_photo_consent : row.consent_photo) ? "✅ Authorized" : "❌ Not authorized"}
            />
            {!isEnrolled && (
              <Field
                label="Outdoor Activity Consent"
                value={row.consent_outdoor ? "✅ Given" : "❌ Not given"}
              />
            )}
          </div>

          {/* Emergency contact */}
          {(isEnrolled ? row.track_a_emergency_name : row.emergency_name) && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: colors.textTertiary }}>Emergency Contact</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name" value={isEnrolled ? row.track_a_emergency_name : row.emergency_name} />
                <Field label="Phone" value={isEnrolled ? row.track_a_emergency_phone : row.emergency_phone} />
              </div>
            </div>
          )}

          {/* Notes from parent */}
          {(isEnrolled ? row.track_a_notes : row.notes) && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: colors.textTertiary }}>Parent Notes</p>
              <p className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
                {isEnrolled ? row.track_a_notes : row.notes}
              </p>
            </div>
          )}

          {/* Agreement */}
          <div className="flex items-center gap-2">
            {row.agreement_signed
              ? <CheckCircle className="w-4 h-4" style={{ color: colors.success }} />
              : <span className="text-xs" style={{ color: colors.warning }}>⚠</span>}
            <span className="text-xs" style={{ color: row.agreement_signed ? colors.success : colors.warning }}>
              {row.agreement_signed
                ? `Shadow Day Agreement signed${row.signature_name ? ` by ${row.signature_name}` : ""}`
                : "Agreement not signed"}
            </span>
          </div>

          {/* Outreach */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: colors.textTertiary }}>Outreach</p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSendConfirmation}
                disabled={confirmSending || confirmSent || !contactEmail}
                className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#2C5F2E' }}
              >
                {confirmSending ? 'Sending…' : confirmSent ? '✓ Sent!' : 'Send Attendance Confirmation'}
              </button>
              {confirmError && <span className="text-xs" style={{ color: colors.error }}>{confirmError}</span>}
            </div>
            {!contactEmail && (
              <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>No email on file</p>
            )}
          </div>

          {/* Admin notes */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: colors.textTertiary }}>Admin Notes</p>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
              rows={4}
              placeholder="Internal notes…"
              className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none transition-colors"
              style={{
                backgroundColor: colors.elevated,
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
              }}
            />
            <div className="flex items-center justify-between mt-2">
              {notesSaved && (
                <span className="text-xs" style={{ color: colors.success }}>Saved</span>
              )}
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                style={{ backgroundColor: colors.accentLight, color: colors.accent }}
              >
                {savingNotes ? "Saving…" : "Save notes"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${colors.border}` }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            style={{ backgroundColor: colors.errorBg, color: colors.error, border: `1px solid ${colors.errorBorder}` }}
          >
            {deleting ? "Removing…" : "Remove registration"}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
