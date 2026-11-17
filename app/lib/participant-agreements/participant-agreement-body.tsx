import { ACTIVITIES, RISKS } from "@/app/shadow/content";
import {
  FRIDAY_RACE_ACTIVITIES,
  FRIDAY_RACE_RISKS,
} from "./friday-race-activities";

export type ParticipantAgreementVariant = "shadow" | "friday";

export type ParticipantAgreementParticipantInfo = {
  studentLabel?: string;
  studentNames?: string;
  parentName?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  photoConsent?: boolean | null;
  notes?: string;
};

type StyleMode = "garden" | "print";

function SectionHeader({
  title,
  mode,
}: {
  title: string;
  mode: StyleMode;
}) {
  if (mode === "garden") {
    return (
      <h3 className="sf-display border-b-2 border-dashed border-[var(--sf-ink)]/10 pb-2 text-xl">
        {title}
      </h3>
    );
  }
  return (
    <h3 className="text-sm font-bold font-body text-gray-800 pb-2 border-b border-gray-100">
      {title}
    </h3>
  );
}

function bodyTextClass(mode: StyleMode) {
  return mode === "garden"
    ? "text-sm text-[var(--sf-soft)] leading-relaxed"
    : "text-sm text-gray-600 font-body leading-relaxed";
}

function bulletClass(mode: StyleMode) {
  return mode === "garden"
    ? "flex gap-2 text-sm text-[var(--sf-soft)]"
    : "flex gap-2 text-sm text-gray-600 font-body";
}

function bulletDotClass(mode: StyleMode) {
  return mode === "garden"
    ? "text-[var(--sf-coral-deep)] mt-0.5 flex-shrink-0"
    : "text-[#2C5F2E] mt-0.5 flex-shrink-0";
}

const VARIANT_COPY: Record<
  ParticipantAgreementVariant,
  {
    subtitle: string;
    programPhrase: string;
    eventName: string;
    acknowledgmentClosing: string;
    signatureLead: string;
  }
> = {
  shadow: {
    subtitle:
      "Location: Round Rock, Texas · Shadow Day Date: Mon–Thu by appointment",
    programPhrase: "Shadow Day",
    eventName: "Shadow Day",
    acknowledgmentClosing:
      "I understand that these activities involve inherent risks that cannot be completely eliminated while preserving the educational and developmental benefits of participation.",
    signatureLead:
      "By signing below, I confirm that I have read this Agreement in its entirety and understand its contents. I understand that participation in outdoor educational activities involves inherent risks and that I am voluntarily permitting my child to participate. I certify that I am the parent or legal guardian of the child named above and have authority to execute this Agreement.",
  },
  friday: {
    subtitle:
      "Location: Round Rock, Texas · Thankful & Grateful: November 20, 2026",
    programPhrase: "Thankful & Grateful Field Day",
    eventName: "Thankful & Grateful Field Day",
    acknowledgmentClosing:
      "I understand that these activities involve inherent risks that cannot be completely eliminated while preserving the educational and developmental benefits of participation.",
    signatureLead:
      "By signing below, I confirm that I have read this Agreement in its entirety and understand its contents. I certify that I am the parent or legal guardian of the child named above and have authority to execute this Agreement.",
  },
};

const MEDICAL_BULLETS = [
  "Emergency medical services may be contacted when deemed necessary.",
  "I am responsible for all medical expenses incurred on behalf of my child.",
  "School personnel may administer basic first aid as appropriate.",
];

export function ParticipantAgreementBody({
  variant,
  info,
  mode = "print",
  showBlankSignatureLine = false,
  sectionsThrough = 7,
}: {
  variant: ParticipantAgreementVariant;
  info?: ParticipantAgreementParticipantInfo;
  mode?: StyleMode;
  showBlankSignatureLine?: boolean;
  /** Render legal sections through this number (drawers use 6 and supply signature UI). */
  sectionsThrough?: 6 | 7;
}) {
  const copy = VARIANT_COPY[variant];
  const activities =
    variant === "shadow" ? ACTIVITIES : FRIDAY_RACE_ACTIVITIES;
  const risks = variant === "shadow" ? RISKS : FRIDAY_RACE_RISKS;

  const studentLabel =
    info?.studentLabel ??
    (info?.studentNames?.includes(",") ? "Children" : "Student Name");
  const studentNames = info?.studentNames ?? "—";
  const parentName = info?.parentName ?? "—";
  const emergencyDisplay =
    info?.emergencyName && info.emergencyName !== "—"
      ? `${info.emergencyName}${info.emergencyPhone ? ` · ${info.emergencyPhone}` : ""}`
      : "—";
  const photoConsent = info?.photoConsent ?? null;
  const notes = info?.notes?.trim() ?? "";

  const infoBoxClass =
    mode === "garden"
      ? "flex flex-col gap-3 bg-[var(--sf-cream)] rounded-2xl px-4 py-4 border-2 border-dashed border-[var(--sf-ink)]/10"
      : "flex flex-col gap-3 bg-gray-50 rounded-xl px-5 py-4 border border-gray-100";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-0.5">
        <p
          className={
            mode === "garden"
              ? "sf-display text-lg text-[var(--sf-ink)]"
              : "text-sm font-semibold font-heading text-gray-800"
          }
        >
          Sage Field Private Microschool
        </p>
        <p
          className={
            mode === "garden"
              ? "text-xs text-[var(--sf-soft)]"
              : "text-xs text-gray-500 font-body"
          }
        >
          {copy.subtitle}
        </p>
      </div>

      <div className={infoBoxClass}>
        <div
          className={
            mode === "garden"
              ? "grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2"
              : "grid grid-cols-2 gap-x-4 gap-y-2"
          }
        >
          {[
            { label: studentLabel, value: studentNames },
            { label: "Parent / Guardian", value: parentName },
            { label: "Emergency Contact", value: emergencyDisplay },
            {
              label: "Photo Consent",
              value:
                photoConsent === null
                  ? "—"
                  : photoConsent
                    ? "✓ Authorized"
                    : "✗ Not authorized",
            },
          ].map((row) => (
            <div key={row.label}>
              <p
                className={
                  mode === "garden"
                    ? "text-xs font-extrabold uppercase tracking-wide text-[var(--sf-soft)]/70"
                    : "text-xs font-semibold text-gray-400 font-body"
                }
              >
                {row.label}
              </p>
              <p
                className={
                  mode === "garden"
                    ? "text-sm font-bold text-[var(--sf-ink)]"
                    : "text-sm text-gray-800 font-body"
                }
              >
                {row.value}
              </p>
            </div>
          ))}
        </div>
        {notes ? (
          <div
            className={
              mode === "garden"
                ? "border-t-2 border-dashed border-[var(--sf-ink)]/10 pt-3 mt-1"
                : "border-t border-gray-200 pt-3 mt-1"
            }
          >
            <p
              className={
                mode === "garden"
                  ? "text-xs font-extrabold uppercase tracking-wide text-[var(--sf-soft)]/70 mb-1"
                  : "text-xs font-semibold text-gray-400 font-body mb-1"
              }
            >
              Medical / Notes
            </p>
            <p
              className={
                mode === "garden"
                  ? "text-sm text-[var(--sf-soft)] leading-relaxed"
                  : "text-sm text-gray-700 font-body leading-relaxed"
              }
            >
              {notes}
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <SectionHeader
          title="1. Acknowledgment of Program Activities"
          mode={mode}
        />
        <p className={bodyTextClass(mode)}>
          I understand that my child is participating in a {copy.programPhrase}{" "}
          at an outdoor education program where children learn through active
          exploration, hands-on experiences, and supervised outdoor activities.
          Activities may include, but are not limited to:
        </p>
        <ul className="flex flex-col gap-1.5">
          {activities.map((a) => (
            <li key={a} className={bulletClass(mode)}>
              <span className={bulletDotClass(mode)}>•</span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
        <p className={bodyTextClass(mode)}>{copy.acknowledgmentClosing}</p>
      </div>

      <div className="flex flex-col gap-3">
        <SectionHeader title="2. Assumption of Risk" mode={mode} />
        <p className={bodyTextClass(mode)}>
          I knowingly and voluntarily assume all risks associated with my
          child&apos;s participation in the {copy.eventName}, including but not
          limited to:
        </p>
        <ul className="flex flex-col gap-1.5">
          {risks.map((r) => (
            <li key={r} className={bulletClass(mode)}>
              <span className={bulletDotClass(mode)}>•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
        <p className={bodyTextClass(mode)}>
          I understand that injury may occur despite reasonable supervision and
          safety precautions.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <SectionHeader title="3. Release of Liability" mode={mode} />
        <p className={bodyTextClass(mode)}>
          In consideration of my child&apos;s participation in the{" "}
          {copy.eventName}, I release and hold harmless the School, its owners,
          directors, employees, contractors, volunteers, agents, and
          representatives from any claims, demands, causes of action, damages,
          losses, costs, or expenses arising out of or related to my
          child&apos;s participation.
        </p>
        <p className={bodyTextClass(mode)}>
          This release applies to all claims based upon ordinary negligence but
          does not apply to claims arising from gross negligence, reckless
          conduct, or intentional misconduct.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <SectionHeader title="4. Medical Authorization" mode={mode} />
        <p className={bodyTextClass(mode)}>
          I authorize school personnel to obtain emergency medical treatment for
          my child if I cannot be reached promptly. I understand that:
        </p>
        <ul className="flex flex-col gap-1.5">
          {MEDICAL_BULLETS.map((item) => (
            <li key={item} className={bulletClass(mode)}>
              <span className={bulletDotClass(mode)}>•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {notes ? (
          <div
            className={
              mode === "garden"
                ? "bg-[var(--sf-butter)]/50 rounded-2xl px-4 py-3"
                : "bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3"
            }
          >
            <p
              className={
                mode === "garden"
                  ? "text-xs font-semibold text-[#7a5b00] mb-1"
                  : "text-xs font-semibold text-yellow-700 font-body mb-1"
              }
            >
              Allergies, Medical Conditions, or Special Notes
            </p>
            <p
              className={
                mode === "garden"
                  ? "text-sm text-[var(--sf-ink)]"
                  : "text-sm text-yellow-800 font-body"
              }
            >
              {notes}
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <SectionHeader title="5. Photography and Media Release" mode={mode} />
        {photoConsent === null && mode === "print" ? (
          <div className="flex flex-col gap-2 text-sm text-gray-600 font-body">
            <p>
              ☐ I authorize the School to photograph and/or record my child and
              use such images or recordings for educational, promotional,
              website, social media, and marketing purposes.
            </p>
            <p>
              ☐ I do not authorize the School to use photographs or recordings
              of my child.
            </p>
          </div>
        ) : (
          <div
            className={
              mode === "garden"
                ? `flex items-center gap-3 px-4 py-3 rounded-2xl border-2 ${
                    photoConsent
                      ? "bg-[var(--sf-mint)]/60 border-[var(--sf-mint)]"
                      : "bg-[var(--sf-cream)] border-[var(--sf-ink)]/10"
                  }`
                : `flex items-center gap-3 px-4 py-3 rounded-lg border ${
                    photoConsent
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-gray-50 border-gray-200"
                  }`
            }
          >
            <span className="text-lg">{photoConsent ? "✅" : "🚫"}</span>
            <p className={bodyTextClass(mode)}>
              {photoConsent
                ? "I authorize the School to photograph and/or record my child and use such images or recordings for educational, promotional, website, social media, and marketing purposes."
                : "I do not authorize the School to use photographs or recordings of my child."}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <SectionHeader
          title="6. Emergency Contact Authorization"
          mode={mode}
        />
        <p className={bodyTextClass(mode)}>
          If the parent or guardian cannot be reached, the following individual
          is authorized to make emergency decisions regarding the child:
        </p>
        <div
          className={
            mode === "garden"
              ? "bg-[var(--sf-cream)] rounded-2xl px-4 py-3"
              : "bg-gray-50 rounded-lg px-4 py-3 border border-gray-100"
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p
                className={
                  mode === "garden"
                    ? "text-xs font-extrabold uppercase tracking-wide text-[var(--sf-soft)]/70"
                    : "text-xs font-semibold text-gray-400 font-body"
                }
              >
                Name
              </p>
              <p
                className={
                  mode === "garden"
                    ? "text-sm font-bold text-[var(--sf-ink)]"
                    : "text-sm text-gray-800 font-body"
                }
              >
                {info?.emergencyName ?? "—"}
              </p>
            </div>
            <div>
              <p
                className={
                  mode === "garden"
                    ? "text-xs font-extrabold uppercase tracking-wide text-[var(--sf-soft)]/70"
                    : "text-xs font-semibold text-gray-400 font-body"
                }
              >
                Phone
              </p>
              <p
                className={
                  mode === "garden"
                    ? "text-sm font-bold text-[var(--sf-ink)]"
                    : "text-sm text-gray-800 font-body"
                }
              >
                {info?.emergencyPhone ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {sectionsThrough >= 7 ? (
        <div className="flex flex-col gap-4">
          <SectionHeader
            title="7. Parent Acknowledgment & Signature"
            mode={mode}
          />
          <p className={bodyTextClass(mode)}>{copy.signatureLead}</p>
          {showBlankSignatureLine ? (
            <div className="mt-4 border border-gray-300 rounded-lg px-4 py-6 grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 font-body mb-8">
                  Printed name
                </p>
                <div className="border-b border-gray-400 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 font-body mb-8">
                  Signature
                </p>
                <div className="border-b border-gray-400 h-6" />
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-500 font-body mb-2">
                  Date
                </p>
                <div className="border-b border-gray-400 h-6 max-w-xs" />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}