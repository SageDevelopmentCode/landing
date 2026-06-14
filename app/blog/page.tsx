import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { getPublishedPosts } from '@/app/actions/blog'
import { BookOpen } from 'lucide-react'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Blog — Sage Field Private School',
  description: 'Thoughts, stories, and insights from the teachers and community at Sage Field Private School in Round Rock, TX.',
}

export default async function BlogListPage() {
  const posts = await getPublishedPosts()

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar darkStyle />

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 pt-32 pb-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold font-heading text-gray-900 mb-3">Blog</h1>
          <p className="text-lg text-gray-500 font-body">Stories, reflections, and ideas from Sage Field.</p>
        </div>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BookOpen className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-gray-400 font-body">No posts yet — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all"
              >
                {/* Cover image */}
                <div className="relative w-full aspect-[16/9] bg-[#f5f2ed] flex-shrink-0">
                  {post.cover_image_signed_url ? (
                    <img
                      src={post.cover_image_signed_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col gap-2 p-5 flex-1">
                  <p className="text-xs font-body text-gray-400">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      : ''}
                    {post.author_name && ` · ${post.author_name}`}
                  </p>
                  <h2 className="text-base font-semibold font-heading text-gray-900 group-hover:text-[#4a7c59] transition-colors leading-snug">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm font-body text-gray-500 line-clamp-3 leading-relaxed">{post.excerpt}</p>
                  )}
                  <div className="mt-auto pt-3">
                    <span className="text-xs font-semibold font-body text-[#4a7c59] group-hover:underline">
                      Read more →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
