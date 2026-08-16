import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { supabase } from "@/lib/supabase";

const IMPERSONATE_ID_KEY = "impersonate_parent_id";
const IMPERSONATE_NAME_KEY = "impersonate_parent_name";

export type UserRole = "super_admin" | "teacher" | "teacher_aide" | "parent" | "admin" | string;

type AuthContextValue = {
  userId: string | null;
  userRole: UserRole | null;
  effectiveParentId: string | null;
  parentViewUserId: string | null;
  isGrantee: boolean;
  ownerName: string | null;
  isImpersonating: boolean;
  impersonatedParentName: string | null;
  isReadOnlyPreview: boolean;
  startImpersonation: (parentId: string, parentName: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  userId: null,
  userRole: null,
  effectiveParentId: null,
  parentViewUserId: null,
  isGrantee: false,
  ownerName: null,
  isImpersonating: false,
  impersonatedParentName: null,
  isReadOnlyPreview: false,
  startImpersonation: async () => {},
  stopImpersonation: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function useReadOnlyPreview(): boolean {
  return useContext(AuthContext).isReadOnlyPreview;
}

async function resolveGrantForUser(userId: string): Promise<{
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

async function resolveActingParentId(parentId: string): Promise<string> {
  const { data: grant } = await supabase
    .schema("parent_app")
    .from("dashboard_access_grants")
    .select("owner_id")
    .eq("grantee_id", parentId)
    .eq("status", "active")
    .maybeSingle();

  return grant?.owner_id ?? parentId;
}

async function loadPersistedImpersonation(): Promise<{
  parentId: string | null;
  parentName: string | null;
}> {
  const [parentId, parentName] = await Promise.all([
    SecureStore.getItemAsync(IMPERSONATE_ID_KEY),
    SecureStore.getItemAsync(IMPERSONATE_NAME_KEY),
  ]);
  return { parentId, parentName };
}

async function clearPersistedImpersonation(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(IMPERSONATE_ID_KEY),
    SecureStore.deleteItemAsync(IMPERSONATE_NAME_KEY),
  ]);
}

type AuthState = {
  userId: string | null;
  userRole: UserRole | null;
  effectiveParentId: string | null;
  parentViewUserId: string | null;
  isGrantee: boolean;
  ownerName: string | null;
  impersonatedParentId: string | null;
  impersonatedParentName: string | null;
};

const EMPTY_STATE: AuthState = {
  userId: null,
  userRole: null,
  effectiveParentId: null,
  parentViewUserId: null,
  isGrantee: false,
  ownerName: null,
  impersonatedParentId: null,
  impersonatedParentName: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(EMPTY_STATE);

  const applySession = useCallback(
    async (
      userId: string,
      impersonatedParentId: string | null,
      impersonatedParentName: string | null,
    ) => {
      const { data: userRow } = await supabase
        .schema("admin")
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      const userRole = (userRow?.role as UserRole) ?? null;

      let activeId = impersonatedParentId;
      let activeName = impersonatedParentName;

      if (userRole !== "super_admin") {
        if (activeId) await clearPersistedImpersonation();
        activeId = null;
        activeName = null;
      }

      if (activeId) {
        setState({
          userId,
          userRole,
          effectiveParentId: activeId,
          parentViewUserId: activeId,
          isGrantee: false,
          ownerName: null,
          impersonatedParentId: activeId,
          impersonatedParentName: activeName,
        });
        return;
      }

      const grantResolved = await resolveGrantForUser(userId);
      const parentViewUserId = grantResolved.isGrantee
        ? grantResolved.effectiveParentId
        : userId;

      setState({
        userId,
        userRole,
        effectiveParentId: grantResolved.effectiveParentId,
        parentViewUserId,
        isGrantee: grantResolved.isGrantee,
        ownerName: grantResolved.ownerName,
        impersonatedParentId: null,
        impersonatedParentName: null,
      });
    },
    [],
  );

  const stopImpersonation = useCallback(async () => {
    await clearPersistedImpersonation();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await applySession(user.id, null, null);
  }, [applySession]);

  const startImpersonation = useCallback(
    async (parentId: string, parentName: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userRow } = await supabase
        .schema("admin")
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (userRow?.role !== "super_admin") return;

      const actingParentId = await resolveActingParentId(parentId);

      await Promise.all([
        SecureStore.setItemAsync(IMPERSONATE_ID_KEY, actingParentId),
        SecureStore.setItemAsync(IMPERSONATE_NAME_KEY, parentName),
      ]);

      await applySession(user.id, actingParentId, parentName);
    },
    [applySession],
  );

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const persisted = await loadPersistedImpersonation();
      await applySession(user.id, persisted.parentId, persisted.parentName);
    }
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        await clearPersistedImpersonation();
        setState(EMPTY_STATE);
      } else if (event === "SIGNED_IN") {
        const persisted = await loadPersistedImpersonation();
        await applySession(session.user.id, persisted.parentId, persisted.parentName);
      }
    });

    return () => subscription.unsubscribe();
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      userId: state.userId,
      userRole: state.userRole,
      effectiveParentId: state.effectiveParentId,
      parentViewUserId: state.parentViewUserId,
      isGrantee: state.impersonatedParentId ? false : state.isGrantee,
      ownerName: state.impersonatedParentId ? null : state.ownerName,
      isImpersonating: !!state.impersonatedParentId,
      impersonatedParentName: state.impersonatedParentName,
      isReadOnlyPreview: !!state.impersonatedParentId,
      startImpersonation,
      stopImpersonation,
    }),
    [state, startImpersonation, stopImpersonation],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
