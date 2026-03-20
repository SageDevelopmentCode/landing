'use client'

import { useState, useRef, useTransition, KeyboardEvent } from 'react'
import { updateWaitlistTags, updateContactTags } from '../../actions/updateLeadTags'

const PREDEFINED_TAGS = [
  'facebook lead',
  'instagram lead',
  'open house',
  'referral',
  'website',
  'walk-in',
  'scholarship',
  'sibling',
  'follow-up',
]

interface TagEditorProps {
  tags: string[]
  leadId: string
  leadType: 'waitlist' | 'contact'
  onTagsChange?: (leadId: string, newTags: string[]) => void
}

const TAG_COLORS = [
  { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  { bg: '#FDF4FF', text: '#7E22CE', border: '#E9D5FF' },
  { bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3' },
  { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4' },
]

function getTagColor(tag: string) {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

export function TagEditor({ tags, leadId, leadType, onTagsChange }: TagEditorProps) {
  const [currentTags, setCurrentTags] = useState<string[]>(tags)
  const [inputValue, setInputValue] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const saveTags = (newTags: string[]) => {
    startTransition(async () => {
      const action = leadType === 'waitlist' ? updateWaitlistTags : updateContactTags
      await action(leadId, newTags)
      if (onTagsChange) onTagsChange(leadId, newTags)
    })
  }

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase()
    if (!tag || currentTags.includes(tag)) return
    const newTags = [...currentTags, tag]
    setCurrentTags(newTags)
    setInputValue('')
    saveTags(newTags)
  }

  const removeTag = (tag: string) => {
    const newTags = currentTags.filter((t) => t !== tag)
    setCurrentTags(newTags)
    saveTags(newTags)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setInputValue('')
    } else if (e.key === 'Backspace' && inputValue === '' && currentTags.length > 0) {
      removeTag(currentTags[currentTags.length - 1])
    }
  }

  const handleBlur = () => {
    if (inputValue.trim()) addTag(inputValue)
    setIsEditing(false)
    setInputValue('')
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1"
      onClick={(e) => {
        e.stopPropagation()
        setIsEditing(true)
        setTimeout(() => inputRef.current?.focus(), 0)
      }}
    >
      {currentTags.map((tag) => {
        const color = getTagColor(tag)
        return (
          <span
            key={tag}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium rounded-full border"
            style={{
              backgroundColor: color.bg,
              color: color.text,
              borderColor: color.border,
            }}
          >
            {tag}
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
              className="ml-0.5 hover:opacity-70 transition-opacity leading-none"
              style={{ color: color.text, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              aria-label={`Remove tag ${tag}`}
            >
              ×
            </button>
          </span>
        )
      })}

      {isEditing ? (
        <div className="relative">
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onClick={(e) => e.stopPropagation()}
            placeholder="add tag…"
            className="text-xs outline-none bg-transparent"
            style={{
              width: Math.max(60, inputValue.length * 8 + 60) + 'px',
              color: '#6B7280',
              border: 'none',
              padding: '2px 0',
            }}
            disabled={isPending}
          />
          {(() => {
            const suggestions = PREDEFINED_TAGS.filter(
              (t) =>
                !currentTags.includes(t) &&
                (inputValue === '' || t.includes(inputValue.toLowerCase()))
            )
            if (suggestions.length === 0) return null
            return (
              <div
                className="absolute left-0 top-full mt-0.5 z-50 bg-white py-1"
                style={{
                  border: '1px solid #E8E4DF',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  minWidth: '140px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      addTag(s)
                      setIsEditing(false)
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors"
                    style={{ color: '#3D3D3D', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )
          })()}
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsEditing(true)
            setTimeout(() => inputRef.current?.focus(), 0)
          }}
          className="text-xs text-gray-300 hover:text-gray-400 transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
        >
          {currentTags.length === 0 ? '+ tag' : '+'}
        </button>
      )}
    </div>
  )
}
