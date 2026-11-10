"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import Footer from "@/app/components/Footer";
import WaitlistDialog from "@/app/components/WaitlistDialog";
import FloatingSMSButton from "@/app/components/FloatingSMSButton";
import EnrollmentAnnouncementPopup from "@/app/components/EnrollmentAnnouncementPopup";
import ContactDialog from "@/app/components/ContactDialog";
import SmoothScroll from "./SmoothScroll";
import { usePastHero } from "./hooks";

type Dialogs = { openWaitlist: () => void; openContact: () => void };
const DialogsContext = createContext<Dialogs>({
  openWaitlist: () => {},
  openContact: () => {},
});

/** Open the shared interest-form / contact dialogs from any section. */
export const useDialogs = () => useContext(DialogsContext);

/**
 * Page chrome for Garden pages: smooth scroll, the announcement popup, footer,
 * waitlist + contact dialogs (open them with useDialogs()), and the floating
 * SMS button that appears once the visitor scrolls past the hero.
 */
export default function GardenShell({
  navbar,
  children,
  className = "",
}: {
  navbar: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const pastHero = usePastHero();

  return (
    <DialogsContext.Provider
      value={{
        openWaitlist: () => setWaitlistOpen(true),
        openContact: () => setContactOpen(true),
      }}
    >
      <SmoothScroll>
        <div className={`overflow-x-clip ${className}`}>
          {navbar}
          <main>{children}</main>
          <EnrollmentAnnouncementPopup />
          <Footer useShellDialogs />
        </div>
        <WaitlistDialog isOpen={waitlistOpen} onClose={() => setWaitlistOpen(false)} />
        <ContactDialog isOpen={contactOpen} onClose={() => setContactOpen(false)} />
        <AnimatePresence>{pastHero && <FloatingSMSButton />}</AnimatePresence>
      </SmoothScroll>
    </DialogsContext.Provider>
  );
}
