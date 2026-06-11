"use client";

import { Newspaper } from "lucide-react";
import type { DBNewsletterListItem } from "@/app/actions/newsletter";

interface Props {
  newsletters: DBNewsletterListItem[];
}

function NewsletterCard({ newsletter }: { newsletter: DBNewsletterListItem }) {
  return (
    <a
      href={`/newsletter/${newsletter.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#4a7c59]/20 transition-all duration-200 flex flex-col"
    >
      <div className="relative aspect-[16/9] bg-gray-50 overflow-hidden">
        {newsletter.cover_image_signed_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={newsletter.cover_image_signed_url}
            alt={newsletter.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Newspaper className="w-10 h-10 text-gray-300" />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-1 flex-1">
        <h2 className="text-sm font-semibold font-body text-gray-900 leading-snug line-clamp-2 group-hover:text-[#4a7c59] transition-colors">
          {newsletter.title}
        </h2>

        <p className="text-xs text-gray-500 font-body">{newsletter.week_range}</p>

        {newsletter.access_password && (
          <p className="text-xs text-gray-400 font-body mt-auto pt-2">
            Password:{" "}
            <span className="font-medium text-gray-600 select-all">
              {newsletter.access_password}
            </span>
          </p>
        )}
      </div>
    </a>
  );
}

export default function ParentNewslettersClient({ newsletters }: Props) {
  if (newsletters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#4a7c59]/10 flex items-center justify-center mb-4">
          <Newspaper className="w-8 h-8 text-[#4a7c59]" />
        </div>
        <h2 className="text-base font-semibold font-body text-gray-800 mb-1">
          No newsletters yet
        </h2>
        <p className="text-sm text-gray-400 font-body">
          Newsletters published by the school will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold font-body text-gray-900">Newsletters</h1>
        <p className="text-sm text-gray-400 font-body mt-0.5">
          {newsletters.length} newsletter{newsletters.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {newsletters.map((newsletter) => (
          <NewsletterCard key={newsletter.id} newsletter={newsletter} />
        ))}
      </div>
    </div>
  );
}
