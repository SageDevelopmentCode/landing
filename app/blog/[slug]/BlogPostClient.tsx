"use client";

import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { BlogPost } from '@/app/actions/blog'

interface Props {
  post: BlogPost
}

export default function BlogPostClient({ post }: Props) {
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
  )
}
