'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, ReactNodeViewProps } from '@tiptap/react'
import { useState, useEffect, useRef } from 'react'

// ─── Color theme ────────────────────────────────────────────────────────────
const THEME = {
  input:    { bg: '#D4EAF7', color: '#1a6a9a', border: '#9ecae8' },
  yesno:    { bg: '#BFD8C0', color: '#2e6b3f', border: '#8fbf91' },
  dropdown: { bg: '#FDE68A', color: '#92400e', border: '#f5c842' },
} as const

type FieldType = 'input' | 'yesno' | 'dropdown'

// ─── React NodeView component ────────────────────────────────────────────────
function ContractFieldView({ node, updateAttributes, deleteNode }: ReactNodeViewProps) {
  const { fieldType, fieldLabel, fieldOptions, fieldRequired } = node.attrs as { fieldType: FieldType; fieldLabel: string; fieldOptions: string; fieldRequired: string }
  const theme = THEME[fieldType] ?? THEME.input

  const [labelPopover, setLabelPopover] = useState(false)
  const [optionsPopover, setOptionsPopover] = useState(false)
  const [draftLabel, setDraftLabel] = useState(fieldLabel)
  const [draftOptions, setDraftOptions] = useState(fieldOptions ?? '')

  const labelRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)

  // Sync drafts when node attrs change externally
  useEffect(() => { setDraftLabel(fieldLabel) }, [fieldLabel])
  useEffect(() => { setDraftOptions(fieldOptions ?? '') }, [fieldOptions])

  // Click-outside for label popover
  useEffect(() => {
    if (!labelPopover) return
    function handler(e: MouseEvent) {
      if (labelRef.current && !labelRef.current.contains(e.target as globalThis.Node)) {
        setLabelPopover(false)
        setDraftLabel(fieldLabel) // reset draft
      }
    }
    document.addEventListener('mousedown', handler, true)
    return () => document.removeEventListener('mousedown', handler, true)
  }, [labelPopover, fieldLabel])

  // Click-outside for options popover
  useEffect(() => {
    if (!optionsPopover) return
    function handler(e: MouseEvent) {
      if (optionsRef.current && !optionsRef.current.contains(e.target as globalThis.Node)) {
        setOptionsPopover(false)
        setDraftOptions(fieldOptions ?? '') // reset draft
      }
    }
    document.addEventListener('mousedown', handler, true)
    return () => document.removeEventListener('mousedown', handler, true)
  }, [optionsPopover, fieldOptions])

  function confirmLabel() {
    if (draftLabel.trim()) {
      updateAttributes({ fieldLabel: draftLabel.trim() })
    }
    setLabelPopover(false)
  }

  function confirmOptions() {
    updateAttributes({ fieldOptions: draftOptions.trim() })
    setOptionsPopover(false)
  }

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: theme.bg,
    color: theme.color,
    border: `1px solid ${theme.border}`,
    borderRadius: '4px',
    padding: '1px 4px',
    fontSize: '0.78rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    verticalAlign: 'middle',
    userSelect: 'none',
    position: 'relative',
  }

  const iconBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0 2px',
    color: theme.color,
    fontSize: '0.7rem',
    lineHeight: 1,
    opacity: 0.7,
    flexShrink: 0,
  }

  const popoverStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    backgroundColor: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    zIndex: 9999,
    minWidth: '200px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  }

  const popoverInputStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #d1d5db',
    outline: 'none',
    color: '#374151',
    width: '100%',
    boxSizing: 'border-box',
  }

  const saveBtnStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    padding: '3px 10px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#4b7a5a',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
    alignSelf: 'flex-end',
  }

  // ── input field ──────────────────────────────────────────────────────────
  if (fieldType === 'input') {
    return (
      <NodeViewWrapper as="span" style={{ display: 'inline' }}>
        <span style={baseStyle} contentEditable={false}>
          <input
            type="text"
            readOnly
            placeholder={fieldLabel}
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              color: theme.color,
              fontSize: '0.78rem',
              width: `${Math.max(60, fieldLabel.length * 7)}px`,
              cursor: 'default',
              padding: 0,
            }}
          />
          {/* Pencil */}
          <div ref={labelRef} style={{ position: 'relative', display: 'inline-flex' }}>
            <button
              type="button"
              style={iconBtnStyle}
              title="Edit label"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setLabelPopover(v => !v) }}
            >
              ✏️
            </button>
            {labelPopover && (
              <div style={popoverStyle}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>Edit label</div>
                <input
                  autoFocus
                  type="text"
                  value={draftLabel}
                  onChange={e => setDraftLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') confirmLabel() }}
                  style={popoverInputStyle}
                />
                <button type="button" style={saveBtnStyle} onMouseDown={e => { e.preventDefault(); confirmLabel() }}>
                  Save
                </button>
              </div>
            )}
          </div>
          {/* Required toggle */}
          <button
            type="button"
            title={fieldRequired === 'true' ? 'Mark optional' : 'Mark required'}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              updateAttributes({ fieldRequired: fieldRequired === 'true' ? 'false' : 'true' })
            }}
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              padding: '0px 5px',
              borderRadius: '999px',
              border: `1px solid ${fieldRequired === 'true' ? '#dc2626' : theme.border}`,
              backgroundColor: fieldRequired === 'true' ? '#fee2e2' : 'transparent',
              color: fieldRequired === 'true' ? '#dc2626' : theme.color,
              cursor: 'pointer',
              lineHeight: '1.4',
              opacity: fieldRequired === 'true' ? 1 : 0.5,
            }}
          >
            {fieldRequired === 'true' ? 'req' : 'opt'}
          </button>
          {/* Delete */}
          <button
            type="button"
            style={{ ...iconBtnStyle, opacity: 0.5 }}
            title="Remove field"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); deleteNode() }}
          >
            ✕
          </button>
        </span>
      </NodeViewWrapper>
    )
  }

  // ── yesno field ──────────────────────────────────────────────────────────
  if (fieldType === 'yesno') {
    return (
      <NodeViewWrapper as="span" style={{ display: 'inline' }}>
        <span style={baseStyle} contentEditable={false}>
          <span style={{ fontSize: '0.7rem', color: theme.color, opacity: 0.7, marginRight: '2px' }}>
            {fieldLabel}:
          </span>
          <span style={{
            display: 'inline-flex',
            borderRadius: '999px',
            border: `1px solid ${theme.border}`,
            overflow: 'hidden',
            fontSize: '0.7rem',
          }}>
            <span style={{ padding: '1px 7px', backgroundColor: theme.bg, color: theme.color, cursor: 'default' }}>Yes</span>
            <span style={{ width: '1px', backgroundColor: theme.border }} />
            <span style={{ padding: '1px 7px', backgroundColor: theme.bg, color: theme.color, cursor: 'default' }}>No</span>
          </span>
          {/* Required toggle */}
          <button
            type="button"
            title={fieldRequired === 'true' ? 'Mark optional' : 'Mark required'}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              updateAttributes({ fieldRequired: fieldRequired === 'true' ? 'false' : 'true' })
            }}
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              padding: '0px 5px',
              borderRadius: '999px',
              border: `1px solid ${fieldRequired === 'true' ? '#dc2626' : theme.border}`,
              backgroundColor: fieldRequired === 'true' ? '#fee2e2' : 'transparent',
              color: fieldRequired === 'true' ? '#dc2626' : theme.color,
              cursor: 'pointer',
              lineHeight: '1.4',
              opacity: fieldRequired === 'true' ? 1 : 0.5,
            }}
          >
            {fieldRequired === 'true' ? 'req' : 'opt'}
          </button>
          {/* Delete */}
          <button
            type="button"
            style={{ ...iconBtnStyle, opacity: 0.5 }}
            title="Remove field"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); deleteNode() }}
          >
            ✕
          </button>
        </span>
      </NodeViewWrapper>
    )
  }

  // ── dropdown field ───────────────────────────────────────────────────────
  const options = fieldOptions ? fieldOptions.split(',').map(o => o.trim()).filter(Boolean) : []

  return (
    <NodeViewWrapper as="span" style={{ display: 'inline' }}>
      <span style={baseStyle} contentEditable={false}>
        <select
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            color: theme.color,
            fontSize: '0.78rem',
            cursor: 'pointer',
            padding: 0,
            maxWidth: '120px',
          }}
        >
          <option value="">{fieldLabel}</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {/* Pencil for options */}
        <div ref={optionsRef} style={{ position: 'relative', display: 'inline-flex' }}>
          <button
            type="button"
            style={iconBtnStyle}
            title="Edit options"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setOptionsPopover(v => !v) }}
          >
            ✏️
          </button>
          {optionsPopover && (
            <div style={popoverStyle}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>Edit options</div>
              <input
                autoFocus
                type="text"
                placeholder="Option 1, Option 2, ..."
                value={draftOptions}
                onChange={e => setDraftOptions(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') confirmOptions() }}
                style={popoverInputStyle}
              />
              <button type="button" style={saveBtnStyle} onMouseDown={e => { e.preventDefault(); confirmOptions() }}>
                Save
              </button>
            </div>
          )}
        </div>
        {/* Pencil for label */}
        <div ref={labelRef} style={{ position: 'relative', display: 'inline-flex' }}>
          <button
            type="button"
            style={{ ...iconBtnStyle, fontSize: '0.65rem' }}
            title="Edit label"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setLabelPopover(v => !v) }}
          >
            🏷️
          </button>
          {labelPopover && (
            <div style={{ ...popoverStyle, left: 'auto', right: 0 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>Edit label</div>
              <input
                autoFocus
                type="text"
                value={draftLabel}
                onChange={e => setDraftLabel(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') confirmLabel() }}
                style={popoverInputStyle}
              />
              <button type="button" style={saveBtnStyle} onMouseDown={e => { e.preventDefault(); confirmLabel() }}>
                Save
              </button>
            </div>
          )}
        </div>
        {/* Required toggle */}
        <button
          type="button"
          title={fieldRequired === 'true' ? 'Mark optional' : 'Mark required'}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            updateAttributes({ fieldRequired: fieldRequired === 'true' ? 'false' : 'true' })
          }}
          style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            padding: '0px 5px',
            borderRadius: '999px',
            border: `1px solid ${fieldRequired === 'true' ? '#dc2626' : theme.border}`,
            backgroundColor: fieldRequired === 'true' ? '#fee2e2' : 'transparent',
            color: fieldRequired === 'true' ? '#dc2626' : theme.color,
            cursor: 'pointer',
            lineHeight: '1.4',
            opacity: fieldRequired === 'true' ? 1 : 0.5,
          }}
        >
          {fieldRequired === 'true' ? 'req' : 'opt'}
        </button>
        {/* Delete */}
        <button
          type="button"
          style={{ ...iconBtnStyle, opacity: 0.5 }}
          title="Remove field"
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); deleteNode() }}
        >
          ✕
        </button>
      </span>
    </NodeViewWrapper>
  )
}

// ─── TipTap Node extension ───────────────────────────────────────────────────
export const ContractFieldNode = Node.create({
  name: 'contractField',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      fieldType: {
        default: 'input',
        parseHTML: el => (el as HTMLElement).getAttribute('data-field-type'),
      },
      fieldLabel: {
        default: '',
        parseHTML: el => (el as HTMLElement).getAttribute('data-field-label'),
      },
      fieldOptions: {
        default: '',
        parseHTML: el => (el as HTMLElement).getAttribute('data-field-options') ?? '',
      },
      fieldRequired: {
        default: 'false',
        parseHTML: el => (el as HTMLElement).getAttribute('data-field-required') ?? 'false',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: (node) => {
          if (typeof node === 'string') return false
          return (node as HTMLElement).classList.contains('contract-field') ? {} : false
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { fieldType, fieldLabel, fieldOptions, fieldRequired } = HTMLAttributes
    const prefix = fieldType === 'input' ? '[ ]' : fieldType === 'yesno' ? 'Y/N' : '▼'
    return [
      'span',
      mergeAttributes({
        class: 'contract-field',
        'data-field-type': fieldType,
        'data-field-label': fieldLabel,
        ...(fieldOptions ? { 'data-field-options': fieldOptions } : {}),
        ...(fieldRequired === 'true' ? { 'data-field-required': 'true' } : {}),
        contenteditable: 'false',
      }),
      `${prefix} ${fieldLabel}`,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ContractFieldView, { stopEvent: () => true })
  },
})
