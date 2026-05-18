// ─── Types ────────────────────────────────────────────────────────────────────

export type InventoryCategory =
  | "Arts"
  | "Crafts"
  | "Science"
  | "Math"
  | "Writing"
  | "Sensory"
  | "Outdoor"
  | "General";

export type InventoryStatus = "Full" | "Running Out" | "Low" | null;

export type HistoryActionType =
  | "taken"
  | "restocked"
  | "photo_added"
  | "note_added"
  | "status_changed"
  | "shopping_requested"
  | "created";

export type ShoppingRequestStatus = "pending" | "approved" | "purchased";

export type InventoryPhoto = {
  id: string;
  url: string | null;
  uploaded_at: string;
  uploaded_by: string;
  is_primary: boolean;
};

export type HistoryEvent = {
  id: string;
  action_type: HistoryActionType;
  teacher_name: string;
  count_before: number | null;
  count_after: number | null;
  timestamp: string;
  note: string | null;
};

export type ShoppingRequest = {
  id: string;
  item_id: string;
  requested_by: string;
  note: string;
  status: ShoppingRequestStatus;
  created_at: string;
};

export type InventoryItem = {
  id: string;
  title: string;
  category: InventoryCategory;
  photos: InventoryPhoto[];
  status: InventoryStatus;
  count: number | null;
  notes: string | null;
  history_log: HistoryEvent[];
  shopping_requests: ShoppingRequest[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

export const ALL_CATEGORIES: InventoryCategory[] = [
  "Arts", "Crafts", "Science", "Math", "Writing", "Sensory", "Outdoor", "General",
];

export const STATUS_CONFIG: Record<
  NonNullable<InventoryStatus>,
  { label: string; bg: string; text: string; dot: string }
> = {
  Full:          { label: "Full",         bg: "bg-green-100",  text: "text-green-700", dot: "bg-green-500"  },
  "Running Out": { label: "Running Out",  bg: "bg-amber-100",  text: "text-amber-700", dot: "bg-amber-500"  },
  Low:           { label: "Low",          bg: "bg-red-100",    text: "text-red-600",   dot: "bg-red-500"    },
};

export const SHOPPING_STATUS_CONFIG: Record<
  ShoppingRequestStatus,
  { label: string; bg: string; text: string }
> = {
  pending:   { label: "Pending",   bg: "bg-amber-100", text: "text-amber-700" },
  approved:  { label: "Approved",  bg: "bg-blue-100",  text: "text-blue-700"  },
  purchased: { label: "Purchased", bg: "bg-green-100", text: "text-green-700" },
};

export const HISTORY_ACTION_LABELS: Record<HistoryActionType, string> = {
  taken:              "Item taken",
  restocked:          "Restocked",
  photo_added:        "Photo added",
  note_added:         "Note added",
  status_changed:     "Status updated",
  shopping_requested: "Purchase requested",
  created:            "Added to inventory",
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const MOCK_INVENTORY_ITEMS: InventoryItem[] = [
  // ── Arts ──────────────────────────────────────────────────────────────────
  {
    id: "inv-001",
    title: "Watercolor Paint Set",
    category: "Arts",
    photos: [
      {
        id: "ph-001a",
        url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop",
        uploaded_at: "2026-05-10T09:00:00Z",
        uploaded_by: "Ms. Rivera",
        is_primary: true,
      },
      {
        id: "ph-001b",
        url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&auto=format&fit=crop",
        uploaded_at: "2026-04-02T11:00:00Z",
        uploaded_by: "Ms. Rivera",
        is_primary: false,
      },
    ],
    status: "Low",
    count: 3,
    notes: "Several palettes have dried-out colors in the yellow and red sections. Order 2 new sets before the end-of-year projects.",
    history_log: [
      {
        id: "he-001a",
        action_type: "taken",
        teacher_name: "Ms. Rivera",
        count_before: 5,
        count_after: 3,
        timestamp: "2026-05-12T14:30:00Z",
        note: "Used for self-portrait project",
      },
      {
        id: "he-001b",
        action_type: "restocked",
        teacher_name: "Ms. Chen",
        count_before: 2,
        count_after: 5,
        timestamp: "2026-04-28T09:00:00Z",
        note: null,
      },
      {
        id: "he-001c",
        action_type: "shopping_requested",
        teacher_name: "Ms. Rivera",
        count_before: null,
        count_after: null,
        timestamp: "2026-04-20T10:00:00Z",
        note: "Need 2 new sets before May projects",
      },
      {
        id: "he-001d",
        action_type: "created",
        teacher_name: "Ms. Rivera",
        count_before: null,
        count_after: 2,
        timestamp: "2026-03-15T08:00:00Z",
        note: null,
      },
    ],
    shopping_requests: [
      {
        id: "sr-001a",
        item_id: "inv-001",
        requested_by: "Ms. Rivera",
        note: "Need 2 new sets before May projects — several palettes are dried out",
        status: "pending",
        created_at: "2026-04-20T10:00:00Z",
      },
    ],
  },
  {
    id: "inv-002",
    title: "Acrylic Paint — Primary Set",
    category: "Arts",
    photos: [
      {
        id: "ph-002a",
        url: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=600&auto=format&fit=crop",
        uploaded_at: "2026-04-15T10:00:00Z",
        uploaded_by: "Ms. Chen",
        is_primary: true,
      },
    ],
    status: "Full",
    count: 12,
    notes: null,
    history_log: [
      {
        id: "he-002a",
        action_type: "restocked",
        teacher_name: "Ms. Chen",
        count_before: 8,
        count_after: 12,
        timestamp: "2026-05-01T09:00:00Z",
        note: "Restocked from supply closet",
      },
      {
        id: "he-002b",
        action_type: "taken",
        teacher_name: "Ms. Rivera",
        count_before: 12,
        count_after: 8,
        timestamp: "2026-04-22T13:00:00Z",
        note: null,
      },
      {
        id: "he-002c",
        action_type: "created",
        teacher_name: "Ms. Chen",
        count_before: null,
        count_after: 12,
        timestamp: "2026-03-01T08:00:00Z",
        note: null,
      },
    ],
    shopping_requests: [],
  },

  // ── Crafts ────────────────────────────────────────────────────────────────
  {
    id: "inv-003",
    title: "Colored Cardstock (Ream)",
    category: "Crafts",
    photos: [
      {
        id: "ph-003a",
        url: "https://images.unsplash.com/photo-1586953983027-d5b5ebb4db1a?w=600&auto=format&fit=crop",
        uploaded_at: "2026-05-05T08:00:00Z",
        uploaded_by: "Ms. Torres",
        is_primary: true,
      },
    ],
    status: "Running Out",
    count: 40,
    notes: "Down to last 40 sheets. Mixed colors — heavy use of blue and yellow.",
    history_log: [
      {
        id: "he-003a",
        action_type: "taken",
        teacher_name: "Ms. Torres",
        count_before: 60,
        count_after: 40,
        timestamp: "2026-05-14T11:00:00Z",
        note: "Community map project",
      },
      {
        id: "he-003b",
        action_type: "note_added",
        teacher_name: "Ms. Torres",
        count_before: null,
        count_after: null,
        timestamp: "2026-05-10T09:00:00Z",
        note: "Blue and yellow running especially low",
      },
      {
        id: "he-003c",
        action_type: "created",
        teacher_name: "Ms. Torres",
        count_before: null,
        count_after: 100,
        timestamp: "2026-04-01T08:00:00Z",
        note: null,
      },
    ],
    shopping_requests: [],
  },
  {
    id: "inv-004",
    title: "Glue Sticks",
    category: "Crafts",
    photos: [
      {
        id: "ph-004a",
        url: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&auto=format&fit=crop",
        uploaded_at: "2026-04-20T09:00:00Z",
        uploaded_by: "Ms. Torres",
        is_primary: true,
      },
    ],
    status: "Full",
    count: 24,
    notes: null,
    history_log: [
      {
        id: "he-004a",
        action_type: "restocked",
        teacher_name: "Admin",
        count_before: 10,
        count_after: 24,
        timestamp: "2026-05-03T08:30:00Z",
        note: "Bulk order arrived",
      },
      {
        id: "he-004b",
        action_type: "created",
        teacher_name: "Ms. Torres",
        count_before: null,
        count_after: 10,
        timestamp: "2026-03-15T08:00:00Z",
        note: null,
      },
    ],
    shopping_requests: [],
  },

  // ── Science ───────────────────────────────────────────────────────────────
  {
    id: "inv-005",
    title: "Magnifying Glasses",
    category: "Science",
    photos: [
      {
        id: "ph-005a",
        url: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600&auto=format&fit=crop",
        uploaded_at: "2026-04-10T10:00:00Z",
        uploaded_by: "Mr. Walsh",
        is_primary: true,
      },
      {
        id: "ph-005b",
        url: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&auto=format&fit=crop",
        uploaded_at: "2026-03-20T10:00:00Z",
        uploaded_by: "Mr. Walsh",
        is_primary: false,
      },
    ],
    status: "Low",
    count: 4,
    notes: "Two have cracked lenses — still functional but should be replaced before outdoor science day.",
    history_log: [
      {
        id: "he-005a",
        action_type: "note_added",
        teacher_name: "Mr. Walsh",
        count_before: null,
        count_after: null,
        timestamp: "2026-05-08T10:00:00Z",
        note: "Two have cracked lenses",
      },
      {
        id: "he-005b",
        action_type: "taken",
        teacher_name: "Mr. Walsh",
        count_before: 6,
        count_after: 4,
        timestamp: "2026-04-30T14:00:00Z",
        note: "2 lost during outdoor science day",
      },
      {
        id: "he-005c",
        action_type: "shopping_requested",
        teacher_name: "Mr. Walsh",
        count_before: null,
        count_after: null,
        timestamp: "2026-05-08T10:05:00Z",
        note: "Need at least 6 for class rotation",
      },
      {
        id: "he-005d",
        action_type: "created",
        teacher_name: "Mr. Walsh",
        count_before: null,
        count_after: 6,
        timestamp: "2026-02-10T08:00:00Z",
        note: null,
      },
    ],
    shopping_requests: [
      {
        id: "sr-005a",
        item_id: "inv-005",
        requested_by: "Mr. Walsh",
        note: "Need at least 6 for class rotation — 2 lost on outdoor day and 2 have cracked lenses",
        status: "approved",
        created_at: "2026-05-08T10:05:00Z",
      },
    ],
  },
  {
    id: "inv-006",
    title: "Plant Growing Kits",
    category: "Science",
    photos: [
      {
        id: "ph-006a",
        url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop",
        uploaded_at: "2026-05-01T08:00:00Z",
        uploaded_by: "Mr. Walsh",
        is_primary: true,
      },
    ],
    status: null,
    count: 8,
    notes: "Currently in use for spring garden unit. Do not remove from classroom shelf.",
    history_log: [
      {
        id: "he-006a",
        action_type: "note_added",
        teacher_name: "Mr. Walsh",
        count_before: null,
        count_after: null,
        timestamp: "2026-05-05T09:00:00Z",
        note: "Currently in use — do not remove from classroom shelf",
      },
      {
        id: "he-006b",
        action_type: "created",
        teacher_name: "Mr. Walsh",
        count_before: null,
        count_after: 8,
        timestamp: "2026-04-28T08:00:00Z",
        note: "Purchased for spring science unit",
      },
    ],
    shopping_requests: [],
  },

  // ── Writing ───────────────────────────────────────────────────────────────
  {
    id: "inv-007",
    title: "Composition Notebooks",
    category: "Writing",
    photos: [
      {
        id: "ph-007a",
        url: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop",
        uploaded_at: "2026-03-10T08:00:00Z",
        uploaded_by: "Ms. Rivera",
        is_primary: true,
      },
    ],
    status: "Running Out",
    count: 5,
    notes: null,
    history_log: [
      {
        id: "he-007a",
        action_type: "taken",
        teacher_name: "Ms. Rivera",
        count_before: 12,
        count_after: 5,
        timestamp: "2026-05-13T09:00:00Z",
        note: "Distributed for journal writing unit",
      },
      {
        id: "he-007b",
        action_type: "created",
        teacher_name: "Ms. Rivera",
        count_before: null,
        count_after: 12,
        timestamp: "2026-03-01T08:00:00Z",
        note: null,
      },
    ],
    shopping_requests: [],
  },

  // ── Sensory ───────────────────────────────────────────────────────────────
  {
    id: "inv-008",
    title: "Kinetic Sand Tub",
    category: "Sensory",
    photos: [
      {
        id: "ph-008a",
        url: "https://images.unsplash.com/photo-1503455637927-730bce8583c0?w=600&auto=format&fit=crop",
        uploaded_at: "2026-04-05T10:00:00Z",
        uploaded_by: "Ms. Chen",
        is_primary: true,
      },
    ],
    status: "Full",
    count: null,
    notes: "Stored in sensory room cabinet, bottom shelf.",
    history_log: [
      {
        id: "he-008a",
        action_type: "note_added",
        teacher_name: "Ms. Chen",
        count_before: null,
        count_after: null,
        timestamp: "2026-04-05T10:00:00Z",
        note: "Moved to sensory room — bottom shelf of main cabinet",
      },
      {
        id: "he-008b",
        action_type: "created",
        teacher_name: "Ms. Chen",
        count_before: null,
        count_after: null,
        timestamp: "2026-03-20T08:00:00Z",
        note: null,
      },
    ],
    shopping_requests: [],
  },

  // ── Outdoor ───────────────────────────────────────────────────────────────
  {
    id: "inv-009",
    title: "Jump Ropes",
    category: "Outdoor",
    photos: [
      {
        id: "ph-009a",
        url: "https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=600&auto=format&fit=crop",
        uploaded_at: "2026-04-15T12:00:00Z",
        uploaded_by: "Ms. Torres",
        is_primary: true,
      },
    ],
    status: "Full",
    count: 10,
    notes: null,
    history_log: [
      {
        id: "he-009a",
        action_type: "created",
        teacher_name: "Ms. Torres",
        count_before: null,
        count_after: 10,
        timestamp: "2026-03-01T08:00:00Z",
        note: null,
      },
    ],
    shopping_requests: [],
  },

  // ── Math ──────────────────────────────────────────────────────────────────
  {
    id: "inv-010",
    title: "Counting Bears Set",
    category: "Math",
    photos: [
      {
        id: "ph-010a",
        url: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&auto=format&fit=crop",
        uploaded_at: "2026-04-20T09:00:00Z",
        uploaded_by: "Ms. Chen",
        is_primary: true,
      },
    ],
    status: "Low",
    count: 2,
    notes: "Down to 2 complete sets. Several bears missing from the other sets — individual bears scattered across classrooms.",
    history_log: [
      {
        id: "he-010a",
        action_type: "taken",
        teacher_name: "Ms. Chen",
        count_before: 4,
        count_after: 2,
        timestamp: "2026-05-10T10:00:00Z",
        note: "2 sets went home with students — unreturned",
      },
      {
        id: "he-010b",
        action_type: "shopping_requested",
        teacher_name: "Ms. Chen",
        count_before: null,
        count_after: null,
        timestamp: "2026-05-10T10:05:00Z",
        note: "Need 3 new sets",
      },
      {
        id: "he-010c",
        action_type: "created",
        teacher_name: "Ms. Chen",
        count_before: null,
        count_after: 4,
        timestamp: "2026-02-15T08:00:00Z",
        note: null,
      },
    ],
    shopping_requests: [
      {
        id: "sr-010a",
        item_id: "inv-010",
        requested_by: "Ms. Chen",
        note: "Need 3 new complete sets — 2 went home with students and never returned",
        status: "purchased",
        created_at: "2026-05-10T10:05:00Z",
      },
    ],
  },
];
