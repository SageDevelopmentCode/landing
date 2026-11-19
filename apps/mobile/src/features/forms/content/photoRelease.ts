// Legal copy moved verbatim from app/(tabs)/forms/photo-release.tsx. Do not edit the
// wording here without sign-off: typos are flagged, not fixed.
export const PHOTO_RELEASE_CONTRACT_ID = 5;

export const PHOTO_RELEASE_SECTIONS = [
  {
    heading: "Permission to Photograph, Record, and Use Likeness",
    paragraphs: [
      "1.1 — I, the undersigned parent or legal guardian, hereby grant Sage Field Private School (\"the School\") permission to photograph, video record, and otherwise capture images or likenesses of my child during school activities, programs, field trips, events, and related educational experiences.",
      "1.2 — I understand that these images and recordings may be used for educational, promotional, or informational purposes, including but not limited to the School's website, social media channels, newsletters, printed materials, grant applications, and community presentations.",
      "1.3 — This permission extends to the School's authorized staff, contractors, and volunteers acting in an official capacity for the School.",
    ],
  },
  {
    heading: "Scope of Use and Ownership",
    paragraphs: [
      "2.1 — All photographs, videos, and other media captured by Sage Field Private School staff or on behalf of the School are the property of Sage Field Private School.",
      "2.2 — The School may edit, crop, enhance, or otherwise modify media for use in materials described above.",
      "2.3 — The School will not sell images of students to third parties or use them in commercial advertising without separate, explicit written consent.",
    ],
  },
  {
    heading: "No Compensation and No Obligation to Use",
    paragraphs: [
      "3.1 — I understand that no compensation will be provided for the use of my child's likeness, and I waive any right to review or approve the final use of any image or recording before publication.",
      "3.2 — The School is under no obligation to use any image or recording and may choose not to publish or distribute specific materials at its discretion.",
    ],
  },
  {
    heading: "Release of Claims",
    paragraphs: [
      "4.1 — By signing this form, I release Sage Field Private School, its directors, staff, volunteers, and agents from any and all claims, liabilities, or causes of action arising out of or in connection with the use of photographs or recordings of my child as described herein.",
      "4.2 — This release applies to all current and future uses consistent with this agreement and shall remain in effect for the duration of my child's enrollment unless revoked in writing.",
    ],
  },
  {
    heading: "Duration and Revocation",
    paragraphs: [
      "6.1 — This consent is valid for the duration of my child's enrollment at Sage Field Private School. It may be revoked at any time by submitting a written notice to the director at sabrina@sagefield.co.",
      "6.2 — Revocation is effective upon receipt and applies to future use only. It does not apply retroactively to media already published or distributed.",
    ],
  },
  {
    heading: "Miscellaneous",
    paragraphs: [
      "7.1 — This agreement constitutes the entire understanding between the parties with respect to media consent and supersedes any prior verbal or written discussions on this subject.",
      "7.2 — If any provision of this agreement is found to be unenforceable, the remaining provisions shall remain in full force and effect.",
    ],
  },
];

export const CONSENT_LEVEL_LABELS: Record<string, string> = {
  FULL: "Full Consent",
  LIMITED: "Limited Consent",
  NO: "No Consent",
};

export const CONSENT_DESCRIPTIONS: Record<string, string> = {
  FULL: "My child's image and name may be used in all School materials, including website, social media, newsletters, print, and presentations.",
  LIMITED:
    "My child's image may be used in internal School materials only (e.g., newsletters sent to enrolled families). My child's image may NOT be used on public-facing platforms such as the website or social media.",
  NO: "I do not consent to any photography or video recording of my child for School use. My child will be excluded from group photos and media captures.",
};

export const SECTION_ACKNOWLEDGMENTS: Record<number, string> = {
  1: "Consent level acknowledgment — I acknowledge my selected consent level for my child's participation in photography and video recording at Sage Field.",
  2: "By signing below, I confirm that I have read and understood this Photo, Video, and Media Release in its entirety. I acknowledge my selected consent level for my child's participation in photography and video recording at Sage Field Academy. I understand that this consent may be revoked at any time in writing and that revocation applies to future use only. I enter this agreement freely and on behalf of my child, and I have the legal authority to grant or withhold consent as described herein.",
};
