'use client'

import React from 'react'

export function SidebarField({
  label,
  value,
}: {
  label: string
  value: string | number | null | boolean | undefined
}) {
  if (value == null || value === false || value === '') return null
  const display = value === true ? 'Yes' : value
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 font-body">{label}</span>
      <span className="text-sm text-gray-800 font-body">{String(display)}</span>
    </div>
  )
}

export function SidebarSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const kids = Array.isArray(children) ? children.filter(Boolean) : children
  if (!kids || (Array.isArray(kids) && kids.length === 0)) return null
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-3 border-b border-gray-100 pb-2">
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}
