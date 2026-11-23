"use client";

import { useRef, useState } from "react";
import type { SignatureMap, EnrollmentSignature } from "@/app/types/enrollment-signatures";
import { CONTRACT_6_ID, CONTRACT_6_TOTAL_SECTIONS } from "@/app/types/enrollment-signatures";
import type { Database } from "@/app/types/database.types";
import GardenSheet from "./garden/EnrollmentSheet";
import SignatureBlock from "@/app/parent/_garden/SignatureBlock";
import { FactsCard, LegalText, SheetStep, SigningFooter, signedLabel, useScrollToSection } from "./garden/sheetParts";

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
  readOnly?: boolean;
  readOnlyPreview?: boolean;
}

export default function AssumptionOfRiskModal({
  open,
  onClose,
  studentId,
  parentName,
  app,
  signatures,
  onSectionSaved,
  readOnly,
  readOnlyPreview,
}: AssumptionOfRiskModalProps) {
  const [localSigs, setLocalSigs] = useState<SignatureMap>(signatures);
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollTo = useScrollToSection(bodyRef);

  const studentName = app.child_legal_name ?? "Student";
  const dob = app.dob_month && app.dob_day && app.dob_year ? `${app.dob_month}/${app.dob_day}/${app.dob_year}` : "—";
  const signed = !!localSigs[`${CONTRACT_6_ID}-1`];

  const handleSectionSaved = (sectionId: number, sig: EnrollmentSignature) => {
    setLocalSigs((prev) => ({ ...prev, [`${CONTRACT_6_ID}-${sectionId}`]: sig }));
    onSectionSaved(sig);
  };

  return (
    <GardenSheet
      open={open}
      onClose={onClose}
      size="wide"
      bodyRef={bodyRef}
      icon="⚠️"
      title="Assumption of Risk and Liability Release"
      note={`${studentName} · ${signedLabel(signed ? 1 : 0, CONTRACT_6_TOTAL_SECTIONS)}`}
      footer={
        <SigningFooter
          total={CONTRACT_6_TOTAL_SECTIONS}
          signed={signed ? 1 : 0}
          readOnly={readOnly}
          onClose={onClose}
          onNext={() => scrollTo("risk-sec-sign")}
        />
      }
    >
      <div className="flex flex-col gap-10 pt-2">
        <div>
          <p className="sf-display text-xl leading-tight">Sage Field Private School</p>
          <p className="text-xs font-bold text-[var(--sf-soft)]">EIN: 93-4410750</p>
        </div>

        <FactsCard
          rows={[
            { label: "Student Name", value: studentName },
            { label: "Grade", value: app.child_grade ?? "—" },
            { label: "Date of Birth", value: dob },
            { label: "Parent / Guardian", value: parentName },
          ]}
        />

        <SheetStep n={1} title="Acknowledgment of Risks">
          <LegalText>
            <p>
              I, the undersigned parent or legal guardian, acknowledge that participation in the educational, recreational, and extracurricular
              activities offered by Sage Field Private School &quot;School&quot; involves inherent risks. These risks may include, but are not
              limited to, physical injury from falls, collisions, equipment use, or other participants; exposure to communicable illness;
              emotional or psychological stress; allergic reactions; and other unforeseen hazards that may arise during normal school activities,
              field trips, outdoor education, and community events.
            </p>
            <p>
              I understand that no environment can be made entirely risk-free and that Sage Field Private School, while committed to maintaining
              a safe and supportive environment, cannot guarantee complete freedom from injury or illness.
            </p>
          </LegalText>
        </SheetStep>

        <SheetStep n={2} title="Assumption of Risk">
          <LegalText>
            <p>
              With full knowledge of the risks described above, I voluntarily enroll my child in Sage Field Private School and authorize their
              participation in all school-sanctioned activities. I freely and expressly assume all risks associated with such participation,
              whether known or unknown, foreseeable or unforeseeable, including the risk of serious injury, permanent disability, or death.
            </p>
          </LegalText>
        </SheetStep>

        <SheetStep n={3} title="Release of Liability and Indemnification">
          <LegalText>
            <p>
              In consideration of my child&apos;s enrollment and participation, I, on behalf of myself, my child, and our heirs, successors, and
              legal representatives, hereby release, waive, discharge, and hold harmless Sage Field Academy, its officers, directors, employees,
              volunteers, independent contractors, and agents (collectively, &quot;Released Parties&quot;) from any and all claims, demands,
              damages, liabilities, actions, or causes of action — whether arising from negligence or otherwise — that may result from my
              child&apos;s participation in school activities.
            </p>
            <p>
              I further agree to indemnify and hold harmless the Released Parties from any claims brought by or on behalf of my child arising out
              of or related to their participation in school activities, including any claims arising from the negligence of the Released
              Parties, to the fullest extent permitted by applicable law.
            </p>
          </LegalText>
        </SheetStep>

        <SheetStep n={4} title="Scope and Limitations">
          <LegalText>
            <p>
              This Agreement applies to all activities conducted under the auspices of Sage Field Private School, including but not limited to:
              on-campus instruction and activities, field trips and off-site excursions, outdoor and nature-based education, school-sponsored
              community events, and any transportation provided by or arranged by the School.
            </p>
            <p>
              Nothing in this Agreement shall be construed to release any party from liability arising from willful or grossly negligent conduct,
              or from any liability that cannot be released as a matter of law.
            </p>
          </LegalText>
        </SheetStep>

        <SheetStep n={5} title="Severability">
          <LegalText>
            <p>
              If any provision of this Agreement is found to be unenforceable or invalid under applicable law, such provision shall be modified
              to the minimum extent necessary to make it enforceable, or, if modification is not possible, shall be severed from this Agreement,
              while the remaining provisions shall continue in full force and effect. This Agreement constitutes the entire understanding between
              the parties regarding the assumption of risk and release of liability for{" "}
              <span className="font-extrabold text-[var(--sf-ink)]">{studentName}</span>&apos;s participation at Sage Field Private School.
            </p>
          </LegalText>
        </SheetStep>

        <SheetStep n={6} title="Releasor Acknowledgment" done={signed} id="risk-sec-sign">
          <LegalText>
            <p>
              By signing below, I confirm that I have read and fully understand this Assumption of Risk and Liability Release. I acknowledge that
              I am signing this Agreement freely and voluntarily, without any duress or undue influence, and that I have had the opportunity to
              seek independent legal counsel if desired. I represent that I have the legal authority to execute this Agreement on behalf of my
              child.
            </p>
          </LegalText>
          <SignatureBlock
            sectionId={1}
            contractId={CONTRACT_6_ID}
            studentId={studentId}
            parentName={parentName}
            existingSig={localSigs[`${CONTRACT_6_ID}-1`]}
            onSectionSaved={handleSectionSaved}
            readOnly={readOnly}
            readOnlyPreview={readOnlyPreview}
            label="Assumption of Risk"
          />
        </SheetStep>
      </div>
    </GardenSheet>
  );
}
