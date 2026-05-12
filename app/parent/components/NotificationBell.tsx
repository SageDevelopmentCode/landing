"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, MessageCircle, Hash } from "lucide-react";

export type NotificationItem = {
  id: string;
  kind: "direct" | "channel";
  name: string;
  preview: string;
  timestamp: string;
  unreadCount: number;
  otherUserId?: string;
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0)
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)
    return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function NotificationBell({
  items,
  totalUnread,
  baseMessagesPath = "/parent/messages",
}: {
  items: NotificationItem[];
  totalUnread: number;
  baseMessagesPath?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleItemClick(item: NotificationItem) {
    setOpen(false);
    if (item.kind === "direct") {
      router.push(`${baseMessagesPath}?recipientId=${item.otherUserId}`);
    } else {
      router.push(`${baseMessagesPath}?tab=community`);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1.5 rounded-md text-gray-500 hover:text-[#4a7c59] hover:bg-gray-50 transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-[#4a7c59] text-white text-[10px] font-semibold flex items-center justify-center px-0.5 leading-none">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-xl shadow-sm z-50">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Unread Messages
            </span>
            <Link
              href={baseMessagesPath}
              onClick={() => setOpen(false)}
              className="text-xs text-[#4a7c59] hover:underline font-body"
            >
              View all
            </Link>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400 font-body">
              No unread messages
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 flex items-start gap-3 cursor-pointer"
                >
                  <div className="mt-0.5 w-7 h-7 rounded-full bg-[#4a7c59]/10 flex items-center justify-center flex-shrink-0">
                    {item.kind === "direct" ? (
                      <MessageCircle className="w-3.5 h-3.5 text-[#4a7c59]" />
                    ) : (
                      <Hash className="w-3.5 h-3.5 text-[#4a7c59]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="text-sm font-semibold text-gray-800 truncate font-body">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-gray-400 font-body shrink-0">
                        {formatTime(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-body truncate mt-0.5">
                      {item.preview}
                    </p>
                    {item.unreadCount > 1 && (
                      <span className="mt-1 inline-flex items-center text-[10px] font-semibold text-[#4a7c59]">
                        {item.unreadCount} unread
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
