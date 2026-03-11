"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Dancing_Script } from "next/font/google";
import type { SignatureMap, EnrollmentSignature } from "@/app/types/enrollment-signatures";
import { CONTRACT_6_ID } from "@/app/types/enrollment-signatures";
import SectionSignatureBlock from "./SectionSignatureBlock";
import type { Database } from "@/app/types/database.types";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

type Application = Database["parent_app"]["Tables"]["applications"]["Row"];

interface AssumptionOfRiskModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  parentId: string;
  parentName: string;
  app: Application;
  signatures: SignatureMap;
  onSectionSaved: (sig: EnrollmentSignature) => void;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs font-semibold font-body text-gray-500 w-36 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm font-body text-gray-800">{value}</span>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-bold font-heading text-gray-800 pb-2 border-b border-gray-100">
      {title}
    </h3>
  );
}

export default function AssumptionOfRiskModal({
  open,
  onClose,
  studentId,
  parentName,
  app,
  signatures,
  onSectionSaved,
}: AssumptionOfRiskModalProps) {
  const [localSigs, setLocalSigs] = useState<SignatureMap>(signatures);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const studentName = app.child_legal_name ?? "Student";
  const dob =
    app.dob_month && app.dob_day && app.dob_year
      ? `${app.dob_month}/${app.dob_day}/${app.dob_year}`
      : "—";

  const handleSectionSaved = (sectionId: number, sig: EnrollmentSignature) => {
    const key = `${CONTRACT_6_ID}-${sectionId}`;
    setLocalSigs({ ...localSigs, [key]: sig });
    onSectionSaved(sig);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className={dancingScript.variable}>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Right-side drawer */}
          <motion.div
            className="fixed inset-y-0 right-0 w-full max-w-3xl z-[70] bg-white flex flex-col shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="flex-shrink-0 sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-base font-bold font-heading text-gray-800">
                  Assumption of Risk and Liability Release
                </h2>
                <p className="text-xs text-gray-400 font-body mt-0.5">
                  {studentName} · {localSigs[`${CONTRACT_6_ID}-1`] ? "1" : "0"} of 1 sections signed
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex flex-col gap-10">

                {/* School header */}
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold font-heading text-gray-800">Sage Field Academy</p>
                  <p className="text-xs text-gray-500 font-body">EIN: 93-4410750</p>
                </div>

                {/* Pre-filled student/parent info */}
                <div className="flex flex-col gap-3 bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
                  <InfoRow label="Student Name" value={studentName} />
                  <InfoRow label="Grade" value={app.child_grade ?? "—"} />
                  <InfoRow label="Date of Birth" value={dob} />
                  <InfoRow label="Parent / Guardian" value={parentName} />
                </div>

                {/* 1. Acknowledgment of Risks */}
                <div className="flex flex-col gap-3">
                  <SectionHeader title="1. Acknowledgment of Risks" />
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    I, the undersigned parent or legal guardian, acknowledge that participation in the
                    educational, recreational, and extracurricular activities offered by Sage Field Academy
                    ("School") involves inherent risks. These risks may include, but are not limited to,
                    physical injury from falls, collisions, equipment use, or other participants; exposure
                    to communicable illness; emotional or psychological stress; allergic reactions; and
                    other unforeseen hazards that may arise during normal school activities, field trips,
                    outdoor education, and community events.
                  </p>
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    I understand that no environment can be made entirely risk-free and that Sage Field
                    Academy, while committed to maintaining a safe and supportive environment, cannot
                    guarantee complete freedom from injury or illness.
                  </p>
                </div>

                {/* 2. Assumption of Risk */}
                <div className="flex flex-col gap-3">
                  <SectionHeader title="2. Assumption of Risk" />
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    With full knowledge of the risks described above, I voluntarily enroll my child in
                    Sage Field Academy and authorize their participation in all school-sanctioned
                    activities. I freely and expressly assume all risks associated with such participation,
                    whether known or unknown, foreseeable or unforeseeable, including the risk of serious
                    injury, permanent disability, or death.
                  </p>
                </div>

                {/* 3. Release of Liability and Indemnification */}
                <div className="flex flex-col gap-3">
                  <SectionHeader title="3. Release of Liability and Indemnification" />
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    In consideration of my child&apos;s enrollment and participation, I, on behalf of myself,
                    my child, and our heirs, successors, and legal representatives, hereby release,
                    waive, discharge, and hold harmless Sage Field Academy, its officers, directors,
                    employees, volunteers, independent contractors, and agents (collectively, "Released
                    Parties") from any and all claims, demands, damages, liabilities, actions, or causes
                    of action — whether arising from negligence or otherwise — that may result from my
                    child&apos;s participation in school activities.
                  </p>
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    I further agree to indemnify and hold harmless the Released Parties from any claims
                    brought by or on behalf of my child arising out of or related to their participation
                    in school activities, including any claims arising from the negligence of the Released
                    Parties, to the fullest extent permitted by applicable law.
                  </p>
                </div>

                {/* 4. Scope and Limitations */}
                <div className="flex flex-col gap-3">
                  <SectionHeader title="4. Scope and Limitations" />
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    This Agreement applies to all activities conducted under the auspices of Sage Field
                    Academy, including but not limited to: on-campus instruction and activities, field
                    trips and off-site excursions, outdoor and nature-based education, school-sponsored
                    community events, and any transportation provided by or arranged by the School.
                  </p>
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    Nothing in this Agreement shall be construed to release any party from liability
                    arising from willful or grossly negligent conduct, or from any liability that cannot
                    be released as a matter of law.
                  </p>
                </div>

                {/* 5. Severability */}
                <div className="flex flex-col gap-3">
                  <SectionHeader title="5. Severability" />
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    If any provision of this Agreement is found to be unenforceable or invalid under
                    applicable law, such provision shall be modified to the minimum extent necessary to
                    make it enforceable, or, if modification is not possible, shall be severed from this
                    Agreement, while the remaining provisions shall continue in full force and effect.
                    This Agreement constitutes the entire understanding between the parties regarding
                    the assumption of risk and release of liability for{" "}
                    <span className="font-semibold text-gray-800">{studentName}</span>&apos;s participation
                    at Sage Field Academy.
                  </p>
                </div>

                {/* Releasor Acknowledgment + Signature */}
                <div className="flex flex-col gap-4">
                  <SectionHeader title="Releasor Acknowledgment" />
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    By signing below, I confirm that I have read and fully understand this Assumption
                    of Risk and Liability Release. I acknowledge that I am signing this Agreement freely
                    and voluntarily, without any duress or undue influence, and that I have had the
                    opportunity to seek independent legal counsel if desired. I represent that I have
                    the legal authority to execute this Agreement on behalf of my child.
                  </p>
                  <SectionSignatureBlock
                    sectionId={1}
                    contractId={CONTRACT_6_ID}
                    studentId={studentId}
                    parentName={parentName}
                    existingSig={localSigs[`${CONTRACT_6_ID}-1`]}
                    onSectionSaved={handleSectionSaved}
                  />
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
