export type ContractDownloadKind =
  | "enrollment-item"
  | "static"
  | "shadow"
  | "friday"
  | "terms";

export type ContractDownloadCategory =
  | "enrollment"
  | "health"
  | "events"
  | "legal";

export type ContractDownloadEntry = {
  slug: string;
  title: string;
  description: string;
  category: ContractDownloadCategory;
  kind: ContractDownloadKind;
  enrollmentItemId?: number;
  staticHref?: string;
  staticFilename?: string;
};

export const CONTRACT_DOWNLOAD_CATALOG: ContractDownloadEntry[] = [
  {
    slug: "program-contract",
    title: "Program Description, Parent Responsibilities & Key Policies",
    description: "Enrollment program contract (13 sections).",
    category: "enrollment",
    kind: "enrollment-item",
    enrollmentItemId: 1,
  },
  {
    slug: "community-agreement",
    title: "Community Agreement for Families and Staff",
    description: "Community conduct and participation agreement.",
    category: "enrollment",
    kind: "enrollment-item",
    enrollmentItemId: 2,
  },
  {
    slug: "health-emergency-form",
    title: "Emergency Contact, Health, and Immunization Form",
    description: "Health and emergency contact information form.",
    category: "enrollment",
    kind: "enrollment-item",
    enrollmentItemId: 3,
  },
  {
    slug: "medication-plan",
    title: "Emergency Medication Plan on File",
    description: "Optional emergency medication authorization.",
    category: "enrollment",
    kind: "enrollment-item",
    enrollmentItemId: 4,
  },
  {
    slug: "photo-release",
    title: "Photo Release Form",
    description: "Photo, video, and media consent.",
    category: "enrollment",
    kind: "enrollment-item",
    enrollmentItemId: 6,
  },
  {
    slug: "assumption-of-risk",
    title: "Assumption of Risk and Liability Release",
    description: "School participation liability release.",
    category: "enrollment",
    kind: "enrollment-item",
    enrollmentItemId: 7,
  },
  {
    slug: "authorized-pickup",
    title: "Additional Authorized Pickup Person",
    description: "Authorized pickup contacts and signature.",
    category: "enrollment",
    kind: "enrollment-item",
    enrollmentItemId: 8,
  },
  {
    slug: "health-information-statement",
    title: "Health Information Form",
    description: "Health information statement options (parent portal).",
    category: "enrollment",
    kind: "enrollment-item",
    enrollmentItemId: 10,
  },
  {
    slug: "health-care-statement-pdf",
    title: "Health Care Statement (for physician)",
    description:
      "PDF for Option A — signed by a licensed health care professional.",
    category: "health",
    kind: "static",
    staticHref: "/sage-field-health-care-statement.pdf",
    staticFilename: "sage-field-health-care-statement.pdf",
  },
  {
    slug: "shadow-day-agreement",
    title: "Shadow Day Participant Agreement",
    description: "Waiver for shadow day visits.",
    category: "events",
    kind: "shadow",
  },
  {
    slug: "friday-race-agreement",
    title: "Thankful & Grateful Participant Agreement",
    description: "Field Friday participant waiver.",
    category: "events",
    kind: "friday",
  },
  {
    slug: "terms-of-use",
    title: "Terms of Use",
    description: "Website, parent portal, and mobile app terms.",
    category: "legal",
    kind: "terms",
  },
];

const CATEGORY_LABELS: Record<ContractDownloadCategory, string> = {
  enrollment: "Enrollment forms",
  health: "Health",
  events: "Events",
  legal: "Legal (site)",
};

export function getCatalogEntry(
  slug: string,
): ContractDownloadEntry | undefined {
  return CONTRACT_DOWNLOAD_CATALOG.find((e) => e.slug === slug);
}

export function getCatalogByCategory(): {
  category: ContractDownloadCategory;
  label: string;
  items: ContractDownloadEntry[];
}[] {
  const order: ContractDownloadCategory[] = [
    "enrollment",
    "health",
    "events",
    "legal",
  ];
  return order.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    items: CONTRACT_DOWNLOAD_CATALOG.filter((e) => e.category === category),
  }));
}