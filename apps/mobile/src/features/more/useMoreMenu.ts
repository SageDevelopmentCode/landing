// More menu data: the parent's name/photo for the sheet header and live,
// read-only nudges for the tiles (tuition payments due). Everything here is
// optional decoration — failures are reported and the menu falls back to plain
// tiles + initials.
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";

const TAG = "more-menu-nudges";

export type MoreMenuData = {
  fullName: string | null;
  firstName: string | null;
  photoUrl: string | null;
  /** Pending tuition/payment requests for this family. */
  tuitionDue: number;
  loaded: boolean;
};

const EMPTY: MoreMenuData = {
  fullName: null,
  firstName: null,
  photoUrl: null,
  tuitionDue: 0,
  loaded: false,
};

export function useMoreMenu() {
  const { userId, parentViewUserId, effectiveParentId } = useAuth();
  const profileId = parentViewUserId ?? userId;
  const [data, setData] = useState<MoreMenuData>(EMPTY);
  const seqRef = useRef(0);

  const load = useCallback(async () => {
    if (!profileId) return;
    const seq = ++seqRef.current;
    try {
      const [profileRes, dueRes] = await Promise.all([
        supabase
          .schema("admin")
          .from("users")
          .select("full_name, profile_image_url")
          .eq("id", profileId)
          .maybeSingle(),
        effectiveParentId
          ? supabase
              .schema("billing")
              .from("pending_payment_requests")
              .select("id", { count: "exact", head: true })
              .eq("parent_id", effectiveParentId)
              .eq("status", "pending")
          : Promise.resolve({ count: 0, error: null }),
      ]);
      if (seq !== seqRef.current) return;
      if (profileRes.error) void notifyError(TAG, profileRes.error);
      if (dueRes.error) void notifyError(TAG, dueRes.error);

      const full = (profileRes.data as { full_name?: string | null } | null)?.full_name ?? null;
      setData((prev) => ({
        fullName: profileRes.error ? prev.fullName : full,
        firstName: profileRes.error ? prev.firstName : (full?.trim().split(/\s+/)[0] ?? null),
        photoUrl: profileRes.error
          ? prev.photoUrl
          : ((profileRes.data as { profile_image_url?: string | null } | null)?.profile_image_url ?? null),
        tuitionDue: dueRes.error ? prev.tuitionDue : (dueRes.count ?? 0),
        loaded: true,
      }));
    } catch (e) {
      void notifyError(TAG, e);
      if (seq === seqRef.current) setData((prev) => ({ ...prev, loaded: true }));
    }
  }, [profileId, effectiveParentId]);

  // Quiet first load so the sheet opens already filled in.
  useEffect(() => {
    setData(EMPTY);
    void load();
  }, [load]);

  return { ...data, reload: load };
}
