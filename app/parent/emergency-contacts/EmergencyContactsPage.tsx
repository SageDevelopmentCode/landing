"use client";

import { useState } from "react";
import type { ParentEmergencyContactsRecord } from "@/app/actions/getParentEmergencyContacts";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy"
      className="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
    >
      {copied ? (
        <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
    </button>
  );
}

function ContactRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 font-medium leading-none mb-0.5">{label}</p>
        {href ? (
          <a href={href} className="text-sm text-[#3d6b4f] font-medium truncate hover:underline">
            {value}
          </a>
        ) : (
          <p className="text-sm text-gray-800 font-medium truncate">{value}</p>
        )}
      </div>
      <CopyButton value={value} />
    </div>
  );
}

function ContactCard({
  title,
  badge,
  name,
  relationship,
  rows,
}: {
  title: string;
  badge?: string;
  name?: string | null;
  relationship?: string | null;
  rows: { icon: React.ReactNode; label: string; value: string; href?: string }[];
}) {
  const visibleRows = rows.filter((r) => !!r.value);
  return (
    <div className="border-b border-gray-200 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body">{title}</h3>
        {badge && (
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
            {badge}
          </span>
        )}
      </div>
      {name && (
        <div className="flex items-center gap-3 pb-3 mb-1 border-b border-gray-100">
          <div className="w-9 h-9 rounded-full bg-[#3d6b4f]/10 flex items-center justify-center text-[#3d6b4f] font-semibold text-sm flex-shrink-0">
            {name.trim().charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 leading-tight">{name}</p>
            {relationship && <p className="text-xs text-gray-400 capitalize">{relationship}</p>}
          </div>
        </div>
      )}
      {visibleRows.length > 0 ? (
        visibleRows.map((r, i) => <ContactRow key={i} icon={r.icon} label={r.label} value={r.value} href={r.href} />)
      ) : (
        <p className="text-sm text-gray-400 py-2">No contact info available</p>
      )}
    </div>
  );
}

const phoneIcon = (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);
const emailIcon = (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const workPhoneIcon = (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

interface Props {
  contacts: ParentEmergencyContactsRecord[];
}

export default function EmergencyContactsPage({ contacts }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (contacts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <p className="text-gray-400 text-sm">No children enrolled yet.</p>
      </div>
    );
  }

  const c = contacts[activeIndex];

  return (
    <div>
      {contacts.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {contacts.map((child, i) => (
            <button
              key={child.studentId}
              onClick={() => setActiveIndex(i)}
              className={`px-4 py-1.5 text-sm rounded-full border transition-colors cursor-pointer whitespace-nowrap ${
                i === activeIndex
                  ? "bg-[#4a7c59] text-white border-[#4a7c59] font-semibold"
                  : "bg-white border-gray-200 text-gray-600 hover:border-[#4a7c59]"
              }`}
            >
              {child.studentName ?? "Child"}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <ContactCard
          title="Guardian 1"
          badge={c.g1_relationship ?? undefined}
          name={c.g1_full_name}
          relationship={c.g1_relationship}
          rows={[
            { icon: emailIcon, label: "Email", value: c.g1_email ?? "", href: c.g1_email ? `mailto:${c.g1_email}` : undefined },
            { icon: phoneIcon, label: "Cell Phone", value: c.g1_cell_phone ?? "", href: c.g1_cell_phone ? `tel:${c.g1_cell_phone}` : undefined },
            { icon: workPhoneIcon, label: "Work Phone", value: c.g1_work_phone ?? "", href: c.g1_work_phone ? `tel:${c.g1_work_phone}` : undefined },
          ]}
        />
        <ContactCard
          title="Guardian 2"
          badge={c.g2_relationship ?? undefined}
          name={c.g2_full_name}
          relationship={c.g2_relationship}
          rows={[
            { icon: emailIcon, label: "Email", value: c.g2_email ?? "", href: c.g2_email ? `mailto:${c.g2_email}` : undefined },
            { icon: phoneIcon, label: "Cell Phone", value: c.g2_cell_phone ?? "", href: c.g2_cell_phone ? `tel:${c.g2_cell_phone}` : undefined },
            { icon: workPhoneIcon, label: "Work Phone", value: c.g2_work_phone ?? "", href: c.g2_work_phone ? `tel:${c.g2_work_phone}` : undefined },
          ]}
        />
        <ContactCard
          title="In-State Contact"
          badge={c.in_state_contact_relation ?? undefined}
          name={c.in_state_contact_name}
          relationship={c.in_state_contact_relation}
          rows={[
            { icon: phoneIcon, label: "Phone", value: c.in_state_contact_phone ?? "", href: c.in_state_contact_phone ? `tel:${c.in_state_contact_phone}` : undefined },
          ]}
        />
        <ContactCard
          title="Out-of-State Contact"
          badge={c.out_of_state_contact_relation ?? undefined}
          name={c.out_of_state_contact_name}
          relationship={c.out_of_state_contact_relation}
          rows={[
            { icon: phoneIcon, label: "Phone", value: c.out_of_state_contact_phone ?? "", href: c.out_of_state_contact_phone ? `tel:${c.out_of_state_contact_phone}` : undefined },
          ]}
        />
      </div>
    </div>
  );
}
