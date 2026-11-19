// Who is using the staff app: id + role from AuthContext (already loaded from
// admin.users at sign-in). Owner / super-admin gating reads from here so
// admin-only affordances render as plain views for everyone else (staff.md).
import { useAuth } from "@/contexts/AuthContext";

export function useStaffRole() {
  const { userId, userRole } = useAuth();
  const isSuperAdmin = userRole === "super_admin";
  return {
    userId,
    role: userRole,
    isSuperAdmin,
    /** True when the signed-in user created the thing. */
    isOwner: (createdBy: string | null | undefined) => !!userId && createdBy === userId,
  };
}

export type StaffRole = ReturnType<typeof useStaffRole>;
