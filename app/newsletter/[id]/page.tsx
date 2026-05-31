import { getNewsletterMetaPublic } from '@/app/lib/newsletter-public'
import { notFound } from 'next/navigation'
import PublicNewsletterClient from './PublicNewsletterClient'

export default async function PublicNewsletterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const meta = await getNewsletterMetaPublic(id)
  if (!meta) notFound()
  return <PublicNewsletterClient id={id} title={meta.title} weekRange={meta.week_range} />
}
