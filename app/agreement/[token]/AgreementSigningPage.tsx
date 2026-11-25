"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pill, btnPop, fieldInput, fieldLabel } from "@/app/_garden/ui";
import { useToast } from "@/app/_garden/toast";
import { CheckIcon, Spinner } from "@/app/parent/_garden/ui";
import { submitContractorAgreement } from "@/app/actions/contractorAgreements";
import {
  buildValues,
  formatDate,
  formatRate,
  formatRole,
  getTemplate,
  parseTemplate,
  type AgreementSection,
} from "@/app/lib/contractor-agreement/content";
import type { PublicAgreement, SectionSignature, SectionSignatureMap } from "@/app/lib/contractor-agreement/types";
import ContractorSignatureBlock from "./ContractorSignatureBlock";

type Details = { name: string; email: string; phone: string; address: string };
type Draft = { details: Details; sigs: SectionSignatureMap; final?: SectionSignature; consent: boolean };

const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

async function celebrate() {
  if (prefersReducedMotion()) return;
  const confetti = (await import("canvas-confetti")).default;
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 }, colors: ["#f29a8f", "#ffe58a", "#cdeed5", "#cfe6fb", "#e8d8f1"] });
}

// ─── Text rendering with filled blanks ───────────────────────────────────────

const HINTS: Record<string, string> = {
  contractor_name: "your name",
  contractor_address: "your address",
  signer_email: "your email",
  contractor_phone: "your phone",
};

function TermText({ text, values }: { text: string; values: Record<string, string | null> }) {
  return (
    <>
      {parseTemplate(text, values).map((p, i) => {
        if (p.kind === "text") return p.bold ? <strong key={i} className="font-extrabold text-[var(--sf-ink)]">{p.text}</strong> : <span key={i}>{p.text}</span>;
        if (p.value)
          return (
            <span key={i} className="font-extrabold text-[var(--sf-ink)] [box-decoration-break:clone] bg-[linear-gradient(transparent_55%,var(--sf-butter)_55%)]">
              {p.value}
            </span>
          );
        return (
          <span key={i} className="mx-0.5 rounded-md border border-dashed border-[var(--sf-coral-deep)]/50 px-1.5 text-sm font-bold text-[var(--sf-coral-deep)]">
            {HINTS[p.key] ?? "to be filled in"}
          </span>
        );
      })}
    </>
  );
}

function SectionText({ section, values }: { section: AgreementSection; values: Record<string, string | null> }) {
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-[var(--sf-soft)] sm:text-base">
      {section.paragraphs?.map((p, i) => (
        <p key={`p${i}`} className={p === "{{role_checkboxes}}" ? "whitespace-pre-wrap" : undefined}>
          <TermText text={p} values={values} />
        </p>
      ))}
      {section.bullets ? (
        <ul className="space-y-2">
          {section.bullets.map((b, i) => (
            <li key={i} className="flex gap-2.5">
              <span aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--sf-sage)]">
                {section.checklist ? "☐" : "•"}
              </span>
              <span>
                <TermText text={b} values={values} />
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {section.afterBullets?.map((p, i) => (
        <p key={`a${i}`}>
          <TermText text={p} values={values} />
        </p>
      ))}
    </div>
  );
}

// ─── Chrome ──────────────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="mx-auto flex max-w-3xl items-center gap-3 px-5 pt-6 sm:px-8">
      <Link href="/" className="flex items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-mint)]">
        <Image src="/assets/Logo.png" alt="" width={36} height={36} />
        <span className="sf-display text-xl text-[var(--sf-ink)]">Sage Field</span>
      </Link>
    </header>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--sf-cream)] pb-24">
      <Header />
      <main className="mx-auto max-w-3xl px-5 sm:px-8">{children}</main>
    </div>
  );
}

function StatusCard({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-12 rounded-[32px] bg-white px-6 py-10 text-center shadow-[0_20px_50px_-30px_rgba(43,42,38,0.5)] sm:px-10">
      <p className="text-5xl" aria-hidden="true">
        {emoji}
      </p>
      <h1 className="sf-display mt-4 text-3xl text-[var(--sf-ink)] sm:text-5xl">{title}</h1>
      <div className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[var(--sf-soft)]">{children}</div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const draftKey = (token: string) => `sf-contractor-agreement:${token}`;

function readDraft(token: string): Partial<Draft> {
  try {
    const raw = localStorage.getItem(draftKey(token));
    return raw ? (JSON.parse(raw) as Partial<Draft>) : {};
  } catch {
    return {};
  }
}

const noopSubscribe = () => () => {};

/**
 * The signing flow restores a draft from localStorage, so it renders on the
 * client only (this is a private, noindex page — no SEO cost).
 */
export default function AgreementSigningPage({ agreement, token }: { agreement: PublicAgreement; token: string }) {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!isClient) {
    return (
      <Shell>
        <div className="mt-12 h-64 animate-pulse rounded-[32px] bg-white/70" aria-hidden="true" />
      </Shell>
    );
  }
  return <SigningFlow agreement={agreement} token={token} />;
}

function SigningFlow({ agreement, token }: { agreement: PublicAgreement; token: string }) {
  const router = useRouter();
  const toast = useToast();
  const template = getTemplate(agreement.template_version);
  const sectionIds = useMemo(() => template.sections.map((s) => s.id), [template]);
  const storageKey = draftKey(token);
  const [draft] = useState(() => readDraft(token));

  const [details, setDetails] = useState<Details>(() => ({
    name: agreement.contractor_name ?? "",
    email: agreement.contractor_email ?? "",
    phone: "",
    address: "",
    ...draft.details,
  }));
  const [sigs, setSigs] = useState<SectionSignatureMap>(draft.sigs ?? {});
  const [finalSig, setFinalSig] = useState<SectionSignature | undefined>(draft.final);
  const [consent, setConsent] = useState(Boolean(draft.consent));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [justSigned, setJustSigned] = useState(false);

  useEffect(() => {
    if (justSigned) return;
    try {
      const d: Draft = { details, sigs, final: finalSig, consent };
      localStorage.setItem(storageKey, JSON.stringify(d));
    } catch {
      /* storage full / private mode */
    }
  }, [details, sigs, finalSig, consent, storageKey, justSigned]);

  const values = useMemo(
    () =>
      buildValues({
        ...agreement,
        contractor_name: details.name || agreement.contractor_name,
        contractor_address: details.address || null,
        contractor_phone: details.phone || null,
        signer_email: details.email || null,
      }),
    [agreement, details],
  );

  const detailsMissing = [
    !details.name.trim() && "your legal name",
    !/^\S+@\S+\.\S+$/.test(details.email.trim()) && "a valid email",
    details.phone.replace(/\D/g, "").length < 7 && "your phone",
    details.address.trim().length < 5 && "your address",
  ].filter(Boolean) as string[];
  const detailsOk = detailsMissing.length === 0;
  const disabledReason = details.name.trim() ? null : "Fill in your legal name in “Your details” first.";

  const signedCount = sectionIds.filter((id) => sigs[String(id)]).length;
  const allSectionsSigned = signedCount === sectionIds.length;
  const canSubmit = detailsOk && allSectionsSigned && Boolean(finalSig) && consent && !submitting;

  const scrollTo = useCallback((elId: string) => {
    document.getElementById(elId)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  }, []);

  const changeName = (name: string) => {
    const hadSigs = Object.keys(sigs).length > 0 || finalSig;
    setDetails((d) => ({ ...d, name }));
    // Signatures copy the printed name, so changing it un-signs (same as parent contracts).
    if (hadSigs && norm(name) !== norm(details.name)) {
      setSigs({});
      setFinalSig(undefined);
      toast.show({ tone: "info", title: "Name changed", message: "Please re-sign each section with your new name." });
    }
  };

  const saveSection = (id: number, sig: SectionSignature) => {
    const next = { ...sigs, [String(id)]: sig };
    setSigs(next);
    toast.show({ tone: "success", title: `Signed · Section ${id}` });
    const nextUnsigned = sectionIds.find((sid) => !next[String(sid)]);
    window.setTimeout(() => scrollTo(nextUnsigned ? `sec-${nextUnsigned}` : "sec-final"), 120);
  };

  const submit = async () => {
    if (!finalSig) return;
    setSubmitError(null);
    setSubmitting(true);
    const res = await submitContractorAgreement({
      token,
      contractor_address: details.address,
      contractor_phone: details.phone,
      signer_email: details.email,
      section_signatures: sigs,
      final_printed_name: finalSig.printed_name,
      final_signature: finalSig.signature,
      esign_consent: consent as true,
    });
    setSubmitting(false);
    if (!res.ok) {
      setSubmitError(res.error);
      toast.show({ tone: "error", title: "Couldn't submit", message: res.error });
      return;
    }
    setJustSigned(true);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    void celebrate();
    router.refresh();
  };

  // ── Terminal states ──
  if (agreement.status === "voided") {
    return (
      <Shell>
        <StatusCard emoji="🍂" title="This link is no longer active">
          This agreement was withdrawn. Please reach out to the School if you were expecting to sign it.
        </StatusCard>
      </Shell>
    );
  }

  if (justSigned || agreement.status === "signed" || agreement.status === "countersigned") {
    const fully = agreement.status === "countersigned";
    const signedAt = agreement.signed_at ?? new Date().toISOString();
    return (
      <Shell>
        <StatusCard emoji={fully ? "🌳" : "🌱"} title={fully ? "All signed!" : "Thank you — you're signed!"}>
          <p>
            You signed on {formatDate(signedAt.slice(0, 10))}.{" "}
            {fully ? "The School has countersigned, so your agreement is fully executed." : "The School will countersign next. We've let them know."}
          </p>
          <p className="mt-6">
            <Link href={`/agreement/${token}/print`} className={btnPop}>
              📄 View &amp; download your copy
            </Link>
          </p>
        </StatusCard>
      </Shell>
    );
  }

  // ── Signing flow ──
  const role = formatRole(agreement);
  const rate = formatRate(agreement);
  const start = formatDate(agreement.start_date);

  return (
    <Shell>
      {/* Hero */}
      <section className="pt-10 sm:pt-14">
        <Pill tint="sage">📝 Contractor agreement</Pill>
        <h1 className="sf-display mt-5 text-[2.5rem] leading-[1.02] text-[var(--sf-ink)] sm:text-6xl">{template.title}</h1>
        <p className="sf-hand mt-3 text-2xl text-[var(--sf-sage-deep)]">prepared for {agreement.contractor_name} 🌱</p>

        <div
          className="relative mt-8 rounded-[28px] bg-[var(--sf-butter)] px-6 py-6 shadow-[0_20px_50px_-30px_rgba(43,42,38,0.5)] sm:px-8"
          style={{ rotate: "-1deg" }}
        >
          <span aria-hidden="true" className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-3 rounded-sm bg-[var(--sf-mint)]/90" />
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            {[
              ["Role", role],
              ["Start date", start],
              ["Rate", rate],
              ["Effective", formatDate(agreement.effective_date)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-extrabold uppercase tracking-wide text-[#7a5b00]">{k}</dt>
                <dd className="mt-0.5 font-extrabold text-[var(--sf-ink)]">{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-8 space-y-3 text-lg leading-relaxed text-[var(--sf-soft)]">
          {template.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <ol className="mt-6 space-y-1.5 text-[15px] font-bold text-[var(--sf-ink)]">
          <li>1. Fill in your details</li>
          <li>2. Read and sign each section ({sectionIds.length})</li>
          <li>3. Sign the agreement and submit</li>
        </ol>
        <p className="sf-hand mt-2 text-lg text-[var(--sf-soft)]">your progress saves on this device as you go</p>
      </section>

      {/* Step 1 */}
      <section id="details" className="mt-12 scroll-mt-28 rounded-[32px] bg-white p-5 shadow-[0_20px_50px_-30px_rgba(43,42,38,0.5)] sm:p-8">
        <p className="sf-hand text-xl text-[var(--sf-coral-deep)]">step 1</p>
        <h2 className="sf-display text-3xl text-[var(--sf-ink)] sm:text-4xl">Your details</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="ca-name" className={fieldLabel}>
              Full legal name
            </label>
            <input id="ca-name" className={fieldInput} autoComplete="name" value={details.name} onChange={(e) => changeName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="ca-email" className={fieldLabel}>
              Email
            </label>
            <input
              id="ca-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              className={fieldInput}
              value={details.email}
              onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="ca-phone" className={fieldLabel}>
              Phone
            </label>
            <input
              id="ca-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className={fieldInput}
              value={details.phone}
              onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ca-address" className={fieldLabel}>
              Address
            </label>
            <textarea
              id="ca-address"
              rows={2}
              autoComplete="street-address"
              className={`${fieldInput} resize-none`}
              value={details.address}
              onChange={(e) => setDetails((d) => ({ ...d, address: e.target.value }))}
            />
          </div>
        </div>
      </section>

      {/* Step 2 — sticky progress chips */}
      <div className="sticky top-0 z-20 -mx-5 mt-12 border-b border-[var(--sf-ink)]/10 bg-[var(--sf-cream)]/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-extrabold text-[var(--sf-ink)]">
            Step 2 · {signedCount} of {sectionIds.length} signed
          </p>
          <div className="h-2 w-28 overflow-hidden rounded-full bg-[var(--sf-ink)]/10" aria-hidden="true">
            <div className="h-full rounded-full bg-[var(--sf-sage)] transition-[width] duration-500" style={{ width: `${(signedCount / sectionIds.length) * 100}%` }} />
          </div>
        </div>
        <nav aria-label="Jump to section" className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          {sectionIds.map((id) => {
            const done = Boolean(sigs[String(id)]);
            return (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(`sec-${id}`)}
                aria-label={`Section ${id}${done ? ", signed" : ""}`}
                className={`flex h-10 min-w-10 shrink-0 cursor-pointer items-center justify-center rounded-full px-2 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] ${
                  done ? "bg-[var(--sf-sage)] text-white" : "bg-white text-[var(--sf-ink)] ring-1 ring-[var(--sf-ink)]/15 hover:ring-[var(--sf-sage)]"
                }`}
              >
                {done ? <CheckIcon className="h-3.5 w-3.5" /> : id}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => scrollTo("sec-final")}
            className={`flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-full px-3 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] ${
              finalSig ? "bg-[var(--sf-coral)] text-white" : "bg-white text-[var(--sf-ink)] ring-1 ring-[var(--sf-ink)]/15"
            }`}
          >
            Sign ✍️
          </button>
        </nav>
      </div>

      <div className="mt-6 space-y-6">
        {template.sections.map((s) => (
          <section
            key={s.id}
            id={`sec-${s.id}`}
            aria-labelledby={`sec-${s.id}-h`}
            className="scroll-mt-32 rounded-[28px] bg-white p-5 shadow-[0_20px_50px_-30px_rgba(43,42,38,0.5)] sm:p-8"
          >
            <h2 id={`sec-${s.id}-h`} className="sf-display mb-4 flex items-baseline gap-3 text-2xl text-[var(--sf-ink)] sm:text-3xl">
              <span className="text-[var(--sf-coral-deep)]">{s.id}.</span>
              {s.title}
            </h2>
            <SectionText section={s} values={values} />
            <ContractorSignatureBlock
              legalName={details.name}
              existingSig={sigs[String(s.id)]}
              disabledReason={disabledReason}
              onSave={(sig) => saveSection(s.id, sig)}
              onClear={() =>
                setSigs((cur) => {
                  const next = { ...cur };
                  delete next[String(s.id)];
                  return next;
                })
              }
            />
          </section>
        ))}

        {/* Exhibit A */}
        <section aria-labelledby="exhibit-h" className="rounded-[28px] bg-[var(--sf-sky)]/45 p-5 sm:p-8">
          <h2 id="exhibit-h" className="sf-display text-2xl text-[var(--sf-ink)] sm:text-3xl">
            {template.exhibitA.title}
          </h2>
          <dl className="mt-5 divide-y divide-[var(--sf-ink)]/10 rounded-[20px] bg-white">
            {template.exhibitA.rows.map((r) => (
              <div key={r.key} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
                <dt className="text-sm font-extrabold text-[var(--sf-ink)]">{r.label}</dt>
                <dd className="whitespace-pre-wrap text-[15px] text-[var(--sf-soft)]">{agreement.exhibit_a?.[r.key] || "—"}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Step 3 */}
        <section id="sec-final" aria-labelledby="final-h" className="scroll-mt-32 rounded-[32px] bg-white p-5 shadow-[0_30px_60px_-35px_rgba(43,42,38,0.5)] ring-2 ring-[var(--sf-coral)]/40 sm:p-8">
          <p className="sf-hand text-xl text-[var(--sf-coral-deep)]">step 3</p>
          <h2 id="final-h" className="sf-display text-3xl text-[var(--sf-ink)] sm:text-4xl">
            18. Signatures
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--sf-soft)] sm:text-base">{template.signatureIntro}</p>

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[20px] bg-[var(--sf-mint)]/40 p-4">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[var(--sf-sage)]"
            />
            <span className="text-[15px] font-bold leading-snug text-[var(--sf-ink)]">
              I agree to sign this Agreement electronically. My typed signature has the same effect as a handwritten signature.
            </span>
          </label>

          <ContractorSignatureBlock
            legalName={details.name}
            existingSig={finalSig}
            title="Contractor signature"
            saveLabel="Add signature"
            disabledReason={disabledReason}
            onSave={(sig) => {
              setFinalSig(sig);
              toast.show({ tone: "success", title: "Signature added" });
            }}
            onClear={() => setFinalSig(undefined)}
          />

          {!canSubmit && !submitting ? (
            <ul className="mt-5 space-y-1 text-sm font-bold text-[var(--sf-soft)]">
              {!detailsOk ? (
                <li>
                  •{" "}
                  <button type="button" onClick={() => scrollTo("details")} className="cursor-pointer underline underline-offset-4">
                    Add {detailsMissing.join(", ")}
                  </button>
                </li>
              ) : null}
              {!allSectionsSigned ? (
                <li>
                  •{" "}
                  <button
                    type="button"
                    onClick={() => scrollTo(`sec-${sectionIds.find((id) => !sigs[String(id)])}`)}
                    className="cursor-pointer underline underline-offset-4"
                  >
                    Sign {sectionIds.length - signedCount} more section{sectionIds.length - signedCount === 1 ? "" : "s"}
                  </button>
                </li>
              ) : null}
              {!consent ? <li>• Tick the e-signature box</li> : null}
              {!finalSig ? <li>• Add your signature above</li> : null}
            </ul>
          ) : null}

          {submitError ? (
            <p role="alert" className="mt-4 rounded-[16px] bg-[var(--sf-coral)]/15 px-4 py-3 text-sm font-bold text-[var(--sf-coral-deep)]">
              {submitError}
            </p>
          ) : null}

          <button type="button" onClick={() => void submit()} disabled={!canSubmit} aria-busy={submitting || undefined} className={`${btnPop} mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto`}>
            {submitting ? <Spinner /> : null}
            {submitting ? "Submitting…" : "Submit signed agreement"}
          </button>
        </section>
      </div>
    </Shell>
  );
}
