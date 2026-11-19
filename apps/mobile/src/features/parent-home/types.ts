// Shared parent Home types (moved verbatim from (tabs)/home.tsx)

export type HomeApplicationRow = {
  id: string;
  student_id: string;
  status: string;
  program: string | null;
  drop_in_program: string | null;
  child_legal_name: string | null;
};

export type TeacherSuggestion = {
  id: string;
  full_name: string;
  profile_image_url: string | null;
};

export type NotifItem = {
  id: string;
  kind: "direct" | "channel";
  name: string;
  preview: string;
  timestamp: string;
  unreadCount: number;
  conversationId?: string;
  otherUserName?: string;
  otherUserAvatar?: string;
  otherUserId?: string;
  channelId?: string;
  channelName?: string;
  isMember?: boolean;
  isDefault?: boolean;
  memberCount?: number;
};

export type CalendarEvent = {
  id: string;
  title: string;
  event_date: string;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  color: string;
  category: string | null;
  description: string | null;
  location: string | null;
  attachment_links: string[] | null;
};

export type CommunityMessage = {
  body: string;
  senderName: string;
  senderImageUrl: string | null;
};

export type PendingPaymentPreview = {
  id: string;
  label: string;
  amount_cents: number | null;
  program: string;
  student_id: string | null;
  payment_type?: string;
};

export type HomeProgramCardDef = {
  image: any;
  programLabel: string;
  title: string;
  badge?: string;
  statusLine: string;
};

export type SelectedStudent = { id: string; name: string; grade: string | null };
