"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ContactDialog from "../components/ContactDialog";
import WaitlistDialog from "../components/WaitlistDialog";
import FloatingSMSButton from "../components/FloatingSMSButton";
import AcademicCalendarView from "../components/academic-calendar/AcademicCalendarView";

export default function AcademicCalendarPage() {
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isWaitlistDialogOpen, setIsWaitlistDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      <AcademicCalendarView
        variant="public"
        onEnroll={() => setIsWaitlistDialogOpen(true)}
        onContact={() => setIsContactDialogOpen(true)}
      />

      <Footer />

      <ContactDialog
        isOpen={isContactDialogOpen}
        onClose={() => setIsContactDialogOpen(false)}
      />
      <WaitlistDialog
        isOpen={isWaitlistDialogOpen}
        onClose={() => setIsWaitlistDialogOpen(false)}
      />
      <FloatingSMSButton />
    </div>
  );
}
