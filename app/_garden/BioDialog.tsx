"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";
import type { TeamMember } from "./types";

/** Accessible bio modal (bottom sheet on phones) used by every variant's team section. */
export default function BioDialog({
  member,
  onClose,
  panelClassName = "bg-white text-gray-800",
  nameClassName = "",
}: {
  member: TeamMember | null;
  onClose: () => void;
  panelClassName?: string;
  nameClassName?: string;
}) {
  useEffect(() => {
    if (!member) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [member, onClose]);

  // Portals can't hydrate; render only after mount.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {member && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" data-lenis-prevent>
          <motion.button
            aria-label="Close bio"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${member.name} bio`}
            className={`relative w-full sm:max-w-2xl max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl ${panelClassName}`}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="grid sm:grid-cols-[220px_1fr]">
              <div className="relative h-72 sm:h-full min-h-72">
                <Image src={member.image} alt={member.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 220px" />
              </div>
              <div className="p-7 sm:p-9">
                <p className="text-xs uppercase tracking-[0.2em] opacity-60 mb-2">{member.role}</p>
                <h3 className={`text-3xl mb-4 ${nameClassName}`}>{member.name}</h3>
                <p className="leading-relaxed opacity-80">{member.description}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
