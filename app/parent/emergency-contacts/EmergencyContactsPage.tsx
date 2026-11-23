"use client";

import { useState, type ReactNode } from "react";
import { Mail, Phone, Briefcase } from "lucide-react";
import PortalShell from "@/app/parent/_garden/PortalShell";
import ChildSwitcher from "@/app/parent/_garden/ChildSwitcher";
import { CopyButton } from "@/app/parent/_garden/copy";
import { EmptyState } from "@/app/parent/_garden/states";
import { PencilIcon } from "@/app/parent/_garden/fields";
import { TINT_BG, TINT_FG, avatarTint, btnGhostSm, cardBase, firstNameOf, getInitials } from "@/app/parent/_garden/ui";
import { Reveal } from "@/app/_garden/motion";
import type { ParentEmergencyContactsRecord } from "@/app/lib/get-emergency-contacts";
import ContactEditSheet, { type EditTarget } from "./garden/ContactEditSheet";
import { CARD_META, CARD_ORDER, type CardKey } from "./garden/contacts";

type Row = { key: string; icon: ReactNode; label: string; value: string; href: string };

const iconCls = "h-4 w-4";

function rowsFor(c: ParentEmergencyContactsRecord, card: CardKey): Row[] {
  const tel = (v: string) => `tel:${v.replace(/[^\d+]/g, "")}`;
  const rows: (Row | null)[] =
    card === "g1" || card === "g2"
      ? [
          c[`${card}_email`] ? { key: "email", icon: <Mail className={iconCls} aria-hidden="true" />, label: "Email", value: c[`${card}_email`]!, href: `mailto:${c[`${card}_email`]}` } : null,
          c[`${card}_cell_phone`] ? { key: "cell", icon: <Phone className={iconCls} aria-hidden="true" />, label: "Cell Phone", value: c[`${card}_cell_phone`]!, href: tel(c[`${card}_cell_phone`]!) } : null,
          c[`${card}_work_phone`] ? { key: "work", icon: <Briefcase className={iconCls} aria-hidden="true" />, label: "Work Phone", value: c[`${card}_work_phone`]!, href: tel(c[`${card}_work_phone`]!) } : null,
        ]
      : [
          c[`${card}_contact_phone`]
            ? { key: "phone", icon: <Phone className={iconCls} aria-hidden="true" />, label: "Phone", value: c[`${card}_contact_phone`]!, href: tel(c[`${card}_contact_phone`]!) }
            : null,
        ];
  return rows.filter((r): r is Row => r !== null);
}

function nameFor(c: ParentEmergencyContactsRecord, card: CardKey) {
  if (card === "g1" || card === "g2") return { name: c[`${card}_full_name`], relationship: c[`${card}_relationship`] };
  return { name: c[`${card}_contact_name`], relationship: c[`${card}_contact_relation`] };
}

function ContactCard({
  record,
  card,
  onEdit,
}: {
  record: ParentEmergencyContactsRecord;
  card: CardKey;
  onEdit?: () => void;
}) {
  const meta = CARD_META[card];
  const { name, relationship } = nameFor(record, card);
  const rows = rowsFor(record, card);
  const headingId = `contact-${card}`;

  return (
    <article aria-labelledby={headingId} className={`${cardBase} flex min-w-0 flex-col p-5 sm:p-6`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TINT_BG[meta.tint]} text-base`} aria-hidden="true">
            {meta.emoji}
          </span>
          <h2 id={headingId} className="sf-display truncate text-[1.45rem] leading-tight">
            {meta.title}
          </h2>
        </div>
        {onEdit ? (
          <button type="button" onClick={onEdit} className={`${btnGhostSm} shrink-0 px-4`} aria-label={`Edit ${meta.title}`}>
            <PencilIcon />
            Edit
          </button>
        ) : null}
      </div>

      {name ? (
        <div className="mb-3 flex min-w-0 items-center gap-3 rounded-[20px] bg-[var(--sf-cream)] px-3 py-2.5">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${avatarTint(`${record.studentId}-${card}`)}`}
            aria-hidden="true"
          >
            {getInitials(name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-extrabold leading-tight">{name}</p>
            {relationship ? (
              <span className={`mt-1 inline-block max-w-full truncate rounded-full px-2.5 py-0.5 text-xs font-extrabold capitalize ${TINT_BG[meta.tint]} ${TINT_FG[meta.tint]}`}>
                {relationship}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {rows.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {rows.map((r) => (
            <li key={r.key} className="flex min-w-0 items-center gap-3 py-1">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--sf-ink)]/[0.05] text-[var(--sf-soft)]">{r.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[var(--sf-soft)]">{r.label}</p>
                <a
                  href={r.href}
                  className="block truncate rounded text-[15px] font-extrabold text-[var(--sf-sage-deep)] underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-mint)]"
                >
                  {r.value}
                </a>
              </div>
              <CopyButton text={r.value} label={`Copy ${meta.title} ${r.label.toLowerCase()}`} toastTitle={`${r.label} copied`} compact />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-[18px] bg-[var(--sf-ink)]/[0.04] px-4 py-3 text-sm font-bold text-[var(--sf-soft)]">No contact info available</p>
      )}
    </article>
  );
}

interface Props {
  contacts: ParentEmergencyContactsRecord[];
  /** Admin "view as parent": sheets open, saves show the Preview mode toast. */
  readOnlyPreview?: boolean;
}

export default function EmergencyContactsPage({ contacts, readOnlyPreview }: Props) {
  const [localContacts, setLocalContacts] = useState(contacts);
  const [activeId, setActiveId] = useState<string | null>(contacts[0]?.studentId ?? null);
  const [target, setTarget] = useState<EditTarget | null>(null);
  const [open, setOpen] = useState(false);

  const c = localContacts.find((x) => x.studentId === activeId) ?? localContacts[0];
  const childFirst = c?.studentName ? firstNameOf(c.studentName) : null;

  return (
    <PortalShell>
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(55%_60%_at_12%_8%,rgba(255,220,199,0.6),transparent_70%),radial-gradient(50%_55%_at_92%_4%,rgba(207,230,251,0.6),transparent_70%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 pt-8 sm:pt-12">
          <header className="mb-6">
            <h1 className="sf-display text-[2.6rem] leading-none sm:text-[3.4rem]">Emergency Contacts</h1>
            {childFirst ? (
              <p className="sf-hand mt-2 text-xl leading-tight text-[var(--sf-sage-deep)]">who we call for {childFirst}</p>
            ) : null}
          </header>

          {!c ? (
            <EmptyState emoji="🌱" title="No children enrolled yet." tint="mint" />
          ) : (
            <div className="pointer-events-auto flex flex-col gap-6">
              <ChildSwitcher
                items={localContacts.map((x) => ({ id: x.studentId, name: x.studentName ?? "Child", imageUrl: x.profileImageUrl }))}
                activeId={c.studentId}
                onChange={setActiveId}
                controls="emergency-contacts-panel"
              />

              <div id="emergency-contacts-panel" role={localContacts.length > 1 ? "tabpanel" : undefined} className="flex flex-col gap-5">
                {!c.canEdit ? (
                  <p className="flex items-start gap-2 rounded-[20px] bg-[var(--sf-butter)]/60 px-4 py-3 text-sm font-bold text-[#7a5b00]">
                    <span aria-hidden="true">🔒</span>
                    <span>
                      {childFirst ? `${childFirst}'s` : "These"} contacts can&apos;t be edited yet. Editing opens once the application is
                      approved.
                    </span>
                  </p>
                ) : null}
                <Reveal key={c.studentId} className="grid grid-cols-1 gap-5 md:grid-cols-2" y={20} stagger={0.06}>
                  {CARD_ORDER.map((card) => (
                    <ContactCard
                      key={card}
                      record={c}
                      card={card}
                      onEdit={
                        c.canEdit
                          ? () => {
                              setTarget({ card, record: c });
                              setOpen(true);
                            }
                          : undefined
                      }
                    />
                  ))}
                </Reveal>
              </div>
            </div>
          )}
        </div>
      </div>

      <ContactEditSheet
        target={target}
        open={open}
        onClose={() => setOpen(false)}
        onSaved={(updated) => setLocalContacts((prev) => prev.map((x) => (x.studentId === updated.studentId ? updated : x)))}
        readOnlyPreview={readOnlyPreview}
      />
    </PortalShell>
  );
}
