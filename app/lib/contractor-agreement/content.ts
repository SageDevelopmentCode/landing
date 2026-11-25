/**
 * Independent Contractor Agreement: Educator — text transcribed word for word
 * from the signed-off PDF. Blanks are `{{key}}` placeholders filled per teacher.
 *
 * NEVER edit a published version in place: signed agreements store their
 * `template_version`. To change wording, add a new version and point
 * CURRENT_TEMPLATE_VERSION at it.
 *
 * Inline `**bold**` is supported in paragraphs and bullets.
 */
import type { ContractorAgreement, ExhibitAKey } from "./types";
import { ROLE_LABELS, CONTRACTOR_ROLES } from "./types";

export interface AgreementSection {
  id: number;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Render bullets as an informational ☐ checklist instead of dots. */
  checklist?: boolean;
  afterBullets?: string[];
}

export interface AgreementTemplate {
  version: string;
  title: string;
  subtitle: string;
  intro: string[];
  sections: AgreementSection[];
  /** §18 lead-in. */
  signatureIntro: string;
  exhibitA: { title: string; rows: { key: ExhibitAKey; label: string }[] };
  footer: string;
}

export const EDUCATOR_AGREEMENT_V1: AgreementTemplate = {
  version: "educator-v1",
  title: "Independent Contractor Agreement: Educator",
  subtitle: "Sage Field Private School",
  intro: [
    "This Agreement sets the terms for an educator who works at Sage Field as an independent contractor.",
    "In consideration of the mutual promises in this Agreement and other good and valuable consideration, the receipt and sufficiency of which both parties acknowledge, the parties agree as follows:",
  ],
  sections: [
    {
      id: 1,
      title: "Parties",
      paragraphs: [
        'This Agreement is between **Sage Field Private School**, operated by Sage Field LLC (the "School"), and {{contractor_name}} (the "Contractor"). It takes effect on {{effective_date}} (the "Effective Date").',
        "Contractor's address: {{contractor_address}} Email: {{signer_email}} Phone: {{contractor_phone}}",
      ],
    },
    {
      id: 2,
      title: "Services",
      paragraphs: [
        "Contractor will provide educational services at the School in the following role:",
        "{{role_checkboxes}}",
        "Services, schedule, and group assignment are listed in Exhibit A. Services will be performed at the School's campus at 2750 County Road 100, Hutto, TX 78634, or at any temporary campus, field trip, or event location the School designates in writing.",
        "Contractor will perform the services faithfully, professionally, and to the standards in this Agreement. The School does not intend to assign duties outside the normal scope of the role selected above. Any change to the role or to Exhibit A must be agreed in writing by both parties.",
      ],
    },
    {
      id: 3,
      title: "Term",
      bullets: [
        "**Start date:** {{start_date}}",
        "**End date:** {{end_date_text}}",
        "Renewal or changes to the term must be in writing and signed by both parties.",
      ],
    },
    {
      id: 4,
      title: "Introductory Period",
      paragraphs: [
        "The first 90 days after the start date are an introductory period. During this period, either party may end this Agreement at any time, for any reason, by giving written notice, without the notice period in Section 16. The School will pay Contractor for services performed through the last day worked.",
      ],
    },
    {
      id: 5,
      title: "Payment",
      bullets: [
        "**Rate:** {{rate}}",
        "Contractor will submit an invoice on or before {{invoice_due_text}} each {{invoice_period}}. The School will pay within {{payment_days}} days of receiving a correct invoice.",
        "Contractor is paid only for services performed. The School does not pay for sick days, holidays, or school closures unless Exhibit A says otherwise.",
        "The School does not withhold taxes. Contractor will provide a completed Form W-9 before the first payment and will receive a Form 1099 as required by law.",
      ],
    },
    {
      id: 6,
      title: "Independent Contractor Relationship",
      bullets: [
        "Contractor is an independent contractor and not an employee of the School. Contractor is not entitled to employee benefits, including health coverage, paid leave, or retirement contributions.",
        "Contractor is responsible for Contractor's own income taxes, self-employment taxes, insurance, and business expenses.",
        "Contractor may work for other clients, as long as that work does not conflict with the schedule in Exhibit A or with Sections 9 and 12.",
        "Contractor may not sign contracts or make commitments on the School's behalf.",
        "Contractor agrees to meet the School's safety, health, and child-protection standards in Section 8. These requirements are not an employment relationship.",
      ],
    },
    {
      id: 7,
      title: "Requirements Before the First Day",
      paragraphs: ["Contractor must complete the following before working with students:"],
      checklist: true,
      bullets: [
        "Background check, with Contractor's written consent, cleared by the School",
        "Copy of current CPR and First Aid certification (required for lead teachers)",
        "Signed Community Agreement for Families and Staff",
        "Signed confidentiality terms in Section 9",
        "Completed Form W-9",
        "Signed acknowledgment of the School's written safety, health, behavior, and media policies",
      ],
      afterBullets: [
        "The School may end this Agreement immediately if any item is not cleared or if information Contractor provided is false.",
      ],
    },
    {
      id: 8,
      title: "Child Safety and Conduct",
      paragraphs: ["Contractor agrees to:"],
      bullets: [
        "Supervise children at all times, including outdoors and at transitions, and follow the School's group sizes and headcount procedures.",
        "Follow the School's written policies on safety, emergencies, health, medication, behavior, and anti-bullying, as given to Contractor and updated by the School with notice.",
        "Never administer medication to a student unless the director has approved it in writing.",
        "Report suspected child abuse or neglect as the law requires, and tell the director promptly unless the director is the subject of the concern.",
        "Treat every child, family, and colleague with respect, and follow the Community Agreement, including its zero-tolerance behaviors.",
        "Use only School-approved devices and accounts to photograph or record students, and follow each child's photo consent level (Full, Limited, or None).",
      ],
    },
    {
      id: 9,
      title: "Confidentiality",
      bullets: [
        'Contractor will keep confidential all non-public information about students, families, and School operations, including health information, tuition and financial aid details, enrollment records, family contact information, curriculum plans, pricing, and internal discussions ("Confidential Information").',
        "Contractor will not share this information except with School leadership, or as the law requires.",
        "Contractor will not post about students, families, or School matters on social media or in online groups.",
        "These duties continue after this Agreement ends.",
      ],
    },
    {
      id: 10,
      title: "School Materials, Work Product, and Social Media",
      paragraphs: [
        "Curriculum, lesson plans, forms, and other materials that Contractor creates for the School as part of the services belong to the School, unless Exhibit A says otherwise. Contractor keeps ownership of Contractor's own pre-existing materials and grants the School permission to use any that Contractor brings into the classroom.",
        "The School owns all School social media accounts, followers, and content, and all family and student contact lists that Contractor accesses or helps build while providing services. Contractor will not copy, transfer, or use these contacts for any purpose other than the School's work, during or after this Agreement.",
      ],
    },
    {
      id: 11,
      title: "Return of School Property",
      paragraphs: [
        "When this Agreement ends for any reason, Contractor will immediately return all School property, including keys, gate codes or access cards, ID badges, devices, curriculum and classroom materials, student work, records, and any School documents in paper or electronic form. Contractor will delete any School files or student information kept on personal devices or accounts and confirm this in writing if the School asks.",
      ],
    },
    {
      id: 12,
      title: "Non-Compete and Non-Solicitation",
      paragraphs: [
        "Contractor acknowledges that while providing services, Contractor will receive the School's Confidential Information, specialized training in its methods, and close relationships with its families. The School provides these in exchange for Contractor's promises in this Section, which are meant to protect the School's goodwill and Confidential Information.",
      ],
      bullets: [
        "**Non-compete:** For one (1) year after this Agreement ends, Contractor will not, within a 100-mile radius of Hutto, Texas, own, operate, or provide educational services to a private school, microschool, learning pod, or homeschool program that serves children ages 4 to 11 and competes with the School.",
        "**Families:** For one (1) year after this Agreement ends, Contractor will not solicit or encourage any family whose child was enrolled at the School during this Agreement to withdraw from the School or to enroll in another program, and will not offer those families private teaching, tutoring, or childcare services.",
        "**Staff:** For one (1) year after this Agreement ends, Contractor will not recruit or encourage any School staff member or contractor to leave the School.",
        "Contractor agrees these limits are reasonable in time, area, and scope. If a court finds any limit too broad to enforce, the parties ask the court to reduce it to the broadest limit the law allows and to enforce it as reduced.",
      ],
    },
    {
      id: 13,
      title: "Remedies",
      paragraphs: [
        "If Contractor breaches Section 9, 10, 11, or 12, the School may end this Agreement immediately and may pursue any remedy available under law, including a court order to stop further disclosure, competition, or solicitation.",
      ],
    },
    {
      id: 14,
      title: "Absences and Coverage",
      bullets: [
        "Contractor will tell the director as early as possible when unable to work, and at least {{absence_notice_hours}} hours ahead when the absence is planned.",
        "The School will arrange coverage from its substitute list.",
        "Contractor will give the director at least {{time_off_notice_days}} days' notice of planned time off.",
      ],
    },
    {
      id: 15,
      title: "Concerns and Conflict Resolution",
      bullets: [
        "Contractor should raise concerns directly with the person involved when safe to do so.",
        "If the concern is not resolved, or involves the director, Contractor may go to {{second_contact}} (a second point of contact other than the director).",
        "The director makes the final decision on School operations. Both parties will try mediation before taking legal action.",
      ],
    },
    {
      id: 16,
      title: "Ending This Agreement",
      bullets: [
        "Either party may end this Agreement with {{termination_notice_days}} days' written notice.",
        "The School may end this Agreement immediately for any zero-tolerance violation, safety concern, or breach of Sections 7, 8, 9, 10, 11, or 12.",
        "This Agreement also ends by mutual written agreement of the parties, or upon the death of Contractor.",
        "The School will pay Contractor for services performed through the last day worked.",
        "Sections 9, 10, 11, 12, and 13 continue after this Agreement ends.",
      ],
    },
    {
      id: 17,
      title: "General Terms",
      bullets: [
        "This Agreement, with Exhibit A, is the entire agreement between the parties and replaces earlier discussions and agreements.",
        "Changes must be in writing and signed by both parties.",
        "This Agreement binds the School and its successors and assigns. Contractor may not assign this Agreement or subcontract the services without the School's written consent.",
        "Texas law governs this Agreement. If any part is found unenforceable, the rest stays in effect.",
      ],
    },
  ],
  signatureIntro: "The parties have signed this Agreement as of the dates below.",
  exhibitA: {
    title: "Exhibit A: Role, Schedule, and Rate",
    rows: [
      { key: "role", label: "Role" },
      { key: "group", label: "Group assigned (Primary, Lower El, Upper El)" },
      { key: "days_hours", label: "Days and hours" },
      { key: "rate_schedule", label: "Rate and pay schedule" },
      { key: "planning_time", label: "Planning or meeting time included" },
      { key: "extra_duties", label: "Extra duties (Friday enrichment, extended care, events)" },
      { key: "materials_contractor", label: "Materials Contractor provides" },
      { key: "materials_school", label: "Materials the School provides" },
    ],
  },
  footer: "Sage Field LLC · 2750 County Road 100, Hutto, TX 78634",
};

export const CURRENT_TEMPLATE_VERSION = EDUCATOR_AGREEMENT_V1.version;

const TEMPLATES: Record<string, AgreementTemplate> = {
  [EDUCATOR_AGREEMENT_V1.version]: EDUCATOR_AGREEMENT_V1,
};

export function getTemplate(version: string): AgreementTemplate {
  return TEMPLATES[version] ?? EDUCATOR_AGREEMENT_V1;
}

/** Sections the contractor signs individually (§18 is the final signature). */
export const signedSectionIds = (t: AgreementTemplate) => t.sections.map((s) => s.id);

// ─── Filling blanks ──────────────────────────────────────────────────────────

export function formatDate(d: string | null | undefined): string | null {
  if (!d) return null;
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return d;
  return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function formatRole(a: Pick<ContractorAgreement, "role" | "role_other">): string {
  if (a.role === "other") return a.role_other ? `Other: ${a.role_other}` : "Other";
  return ROLE_LABELS[a.role];
}

export function formatRate(a: Pick<ContractorAgreement, "rate_amount" | "rate_unit">): string | null {
  if (a.rate_amount == null) return null;
  const amt = Number(a.rate_amount).toLocaleString("en-US", { style: "currency", currency: "USD" });
  return a.rate_unit ? `${amt} per ${a.rate_unit}` : amt;
}

type FillSource = Pick<
  ContractorAgreement,
  | "contractor_name"
  | "role"
  | "role_other"
  | "effective_date"
  | "start_date"
  | "end_date_text"
  | "rate_amount"
  | "rate_unit"
  | "invoice_due_text"
  | "invoice_period"
  | "payment_days"
  | "absence_notice_hours"
  | "time_off_notice_days"
  | "termination_notice_days"
  | "second_contact"
  | "contractor_address"
  | "contractor_phone"
  | "signer_email"
>;

/** Placeholder → display value (null = still blank). */
export function buildValues(a: FillSource): Record<string, string | null> {
  const num = (n: number | null) => (n == null ? null : String(n));
  return {
    contractor_name: a.contractor_name || null,
    effective_date: formatDate(a.effective_date),
    contractor_address: a.contractor_address || null,
    signer_email: a.signer_email || null,
    contractor_phone: a.contractor_phone || null,
    role_checkboxes: CONTRACTOR_ROLES.map((r) => {
      const on = a.role === r;
      const label = r === "other" ? `Other${on && a.role_other ? `: ${a.role_other}` : ""}` : ROLE_LABELS[r];
      return `${on ? "☑" : "☐"} ${label}`;
    }).join("   "),
    start_date: formatDate(a.start_date),
    end_date_text: a.end_date_text || null,
    rate: formatRate(a),
    invoice_due_text: a.invoice_due_text || null,
    invoice_period: a.invoice_period,
    payment_days: num(a.payment_days),
    absence_notice_hours: num(a.absence_notice_hours),
    time_off_notice_days: num(a.time_off_notice_days),
    termination_notice_days: num(a.termination_notice_days),
    second_contact: a.second_contact || null,
  };
}

export type TextPart = { kind: "text"; text: string; bold?: boolean } | { kind: "field"; key: string; value: string | null };

/** Split a template string into text / bold / filled-field parts for rendering. */
export function parseTemplate(text: string, values: Record<string, string | null>): TextPart[] {
  const parts: TextPart[] = [];
  const re = /(\*\*[^*]+\*\*|\{\{[a-z_]+\}\})/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push({ kind: "text", text: text.slice(last, idx) });
    const tok = m[0];
    if (tok.startsWith("**")) parts.push({ kind: "text", text: tok.slice(2, -2), bold: true });
    else {
      const key = tok.slice(2, -2);
      parts.push({ kind: "field", key, value: values[key] ?? null });
    }
    last = idx + tok.length;
  }
  if (last < text.length) parts.push({ kind: "text", text: text.slice(last) });
  return parts;
}
