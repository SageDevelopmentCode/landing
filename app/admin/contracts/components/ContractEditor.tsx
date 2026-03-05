'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import { colors, radius } from '../../design-system'

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

function Divider() {
  return (
    <div
      className="h-5 w-px mx-1"
      style={{ backgroundColor: colors.border }}
    />
  )
}

export default function ContractEditor({ content, onChange }: Props) {
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
        .tiptap-editor ul, .tiptap-editor ol { padding-left: 1.5rem; }
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

      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-0.5 px-3 py-2"
        style={{
          backgroundColor: colors.warmLinen,
          borderBottom: `1px solid ${colors.border}`,
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
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  )
}
