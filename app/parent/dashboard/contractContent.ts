export interface ContractSection {
  id: number;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  afterBullets?: string[];
}

export const CONTRACT_5_SECTIONS: ContractSection[] = [
  {
    id: 1,
    title: "1. Permission to Photograph, Record, and Use Likeness",
    paragraphs: [
      '1.1 — I, the undersigned parent or legal guardian, hereby grant Sage Field Private School ("the School") permission to photograph, video record, and otherwise capture images or likenesses of my child during school activities, programs, field trips, events, and related educational experiences.',
      "1.2 — I understand that these images and recordings may be used for educational, promotional, or informational purposes, including but not limited to the School's website, social media channels, newsletters, printed materials, grant applications, and community presentations.",
      "1.3 — This permission extends to the School's authorized staff, contractors, and volunteers acting in an official capacity for the School.",
    ],
  },
  {
    id: 2,
    title: "2. Scope of Use and Ownership",
    paragraphs: [
      "2.1 — All photographs, videos, and other media captured by Sage Field Private School staff or on behalf of the School are the property of Sage Field Private School.",
      "2.2 — The School may edit, crop, enhance, or otherwise modify media for use in materials described above.",
      "2.3 — The School will not sell images of students to third parties or use them in commercial advertising without separate, explicit written consent.",
    ],
  },
  {
    id: 3,
    title: "3. No Compensation and No Obligation to Use",
    paragraphs: [
      "3.1 — I understand that no compensation will be provided for the use of my child's likeness, and I waive any right to review or approve the final use of any image or recording before publication.",
      "3.2 — The School is under no obligation to use any image or recording and may choose not to publish or distribute specific materials at its discretion.",
    ],
  },
  {
    id: 4,
    title: "4. Release of Claims",
    paragraphs: [
      "4.1 — By signing this form, I release Sage Field Private School, its directors, staff, volunteers, and agents from any and all claims, liabilities, or causes of action arising out of or in connection with the use of photographs or recordings of my child as described herein.",
      "4.2 — This release applies to all current and future uses consistent with this agreement and shall remain in effect for the duration of my child's enrollment unless revoked in writing.",
    ],
  },
  {
    id: 5,
    title: "5. Optional Levels of Consent",
    paragraphs: [
      "Please select your preferred level of consent for how your child's image may be used by Sage Field Private School. Your selection will be noted and honored throughout your child's enrollment.",
      "Full Consent — My child's image and name may be used in all School materials, including website, social media, newsletters, print, and presentations.",
      "Limited Consent — My child's image may be used in internal School materials only (e.g., newsletters sent to enrolled families). My child's image may NOT be used on public-facing platforms such as the website or social media.",
      "No Consent — I do not consent to any photography or video recording of my child for School use. My child will be excluded from group photos and media captures.",
    ],
  },
  {
    id: 6,
    title: "6. Duration and Revocation",
    paragraphs: [
      "6.1 — This consent is valid for the duration of my child's enrollment at Sage Field Private School. It may be revoked at any time by submitting a written notice to the director at sabrina@sagefield.co.",
      "6.2 — Revocation is effective upon receipt and applies to future use only. It does not apply retroactively to media already published or distributed.",
    ],
  },
  {
    id: 7,
    title: "7. Miscellaneous",
    paragraphs: [
      "7.1 — This agreement constitutes the entire understanding between the parties with respect to media consent and supersedes any prior verbal or written discussions on this subject.",
      "7.2 — If any provision of this agreement is found to be unenforceable, the remaining provisions shall remain in full force and effect.",
    ],
  },
];

export const CONTRACT_2_SECTIONS: ContractSection[] = [
  {
    id: 1,
    title: "1. Core Community Commitments",
    paragraphs: [
      "As a member of the Sage Field Private School community — whether as a family or staff member — I commit to upholding the following values and behaviors that make our community safe, respectful, and thriving:",
    ],
    bullets: [
      "Respect for All People: I will treat every child, parent, caregiver, and staff member with dignity and respect — regardless of background, ability, race, religion, family structure, or any other characteristic. I will not make derogatory remarks, engage in exclusionary behavior, or tolerate discrimination of any kind.",
      "Honest and Constructive Communication: I will communicate concerns directly, honestly, and respectfully. I will not gossip about other families or staff, spread rumors, or discuss community conflicts in front of children. If I have a concern, I will bring it to the appropriate person (staff member or director) through the proper channels.",
      "Support for Children's Learning and Wellbeing: I understand that children learn best in emotionally safe environments. I will not undermine staff authority, second-guess educators in front of children, or create tension that disrupts the learning environment. I trust the Sage Field team to make thoughtful educational decisions.",
      "Care for Shared Spaces and Property: I will model and encourage responsible care for all shared materials, outdoor spaces, and facilities. I will not damage, misuse, or allow my child to damage school property.",
      "Digital and Social Media Conduct: I will not post negative, disparaging, or identifying content about Sage Field staff, families, or children on social media or in online groups. If I have concerns or feedback, I will raise them directly with the director — not publicly online.",
      "Active Community Participation: I understand that Sage Field is a community — not just a service provider. I will show up, engage, and contribute to a positive culture. This includes volunteering when asked, attending community events, and supporting other families when I can.",
    ],
  },
  {
    id: 2,
    title: "2. Unacceptable Behaviors (Zero Tolerance)",
    paragraphs: [
      "The following behaviors are not acceptable in our community and may result in immediate disenrollment or termination of the staff relationship:",
    ],
    bullets: [
      "Physical aggression or threats toward any child, parent, or staff member",
      "Verbal abuse, harassment, or intimidation of staff or families",
      "Discrimination or hate speech of any kind",
      "Deliberate damage to school property",
      "Sharing private information about other families or children without consent",
      "Attempting to organize other families against staff or school leadership",
      "Persistent violations of this agreement after being formally warned",
    ],
  },
  {
    id: 3,
    title: "3. Conflict Resolution Process",
    paragraphs: [
      "We recognize that disagreements will sometimes arise. When they do, we ask that all parties follow this process:",
    ],
    bullets: [
      "Step 1 — Direct Conversation: Address the issue directly and respectfully with the person involved, when safe and appropriate to do so.",
      "Step 2 — Staff Involvement: If the issue involves a child's experience or classroom dynamic, bring it to the lead educator first.",
      "Step 3 — Director Review: If the issue is unresolved or involves a staff member, bring it to the director in writing or by requesting a meeting.",
      "Step 4 — Formal Resolution: The director will review the situation, speak with all involved parties, and make a final decision. That decision is binding.",
    ],
    afterBullets: [
      "Bypassing this process — for example, by confronting another parent or staff member publicly or escalating directly to legal threats without first attempting resolution — is itself a violation of this agreement.",
    ],
  },
  {
    id: 4,
    title: "4. Acknowledgment and Agreement",
    paragraphs: [
      "By signing this agreement, I acknowledge that I have read, understood, and agree to uphold the community standards described above. I understand that my participation in the Sage Field Private School community — as a family or staff member — comes with a shared responsibility to protect and nurture the culture we are building together. I agree that violations of this agreement may result in consequences up to and including disenrollment of my child or termination of my employment or contractor relationship with Sage Field Private School.",
    ],
  },
];

export const CONTRACT_1_SECTIONS: ContractSection[] = [
  {
    id: 1,
    title: "1. What Sage Field Is",
    paragraphs: [
      "Sage Field Private School is a nature-based micro-school offering small-group, project-driven learning for children ages 4-11. Our program integrates academic instruction with hands-on exploration, outdoor education, and community-centered learning.",
      "Sage Field is not a daycare or a traditional school. We operate as a private school. Parents who enroll their children agree to embrace our philosophy, structure, and community expectations as described in this document.",
    ],
  },
  {
    id: 2,
    title: "2. Program Schedule and Attendance",
    paragraphs: [
      "The program runs Monday through Thursday, with optional Friday enrichment sessions available for an additional fee. Core program hours are 9:00 AM – 3:00 PM. Drop-off begins at 8:45 AM; students must be picked up no later than 3:15 PM unless enrolled in extended care.",
    ],
    bullets: ["Friday sessions are optional add-ons and billed separately."],
  },
  {
    id: 3,
    title: "3. Tuition, Fees, and Payment",
    paragraphs: [
      "Tuition is due on the 1st of each month. A grace period of three (3) calendar days is provided. Accounts not paid by the 4th of the month will incur a $50 late fee.",
    ],
    bullets: [
      "Tuition is non-refundable.",
      "Registration fees are non-refundable under any circumstances.",
      "If an account remains unpaid for more than 30 days, your child's enrollment may be suspended until the balance is resolved.",
      "We accept payment via ACH bank transfer (lower processing fee), check, or credit card (a 3% processing fee applies to card payments).",
    ],
    afterBullets: [
      "Families experiencing financial hardship should contact the director to discuss payment plan options before a payment becomes overdue.",
    ],
  },
  {
    id: 4,
    title: "4. Withdrawal and Enrollment Changes",
    paragraphs: [
      "If you need to withdraw your child or change their enrollment, we require 30 days written notice. Tuition for the contracted commitment is still owed in full, regardless of attendance.",
      "To withdraw, email the director at sabrina@sagefield.co with your child's name, your name, and the intended last day of enrollment.",
    ],
    bullets: [
      "Withdrawing mid-contractual time does not entitle a family to a prorated refund.",
      "Re-enrollment after withdrawal is subject to availability and is not guaranteed.",
    ],
  },
  {
    id: 5,
    title: "5. Health, Illness, and Medication Policies",
    paragraphs: [
      "The health and safety of our entire community is a shared responsibility. Please keep your child home if they are sick.",
    ],
    bullets: [
      "Children must be fever-free (below 100.4°F) for at least 24 hours without fever-reducing medication before returning.",
      "Children with vomiting or diarrhea must remain home for 24 hours after the last episode.",
      "If a child becomes ill during the day, a parent or emergency contact will be called and the child must be picked up within one hour.",
      "Sage Field staff cannot administer prescription medication without a completed Medication Authorization Form on file.",
      "Emergency medication (e.g., EpiPens, inhalers) must be provided by the family and kept at the program site. An Emergency Medication Plan must be on file before the child's first day.",
    ],
    afterBullets: [
      "All students must have current immunization records on file. Exemptions require written documentation in accordance with applicable state law.",
    ],
  },
  {
    id: 6,
    title: "6. Outdoor Learning and Physical Activity",
    paragraphs: [
      "Outdoor education is a core part of the Sage Field experience. Students spend significant time outside in all weather conditions except for lightning, extreme heat (above 100°F), or conditions deemed unsafe by staff.",
    ],
    bullets: [
      "Please dress your child in layers and appropriate footwear daily.",
      "Sage Field is not liable for normal wear and tear on clothing or minor scrapes and bruises that occur during typical outdoor play and learning activities.",
      "Students may engage in hiking, gardening, building projects, and free outdoor exploration as part of the curriculum.",
    ],
    afterBullets: [
      "By enrolling your child, you acknowledge and accept that outdoor and nature-based activities carry inherent physical risks, and that Sage Field takes reasonable precautions to mitigate those risks.",
    ],
  },
  {
    id: 7,
    title: "7. Community Behavior Standards",
    paragraphs: [
      "Sage Field is built on respect — for people, for the natural world, and for the learning process. We ask all students and families to uphold these values.",
    ],
    bullets: [
      "Physical aggression, persistent bullying, or deliberate destruction of property will result in a restorative conversation with the child and a parent meeting. Repeated incidents may result in suspension or disenrollment.",
      "Students are expected to care for shared materials and outdoor spaces.",
      "Parents and caregivers are also expected to model respectful communication with staff and other families — in person and online.",
    ],
    afterBullets: [
      "Sage Field reserves the right to disenroll a student whose behavior, or whose family's behavior, is consistently disruptive to the community or unsafe for staff or other students. In such cases, a two-week notice will be given except in cases of immediate safety concerns.",
    ],
  },
  {
    id: 8,
    title: "8. Drop-Off, Pick-Up, and Authorized Persons",
    paragraphs: [
      "Student safety is our top priority. Only adults listed as authorized pickup persons on file may pick up your child.",
    ],
    bullets: [
      "Staff will ask for photo ID from any adult they do not recognize.",
      "If someone not on the authorized list arrives, the child will not be released until a parent or guardian on file gives explicit verbal confirmation.",
      "Late pick-up (after 3:15 PM) will be automatically enrolled into After Care. They will be charged the drop-in after-care rate in the next billing cycle.",
      "If you need to permanently or temporarily add or remove an authorized pickup person, submit a written update to the director.",
    ],
  },
  {
    id: 9,
    title: "9. Photo, Media, and Privacy",
    paragraphs: [
      "Sage Field may photograph or video students during program activities for use in our website, social media, newsletters, and other program materials. A separate Photo Release Form is required for this consent.",
    ],
    bullets: [
      "If you do not sign the Photo Release, your child will not be photographed or filmed for any published materials.",
      "Parents may not photograph or video other families' children without explicit consent from those families.",
      "All student records and personal information are kept confidential and will not be shared with third parties without your consent, except as required by law.",
    ],
  },
  {
    id: 10,
    title: "10. Emergency Procedures",
    paragraphs: [
      "In the event of a medical emergency, Sage Field staff will call 911 immediately and then contact the parent or guardian. We willnot wait for parental approval before calling emergency services.",
    ],
    bullets: [
      "In the event of evacuation (fire, gas leak, etc.), students will be moved to the designated assembly area and parents will be notified as soon as it is safe to do so.",
      "Please ensure your emergency contact information is always current. Update it in writing if it changes.",
      "Sage Field maintains a basic first aid kit on-site at all times. At least one staff member with current first aid and CPR certification is present during program hours.",
    ],
  },
  {
    id: 11,
    title: "11. Parent Participation and Communication",
    paragraphs: [
      "Sage Field is a community — parent involvement makes us stronger. We ask families to engage actively and respectfully.",
    ],
    bullets: [
      "Respond to important staff communications within 72 hours on school days.",
      "Read newsletters and updates sent through our primary communication channel (currently email).",
      "If you have concerns about your child's experience, please bring them to the director directly rather than discussing them with other families first.",
    ],
    afterBullets: [
      "We are committed to transparent, honest communication with families. We ask for the same in return.",
    ],
  },
  {
    id: 12,
    title: "12. Program Changes and Director Authority",
    paragraphs: [
      "Sage Field Private School reserves the right to update program schedules, policies, staff, and fees with reasonable notice (generally 30 days, except in cases of health or safety necessity).",
      "The director has final authority over all enrollment, curriculum, staffing, and behavior decisions. Families who repeatedly challenge staff authority or undermine the program culture may be asked to find alternative educational options for their child.",
    ],
  },
  {
    id: 13,
    title: "13. Final Acknowledgment",
    paragraphs: [
      "By signing each section of this document, I confirm that I have read, understood, and agree to the terms described in that section. I understand that this agreement governs my child's enrollment at Sage Field Private School and that violations of these terms may result in consequences up to and including disenrollment.",
      "I enter this agreement freely and understand that Sage Field Private School is acting in good faith to provide a safe, enriching, and community-centered learning environment for my child.",
    ],
  },
];
