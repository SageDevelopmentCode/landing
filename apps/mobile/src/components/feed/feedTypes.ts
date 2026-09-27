export interface PostMediaRow {
  id: string;
  post_id: string;
  kind: "image" | "video";
  storage_url: string;
  display_order: number;
  duration_secs: number | null;
  signed_url: string | null;
}

export interface PostAttachmentRow {
  id: string;
  post_id: string;
  file_name: string;
  file_size_bytes: number | null;
  kind: "pdf" | "doc" | "sheet" | "other";
  storage_url: string;
}

export interface PostReactionRow {
  post_id: string;
  user_id: string;
  emoji: string;
}

export interface PostWithMeta {
  id: string;
  teacher_id: string;
  body: string;
  school_year: string | null;
  classroom: string | null;
  created_at: string;
  post_type: string | null;
  source_type: string | null;
  cta_label: string | null;
  cta_route: string | null;
  authorName: string;
  authorRole: string | null;
  authorProfileImageUrl: string | null;
  media: PostMediaRow[];
  attachments: PostAttachmentRow[];
  reactions: PostReactionRow[];
  commentCount: number;
}

export interface TeacherOption {
  id: string;
  full_name: string;
}
