// Data for the parent Rewards area: the summary on the Rewards index, the
// referral list + link on Refer, and the testimonial on Share Your Experience.
// Queries, inserts, Discord payloads and error tags are unchanged.
import { useAuth, useReadOnlyPreview } from "@/contexts/AuthContext";
import { notifyDiscord, notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";

export type Result = { ok: boolean; error?: string };

export const REFERRAL_REWARD_DOLLARS = 500;

function countReferrals(refs: { status: string }[]) {
  return {
    referralCount: refs.length,
    enrolledCount: refs.filter((r) => r.status === "enrolled" || r.status === "rewarded").length,
    earnedDollars: refs.filter((r) => r.status === "rewarded").length * REFERRAL_REWARD_DOLLARS,
  };
}

// ─── Rewards index ───────────────────────────────────────────────────────────
export function useRewardsSummary() {
  const { userId, effectiveParentId } = useAuth();
  const [referralCount, setReferralCount] = useState(0);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [earnedDollars, setEarnedDollars] = useState(0);
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<Result> => {
    if (!effectiveParentId || !userId) return { ok: true };
    try {
      const [referralsResult, testimonialResult] = await Promise.all([
        supabase.schema("parent_app").from("referrals").select("status").eq("referrer_id", effectiveParentId),
        supabase.schema("marketing").from("testimonials").select("id").eq("parent_id", userId).limit(1),
      ]);
      if (referralsResult.error) throw referralsResult.error;

      const c = countReferrals(referralsResult.data ?? []);
      setReferralCount(c.referralCount);
      setEnrolledCount(c.enrolledCount);
      setEarnedDollars(c.earnedDollars);
      setTestimonialSubmitted((testimonialResult.data?.length ?? 0) > 0);
      setError(null);
      return { ok: true };
    } catch (e) {
      notifyError("rewards-index-load", e);
      const message = e instanceof Error ? e.message : String((e as any)?.message ?? e);
      setError(message);
      return { ok: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [effectiveParentId, userId]);

  // Reload whenever the screen is focused (e.g. after submitting a testimonial).
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { referralCount, enrolledCount, earnedDollars, testimonialSubmitted, loading, error, reload: load };
}

export type RewardsSummary = ReturnType<typeof useRewardsSummary>;

// ─── Refer a Family ──────────────────────────────────────────────────────────
export type HomeReferral = {
  id: string;
  referred_email: string | null;
  status: string;
  created_at: string;
};

export function useReferrals() {
  const { userId, effectiveParentId } = useAuth();
  const [referrals, setReferrals] = useState<HomeReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refCode = userId ? userId.replace(/-/g, "").slice(0, 8).toUpperCase() : "";
  const referralLink = refCode ? `https://sagefield.co/apply?ref=${refCode}` : "";

  const load = useCallback(async (): Promise<Result> => {
    if (!effectiveParentId || !userId) return { ok: true };
    try {
      const { data, error: qErr } = await supabase
        .schema("parent_app")
        .from("referrals")
        .select("id, referred_email, status, created_at")
        .eq("referrer_id", effectiveParentId)
        .order("created_at", { ascending: false });
      if (qErr) throw qErr;
      setReferrals(data ?? []);
      setError(null);
      return { ok: true };
    } catch (e) {
      notifyError("rewards-refer-load", e);
      const message = e instanceof Error ? e.message : String((e as any)?.message ?? e);
      setError(message);
      return { ok: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [effectiveParentId, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { referrals, referralLink, loading, error, reload: load, ...countReferrals(referrals) };
}

export type Referrals = ReturnType<typeof useReferrals>;

// ─── Share Your Experience ───────────────────────────────────────────────────
export function useTestimonial() {
  const { userId, effectiveParentId } = useAuth();
  const isReadOnlyPreview = useReadOnlyPreview();
  const [testimonialText, setTestimonialText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("your child");
  const [fullName, setFullName] = useState("");
  const [firstChildName, setFirstChildName] = useState("");

  useEffect(() => {
    if (!userId || !effectiveParentId) return;

    async function load() {
      try {
        const [userResult, studentsResult, testimonialResult] = await Promise.all([
          supabase.schema("admin").from("users").select("full_name").eq("id", userId).single(),
          supabase
            .schema("admin")
            .from("students")
            .select("child_legal_name")
            .eq("parent_id", effectiveParentId)
            .eq("is_deleted", false)
            .limit(1),
          supabase.schema("marketing").from("testimonials").select("id").eq("parent_id", userId).limit(1),
        ]);

        if (userResult.data?.full_name) {
          setFullName(userResult.data.full_name);
          setFirstName(userResult.data.full_name.split(" ")[0]);
        }
        const firstChild = studentsResult.data?.[0];
        if (firstChild?.child_legal_name) {
          setFirstChildName(firstChild.child_legal_name.split(" ")[0]);
        }
        if ((testimonialResult.data?.length ?? 0) > 0) setSubmitted(true);
      } catch (e) {
        notifyError("rewards-testimonial-load", e);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [userId, effectiveParentId]);

  const submit = useCallback(async (): Promise<Result> => {
    if (isReadOnlyPreview) return { ok: false, error: "read-only" };
    const trimmed = testimonialText.trim();
    if (!trimmed) return { ok: false };
    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      const { error } = await supabase.schema("marketing").from("testimonials").insert({
        parent_id: userId,
        parent_name: fullName || firstName,
        parent_email: session?.user?.email ?? "",
        child_name: firstChildName,
        testimonial: trimmed,
      });

      if (error) throw error;

      setSubmitted(true);
      setTestimonialText("");

      notifyDiscord({
        type: "testimonial_submitted",
        data: {
          parentName: fullName || firstName,
          parentEmail: session?.user?.email ?? "",
          childName: firstChildName,
          testimonial: trimmed,
        },
      });
      return { ok: true };
    } catch (e) {
      notifyError("rewards-testimonial-submit", e);
      return { ok: false, error: e instanceof Error ? e.message : String((e as any)?.message ?? e) };
    } finally {
      setSubmitting(false);
    }
  }, [isReadOnlyPreview, testimonialText, userId, fullName, firstName, firstChildName]);

  return {
    testimonialText,
    setTestimonialText,
    submitting,
    submitted,
    loading,
    firstChildName,
    submit,
  };
}

export type Testimonial = ReturnType<typeof useTestimonial>;
