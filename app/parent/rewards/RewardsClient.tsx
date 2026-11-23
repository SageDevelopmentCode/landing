"use client";

import { useState } from "react";
import PortalShell from "@/app/parent/_garden/PortalShell";
import ReferralDialog from "@/app/parent/home/garden/ReferralDialog";
import type { RewardsReferral } from "./page";
import { ExperienceCard, ReferPanel } from "./garden/RewardCards";
import TestimonialSheet from "./garden/TestimonialSheet";

interface Props {
  referrals: RewardsReferral[];
  hasSubmittedTestimonial: boolean;
  /** The account the rewards belong to (the primary parent for shared-access co-parents). */
  effectiveParentId: string;
  studentFirstName: string;
}

export default function RewardsClient(props: Props) {
  return (
    <PortalShell>
      <RewardsContent {...props} />
    </PortalShell>
  );
}

function RewardsContent({ referrals, hasSubmittedTestimonial, effectiveParentId, studentFirstName }: Props) {
  const [referralOpen, setReferralOpen] = useState(false);
  const [testimonialOpen, setTestimonialOpen] = useState(false);
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(hasSubmittedTestimonial);

  const refCode = effectiveParentId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const referralLink = `https://sagefield.co/apply?ref=${refCode}`;
  const referralCount = referrals.length;
  const enrolledCount = referrals.filter((r) => r.status === "enrolled" || r.status === "rewarded").length;
  const earnedDollars = referrals.filter((r) => r.status === "rewarded").length * 500;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-8 sm:pt-12">
      <header className="max-w-2xl">
        <h1 className="sf-display text-[2.5rem] leading-[1.02] sm:text-[3.2rem]">Rewards</h1>
        <p className="mt-3 text-[15px] font-semibold leading-relaxed text-[var(--sf-soft)]">
          Earn rewards by referring families and sharing your experience.
        </p>
      </header>

      <div className="mt-8 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-10">
        <ReferPanel
          referralCount={referralCount}
          enrolledCount={enrolledCount}
          earnedDollars={earnedDollars}
          referralLink={referralLink}
          onOpenDetails={() => setReferralOpen(true)}
        />
        <ExperienceCard submitted={testimonialSubmitted} onOpen={() => setTestimonialOpen(true)} />
      </div>

      <ReferralDialog open={referralOpen} onClose={() => setReferralOpen(false)} referralLink={referralLink} />
      <TestimonialSheet
        open={testimonialOpen}
        onClose={() => setTestimonialOpen(false)}
        studentFirstName={studentFirstName}
        submitted={testimonialSubmitted}
        onSubmitted={() => setTestimonialSubmitted(true)}
      />
    </div>
  );
}
