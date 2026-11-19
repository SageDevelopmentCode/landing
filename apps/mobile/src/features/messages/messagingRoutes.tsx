// Route base for the shared messaging layer: parent screens live under
// /(tabs)/messages, staff screens under /(staff)/messages. Default = parent,
// so parent screens behave exactly as before without a provider.
import type { Href } from "expo-router";
import { createContext, useContext, type ReactNode } from "react";

export type MessagingAudience = "parent" | "staff";

export type MessagingRoutes = {
  audience: MessagingAudience;
  base: "/(tabs)/messages" | "/(staff)/messages";
  thread: "/(tabs)/messages/[id]" | "/(staff)/messages/[id]";
  channel: "/(tabs)/messages/channel/[channelId]" | "/(staff)/messages/channel/[channelId]";
  compose: "/(tabs)/messages/compose" | "/(staff)/messages/compose";
  /** Where tapping the other person's name in a DM header goes, or null when it isn't tappable. */
  profileFor: (otherId: string, name: string, role?: string | null) => Href | null;
  /** "Get Help" target on failures, or null for no help action. */
  helpHref: "/(tabs)/help" | null;
};

export const PARENT_MESSAGING_ROUTES: MessagingRoutes = {
  audience: "parent",
  base: "/(tabs)/messages",
  thread: "/(tabs)/messages/[id]",
  channel: "/(tabs)/messages/channel/[channelId]",
  compose: "/(tabs)/messages/compose",
  profileFor: (otherId, name) =>
    otherId ? { pathname: "/(tabs)/teacher/[teacherId]", params: { teacherId: otherId, teacherName: name } } : null,
  helpHref: "/(tabs)/help",
};

export const STAFF_MESSAGING_ROUTES: MessagingRoutes = {
  audience: "staff",
  base: "/(staff)/messages",
  thread: "/(staff)/messages/[id]",
  channel: "/(staff)/messages/channel/[channelId]",
  compose: "/(staff)/messages/compose",
  // Staff can open a colleague's profile; parents have no staff-side profile screen.
  profileFor: (otherId, name, role) =>
    otherId && (role === "teacher" || role === "super_admin")
      ? { pathname: "/(staff)/teacher/[teacherId]", params: { teacherId: otherId, teacherName: name } }
      : null,
  helpHref: null,
};

const Ctx = createContext<MessagingRoutes>(PARENT_MESSAGING_ROUTES);

export function MessagingRoutesProvider({ value, children }: { value: MessagingRoutes; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMessagingRoutes(): MessagingRoutes {
  return useContext(Ctx);
}
