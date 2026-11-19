// Staff More menu data: the signed-in staff member's name and photo for the
// sheet header. Decoration only: failures are reported and the header falls
// back to initials / "More".
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";

const TAG = "staff-more-menu-profile";

export type StaffMoreMenuData = {
  fullName: string | null;
  firstName: string | null;
  photoUrl: string | null;
};

const EMPTY: StaffMoreMenuData = { fullName: null, firstName: null, photoUrl: null };

export function useStaffMoreMenu() {
  const { userId } = useAuth();
  const [data, setData] = useState<StaffMoreMenuData>(EMPTY);
  const seqRef = useRef(0);

  const load = useCallback(async () => {
    if (!userId) return;
    const seq = ++seqRef.current;
    try {
      const { data: row, error } = await supabase
        .schema("admin")
        .from("users")
        .select("full_name, profile_image_url")
        .eq("id", userId)
        .maybeSingle();
      if (seq !== seqRef.current) return;
      if (error) {
        void notifyError(TAG, error);
        return;
      }
      const full = (row as { full_name?: string | null } | null)?.full_name?.trim() || null;
      setData({
        fullName: full,
        firstName: full ? full.split(/\s+/)[0] : null,
        photoUrl: (row as { profile_image_url?: string | null } | null)?.profile_image_url ?? null,
      });
    } catch (e) {
      void notifyError(TAG, e);
    }
  }, [userId]);

  // Quiet first load so the sheet opens already filled in.
  useEffect(() => {
    setData(EMPTY);
    void load();
  }, [load]);

  return { ...data, reload: load };
}
