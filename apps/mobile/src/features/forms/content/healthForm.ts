// Legal copy moved verbatim from app/(tabs)/forms/health-form.tsx. Do not edit the
// wording here without sign-off: typos are flagged, not fixed.
export const HEALTH_FORM_CONTRACT_ID = 3;

export const SIGNATURE_SECTIONS: Record<number, { title: string; text: string }> = {
  1: {
    title: "Over-the-Counter Medications Policy",
    text: "I understand and agree to Sage Field's Over-the-Counter Medications Policy as described above.",
  },
  2: {
    title: "Sunscreen, Lotion, and Topical Products",
    text: "I acknowledge Sage Field's policy on sunscreen, lotion, and topical products and give permission for staff to apply sunscreen to my child as needed during outdoor activities.",
  },
  3: {
    title: "Consent and Release",
    text: "I certify that all information provided in this form is true and accurate to the best of my knowledge. I authorize Sage Field Private School to provide first aid and emergency medical care for my child as necessary. I accept financial responsibility for any medical expenses incurred. I agree to notify Sage Field of any changes to my child's health information, emergency contacts, or insurance coverage.",
  },
};
