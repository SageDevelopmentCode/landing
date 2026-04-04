"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Video,
  Paperclip,
  MoreHorizontal,
  MessageCircle,
  Play,
  FileText,
  Send,
  X,
  ArrowLeft,
} from "lucide-react";
import { DetailSidebar } from "@/app/admin/components/DetailSidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

type MediaItem =
  | { type: "image"; color: string; label: string }
  | { type: "video"; color: string; duration: string; label: string };

type Attachment = {
  name: string;
  size: string;
  kind: "pdf" | "doc" | "sheet" | "other";
};

type Reaction = { emoji: string; count: number; label: string };

type Comment = {
  id: string;
  author: string;
  initials: string;
  avatarColor: string;
  text: string;
  timestamp: string;
};

type Post = {
  id: string;
  author: string;
  initials: string;
  avatarColor: string;
  role: string;
  timestamp: string;
  body: string;
  media: MediaItem[];
  attachments: Attachment[];
  reactions: Reaction[];
  comments: Comment[];
};

// ─── Placeholder Data ─────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-[#4a7c59]",
  "bg-[#5a6b8a]",
  "bg-[#8a5a6b]",
  "bg-[#7c6b4a]",
  "bg-[#6b7c4a]",
];

const PLACEHOLDER_POSTS: Post[] = [
  {
    id: "1",
    author: "Ms. Rivera",
    initials: "MR",
    avatarColor: "bg-[#4a7c59]",
    role: "Lead Teacher",
    timestamp: "Today at 10:32 AM",
    body:
      "What an incredible morning! Our students dove into their end-of-term art projects and the creativity was absolutely overflowing. Everyone brought their own unique vision — from mixed-media collages to watercolor landscapes. I'm so proud of each one of them. 🎨",
    media: [
      { type: "image", color: "bg-amber-100", label: "Art 1" },
      { type: "image", color: "bg-rose-100", label: "Art 2" },
      { type: "image", color: "bg-sky-100", label: "Art 3" },
    ],
    attachments: [],
    reactions: [
      { emoji: "❤️", count: 18, label: "Love" },
      { emoji: "🎉", count: 11, label: "Celebrate" },
      { emoji: "😊", count: 7, label: "Smile" },
      { emoji: "👏", count: 9, label: "Clap" },
    ],
    comments: [
      { id: "c1", author: "Sarah M.", initials: "SM", avatarColor: AVATAR_COLORS[1], text: "This made my whole morning! My daughter talked about this project all week.", timestamp: "10:45 AM" },
      { id: "c2", author: "James T.", initials: "JT", avatarColor: AVATAR_COLORS[2], text: "Thank you for sharing — the watercolor one looks amazing!", timestamp: "11:02 AM" },
      { id: "c3", author: "Priya K.", initials: "PK", avatarColor: AVATAR_COLORS[3], text: "Can we get prints?? 😂 These are museum-worthy!", timestamp: "11:15 AM" },
      { id: "c4", author: "Marcus L.", initials: "ML", avatarColor: AVATAR_COLORS[4], text: "My son was so excited last night. You all are amazing teachers.", timestamp: "11:28 AM" },
      { id: "c5", author: "Diane W.", initials: "DW", avatarColor: AVATAR_COLORS[0], text: "Absolutely beautiful. Thank you Ms. Rivera!", timestamp: "12:01 PM" },
    ],
  },
  {
    id: "2",
    author: "Mr. Chen",
    initials: "MC",
    avatarColor: "bg-[#5a6b8a]",
    role: "Teacher",
    timestamp: "Today at 9:15 AM",
    body:
      "Morning circle was especially magical today. We talked about gratitude and each student shared one thing they were thankful for. The answers were so pure and honest — you would have loved it. I recorded a short clip to share the moment with you all.",
    media: [
      { type: "video", color: "bg-indigo-100", duration: "0:42", label: "Morning Circle" },
    ],
    attachments: [],
    reactions: [
      { emoji: "❤️", count: 24, label: "Love" },
      { emoji: "😊", count: 14, label: "Smile" },
      { emoji: "🙏", count: 6, label: "Grateful" },
    ],
    comments: [
      { id: "c6", author: "Toni R.", initials: "TR", avatarColor: AVATAR_COLORS[2], text: "I'm not crying, you're crying 🥹", timestamp: "9:22 AM" },
      { id: "c7", author: "Ben A.", initials: "BA", avatarColor: AVATAR_COLORS[3], text: "Lena said she was thankful for 'the smell of rain' — that's the most poetic thing I've ever heard.", timestamp: "9:35 AM" },
      { id: "c8", author: "Yuki N.", initials: "YN", avatarColor: AVATAR_COLORS[4], text: "This is exactly why we chose Sage Field. Thank you Mr. Chen.", timestamp: "9:58 AM" },
    ],
  },
  {
    id: "3",
    author: "Ms. Rivera",
    initials: "MR",
    avatarColor: "bg-[#4a7c59]",
    role: "Lead Teacher",
    timestamp: "Yesterday at 3:45 PM",
    body:
      "Here is this week's classroom summary — covering our learning themes, upcoming events, and a few notes on what we're focusing on next week. It's a quick read and full of good stuff. Give it a look when you get a chance!",
    media: [],
    attachments: [
      { name: "Week 14 Classroom Summary.pdf", size: "1.2 MB", kind: "pdf" },
      { name: "Next Week Schedule.docx", size: "340 KB", kind: "doc" },
    ],
    reactions: [
      { emoji: "👏", count: 8, label: "Clap" },
      { emoji: "❤️", count: 5, label: "Love" },
    ],
    comments: [
      { id: "c9", author: "Fatima O.", initials: "FO", avatarColor: AVATAR_COLORS[1], text: "Thank you for keeping us so informed — this is so helpful!", timestamp: "4:02 PM" },
      { id: "c10", author: "Carlos V.", initials: "CV", avatarColor: AVATAR_COLORS[2], text: "Just read through it — love the new reading corner idea!", timestamp: "4:30 PM" },
    ],
  },
  {
    id: "4",
    author: "Ms. Park",
    initials: "MP",
    avatarColor: "bg-[#8a5a6b]",
    role: "Teacher",
    timestamp: "Yesterday at 11:20 AM",
    body:
      "Our nature walk this morning was absolutely breathtaking. We spotted three different bird species, found mushrooms growing on a fallen oak, and learned about the water cycle right from the stream. Nature is the best classroom there is. 🌿",
    media: [
      { type: "image", color: "bg-emerald-100", label: "Trail" },
      { type: "image", color: "bg-lime-100", label: "Stream" },
      { type: "image", color: "bg-green-100", label: "Mushrooms" },
      { type: "image", color: "bg-teal-100", label: "Birds" },
      { type: "image", color: "bg-cyan-100", label: "Group" },
    ],
    attachments: [],
    reactions: [
      { emoji: "🌿", count: 15, label: "Nature" },
      { emoji: "❤️", count: 21, label: "Love" },
      { emoji: "😮", count: 9, label: "Wow" },
      { emoji: "🎉", count: 6, label: "Celebrate" },
    ],
    comments: [
      { id: "c11", author: "Mia S.", initials: "MS", avatarColor: AVATAR_COLORS[0], text: "My daughter came home and told us all about the mushrooms for 20 minutes straight 😂", timestamp: "11:45 AM" },
      { id: "c12", author: "Theo B.", initials: "TB", avatarColor: AVATAR_COLORS[3], text: "These photos are stunning. Thank you for taking us along!", timestamp: "12:10 PM" },
      { id: "c13", author: "Aisha M.", initials: "AM", avatarColor: AVATAR_COLORS[4], text: "This is incredible. He keeps asking when the next walk is!", timestamp: "12:30 PM" },
    ],
  },
  {
    id: "5",
    author: "Mr. Chen",
    initials: "MC",
    avatarColor: "bg-[#5a6b8a]",
    role: "Teacher",
    timestamp: "2 days ago",
    body:
      "Quick reminder that tomorrow is Show & Tell! Students are welcome to bring anything meaningful to them — a toy, a photo, a book, even a drawing they made. There's no wrong answer. We can't wait to see what everyone shares. See you in the morning! ☀️",
    media: [],
    attachments: [],
    reactions: [
      { emoji: "😊", count: 12, label: "Smile" },
      { emoji: "👍", count: 7, label: "Thumbs Up" },
    ],
    comments: [
      { id: "c14", author: "Leo F.", initials: "LF", avatarColor: AVATAR_COLORS[1], text: "Thank you for the heads up! He's already picking out what to bring.", timestamp: "Yesterday" },
      { id: "c15", author: "Nina C.", initials: "NC", avatarColor: AVATAR_COLORS[2], text: "She's been asking if she can bring her fish. We said no 😅", timestamp: "Yesterday" },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function AuthorAvatar({ initials, color, size = "md" }: { initials: string; color: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-11 h-11 text-base" };
  return (
    <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function FileIcon({ kind }: { kind: Attachment["kind"] }) {
  const map = {
    pdf: { bg: "bg-rose-50", text: "text-rose-500", label: "PDF" },
    doc: { bg: "bg-blue-50", text: "text-blue-500", label: "DOC" },
    sheet: { bg: "bg-emerald-50", text: "text-emerald-500", label: "XLS" },
    other: { bg: "bg-gray-100", text: "text-gray-500", label: "FILE" },
  };
  const { bg, text, label } = map[kind];
  return (
    <div className={`${bg} ${text} w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0`}>
      <FileText className="w-4 h-4" />
    </div>
  );
}

function MediaGrid({ media }: { media: MediaItem[] }) {
  if (media.length === 0) return null;

  const renderItem = (item: MediaItem, className: string) => (
    <div key={item.label} className={`${item.color} ${className} relative overflow-hidden flex items-center justify-center`}>
      {item.type === "video" ? (
        <>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-md">
              <Play className="w-5 h-5 text-gray-700 ml-0.5" fill="currentColor" />
            </div>
            <span className="text-white text-xs font-medium bg-black/40 px-2 py-0.5 rounded-full">{item.duration}</span>
          </div>
        </>
      ) : (
        <ImageIcon className="w-6 h-6 text-gray-300" />
      )}
    </div>
  );

  if (media.length === 1) {
    return (
      <div className="mt-3 rounded-xl overflow-hidden">
        {renderItem(media[0], "w-full h-64")}
      </div>
    );
  }

  if (media.length === 2) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
        {media.map((item) => renderItem(item, "h-52"))}
      </div>
    );
  }

  if (media.length === 3) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
        {renderItem(media[0], "row-span-2 h-full min-h-[208px]")}
        <div className="flex flex-col gap-1">
          {renderItem(media[1], "h-[100px]")}
          {renderItem(media[2], "h-[100px]")}
        </div>
      </div>
    );
  }

  // 4+
  const visible = media.slice(0, 4);
  const extra = media.length - 4;
  return (
    <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
      {visible.map((item, i) => {
        const isLast = i === 3 && extra > 0;
        return (
          <div key={item.label} className="relative">
            {renderItem(item, "h-40 w-full")}
            {isLast && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-xl font-bold">+{extra}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ReactionPills({ reactions }: { reactions: Reaction[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {reactions.map((r) => (
        <motion.button
          key={r.emoji}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 hover:bg-gray-100 rounded-full text-xs font-medium text-gray-600 transition-colors border border-gray-100 cursor-pointer"
        >
          <span>{r.emoji}</span>
          <span>{r.count}</span>
        </motion.button>
      ))}
    </div>
  );
}

function PostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <AuthorAvatar initials={post.initials} color={post.avatarColor} />
          <div>
            <p className="text-sm font-semibold font-body text-gray-800 leading-tight">{post.author}</p>
            <p className="text-xs text-gray-400 font-body">{post.role} · {post.timestamp}</p>
          </div>
        </div>
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <p className="text-sm font-body text-gray-700 leading-relaxed">{post.body}</p>

      {/* Media */}
      <MediaGrid media={post.media} />

      {/* Attachments */}
      {post.attachments.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {post.attachments.map((att) => (
            <div
              key={att.name}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100 hover:bg-gray-100 transition-colors cursor-default"
            >
              <FileIcon kind={att.kind} />
              <div className="min-w-0">
                <p className="text-sm font-body font-medium text-gray-700 truncate">{att.name}</p>
                <p className="text-xs text-gray-400 font-body">{att.size}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reactions + Comments */}
      <div className="mt-4 pt-3.5 border-t border-gray-50 flex items-center justify-between">
        <ReactionPills reactions={post.reactions} />
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#4a7c59] transition-colors font-body ml-3 flex-shrink-0"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {post.comments.length} comments
        </button>
      </div>
    </motion.div>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="flex gap-2.5">
      <AuthorAvatar initials={comment.initials} color={comment.avatarColor} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
          <p className="text-xs font-semibold font-body text-gray-700 mb-0.5">{comment.author}</p>
          <p className="text-sm font-body text-gray-600 leading-relaxed">{comment.text}</p>
        </div>
        <p className="text-xs text-gray-400 font-body mt-1 ml-1">{comment.timestamp}</p>
      </div>
    </div>
  );
}

function PostSidebarContent({ post }: { post: Post }) {
  return (
    <div className="space-y-5">
      {/* Post header */}
      <div className="flex items-center gap-2.5">
        <AuthorAvatar initials={post.initials} color={post.avatarColor} size="lg" />
        <div>
          <p className="text-sm font-semibold font-body text-gray-800">{post.author}</p>
          <p className="text-xs text-gray-400 font-body">{post.role} · {post.timestamp}</p>
        </div>
      </div>

      {/* Full body */}
      <p className="text-sm font-body text-gray-700 leading-relaxed">{post.body}</p>

      {/* Full media */}
      {post.media.length > 0 && (
        <div>
          {post.media.length === 1 ? (
            <MediaGrid media={post.media} />
          ) : (
            <div className="grid grid-cols-2 gap-2 mt-1">
              {post.media.map((item) => (
                <div key={item.label} className={`${item.color} h-32 rounded-xl relative overflow-hidden flex items-center justify-center`}>
                  {item.type === "video" ? (
                    <>
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="relative z-10 flex flex-col items-center gap-1">
                        <div className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                          <Play className="w-4 h-4 text-gray-700 ml-0.5" fill="currentColor" />
                        </div>
                        <span className="text-white text-xs font-medium bg-black/40 px-2 py-0.5 rounded-full">{item.duration}</span>
                      </div>
                    </>
                  ) : (
                    <ImageIcon className="w-5 h-5 text-gray-300" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attachments */}
      {post.attachments.length > 0 && (
        <div className="flex flex-col gap-2">
          {post.attachments.map((att) => (
            <div key={att.name} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
              <FileIcon kind={att.kind} />
              <div className="min-w-0">
                <p className="text-sm font-body font-medium text-gray-700 truncate">{att.name}</p>
                <p className="text-xs text-gray-400 font-body">{att.size}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reactions section */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold font-body text-gray-400 uppercase tracking-wide mb-3">Reactions</p>
        <div className="flex flex-wrap gap-2">
          {post.reactions.map((r) => (
            <div key={r.emoji} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5">
              <span className="text-base leading-none">{r.emoji}</span>
              <span className="text-xs font-semibold text-gray-600 font-body">{r.count}</span>
              <span className="text-xs text-gray-400 font-body">{r.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Comments section */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold font-body text-gray-400 uppercase tracking-wide mb-4">
          Comments · {post.comments.length}
        </p>
        <div className="flex flex-col gap-4">
          {post.comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SidebarCommentFooter({ currentUserInitials }: { currentUserInitials: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 bg-[#4a7c59] rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
        {currentUserInitials}
      </div>
      <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3.5 py-2">
        <input
          type="text"
          placeholder="Add a comment..."
          className="flex-1 bg-transparent text-sm font-body text-gray-700 placeholder-gray-400 outline-none"
          readOnly
        />
        <button className="text-[#4a7c59] hover:text-[#3d6b4a] transition-colors flex-shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ComposeBar({ initials }: { initials: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
      <div className="flex items-center gap-3 mb-3.5">
        <div className="w-9 h-9 bg-[#4a7c59] rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 bg-gray-50 rounded-full px-4 py-2.5 cursor-default border border-gray-100">
          <p className="text-sm font-body text-gray-400">Share something with parents...</p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-gray-50 pt-3">
        <div className="flex items-center gap-1">
          {[
            { icon: ImageIcon, label: "Photo", color: "text-emerald-500 hover:bg-emerald-50" },
            { icon: Video, label: "Video", color: "text-blue-500 hover:bg-blue-50" },
            { icon: Paperclip, label: "File", color: "text-amber-500 hover:bg-amber-50" },
          ].map(({ icon: Icon, label, color }) => (
            <button
              key={label}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-body ${color} transition-colors text-gray-500`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
        <button
          disabled
          className="px-4 py-1.5 bg-gray-100 text-gray-400 text-sm font-semibold font-body rounded-full cursor-not-allowed"
        >
          Post
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeacherFeedClient({
  currentUser,
}: {
  currentUser: { full_name: string; role: string; id: string } | null;
}) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const initials = currentUser?.full_name
    ? currentUser.full_name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "T";

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-heading text-gray-800">Class Feed</h1>
          <p className="text-sm font-body text-gray-400 mt-1">Updates, photos, and moments from the classroom</p>
        </div>

        {/* Compose bar */}
        <ComposeBar initials={initials} />

        {/* Posts */}
        <div className="flex flex-col gap-4">
          {PLACEHOLDER_POSTS.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onClick={() => setSelectedPost(post)}
            />
          ))}
        </div>
      </div>

      {/* Post detail sidebar */}
      <DetailSidebar
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        title={selectedPost ? `${selectedPost.author}'s Post` : "Post"}
        footer={<SidebarCommentFooter currentUserInitials={initials} />}
      >
        {selectedPost && <PostSidebarContent post={selectedPost} />}
      </DetailSidebar>
    </div>
  );
}
