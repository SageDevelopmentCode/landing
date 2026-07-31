import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type AuthContextValue = {
  userId: string | null;
  effectiveParentId: string | null;
  isGrantee: boolean;
  ownerName: string | null;
};

const AuthContext = createContext<AuthContextValue>({
  userId: null,
  effectiveParentId: null,
  isGrantee: false,
  ownerName: null,
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

async function resolveEffectiveParentId(userId: string): Promise<{
  effectiveParentId: string;
  isGrantee: boolean;
  ownerName: string | null;
}> {
  const { data: grant } = await supabase
    .schema("parent_app")
    .from("dashboard_access_grants")
    .select("owner_id")
    .eq("grantee_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (!grant?.owner_id) {
    return { effectiveParentId: userId, isGrantee: false, ownerName: null };
  }

  const { data: ownerUser } = await supabase
    .schema("admin")
    .from("users")
    .select("full_name")
    .eq("id", grant.owner_id)
    .single();

  return {
    effectiveParentId: grant.owner_id,
    isGrantee: true,
    ownerName: ownerUser?.full_name ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthContextValue>({
    userId: null,
    effectiveParentId: null,
    isGrantee: false,
    ownerName: null,
  });

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const resolved = await resolveEffectiveParentId(user.id);
      setState({ userId: user.id, ...resolved });
    }
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setState({ userId: null, effectiveParentId: null, isGrantee: false, ownerName: null });
      } else if (event === "SIGNED_IN") {
        const uid = session.user.id;
        const resolved = await resolveEffectiveParentId(uid);
        setState({ userId: uid, ...resolved });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
