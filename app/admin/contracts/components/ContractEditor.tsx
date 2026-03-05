'use client'

import { useState, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import { colors, radius, shadows } from '../../design-system'

const FULL_SIGNATURE_HTML =
  '<p style="margin-top: 1rem;"><strong>Signature:</strong> _____________________________________ &nbsp;&nbsp; ' +
  '<strong>Name:</strong> _____________________ &nbsp;&nbsp; <strong>Date:</strong> ___________</p>'

const INITIALS_HTML =
  '<p style="margin-top: 1rem;"><strong>Initials:</strong> _______ &nbsp;&nbsp; <strong>Date:</strong> ___________</p>'

type Props = {
  content: string
  onChange: (html: string) => void
}

type ToolbarButtonProps = {
  onClick: () => void
  isActive?: boolean
  title?: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, isActive, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      className="inline-flex items-center justify-center w-7 h-7 text-xs transition-colors duration-150"
      style={{
        backgroundColor: isActive ? colors.pastelSage : 'transparent',
        color: isActive ? colors.mistyForest : colors.textSecondary,
        borderRadius: radius.sm,
        border: 'none',
        cursor: 'pointer',
        fontWeight: isActive ? 600 : 400,
      }}
    >
      {children}
    </button>
  )
}

function SigOption({ label, onMouseDown }: { label: string; onMouseDown: (e: React.MouseEvent) => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '6px 12px',
        fontSize: '0.8rem',
        color: colors.textPrimary,
        backgroundColor: hovered ? colors.pastelSage : 'transparent',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function Divider() {
  return (
    <div
      className="h-5 w-px mx-1"
      style={{ backgroundColor: colors.border }}
    />
  )
}

export default function ContractEditor({ content, onChange }: Props) {
  const [sigMenuOpen, setSigMenuOpen] = useState(false)
  const sigMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sigMenuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (sigMenuRef.current && !sigMenuRef.current.contains(e.target as Node)) {
        setSigMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [sigMenuOpen])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
  })

  if (!editor) return null

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          border: `1px solid ${colors.border}`,
          borderRadius: radius.md,
          overflow: 'hidden',
          backgroundColor: '#fff',
        }}
      >
      <style>{`
        .tiptap-editor {
          min-height: 500px;
          padding: 1.25rem 1.5rem;
          padding-bottom: 4rem;
          outline: none;
          font-size: 0.9rem;
          line-height: 1.7;
          color: ${colors.textPrimary};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .tiptap-editor h1 { font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 0.5rem; color: ${colors.mistyForest}; }
        .tiptap-editor h2 { font-size: 1.25rem; font-weight: 600; margin: 1.25rem 0 0.5rem; color: ${colors.textPrimary}; }
        .tiptap-editor h3 { font-size: 1rem; font-weight: 600; margin: 1rem 0 0.5rem; color: ${colors.textPrimary}; }
        .tiptap-editor p { margin: 0.25rem 0; }
        .tiptap-editor ul { list-style-type: disc; padding-left: 1.5rem; }
        .tiptap-editor ul ul { list-style-type: circle; }
        .tiptap-editor ul ul ul { list-style-type: square; }
        .tiptap-editor ol { list-style-type: decimal; padding-left: 1.5rem; }
        .tiptap-editor ul li::marker, .tiptap-editor ol li::marker { color: ${colors.textPrimary}; }
        .tiptap-editor strong { font-weight: 700; }
        .tiptap-editor em { font-style: italic; }
        .tiptap-editor u { text-decoration: underline; }
        .tiptap-editor blockquote { border-left: 3px solid ${colors.pastelSage}; padding-left: 1rem; color: ${colors.textSecondary}; margin: 0.5rem 0; }
        .tiptap-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: ${colors.textTertiary};
          pointer-events: none;
          height: 0;
        }

      `}</style>

      {/* Editor area */}
      <EditorContent editor={editor} />

      {/* Bubble toolbar — appears above selected text */}
      <BubbleMenu
        editor={editor}
        appendTo={() => document.body}
        options={{
          placement: 'top',
          offset: 8,
          flip: true,
          shift: true,
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          padding: '4px 6px',
          backgroundColor: colors.warmLinen,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.md,
          boxShadow: '0 4px 16px rgba(94, 124, 104, 0.12)',
          zIndex: 50,
        }}
      >
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <u>U</u>
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          H3
        </ToolbarButton>
        <Divider />
        <label
          title="Text color"
          className="relative inline-flex items-center justify-center w-7 h-7 cursor-pointer"
          style={{ borderRadius: radius.sm }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>A</span>
          <input
            type="color"
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            defaultValue="#000000"
            onInput={(e) => {
              editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()
            }}
          />
        </label>
      </BubbleMenu>
      </div>

      {/* Floating toolbar — pill centered above bottom edge */}
      <div
        className="flex items-center gap-0.5 px-3 py-2"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40,
          backgroundColor: colors.warmLinen,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          boxShadow: shadows.medium,
          whiteSpace: 'nowrap',
        }}
      >
        {/* History */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          ↩
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          ↪
        </ToolbarButton>

        <Divider />

        {/* Format */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <u>U</u>
        </ToolbarButton>

        <Divider />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          H3
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          isActive={editor.isActive('paragraph')}
          title="Normal text"
        >
          ¶
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet list"
        >
          •≡
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Ordered list"
        >
          1≡
        </ToolbarButton>

        <Divider />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align left"
        >
          ≡←
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align center"
        >
          ≡
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align right"
        >
          ≡→
        </ToolbarButton>

        <Divider />

        {/* Text color */}
        <label title="Text color" className="relative inline-flex items-center justify-center w-7 h-7 cursor-pointer" style={{ borderRadius: radius.sm }}>
          <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>A</span>
          <input
            type="color"
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            defaultValue="#000000"
            onInput={(e) => {
              editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()
            }}
          />
        </label>

        {/* Highlight */}
        <label title="Highlight color" className="relative inline-flex items-center justify-center w-7 h-7 cursor-pointer" style={{ borderRadius: radius.sm }}>
          <span className="text-xs" style={{ backgroundColor: '#FFFF00', padding: '0 2px', color: '#333' }}>ab</span>
          <input
            type="color"
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            defaultValue="#FFFF00"
            onInput={(e) => {
              editor.chain().focus().toggleHighlight({ color: (e.target as HTMLInputElement).value }).run()
            }}
          />
        </label>

        <Divider />

        {/* Hard break */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setHardBreak().run()}
          title="Line break"
        >
          ↵
        </ToolbarButton>

        {/* Signature dropdown */}
        <div ref={sigMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              setSigMenuOpen((open) => !open)
            }}
            title="Insert signature line"
            className="inline-flex items-center justify-center h-7 text-xs transition-colors duration-150"
            style={{
              padding: '0 6px',
              backgroundColor: sigMenuOpen ? colors.pastelSage : 'transparent',
              color: sigMenuOpen ? colors.mistyForest : colors.textSecondary,
              borderRadius: radius.sm,
              border: 'none',
              cursor: 'pointer',
              gap: '2px',
            }}
          >
            Sig <span style={{ fontSize: '0.6rem' }}>▾</span>
          </button>
          {sigMenuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 4px)',
                left: 0,
                backgroundColor: '#fff',
                border: `1px solid ${colors.border}`,
                borderRadius: radius.md,
                boxShadow: shadows.medium,
                zIndex: 50,
                minWidth: '160px',
                padding: '4px 0',
              }}
            >
              {[
                { label: 'Full Signature', html: FULL_SIGNATURE_HTML },
                { label: 'Initials Only', html: INITIALS_HTML },
              ].map(({ label, html }) => (
                <SigOption
                  key={label}
                  label={label}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    editor.chain().focus().insertContent(html).run()
                    setSigMenuOpen(false)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
