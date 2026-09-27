import type { Router } from "expo-router";
import type { PostAttachmentRow } from "./feedTypes";

export function resolveFeedCtaRoute(
  route: string,
  staffMode: boolean,
): string {
  if (staffMode) {
    return route.replace("/(tabs)/", "/(staff)/");
  }
  return route.replace("/(staff)/", "/(tabs)/");
}

export function pushFeedCtaRoute(router: Router, route: string) {
  const [pathname, query = ""] = route.split("?");
  const params: Record<string, string> = {};
  if (query) {
    for (const segment of query.split("&")) {
      const [key, value] = segment.split("=");
      if (key && value) params[key] = decodeURIComponent(value);
    }
  }
  router.push({ pathname: pathname as never, params });
}

export function isManualFeedPost(sourceType: string | null): boolean {
  return !sourceType;
}

export function canDeleteFeedPost(
  post: { teacher_id: string; source_type: string | null },
  currentUserId: string | null,
  currentUserRole: string | null,
): boolean {
  if (!currentUserId) return false;
  if (currentUserRole === "super_admin") return true;
  return (
    post.teacher_id === currentUserId && isManualFeedPost(post.source_type)
  );
}

export function feedPostDeleteRpcName(currentUserRole: string | null): string {
  return currentUserRole === "super_admin"
    ? "moderate_delete_post"
    : "delete_own_post";
}

export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const d = Math.floor(diff / 86400);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function attachmentIcon(kind: PostAttachmentRow["kind"]): string {
  switch (kind) {
    case "pdf":
      return "document-text";
    case "doc":
      return "document";
    case "sheet":
      return "grid";
    default:
      return "attach";
  }
}

export function avatarColor(id: string): string {
  const colors = ["#C4A882", "#B8956A", "#7FA888", "#97C09B", "#6B9474", "#A67C5B"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  return colors[Math.abs(hash) % colors.length];
}

export function formatAuthorSubtitle(
  classroom: string | null,
  authorRole: string | null,
): string {
  if (classroom?.trim()) {
    const name = classroom.trim();
    return name.toLowerCase().includes("group") ? `${name} guide` : `${name} guide`;
  }
  if (authorRole === "super_admin" || authorRole === "teacher") {
    return "Teacher";
  }
  if (authorRole === "parent") {
    return "Parent";
  }
  if (!authorRole) {
    return "Community";
  }
  return authorRole.charAt(0).toUpperCase() + authorRole.slice(1);
}
