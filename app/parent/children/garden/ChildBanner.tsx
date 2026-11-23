"use client";

import { useRef } from "react";
import { KidAvatar, Spinner, TINT_BG, TINT_FG, firstNameOf } from "@/app/parent/_garden/ui";
import { computeAge, formatDOB, formatProgramLabel, type Student } from "./childrenData";

function CameraIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7.5A1.5 1.5 0 014.5 6h1.8l1.2-2h5l1.2 2h1.8A1.5 1.5 0 0117 7.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 14.5v-7z" />
      <circle cx="10" cy="11" r="2.8" />
    </svg>
  );
}

export default function ChildBanner({
  student,
  imageUrl,
  program,
  canChangePhoto,
  uploading,
  onPickPhoto,
  onBeforePick,
}: {
  student: Student;
  imageUrl: string | null;
  program: string | undefined;
  canChangePhoto: boolean;
  uploading: boolean;
  onPickPhoto: (file: File) => void;
  /** Return false to stop the file picker opening (admin preview). */
  onBeforePick: () => boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const name = student.child_legal_name ?? "Unknown";
  const first = firstNameOf(name);
  const age = computeAge(student.dob_month, student.dob_day, student.dob_year);
  const dob = formatDOB(student.dob_month, student.dob_day, student.dob_year);
  const programLabel = formatProgramLabel(program);

  const avatar = (
    <span className="relative block rounded-full bg-white p-1.5 shadow-[0_14px_30px_-18px_rgba(43,42,38,0.6)]">
      <KidAvatar id={student.id} name={name} imageUrl={imageUrl} size="h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl" />
      {canChangePhoto ? (
        <span
          className="absolute -bottom-0.5 -right-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--sf-ink)] text-white ring-4 ring-[var(--sf-cream)] transition group-hover:bg-[var(--sf-sage-deep)] group-focus-visible:bg-[var(--sf-sage-deep)]"
          aria-hidden="true"
        >
          {uploading ? <Spinner /> : <CameraIcon />}
        </span>
      ) : null}
    </span>
  );

  return (
    <div className="flex min-w-0 items-center gap-4 sm:gap-6">
      {canChangePhoto ? (
        <>
          <button
            type="button"
            onClick={() => {
              if (uploading || !onBeforePick()) return;
              inputRef.current?.click();
            }}
            disabled={uploading}
            aria-busy={uploading || undefined}
            aria-label={uploading ? `Uploading ${first}'s photo` : `Change photo for ${first}`}
            className="group shrink-0 rounded-full transition hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] disabled:cursor-wait cursor-pointer"
          >
            {avatar}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onPickPhoto(file);
            }}
          />
        </>
      ) : (
        <span className="shrink-0">{avatar}</span>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="sf-display break-words text-[2rem] leading-[1.05] sm:text-[2.6rem]">{name}</h2>
        <p className="mt-1.5 text-sm font-bold text-[var(--sf-soft)]">
          {dob !== "—" ? (
            <>
              Born {dob}
              {age !== null ? ` · ${age} years old${student.child_grade ? ` · ${student.child_grade}` : ""}` : ""}
            </>
          ) : (
            "Date of birth not provided"
          )}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {programLabel ? (
            <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${TINT_BG.butter} ${TINT_FG.butter}`}>{programLabel}</span>
          ) : null}
          {canChangePhoto ? (
            <span className="sf-hand text-base leading-none text-[var(--sf-sage-deep)]" aria-hidden="true">
              {uploading ? "uploading…" : "tap the photo to change it"}
            </span>
          ) : null}
        </div>
        {student.special_interests?.trim() ? (
          <p className="mt-2 text-sm font-semibold text-[var(--sf-ink)]">
            <span className="text-[var(--sf-soft)]">Interests: </span>
            {student.special_interests}
          </p>
        ) : null}
      </div>
    </div>
  );
}
