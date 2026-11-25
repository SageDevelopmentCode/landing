import Image from "next/image";
import { Dancing_Script } from "next/font/google";
import { buildValues, formatDate, getTemplate, parseTemplate, type AgreementSection } from "./content";
import type { ContractorAgreement, PublicAgreement } from "./types";

const dancingScript = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing-script" });
const script = { fontFamily: "var(--font-dancing-script)" } as const;

function fmtStamp(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "medium",
    timeStyle: "short",
  }) + " CT";
}

function Text({ text, values }: { text: string; values: Record<string, string | null> }) {
  return (
    <>
      {parseTemplate(text, values).map((p, i) =>
        p.kind === "text" ? (
          p.bold ? <strong key={i}>{p.text}</strong> : <span key={i}>{p.text}</span>
        ) : p.value ? (
          <span key={i} className="font-semibold underline decoration-gray-400 underline-offset-2">
            {p.value}
          </span>
        ) : (
          <span key={i}>______________</span>
        ),
      )}
    </>
  );
}

function SectionBody({ section, values }: { section: AgreementSection; values: Record<string, string | null> }) {
  return (
    <>
      {section.paragraphs?.map((p, i) => (
        <p key={`p${i}`} className="mb-2">
          <Text text={p} values={values} />
        </p>
      ))}
      {section.bullets ? (
        <ul className={section.checklist ? "mb-2 space-y-1" : "mb-2 list-disc space-y-1 pl-6"}>
          {section.bullets.map((b, i) => (
            <li key={i}>
              {section.checklist ? "☐ " : null}
              <Text text={b} values={values} />
            </li>
          ))}
        </ul>
      ) : null}
      {section.afterBullets?.map((p, i) => (
        <p key={`a${i}`} className="mb-2">
          <Text text={p} values={values} />
        </p>
      ))}
    </>
  );
}

function SigLine({ label, signature, printed, date }: { label: string; signature?: string | null; printed?: string | null; date?: string | null }) {
  return (
    <div className="summary-signature-block grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-[1fr_auto]">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
        <p className="min-h-[2.25rem] border-b border-gray-400 text-2xl leading-tight text-gray-900" style={script}>
          {signature ?? ""}
        </p>
        <p className="mt-1 text-xs text-gray-600">Printed name: {printed ?? "______________"}</p>
      </div>
      <div className="sm:min-w-[9rem]">
        <p className="text-xs uppercase tracking-wide text-gray-500">Date</p>
        <p className="min-h-[2.25rem] border-b border-gray-400 pt-2 text-sm">{date ?? ""}</p>
      </div>
    </div>
  );
}

/**
 * Print-friendly full agreement: filled terms, per-section signatures,
 * §18 signatures for both parties, Exhibit A and an audit trail.
 */
export default function AgreementDocument({
  agreement,
  showAudit = false,
}: {
  agreement: ContractorAgreement | PublicAgreement;
  /** Admin copy includes IP / user agent. */
  showAudit?: boolean;
}) {
  const t = getTemplate(agreement.template_version);
  const values = buildValues(agreement);
  const sigs = agreement.section_signatures ?? {};
  const full = agreement as Partial<ContractorAgreement>;

  return (
    <article className={`${dancingScript.variable} text-[13.5px] leading-relaxed text-gray-900`}>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="mt-1 font-semibold">{t.subtitle}</p>
        </div>
        <Image src="/assets/Logo.png" alt="Sage Field" width={56} height={56} />
      </header>

      {t.intro.map((p, i) => (
        <p key={i} className="mb-2">
          {p}
        </p>
      ))}

      {t.sections.map((s) => {
        const sig = sigs[String(s.id)];
        return (
          <section key={s.id} className="mt-5">
            <h2 className="mb-2 text-base font-bold">
              {s.id}. {s.title}
            </h2>
            <SectionBody section={s} values={values} />
            <p className="summary-signature-block mt-1 text-xs text-gray-600">
              Contractor signature:{" "}
              {sig ? (
                <>
                  <span className="text-lg text-gray-900" style={script}>
                    {sig.signature}
                  </span>{" "}
                  · {sig.printed_name} · {fmtStamp(sig.signed_at)}
                </>
              ) : (
                "Not signed"
              )}
            </p>
          </section>
        );
      })}

      <section className="mt-6" style={{ breakInside: "avoid" }}>
        <h2 className="mb-2 text-base font-bold">18. Signatures</h2>
        <p className="mb-4">{t.signatureIntro}</p>
        <div className="space-y-5">
          <SigLine
            label="Contractor signature"
            signature={agreement.signed_signature}
            printed={agreement.signed_printed_name}
            date={agreement.signed_at ? formatDate(agreement.signed_at.slice(0, 10)) : null}
          />
          <SigLine
            label="School representative signature"
            signature={agreement.school_signature}
            printed={
              agreement.school_signer_name
                ? `${agreement.school_signer_name}${agreement.school_signer_title ? `, ${agreement.school_signer_title}` : ""}`
                : null
            }
            date={agreement.countersigned_at ? formatDate(agreement.countersigned_at.slice(0, 10)) : null}
          />
        </div>
      </section>

      <section className="mt-8" style={{ breakBefore: "page" }}>
        <h2 className="mb-3 text-base font-bold">{t.exhibitA.title}</h2>
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">Item</th>
              <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">Details</th>
            </tr>
          </thead>
          <tbody>
            {t.exhibitA.rows.map((r) => (
              <tr key={r.key}>
                <td className="w-[45%] border border-gray-400 px-2 py-1.5 align-top">{r.label}</td>
                <td className="whitespace-pre-wrap border border-gray-400 px-2 py-1.5 align-top">{agreement.exhibit_a?.[r.key] ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="mt-8 border-t border-gray-300 pt-3 text-[11px] text-gray-500">
        <p>{t.footer}</p>
        <p className="mt-1">
          Signed electronically. Agreement ID {agreement.id} · Template {agreement.template_version}
          {agreement.signed_at ? ` · Contractor signed ${fmtStamp(agreement.signed_at)}` : ""}
          {agreement.esign_consent_at ? ` · E-sign consent ${fmtStamp(agreement.esign_consent_at)}` : ""}
          {agreement.countersigned_at ? ` · School countersigned ${fmtStamp(agreement.countersigned_at)}` : ""}
        </p>
        {showAudit && (full.signer_ip || full.signer_user_agent) ? (
          <p className="mt-1 break-all">
            Signer IP {full.signer_ip ?? "unknown"} · {full.signer_user_agent ?? ""}
          </p>
        ) : null}
      </footer>
    </article>
  );
}
