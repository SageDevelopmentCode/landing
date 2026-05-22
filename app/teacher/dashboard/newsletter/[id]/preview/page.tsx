import { notFound } from 'next/navigation'
import { getNewsletterById, getNewsletters } from '@/app/actions/newsletter'
import PreviewClient from './PreviewClient'

export default async function NewsletterPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [newsletter, allNewsletters] = await Promise.all([
    getNewsletterById(id),
    getNewsletters(),
  ])

  if (!newsletter) notFound()

  return <PreviewClient newsletter={newsletter} allNewsletters={allNewsletters} />
}
