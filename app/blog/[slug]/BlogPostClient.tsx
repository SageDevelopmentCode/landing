"use client";

import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, BookOpen } from 'lucide-react'
import type { BlogPost } from '@/app/actions/blog'
import WeekRecapPreview from '@/app/components/WeekRecapPreview'

interface Props {
  post: BlogPost
  otherPosts: BlogPost[]
}

export default function BlogPostClient({ post, otherPosts }: Props) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description ?? post.excerpt ?? undefined,
    ...(post.cover_image_signed_url ? { image: post.cover_image_signed_url } : {}),
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at,
    author: post.author_name ? { '@type': 'Person', name: post.author_name } : undefined,
    publisher: { '@type': 'Organization', name: 'Sage Field Private School' },
  }

  return (
    <>
    <article className="max-w-2xl mx-auto w-full px-5 pt-32 pb-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Back */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-body text-gray-500 hover:text-gray-800 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Blog
      </Link>

      {/* Cover image */}
      {post.cover_image_signed_url && (
        <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden mb-8 bg-[#f5f2ed]">
          <img
            src={post.cover_image_signed_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Meta */}
      <p className="text-sm font-body text-gray-400 mb-3">
        {post.published_at
          ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : ''}
        {post.author_name && ` · ${post.author_name}`}
      </p>

      {/* Title */}
      <h1 className="text-3xl font-bold font-heading text-gray-900 leading-tight mb-8">
        {post.title}
      </h1>

      {/* Body */}
      <div className="blog-body font-body text-gray-700 leading-relaxed">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="text-2xl font-bold font-heading text-gray-900 mt-8 mb-3">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xl font-bold font-heading text-gray-900 mt-7 mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-lg font-semibold font-heading text-gray-900 mt-6 mb-2">{children}</h3>,
            p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            a: ({ href, children }) => <a href={href} className="text-[#4a7c59] hover:underline" target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}>{children}</a>,
            hr: () => <hr className="my-8 border-gray-200" />,
            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            blockquote: ({ children }) => <blockquote className="border-l-4 border-[#4a7c59]/30 pl-4 italic text-gray-500 my-4">{children}</blockquote>,
          }}
        >
          {post.body}
        </ReactMarkdown>
      </div>

    </article>

    {/* Other posts — wider than article column */}
    {otherPosts.length > 0 && (
      <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-12 pt-12 pb-16 border-t border-gray-100">
        <h2 className="text-2xl font-bold font-heading text-gray-800 mb-8">Read Our Other Posts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherPosts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group flex flex-col rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                {p.cover_image_signed_url ? (
                  <Image
                    src={p.cover_image_signed_url}
                    alt={p.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <BookOpen className="w-10 h-10 text-gray-300" />
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <p className="text-xs font-body text-gray-400 mb-2">
                  {p.published_at
                    ? new Date(p.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : ''}
                  {p.author_name && ` · ${p.author_name}`}
                </p>
                <h3 className="text-base font-bold font-heading text-gray-800 group-hover:text-[#4a7c59] transition-colors duration-200 mb-2 leading-snug">
                  {p.title}
                </h3>
                {p.excerpt && (
                  <p className="text-sm font-body text-gray-500 line-clamp-3 mb-4 flex-1">{p.excerpt}</p>
                )}
                <span className="text-sm font-semibold font-body text-[#4a7c59]">Read more →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    )}

    {/* Week recap promo */}
    <WeekRecapPreview />

    {/* Apply CTA */}
    <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-12 py-16">
      <div className="bg-sage-700 rounded-2xl px-8 py-12 text-center">
        <span className="inline-block px-4 py-1 bg-white/20 text-white text-sm font-semibold rounded-full mb-4 font-body">
          Enrollment Open
        </span>
        <h2 className="text-3xl font-bold font-heading text-white mb-3">
          Ready to Join Sage Field?
        </h2>
        <p className="text-white/80 font-body text-base mb-8 max-w-md mx-auto">
          Spots are limited — apply early to secure your child&apos;s place in our Summer 2026 or School Year 2026–2027 program.
        </p>
        <Link
          href="/apply"
          className="inline-block px-8 py-4 bg-white text-sage-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200 font-body shadow-md"
        >
          Apply Now →
        </Link>
      </div>
    </div>
    </>
  )
}
