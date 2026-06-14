"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, Globe, FileText, Trash2, Loader2, ExternalLink } from "lucide-react";
import { createBlogPost, deletePost, type BlogPost } from "@/app/actions/blog";

interface Props {
  initialPosts: BlogPost[];
  currentUserId: string;
}

export default function BlogPageClient({ initialPosts, currentUserId }: Props) {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate() {
    const title = newTitle.trim();
    if (!title) return;
    setCreating(false);
    startTransition(async () => {
      const result = await createBlogPost(title);
      if (result.data) {
        router.push(`/teacher/dashboard/blog/${result.data.id}`);
      }
    });
  }

  async function handleDelete(postId: string) {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setDeletingId(postId);
    const result = await deletePost(postId);
    if (!result.error) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }
    setDeletingId(null);
  }

  const published = posts.filter((p) => p.status === "published");
  const drafts = posts.filter((p) => p.status === "draft");

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold font-heading text-gray-900">Blog</h1>
          <p className="text-sm text-gray-500 font-body mt-0.5">Write and publish posts for the school blog.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-body text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Public Blog
          </a>
          <button
            onClick={() => { setCreating(true); setNewTitle(""); }}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-body font-semibold text-white bg-[#4a7c59] hover:bg-[#3d6b4a] rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Post
          </button>
        </div>
      </div>

      {/* New post form */}
      {creating && (
        <div className="mb-6 border border-[#4a7c59]/20 bg-[#4a7c59]/5 rounded-xl p-4">
          <p className="text-sm font-semibold font-body text-gray-700 mb-2">Post title</p>
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              placeholder="e.g. A Day at the Nature Pond"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(false); }}
              className="flex-1 text-sm font-body text-gray-900 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
            />
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim() || isPending}
              className="px-4 py-2 text-sm font-semibold font-body text-white bg-[#4a7c59] hover:bg-[#3d6b4a] rounded-lg transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </button>
            <button
              onClick={() => setCreating(false)}
              className="px-3 py-2 text-sm font-body text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {posts.length === 0 && !creating && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BookOpen className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-gray-400 font-body text-sm">No posts yet. Create your first blog post.</p>
        </div>
      )}

      {/* Published */}
      {published.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-[#4a7c59]" />
            <h2 className="text-sm font-semibold font-body text-gray-500 uppercase tracking-wide">Published</h2>
            <span className="text-xs text-gray-400">({published.length})</span>
          </div>
          <div className="flex flex-col gap-2">
            {published.map((post) => (
              <PostRow key={post.id} post={post} onDelete={handleDelete} deletingId={deletingId} />
            ))}
          </div>
        </section>
      )}

      {/* Drafts */}
      {drafts.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold font-body text-gray-500 uppercase tracking-wide">Drafts</h2>
            <span className="text-xs text-gray-400">({drafts.length})</span>
          </div>
          <div className="flex flex-col gap-2">
            {drafts.map((post) => (
              <PostRow key={post.id} post={post} onDelete={handleDelete} deletingId={deletingId} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PostRow({
  post,
  onDelete,
  deletingId,
}: {
  post: BlogPost;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  const router = useRouter();
  const isDeleting = deletingId === post.id;

  return (
    <div
      className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-colors group cursor-pointer"
      onClick={() => router.push(`/teacher/dashboard/blog/${post.id}`)}
    >
      {/* Cover thumbnail */}
      <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        {post.cover_image_signed_url ? (
          <img src={post.cover_image_signed_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-gray-300" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold font-body text-gray-900 truncate">{post.title}</p>
        <p className="text-xs font-body text-gray-400 mt-0.5">
          {post.status === "published" && post.published_at
            ? `Published ${new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
            : `Updated ${new Date(post.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
          {post.author_name && ` · ${post.author_name}`}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs font-semibold font-body px-2 py-0.5 rounded-full ${
          post.status === "published"
            ? "text-[#4a7c59] bg-[#4a7c59]/10"
            : "text-gray-500 bg-gray-100"
        }`}>
          {post.status === "published" ? "Published" : "Draft"}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all rounded"
        >
          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
