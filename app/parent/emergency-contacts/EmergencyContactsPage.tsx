"use client";

import { useState, useTransition } from "react";
import { PenLine, X, Check } from "lucide-react";
import type { ParentEmergencyContactsRecord } from "@/app/actions/getParentEmergencyContacts";
import { updateEmergencyContacts } from "@/app/actions/updateEmergencyContacts";
import { updateEmergencyContactsGuardian } from "@/app/actions/updateEmergencyContactsGuardian";
import { formatPhone } from "@/app/utils/formatPhone";

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

function FormField({ label, value, onChange, type = "text", placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] text-gray-400 font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 w-full focus:outline-none focus:border-[#3d6b4f] transition-colors"
      />
    </div>
  );
}

function ContactCard({
  title,
  badge,
  name,
  relationship,
  rows,
  onEdit,
  editContent,
}: {
  title: string;
  badge?: string;
  name?: string | null;
  relationship?: string | null;
  rows: { icon: React.ReactNode; label: string; value: string; href?: string }[];
  onEdit?: () => void;
  editContent?: React.ReactNode;
}) {
  const visibleRows = rows.filter((r) => !!r.value);
  return (
    <div className="border-b border-gray-200 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body">{title}</h3>
          {badge && (
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
              {badge}
            </span>
          )}
        </div>
        {onEdit && !editContent && (
          <button
            onClick={onEdit}
            className="p-1.5 rounded-md text-gray-400 hover:text-[#3d6b4f] hover:bg-gray-100 transition-colors"
            title="Edit"
          >
            <PenLine className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {editContent ? (
        editContent
      ) : (
        <>
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
        </>
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

type EditingCard = 'g1' | 'g2' | 'in_state' | 'out_of_state' | null;

interface Props {
  contacts: ParentEmergencyContactsRecord[];
  isSharedAccess?: boolean;
}

export default function EmergencyContactsPage({ contacts, isSharedAccess }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [localContacts, setLocalContacts] = useState(contacts);
  const [editing, setEditing] = useState<EditingCard>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Guardian draft state
  const [g1Draft, setG1Draft] = useState({ full_name: "", email: "", cell_phone: "", work_phone: "", relationship: "" });
  const [g2Draft, setG2Draft] = useState({ full_name: "", email: "", cell_phone: "", work_phone: "", relationship: "" });
  // Emergency contact draft state
  const [inStateDraft, setInStateDraft] = useState({ name: "", relation: "", phone: "" });
  const [outOfStateDraft, setOutOfStateDraft] = useState({ name: "", relation: "", phone: "" });

  if (localContacts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <p className="text-gray-400 text-sm">No children enrolled yet.</p>
      </div>
    );
  }

  const c = localContacts[activeIndex];

  function openEdit(card: EditingCard) {
    setSaveError(null);
    if (card === 'g1') {
      setG1Draft({
        full_name: c.g1_full_name ?? "",
        email: c.g1_email ?? "",
        cell_phone: c.g1_cell_phone ?? "",
        work_phone: c.g1_work_phone ?? "",
        relationship: c.g1_relationship ?? "",
      });
    } else if (card === 'g2') {
      setG2Draft({
        full_name: c.g2_full_name ?? "",
        email: c.g2_email ?? "",
        cell_phone: c.g2_cell_phone ?? "",
        work_phone: c.g2_work_phone ?? "",
        relationship: c.g2_relationship ?? "",
      });
    } else if (card === 'in_state') {
      setInStateDraft({
        name: c.in_state_contact_name ?? "",
        relation: c.in_state_contact_relation ?? "",
        phone: c.in_state_contact_phone ?? "",
      });
    } else if (card === 'out_of_state') {
      setOutOfStateDraft({
        name: c.out_of_state_contact_name ?? "",
        relation: c.out_of_state_contact_relation ?? "",
        phone: c.out_of_state_contact_phone ?? "",
      });
    }
    setEditing(card);
  }

  function cancelEdit() {
    setEditing(null);
    setSaveError(null);
  }

  function saveGuardian(guardian: 'g1' | 'g2') {
    const draft = guardian === 'g1' ? g1Draft : g2Draft;
    startTransition(async () => {
      const result = await updateEmergencyContactsGuardian({
        studentId: c.studentId,
        guardian,
        ...draft,
      });
      if (result.error) {
        setSaveError(result.error);
        return;
      }
      setLocalContacts((prev) =>
        prev.map((contact, i) => {
          if (i !== activeIndex) return contact;
          if (guardian === 'g1') {
            return {
              ...contact,
              g1_full_name: draft.full_name || null,
              g1_email: draft.email || null,
              g1_cell_phone: draft.cell_phone || null,
              g1_work_phone: draft.work_phone || null,
              g1_relationship: draft.relationship || null,
            };
          }
          return {
            ...contact,
            g2_full_name: draft.full_name || null,
            g2_email: draft.email || null,
            g2_cell_phone: draft.cell_phone || null,
            g2_work_phone: draft.work_phone || null,
            g2_relationship: draft.relationship || null,
          };
        })
      );
      setEditing(null);
      setSaveError(null);
    });
  }

  function saveEmergencyContacts(type: 'in_state' | 'out_of_state') {
    const currentInState = type === 'in_state' ? inStateDraft : { name: c.in_state_contact_name ?? "", relation: c.in_state_contact_relation ?? "", phone: c.in_state_contact_phone ?? "" };
    const currentOutOfState = type === 'out_of_state' ? outOfStateDraft : { name: c.out_of_state_contact_name ?? "", relation: c.out_of_state_contact_relation ?? "", phone: c.out_of_state_contact_phone ?? "" };

    startTransition(async () => {
      const result = await updateEmergencyContacts({
        studentId: c.studentId,
        inStateContactName: currentInState.name,
        inStateContactRelation: currentInState.relation,
        inStateContactPhone: currentInState.phone,
        outOfStateContactName: currentOutOfState.name,
        outOfStateContactRelation: currentOutOfState.relation,
        outOfStateContactPhone: currentOutOfState.phone,
      });
      if (result.error) {
        setSaveError(result.error);
        return;
      }
      setLocalContacts((prev) =>
        prev.map((contact, i) => {
          if (i !== activeIndex) return contact;
          return {
            ...contact,
            in_state_contact_name: currentInState.name || null,
            in_state_contact_relation: currentInState.relation || null,
            in_state_contact_phone: currentInState.phone || null,
            out_of_state_contact_name: currentOutOfState.name || null,
            out_of_state_contact_relation: currentOutOfState.relation || null,
            out_of_state_contact_phone: currentOutOfState.phone || null,
          };
        })
      );
      setEditing(null);
      setSaveError(null);
    });
  }

  function guardianEditForm(guardian: 'g1' | 'g2') {
    const draft = guardian === 'g1' ? g1Draft : g2Draft;
    const setDraft = guardian === 'g1' ? setG1Draft : setG2Draft;
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Full Name" value={draft.full_name} onChange={(v) => setDraft((d) => ({ ...d, full_name: v }))} />
          <FormField label="Relationship" value={draft.relationship} onChange={(v) => setDraft((d) => ({ ...d, relationship: v }))} />
          <FormField label="Email" type="email" value={draft.email} onChange={(v) => setDraft((d) => ({ ...d, email: v }))} />
          <FormField label="Cell Phone" type="tel" value={draft.cell_phone} onChange={(v) => setDraft((d) => ({ ...d, cell_phone: formatPhone(v) }))} />
          <FormField label="Work Phone" type="tel" value={draft.work_phone} onChange={(v) => setDraft((d) => ({ ...d, work_phone: formatPhone(v) }))} />
        </div>
        {saveError && <p className="text-xs text-red-500">{saveError}</p>}
        <EditActions onSave={() => saveGuardian(guardian)} onCancel={cancelEdit} saving={isPending} />
      </div>
    );
  }

  function emergencyContactEditForm(type: 'in_state' | 'out_of_state') {
    const draft = type === 'in_state' ? inStateDraft : outOfStateDraft;
    const setDraft = type === 'in_state' ? setInStateDraft : setOutOfStateDraft;
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Name" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} />
          <FormField label="Relationship" value={draft.relation} onChange={(v) => setDraft((d) => ({ ...d, relation: v }))} />
          <FormField label="Phone" type="tel" value={draft.phone} onChange={(v) => setDraft((d) => ({ ...d, phone: formatPhone(v) }))} />
        </div>
        {saveError && <p className="text-xs text-red-500">{saveError}</p>}
        <EditActions onSave={() => saveEmergencyContacts(type)} onCancel={cancelEdit} saving={isPending} />
      </div>
    );
  }

  return (
    <div>
      {localContacts.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {localContacts.map((child, i) => (
            <button
              key={child.studentId}
              onClick={() => { setActiveIndex(i); setEditing(null); setSaveError(null); }}
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
          badge={editing === 'g1' ? undefined : (c.g1_relationship ?? undefined)}
          name={editing === 'g1' ? undefined : c.g1_full_name}
          relationship={editing === 'g1' ? undefined : c.g1_relationship}
          rows={[
            { icon: emailIcon, label: "Email", value: c.g1_email ?? "", href: c.g1_email ? `mailto:${c.g1_email}` : undefined },
            { icon: phoneIcon, label: "Cell Phone", value: c.g1_cell_phone ?? "", href: c.g1_cell_phone ? `tel:${c.g1_cell_phone}` : undefined },
            { icon: workPhoneIcon, label: "Work Phone", value: c.g1_work_phone ?? "", href: c.g1_work_phone ? `tel:${c.g1_work_phone}` : undefined },
          ]}
          onEdit={isSharedAccess ? undefined : () => openEdit('g1')}
          editContent={editing === 'g1' ? guardianEditForm('g1') : undefined}
        />
        <ContactCard
          title="Guardian 2"
          badge={editing === 'g2' ? undefined : (c.g2_relationship ?? undefined)}
          name={editing === 'g2' ? undefined : c.g2_full_name}
          relationship={editing === 'g2' ? undefined : c.g2_relationship}
          rows={[
            { icon: emailIcon, label: "Email", value: c.g2_email ?? "", href: c.g2_email ? `mailto:${c.g2_email}` : undefined },
            { icon: phoneIcon, label: "Cell Phone", value: c.g2_cell_phone ?? "", href: c.g2_cell_phone ? `tel:${c.g2_cell_phone}` : undefined },
            { icon: workPhoneIcon, label: "Work Phone", value: c.g2_work_phone ?? "", href: c.g2_work_phone ? `tel:${c.g2_work_phone}` : undefined },
          ]}
          onEdit={isSharedAccess ? undefined : () => openEdit('g2')}
          editContent={editing === 'g2' ? guardianEditForm('g2') : undefined}
        />
        <ContactCard
          title="In-State Contact"
          badge={editing === 'in_state' ? undefined : (c.in_state_contact_relation ?? undefined)}
          name={editing === 'in_state' ? undefined : c.in_state_contact_name}
          relationship={editing === 'in_state' ? undefined : c.in_state_contact_relation}
          rows={[
            { icon: phoneIcon, label: "Phone", value: c.in_state_contact_phone ?? "", href: c.in_state_contact_phone ? `tel:${c.in_state_contact_phone}` : undefined },
          ]}
          onEdit={isSharedAccess ? undefined : () => openEdit('in_state')}
          editContent={editing === 'in_state' ? emergencyContactEditForm('in_state') : undefined}
        />
        <ContactCard
          title="Out-of-State Contact"
          badge={editing === 'out_of_state' ? undefined : (c.out_of_state_contact_relation ?? undefined)}
          name={editing === 'out_of_state' ? undefined : c.out_of_state_contact_name}
          relationship={editing === 'out_of_state' ? undefined : c.out_of_state_contact_relation}
          rows={[
            { icon: phoneIcon, label: "Phone", value: c.out_of_state_contact_phone ?? "", href: c.out_of_state_contact_phone ? `tel:${c.out_of_state_contact_phone}` : undefined },
          ]}
          onEdit={isSharedAccess ? undefined : () => openEdit('out_of_state')}
          editContent={editing === 'out_of_state' ? emergencyContactEditForm('out_of_state') : undefined}
        />
      </div>
    </div>
  );
}

function EditActions({ onSave, onCancel, saving }: { onSave: () => void; onCancel: () => void; saving: boolean }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#3d6b4f] text-white rounded-lg hover:bg-[#2f5540] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Check className="w-3 h-3" />
        {saving ? "Saving…" : "Save"}
      </button>
      <button
        onClick={onCancel}
        disabled={saving}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
      >
        <X className="w-3 h-3" />
        Cancel
      </button>
    </div>
  );
}
