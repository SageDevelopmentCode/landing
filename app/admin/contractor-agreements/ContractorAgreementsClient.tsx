"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dancing_Script } from "next/font/google";
import { Check, Copy, ExternalLink, FileText, Plus } from "lucide-react";
import { cssColors as colors, radius } from "../design-system";
import { Table, TableCell, TableRow } from "../components/Table";
import { DetailSidebar } from "../components/DetailSidebar";
import {
  countersignContractorAgreement,
  createContractorAgreement,
  deleteContractorAgreement,
  updateContractorAgreementTerms,
  voidContractorAgreement,
} from "@/app/actions/contractorAgreements";
import { EDUCATOR_AGREEMENT_V1, formatDate, formatRate, formatRole } from "@/app/lib/contractor-agreement/content";
import {
  CONTRACTOR_ROLES,
  INVOICE_PERIODS,
  RATE_UNITS,
  ROLE_LABELS,
  STATUS_LABELS,
  type AgreementStatus,
  type AgreementTermsInput,
  type ContractorAgreement,
  type ExhibitAKey,
} from "@/app/lib/contractor-agreement/types";

const dancingScript = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing-script" });
const script = { fontFamily: "var(--font-dancing-script)" } as const;

type Filter = "all" | "open" | "signed" | "countersigned" | "voided";
const FILTERS: { key: Filter; label: string; match: (s: AgreementStatus) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "open", label: "Awaiting teacher", match: (s) => s === "sent" || s === "viewed" || s === "draft" },
  { key: "signed", label: "Needs countersign", match: (s) => s === "signed" },
  { key: "countersigned", label: "Fully executed", match: (s) => s === "countersigned" },
  { key: "voided", label: "Voided", match: (s) => s === "voided" },
];

const STATUS_STYLE: Record<AgreementStatus, { bg: string; fg: string }> = {
  draft: { bg: colors.elevated, fg: colors.textTertiary },
  sent: { bg: colors.infoBg, fg: colors.info },
  viewed: { bg: colors.purpleBg, fg: colors.purple },
  signed: { bg: colors.warningBg, fg: colors.warning },
  countersigned: { bg: colors.successBg, fg: colors.success },
  voided: { bg: colors.errorBg, fg: colors.error },
};

const fmtDT = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";
const fmtD = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");
const linkFor = (token: string) => (typeof window === "undefined" ? `/agreement/${token}` : `${window.location.origin}/agreement/${token}`);

function StatusChip({ status }: { status: AgreementStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: s.bg, color: s.fg }}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── Shared admin form bits ──────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  fontSize: 13,
  borderRadius: radius.md,
  border: `1px solid ${colors.border}`,
  background: colors.surface,
  color: colors.textPrimary,
};

function Field({ label, hint, children, span2 }: { label: string; hint?: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <label className={`block ${span2 ? "col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-semibold" style={{ color: colors.textSecondary }}>
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[11px]" style={{ color: colors.textTertiary }}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function Btn({
  children,
  onClick,
  variant = "secondary",
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const v =
    variant === "primary"
      ? { background: colors.accent, color: "#fff", border: "none" }
      : variant === "danger"
        ? { background: colors.surface, color: colors.error, border: `1px solid ${colors.errorBorder}` }
        : { background: colors.surface, color: colors.textPrimary, border: `1px solid ${colors.border}` };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex cursor-pointer items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
      style={{ ...v, borderRadius: radius.md }}
    >
      {children}
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide first:mt-0" style={{ color: colors.textTertiary }}>
      {children}
    </h3>
  );
}

function CopyLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const url = linkFor(token);
  return (
    <div className="flex items-center gap-2">
      <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} style={{ ...inputStyle, fontFamily: "monospace", fontSize: 11 }} />
      <Btn
        variant="primary"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        }}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </Btn>
    </div>
  );
}

// ─── Terms form (create / edit) ──────────────────────────────────────────────

type FormState = {
  contractor_name: string;
  contractor_email: string;
  role: (typeof CONTRACTOR_ROLES)[number];
  role_other: string;
  effective_date: string;
  start_date: string;
  end_date_text: string;
  rate_amount: string;
  rate_unit: string;
  invoice_due_text: string;
  invoice_period: string;
  payment_days: string;
  absence_notice_hours: string;
  time_off_notice_days: string;
  termination_notice_days: string;
  second_contact: string;
  exhibit_a: Partial<Record<ExhibitAKey, string>>;
};

const emptyForm = (): FormState => ({
  contractor_name: "",
  contractor_email: "",
  role: "lead_teacher",
  role_other: "",
  effective_date: "",
  start_date: "",
  end_date_text: "",
  rate_amount: "",
  rate_unit: "hour",
  invoice_due_text: "",
  invoice_period: "month",
  payment_days: "",
  absence_notice_hours: "",
  time_off_notice_days: "",
  termination_notice_days: "",
  second_contact: "",
  exhibit_a: {},
});

const fromAgreement = (a: ContractorAgreement): FormState => ({
  contractor_name: a.contractor_name,
  contractor_email: a.contractor_email ?? "",
  role: a.role,
  role_other: a.role_other ?? "",
  effective_date: a.effective_date ?? "",
  start_date: a.start_date ?? "",
  end_date_text: a.end_date_text ?? "",
  rate_amount: a.rate_amount == null ? "" : String(a.rate_amount),
  rate_unit: a.rate_unit ?? "",
  invoice_due_text: a.invoice_due_text ?? "",
  invoice_period: a.invoice_period ?? "",
  payment_days: a.payment_days == null ? "" : String(a.payment_days),
  absence_notice_hours: a.absence_notice_hours == null ? "" : String(a.absence_notice_hours),
  time_off_notice_days: a.time_off_notice_days == null ? "" : String(a.time_off_notice_days),
  termination_notice_days: a.termination_notice_days == null ? "" : String(a.termination_notice_days),
  second_contact: a.second_contact ?? "",
  exhibit_a: a.exhibit_a ?? {},
});

const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));
const intOrNull = (s: string) => (s.trim() === "" ? null : Math.round(Number(s)));

function toInput(f: FormState): AgreementTermsInput {
  const exhibit = Object.fromEntries(Object.entries(f.exhibit_a).filter(([, v]) => v && v.trim())) as Record<ExhibitAKey, string>;
  return {
    contractor_name: f.contractor_name,
    contractor_email: f.contractor_email || null,
    role: f.role,
    role_other: f.role === "other" ? f.role_other || null : null,
    effective_date: f.effective_date || null,
    start_date: f.start_date || null,
    end_date_text: f.end_date_text || null,
    rate_amount: numOrNull(f.rate_amount),
    rate_unit: (f.rate_unit || null) as AgreementTermsInput["rate_unit"],
    invoice_due_text: f.invoice_due_text || null,
    invoice_period: (f.invoice_period || null) as AgreementTermsInput["invoice_period"],
    payment_days: intOrNull(f.payment_days),
    absence_notice_hours: intOrNull(f.absence_notice_hours),
    time_off_notice_days: intOrNull(f.time_off_notice_days),
    termination_notice_days: intOrNull(f.termination_notice_days),
    second_contact: f.second_contact || null,
    exhibit_a: exhibit,
  };
}

function TermsForm({
  initial,
  onSubmit,
  submitLabel,
  busy,
  error,
}: {
  initial: FormState;
  onSubmit: (f: FormState) => void;
  submitLabel: string;
  busy: boolean;
  error: string | null;
}) {
  const [f, setF] = useState<FormState>(initial);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((cur) => ({ ...cur, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(f);
      }}
      className="space-y-1"
    >
      <SectionTitle>Teacher</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name *" span2>
          <input required style={inputStyle} value={f.contractor_name} onChange={(e) => set("contractor_name", e.target.value)} />
        </Field>
        <Field label="Email" hint="For your records. The teacher confirms it when signing." span2>
          <input type="email" style={inputStyle} value={f.contractor_email} onChange={(e) => set("contractor_email", e.target.value)} />
        </Field>
      </div>

      <SectionTitle>§1–3 Role &amp; term</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Role *">
          <select style={inputStyle} value={f.role} onChange={(e) => set("role", e.target.value as FormState["role"])}>
            {CONTRACTOR_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Other role">
          <input style={inputStyle} disabled={f.role !== "other"} value={f.role_other} onChange={(e) => set("role_other", e.target.value)} />
        </Field>
        <Field label="Effective date">
          <input type="date" style={inputStyle} value={f.effective_date} onChange={(e) => set("effective_date", e.target.value)} />
        </Field>
        <Field label="Start date">
          <input type="date" style={inputStyle} value={f.start_date} onChange={(e) => set("start_date", e.target.value)} />
        </Field>
        <Field label="End date" hint="e.g. the last day of the 2026-2027 school year, or ongoing until ended under Section 16" span2>
          <input style={inputStyle} value={f.end_date_text} onChange={(e) => set("end_date_text", e.target.value)} />
        </Field>
      </div>

      <SectionTitle>§5 Payment</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Rate ($)">
          <input type="number" min={0} step="0.01" style={inputStyle} value={f.rate_amount} onChange={(e) => set("rate_amount", e.target.value)} />
        </Field>
        <Field label="Per">
          <select style={inputStyle} value={f.rate_unit} onChange={(e) => set("rate_unit", e.target.value)}>
            <option value="">—</option>
            {RATE_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Invoice due on or before" hint='e.g. "the 1st"'>
          <input style={inputStyle} value={f.invoice_due_text} onChange={(e) => set("invoice_due_text", e.target.value)} />
        </Field>
        <Field label="Each">
          <select style={inputStyle} value={f.invoice_period} onChange={(e) => set("invoice_period", e.target.value)}>
            <option value="">—</option>
            {INVOICE_PERIODS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Pay within (days)">
          <input type="number" min={0} style={inputStyle} value={f.payment_days} onChange={(e) => set("payment_days", e.target.value)} />
        </Field>
      </div>

      <SectionTitle>§14–16 Notice &amp; contacts</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Planned absence notice (hours)">
          <input type="number" min={0} style={inputStyle} value={f.absence_notice_hours} onChange={(e) => set("absence_notice_hours", e.target.value)} />
        </Field>
        <Field label="Time-off notice (days)">
          <input type="number" min={0} style={inputStyle} value={f.time_off_notice_days} onChange={(e) => set("time_off_notice_days", e.target.value)} />
        </Field>
        <Field label="Second point of contact (§15)">
          <input style={inputStyle} value={f.second_contact} onChange={(e) => set("second_contact", e.target.value)} />
        </Field>
        <Field label="Termination notice (days, §16)">
          <input type="number" min={0} style={inputStyle} value={f.termination_notice_days} onChange={(e) => set("termination_notice_days", e.target.value)} />
        </Field>
      </div>

      <SectionTitle>Exhibit A</SectionTitle>
      <div className="space-y-3">
        {EDUCATOR_AGREEMENT_V1.exhibitA.rows.map((r) => (
          <Field key={r.key} label={r.label}>
            <textarea
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
              value={f.exhibit_a[r.key] ?? ""}
              onChange={(e) => set("exhibit_a", { ...f.exhibit_a, [r.key]: e.target.value })}
            />
          </Field>
        ))}
      </div>

      {error ? (
        <p className="mt-3 rounded px-3 py-2 text-xs font-semibold" style={{ background: colors.errorBg, color: colors.error }}>
          {error}
        </p>
      ) : null}
      <div className="pt-4">
        <Btn type="submit" variant="primary" disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </Btn>
      </div>
    </form>
  );
}

// ─── Countersign ─────────────────────────────────────────────────────────────

function CountersignForm({ agreement, onDone }: { agreement: ContractorAgreement; onDone: (a: ContractorAgreement) => void }) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("Director");
  const [signature, setSignature] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={`${dancingScript.variable} space-y-3 rounded-lg p-4`} style={{ background: colors.warningBg, border: `1px solid ${colors.warningBorder}` }}>
      <p className="text-xs font-semibold" style={{ color: colors.warning }}>
        Countersign as the School representative (§18)
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Printed name">
          <input
            style={inputStyle}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (signature) setSignature("");
            }}
          />
        </Field>
        <Field label="Title">
          <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
      </div>
      {signature ? (
        <div className="flex items-center justify-between rounded-md px-3 py-1" style={{ border: `2px dashed ${colors.accent}`, background: colors.surface }}>
          <span className="text-3xl" style={{ ...script, color: colors.textPrimary }}>
            {signature}
          </span>
          <button type="button" className="cursor-pointer text-xs underline" style={{ color: colors.textTertiary }} onClick={() => setSignature("")}>
            Clear
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={!name.trim()}
          onClick={() => setSignature(name.trim())}
          className="w-full cursor-pointer rounded-md px-3 py-3 text-left text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          style={{ border: `2px dashed ${colors.border}`, background: colors.surface, color: colors.accent }}
        >
          ✍️ Click to sign
        </button>
      )}
      {error ? (
        <p className="text-xs font-semibold" style={{ color: colors.error }}>
          {error}
        </p>
      ) : null}
      <Btn
        variant="primary"
        disabled={busy || !signature || !title.trim()}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const res = await countersignContractorAgreement({ id: agreement.id, name, title, signature });
          setBusy(false);
          if (!res.ok) return setError(res.error);
          onDone(res.data);
        }}
      >
        {busy ? "Saving…" : "Countersign agreement"}
      </Btn>
    </div>
  );
}

// ─── Detail ──────────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-xs" style={{ borderBottom: `1px solid ${colors.border}` }}>
      <span style={{ color: colors.textTertiary }}>{label}</span>
      <span className="text-right" style={{ color: colors.textPrimary }}>
        {value || "—"}
      </span>
    </div>
  );
}

function AgreementDetail({
  agreement,
  onChange,
  onRemove,
}: {
  agreement: ContractorAgreement;
  onChange: (a: ContractorAgreement) => void;
  onRemove: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const a = agreement;
  const editable = a.status === "draft" || a.status === "sent" || a.status === "viewed";
  const sigCount = Object.keys(a.section_signatures ?? {}).length;

  if (editing) {
    return (
      <TermsForm
        initial={fromAgreement(a)}
        submitLabel="Save changes"
        busy={busy}
        error={error}
        onSubmit={async (f) => {
          setBusy(true);
          setError(null);
          const res = await updateContractorAgreementTerms(a.id, toInput(f));
          setBusy(false);
          if (!res.ok) return setError(res.error);
          onChange(res.data);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <StatusChip status={a.status} />
        <span className="text-[11px]" style={{ color: colors.textTertiary }}>
          {a.template_version}
        </span>
      </div>

      {a.status !== "voided" ? (
        <div>
          <SectionTitle>Signing link</SectionTitle>
          <CopyLink token={a.token} />
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={`/agreement/${a.token}`} target="_blank" rel="noopener noreferrer">
              <Btn>
                <ExternalLink className="h-3.5 w-3.5" /> Open teacher view
              </Btn>
            </a>
          </div>
        </div>
      ) : null}

      {a.status === "signed" || a.status === "countersigned" ? (
        <div>
          <SectionTitle>Signed agreement</SectionTitle>
          <Link href={`/admin/contractor-agreements/${a.id}/print`} target="_blank">
            <Btn variant="primary">
              <FileText className="h-3.5 w-3.5" /> View / download PDF
            </Btn>
          </Link>
        </div>
      ) : null}

      {a.status === "signed" ? <CountersignForm agreement={a} onDone={onChange} /> : null}

      <div>
        <SectionTitle>Timeline</SectionTitle>
        <Row label="Created" value={fmtDT(a.created_at)} />
        <Row label="Opened by teacher" value={fmtDT(a.viewed_at)} />
        <Row label="Teacher signed" value={fmtDT(a.signed_at)} />
        <Row
          label="School countersigned"
          value={a.countersigned_at ? `${fmtDT(a.countersigned_at)} · ${a.school_signer_name}, ${a.school_signer_title}` : "—"}
        />
        {a.voided_at ? <Row label="Voided" value={fmtDT(a.voided_at)} /> : null}
      </div>

      {a.signed_at ? (
        <div>
          <SectionTitle>Teacher&apos;s submission</SectionTitle>
          <Row label="Signed as" value={<span className={`${dancingScript.variable} text-xl`} style={script}>{a.signed_signature}</span>} />
          <Row label="Printed name" value={a.signed_printed_name} />
          <Row label="Email" value={a.signer_email} />
          <Row label="Phone" value={a.contractor_phone} />
          <Row label="Address" value={a.contractor_address} />
          <Row label="Sections signed" value={`${sigCount} of ${EDUCATOR_AGREEMENT_V1.sections.length}`} />
          <Row label="IP address" value={a.signer_ip} />
        </div>
      ) : null}

      <div>
        <SectionTitle>Terms</SectionTitle>
        <Row label="Teacher" value={a.contractor_name} />
        <Row label="Email" value={a.contractor_email} />
        <Row label="Role" value={formatRole(a)} />
        <Row label="Effective" value={formatDate(a.effective_date)} />
        <Row label="Start" value={formatDate(a.start_date)} />
        <Row label="End" value={a.end_date_text} />
        <Row label="Rate" value={formatRate(a)} />
        <Row
          label="Invoice"
          value={a.invoice_due_text ? `on or before ${a.invoice_due_text} each ${a.invoice_period ?? "—"}; paid within ${a.payment_days ?? "—"} days` : null}
        />
        <Row label="Absence notice" value={a.absence_notice_hours != null ? `${a.absence_notice_hours} hours` : null} />
        <Row label="Time-off notice" value={a.time_off_notice_days != null ? `${a.time_off_notice_days} days` : null} />
        <Row label="Second contact" value={a.second_contact} />
        <Row label="Termination notice" value={a.termination_notice_days != null ? `${a.termination_notice_days} days` : null} />
      </div>

      {error ? (
        <p className="rounded px-3 py-2 text-xs font-semibold" style={{ background: colors.errorBg, color: colors.error }}>
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-2">
        {editable ? <Btn onClick={() => setEditing(true)}>Edit terms</Btn> : null}
        {a.status !== "voided" && a.status !== "countersigned" ? (
          <Btn
            variant="danger"
            disabled={busy}
            onClick={async () => {
              if (!confirm("Void this agreement? The signing link will stop working.")) return;
              setBusy(true);
              const res = await voidContractorAgreement(a.id);
              setBusy(false);
              if (!res.ok) return setError(res.error);
              onChange(res.data);
            }}
          >
            Void
          </Btn>
        ) : null}
        {!a.signed_at ? (
          <Btn
            variant="danger"
            disabled={busy}
            onClick={async () => {
              if (!confirm("Delete this unsigned agreement?")) return;
              setBusy(true);
              const res = await deleteContractorAgreement(a.id);
              setBusy(false);
              if (!res.ok) return setError(res.error);
              onRemove(a.id);
            }}
          >
            Delete
          </Btn>
        ) : null}
      </div>
    </div>
  );
}

// ─── Page client ─────────────────────────────────────────────────────────────

export default function ContractorAgreementsClient({
  initialAgreements,
  initialOpenId,
}: {
  initialAgreements: ContractorAgreement[];
  initialOpenId: string | null;
}) {
  const router = useRouter();
  const [agreements, setAgreements] = useState(initialAgreements);
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(initialOpenId);
  const [creating, setCreating] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const shown = useMemo(() => agreements.filter((a) => FILTERS.find((f) => f.key === filter)!.match(a.status)), [agreements, filter]);
  const open = agreements.find((a) => a.id === openId) ?? null;

  const upsert = (a: ContractorAgreement) => {
    setAgreements((cur) => (cur.some((x) => x.id === a.id) ? cur.map((x) => (x.id === a.id ? a : x)) : [a, ...cur]));
    router.refresh();
  };

  const closeDetail = () => {
    setOpenId(null);
    if (initialOpenId) router.replace("/admin/contractor-agreements", { scroll: false });
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const count = agreements.filter((a) => f.match(a.status)).length;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  background: active ? colors.accentLight : colors.surface,
                  color: active ? colors.accent : colors.textSecondary,
                  border: `1px solid ${active ? colors.accent : colors.border}`,
                }}
              >
                {f.label} · {count}
              </button>
            );
          })}
        </div>
        <Btn
          variant="primary"
          onClick={() => {
            setCreateError(null);
            setFormKey((k) => k + 1);
            setCreating(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" /> New agreement
        </Btn>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-lg px-6 py-12 text-center text-sm" style={{ background: colors.surface, border: `1px dashed ${colors.border}`, color: colors.textTertiary }}>
          {agreements.length === 0 ? "No agreements yet. Create one to get a signing link for a teacher." : "Nothing in this view."}
        </div>
      ) : (
        <Table headers={["Teacher", "Role", "Status", "Start", "Created", "Signed"]}>
          {shown.map((a, i) => (
            <TableRow key={a.id} index={i} onClick={() => setOpenId(a.id)}>
              <TableCell>
                <span className="font-semibold" style={{ color: colors.textPrimary }}>
                  {a.signed_printed_name ?? a.contractor_name}
                </span>
              </TableCell>
              <TableCell>{formatRole(a)}</TableCell>
              <TableCell>
                <StatusChip status={a.status} />
              </TableCell>
              <TableCell>{formatDate(a.start_date) ?? "—"}</TableCell>
              <TableCell>{fmtD(a.created_at)}</TableCell>
              <TableCell>{fmtD(a.signed_at)}</TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      <DetailSidebar isOpen={creating} onClose={() => setCreating(false)} title="New contractor agreement">
        <TermsForm
          key={formKey}
          initial={emptyForm()}
          submitLabel="Create & get link"
          busy={createBusy}
          error={createError}
          onSubmit={async (f) => {
            setCreateBusy(true);
            setCreateError(null);
            const res = await createContractorAgreement(toInput(f));
            setCreateBusy(false);
            if (!res.ok) return setCreateError(res.error);
            upsert(res.data);
            setCreating(false);
            setOpenId(res.data.id);
          }}
        />
      </DetailSidebar>

      <DetailSidebar isOpen={Boolean(open)} onClose={closeDetail} title={open ? open.signed_printed_name ?? open.contractor_name : ""}>
        {open ? (
          <AgreementDetail
            key={open.id}
            agreement={open}
            onChange={upsert}
            onRemove={(id) => {
              setAgreements((cur) => cur.filter((x) => x.id !== id));
              closeDetail();
              router.refresh();
            }}
          />
        ) : null}
      </DetailSidebar>
    </>
  );
}
