export interface EnrollmentSignature {
  id: string;
  parent_id: string;
  student_id: string;
  contract_id: number;
  section_id: number;
  printed_name: string;
  signature: string;
  signed_at: string;
  created_at: string;
}

// Keyed as `${contract_id}-${section_id}`
export type SignatureMap = Record<string, EnrollmentSignature>;
// Keyed by student_id
export type StudentSignatureMap = Record<string, SignatureMap>;

export const CONTRACT_1_ID = 1;
export const CONTRACT_1_TOTAL_SECTIONS = 13;

export const CONTRACT_2_ID = 2;
export const CONTRACT_2_TOTAL_SECTIONS = 4;

export const CONTRACT_3_ID = 3;
export const CONTRACT_3_TOTAL_SECTIONS = 3;

export const CONTRACT_4_ID = 4;
export const CONTRACT_4_TOTAL_SECTIONS = 1;

export const CONTRACT_5_ID = 5;
export const CONTRACT_5_TOTAL_SECTIONS = 2; // section_id=1: initials, section_id=2: final acknowledgment

export const CONTRACT_6_ID = 6;
export const CONTRACT_6_TOTAL_SECTIONS = 1; // single signature at bottom

export function isContractComplete(
  map: SignatureMap,
  contractId: number,
  totalSections: number
): boolean {
  for (let i = 1; i <= totalSections; i++) {
    if (!map[`${contractId}-${i}`]) return false;
  }
  return true;
}
