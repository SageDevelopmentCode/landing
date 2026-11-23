"use client";

import Link from "next/link";
import type { ElementType } from "react";
import {
  CalendarDays,
  ClipboardList,
  Coffee,
  CreditCard,
  Gift,
  Heart,
  HelpCircle,
  MessageCircle,
  Rss,
  Users,
} from "lucide-react";
import { CountUp } from "@/app/_garden/motion";
import { isFieldFridayCalendarEvent } from "@/shared/parent/calendar";
import type { HomeEvent, HomeStudent } from "../page";
import { formatEventTime, getEventDayMonth } from "@/app/parent/_garden/format";
import { Arrow, CheckIcon, SectionHeader, avatarTint, firstNameOf, getInitials, linkSoft } from "@/app/parent/_garden/ui";

/* ─── My Children ─────────────────────────────────────────────────────────── */

const KID_TILTS = ["-3deg", "2.5deg", "-1.5deg", "3deg"];
const TAPE = ["bg-[var(--sf-butter)]/90", "bg-[var(--sf-mint)]/90", "bg-[var(--sf-sky)]/90", "bg-[var(--sf-lav)]/90"];

export function ChildrenPolaroids({
  students,
  onOpenAttendance,
}: {
  students: HomeStudent[];
  onOpenAttendance: (student: HomeStudent) => void;
}) {
  return (
    <section aria-labelledby="home-children">
      <SectionHeader
        id="home-children"
        title="My Children"
        action={
          <Link href="/parent/children" className={linkSoft}>
            View all <Arrow />
          </Link>
        }
      />
      {students.length === 0 ? (
        <div className="rounded-[24px] bg-white/70 px-5 py-6 text-center">
          <p className="text-sm font-bold text-[var(--sf-soft)]">No children found. Contact us if you believe this is an error.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-x-5 gap-y-7 pt-2 sm:grid-cols-3 md:grid-cols-4">
          {students.map((student, i) => {
            const first = firstNameOf(student.child_legal_name);
            return (
              <li key={student.id}>
                <div
                  className="sf-polaroid relative transition-[rotate,translate] duration-300 hover:!rotate-0 hover:-translate-y-1 focus-within:!rotate-0"
                  style={{ rotate: KID_TILTS[i % KID_TILTS.length] }}
                >
                  <span
                    className={`absolute -top-3 left-1/2 h-5 w-16 -translate-x-1/2 -rotate-3 rounded-sm shadow-sm ${TAPE[i % TAPE.length]}`}
                    aria-hidden="true"
                  />
                  <div className="relative aspect-square overflow-hidden rounded-[3px]">
                    {student.profile_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
                      <img src={student.profile_image_url} alt={first} className="h-full w-full object-cover" />
                    ) : (
                      <div
                        className={`flex h-full w-full items-center justify-center sf-display text-4xl ${avatarTint(student.id)}`}
                        aria-hidden="true"
                      >
                        {getInitials(student.child_legal_name)}
                      </div>
                    )}
                  </div>
                  <div className="px-1 pt-2.5 text-center">
                    <p className="sf-display truncate text-xl leading-tight">{first}</p>
                    {student.child_grade ? (
                      <p className="sf-hand text-base leading-tight text-[var(--sf-soft)]">{student.child_grade}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenAttendance(student)}
                    className="mt-2.5 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-[var(--sf-mint)] px-3 text-xs font-extrabold text-[var(--sf-sage-deep)] transition hover:bg-[var(--sf-sage)] hover:text-white focus-visible:bg-[var(--sf-sage)] focus-visible:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
                    aria-label={`${first}'s attendance`}
                  >
                    <ClipboardList className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
                    Attendance
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ─── Upcoming events ─────────────────────────────────────────────────────── */

export function EventsList({ events }: { events: HomeEvent[] }) {
  return (
    <section aria-labelledby="home-events">
      <SectionHeader
        id="home-events"
        title="Upcoming events"
        action={
          <Link href="/parent/calendar" className={linkSoft}>
            View all <Arrow />
          </Link>
        }
      />
      {events.length === 0 ? (
        <p className="rounded-[24px] bg-white/70 px-5 py-5 text-sm font-bold text-[var(--sf-soft)]">No upcoming events.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((evt) => {
            const { day, month, weekday } = getEventDayMonth(evt.event_date);
            const timeStr = formatEventTime(evt);
            return (
              <li key={evt.id} className="flex items-center gap-3.5 rounded-[24px] bg-white p-3 pr-4 shadow-[0_18px_40px_-30px_rgba(43,42,38,0.5)] ring-1 ring-[var(--sf-ink)]/[0.06]">
                <div
                  className="flex w-14 shrink-0 flex-col items-center overflow-hidden rounded-2xl bg-white ring-2"
                  style={{ borderColor: evt.color, ["--tw-ring-color" as string]: evt.color + "55" }}
                >
                  <span className="w-full py-0.5 text-center text-[10px] font-extrabold uppercase tracking-wide text-white" style={{ backgroundColor: evt.color }}>
                    {month}
                  </span>
                  <span className="sf-display pt-0.5 text-2xl leading-none" style={{ color: evt.color }}>
                    {day}
                  </span>
                  <span className="pb-1 text-[10px] font-bold uppercase text-[var(--sf-soft)]">{weekday}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[15px] font-extrabold leading-snug">{evt.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    {timeStr ? <span className="text-xs font-bold text-[var(--sf-soft)]">{timeStr}</span> : null}
                    {evt.category ? (
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-extrabold"
                        style={{ backgroundColor: evt.color + "22", color: evt.color }}
                      >
                        {evt.category}
                      </span>
                    ) : null}
                  </div>
                  {isFieldFridayCalendarEvent(evt) ? (
                    <Link
                      href="/parent/billing"
                      className="mt-2 inline-flex min-h-9 items-center gap-1 rounded-full bg-[var(--sf-coral-deep)] px-3 text-xs font-extrabold text-white shadow-[0_3px_0_0_#b85a4f] transition hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/40"
                    >
                      Register now! <Arrow className="h-3 w-3" />
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ─── Rewards ─────────────────────────────────────────────────────────────── */

export function RewardsPanel({
  earnedDollars,
  testimonialSubmitted,
}: {
  earnedDollars: number;
  testimonialSubmitted: boolean;
}) {
  return (
    <Link
      href="/parent/rewards"
      className="group relative block overflow-hidden rounded-[36px] bg-[var(--sf-ink)] p-6 text-[var(--sf-cream)] shadow-[0_30px_60px_-35px_rgba(43,42,38,0.8)] transition hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-butter)] sm:p-8"
    >
      <span className="sf-spin-slow pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border-[10px] border-dashed border-[var(--sf-butter)]/25" aria-hidden="true" />
      <span className="inline-flex items-center gap-2 rounded-full bg-[var(--sf-butter)] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wide text-[#5c4400]">
        ✨ Rewards
      </span>
      <h2 className="sf-display mt-4 text-[2rem] leading-[1.02] sm:text-[2.6rem]">
        Earn up to $<CountUp value={515} /> in gift cards
      </h2>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-[var(--sf-cream)]/75">
        Refer a family and share your story — we&apos;ll reward you for both.
        {earnedDollars > 0 ? (
          <span className="ml-1 font-extrabold text-[var(--sf-butter)]">${earnedDollars} earned so far.</span>
        ) : null}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-xs font-bold ring-1 ring-white/15">
          <Gift className="h-3.5 w-3.5 text-[var(--sf-mint)]" strokeWidth={2} aria-hidden="true" />
          Refer a Family · <strong>$500 gift card</strong>
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold ring-1 ${
            testimonialSubmitted ? "bg-white/5 text-white/55 ring-white/10" : "bg-white/10 ring-white/15"
          }`}
        >
          {testimonialSubmitted ? (
            <CheckIcon className="h-3.5 w-3.5 text-white/60" />
          ) : (
            <Coffee className="h-3.5 w-3.5 text-[var(--sf-peach)]" strokeWidth={2} aria-hidden="true" />
          )}
          Share Your Experience · <strong className={testimonialSubmitted ? "line-through" : ""}>$15 Starbucks</strong>
          {testimonialSubmitted ? <span className="sr-only">(done)</span> : null}
          {testimonialSubmitted ? <span aria-hidden="true">✓</span> : null}
        </span>
      </div>
      <span className="mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[var(--sf-butter)] px-5 text-sm font-extrabold text-[#5c4400] shadow-[0_4px_0_0_#c9a93f] transition group-hover:-translate-y-0.5">
        View Rewards <Arrow />
      </span>
    </Link>
  );
}

/* ─── Today's photos ──────────────────────────────────────────────────────── */

export function PhotosLink() {
  return (
    <Link
      href="/parent/photos"
      className="group flex items-center gap-4 rounded-[28px] bg-[var(--sf-sky)]/80 p-4 pr-5 transition hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sage)]/40"
    >
      <span
        className="sf-wiggle flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-white text-3xl shadow-[0_6px_14px_-8px_rgba(43,42,38,0.5)]"
        style={{ rotate: "-6deg" }}
        aria-hidden="true"
      >
        📸
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-extrabold leading-snug">Check out today&apos;s photos!</span>
        <span className="block text-sm font-bold text-[#2d5d86]">✨ New memories from school</span>
      </span>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--sf-ink)] transition group-hover:translate-x-0.5">
        <Arrow />
      </span>
    </Link>
  );
}

/* ─── Quick Actions ───────────────────────────────────────────────────────── */

type QuickAction = { label: string; icon: ElementType; href: string; tint: string };

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Pay Tuition", icon: CreditCard, href: "/parent/billing", tint: "bg-[var(--sf-mint)] text-[var(--sf-sage-deep)]" },
  { label: "Messages", icon: MessageCircle, href: "/parent/messages", tint: "bg-[var(--sf-sky)] text-[#2d5d86]" },
  { label: "Events", icon: CalendarDays, href: "/parent/calendar", tint: "bg-[var(--sf-lav)] text-[#6b3f86]" },
  { label: "Attendance", icon: ClipboardList, href: "/parent/children?tab=attendance", tint: "bg-[var(--sf-butter)] text-[#7a5b00]" },
  { label: "School Feed", icon: Rss, href: "/parent/feed", tint: "bg-[var(--sf-peach)] text-[#a2552e]" },
  { label: "My Children", icon: Users, href: "/parent/children", tint: "bg-[var(--sf-coral)]/25 text-[var(--sf-coral-deep)]" },
  { label: "Volunteer", icon: Heart, href: "/parent/volunteer", tint: "bg-[var(--sf-coral)]/25 text-[var(--sf-coral-deep)]" },
];

const tileClass =
  "group flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-[22px] bg-white p-3 text-center shadow-[0_3px_0_0_rgba(43,42,38,0.08)] ring-1 ring-[var(--sf-ink)]/[0.06] transition-all hover:-translate-y-1 hover:shadow-[0_6px_0_0_rgba(43,42,38,0.1)] focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] active:translate-y-0 cursor-pointer";

function TileFace({ icon: Icon, label, tint }: { icon: ElementType; label: string; tint: string }) {
  return (
    <>
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-transform group-hover:-rotate-6 group-focus-visible:-rotate-6 ${tint}`}>
        <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="text-xs font-extrabold leading-tight text-[var(--sf-ink)]">{label}</span>
    </>
  );
}

export function QuickActions({ onOpenHelp }: { onOpenHelp: () => void }) {
  return (
    <section aria-labelledby="home-quick-actions">
      <SectionHeader id="home-quick-actions" title="Quick Actions" />
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
        {QUICK_ACTIONS.map((a) => (
          <Link key={a.label} href={a.href} className={tileClass}>
            <TileFace icon={a.icon} label={a.label} tint={a.tint} />
          </Link>
        ))}
        <button type="button" onClick={onOpenHelp} className={tileClass}>
          <TileFace icon={HelpCircle} label="Help" tint="bg-[var(--sf-mint)] text-[var(--sf-sage-deep)]" />
        </button>
      </div>
    </section>
  );
}
