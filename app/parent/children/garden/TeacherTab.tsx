"use client";

import { useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import type { TeacherAssignment } from "@/app/actions/teacherAssignments";
import { EmptyState } from "@/app/parent/_garden/states";
import { Spinner, avatarTint, btnGhostSm, btnSageSm, getInitials, linkSoft, Arrow } from "@/app/parent/_garden/ui";
import { TEACHER_CARD_DATA, formatProgramName } from "./childrenData";

function ChatIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 15.5V5.5A1.5 1.5 0 015.5 4h9A1.5 1.5 0 0116 5.5v6a1.5 1.5 0 01-1.5 1.5H7.5L4 15.5z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="14" height="10" rx="1.5" />
      <path d="M3.5 6l6.5 5 6.5-5" />
    </svg>
  );
}

function TeacherCard({
  t,
  opening,
  disabled,
  onMessage,
  nested,
}: {
  t: TeacherAssignment;
  nested: boolean;
  opening: boolean;
  disabled: boolean;
  onMessage: () => void;
}) {
  const name = t.teacher_name ?? "Unknown Teacher";
  const card = TEACHER_CARD_DATA[t.teacher_name ?? ""];
  const role = card?.role ?? "Teacher";
  const email = card?.email?.trim() ?? "";
  return (
    <li className="flex w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_20px_50px_-30px_rgba(43,42,38,0.5)] ring-1 ring-[var(--sf-ink)]/[0.06] sm:w-[320px]">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {card?.image ? (
          <NextImage src={card.image} alt={name} fill sizes="320px" className="object-cover object-top" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center sf-display text-5xl ${avatarTint(t.teacher_id)}`} aria-hidden="true">
            {getInitials(name)}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {nested ? <h4 className="sf-display text-2xl leading-tight">{name}</h4> : <h3 className="sf-display text-2xl leading-tight">{name}</h3>}
        <span className="w-fit rounded-full bg-[var(--sf-mint)] px-3 py-1 text-xs font-extrabold text-[var(--sf-sage-deep)]">{role}</span>
        {card?.about ? <p className="line-clamp-6 text-sm font-semibold leading-relaxed text-[var(--sf-soft)]">{card.about}</p> : null}
        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          <button type="button" onClick={onMessage} disabled={disabled} aria-busy={opening || undefined} className={`${btnSageSm} flex-1`}>
            {opening ? <Spinner /> : <ChatIcon />}
            {opening ? "Opening…" : "Message"}
          </button>
          {email ? (
            <a href={`mailto:${email}`} className={`${btnGhostSm} flex-1`} aria-label={`Email ${name}`}>
              <MailIcon />
              Email
            </a>
          ) : null}
        </div>
        <Link href={`/parent/profile/${t.teacher_id}`} className={`${linkSoft} self-start`}>
          View Profile <Arrow />
        </Link>
      </div>
    </li>
  );
}

export default function TeacherTab({
  teachers,
  onMessage,
}: {
  teachers: TeacherAssignment[];
  /** Returns false when the message wasn't opened (e.g. admin preview). */
  onMessage: (t: TeacherAssignment) => boolean;
}) {
  const [openingId, setOpeningId] = useState<string | null>(null);

  if (teachers.length === 0) {
    return (
      <EmptyState
        emoji="🍎"
        tint="butter"
        title="No teacher assigned yet"
        body="Teacher assignments will appear here once assigned."
      />
    );
  }

  const programMap = new Map<string, TeacherAssignment[]>();
  for (const t of teachers) {
    const key = t.program ?? "General";
    const list = programMap.get(key) ?? [];
    // One card per teacher per program (as before).
    if (!list.some((x) => x.teacher_id === t.teacher_id)) list.push(t);
    programMap.set(key, list);
  }
  const multiple = programMap.size > 1;

  return (
    <div className="flex flex-col gap-8">
      {[...programMap.entries()].map(([program, group]) => (
        <div key={program}>
          {multiple ? <h3 className="sf-hand mb-2 text-xl leading-tight text-[var(--sf-sage-deep)]">{formatProgramName(program)}</h3> : null}
          <ul
            className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 pt-1 [scroll-padding-inline:1.5rem] no-scrollbar"
            aria-label={multiple ? `${formatProgramName(program)} teachers` : "Teachers"}
          >
            {group.map((t) => (
              <TeacherCard
                key={t.id}
                t={t}
                nested={multiple}
                opening={openingId === t.teacher_id}
                disabled={openingId !== null}
                onMessage={() => {
                  if (onMessage(t)) setOpeningId(t.teacher_id);
                }}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
