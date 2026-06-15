import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { getPublishedPostBySlug, getPublishedPosts } from '@/app/actions/blog'
import BlogPostClient from './BlogPostClient'

export const revalidate = 3600

export async function generateStaticParams() {
  const posts = await getPublishedPosts()
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedPostBySlug(slug)
  if (!post) return {}

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sagefield.co'
  const postUrl = `${siteUrl}/blog/${post.slug}`
  const metaDesc = post.meta_description ?? post.excerpt ?? undefined

  return {
    title: `${post.title} — Sage Field Blog`,
    description: metaDesc,
    openGraph: {
      type: 'article',
      title: post.title,
      description: metaDesc,
      url: postUrl,
      images: post.cover_image_signed_url ? [{ url: post.cover_image_signed_url }] : [],
      publishedTime: post.published_at ?? undefined,
      authors: post.author_name ? [post.author_name] : [],
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPublishedPostBySlug(slug)
  if (!post) notFound()

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar darkStyle />
      <main className="flex-1">
        <BlogPostClient post={post} />
      </main>
      <Footer />
    </div>
  )
}
