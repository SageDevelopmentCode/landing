// Legal copy moved verbatim from app/(tabs)/forms/health-statement.tsx. Do not edit the
// wording here without sign-off: typos are flagged, not fixed.
export const HEALTH_STATEMENT_CONTRACT_ID = 8;

export const OPTION_TYPE_CONTENT: Record<
  string,
  { label: string; optionLabel: string; text: string }
> = {
  professional: {
    label: "Health Care Professional Examination",
    optionLabel:
      "My child has been examined by a health care professional within the past year",
    text: "I hereby certify that my child has been examined by a licensed health care professional within the past year and is in satisfactory health to attend school. I agree to have the Health Care Statement form signed by my child's health care professional and email the completed form to sabrina@sagefield.co within the current school year.",
  },
  religious: {
    label: "Religious Exemption",
    optionLabel:
      "Religious exemption — I object to physical examination of my child on religious grounds",
    text: "I object to the physical examination of my child on religious grounds. I understand that I must provide a signed, dated, and notarized affidavit stating my religious objection to such examination. This affidavit must be kept on file with Sage Field Private School.",
  },
};

export const SIGNATURE_ACKNOWLEDGMENT =
  "By signing below, I certify that the information provided is accurate and complete to the best of my knowledge, and I authorize Sage Field Private School to maintain this health information on file for my child.";
