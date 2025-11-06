'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mathematics from '@tiptap/extension-mathematics'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Button } from '@/components/ui/button'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Sigma,
  Undo,
  Redo
} from 'lucide-react'
import 'katex/dist/katex.min.css'
import { useEffect } from 'react'

type MathEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

export default function MathEditor({ 
  value, 
  onChange, 
  placeholder = 'Type here...',
  minHeight = '200px'
}: MathEditorProps) {
  const editor = useEditor({
    immediatelyRender: false, // ✅ Fix SSR hydration mismatch
    extensions: [
      StarterKit,
      Mathematics,
      Image,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) {
    return null
  }

  const addMath = () => {
    const latex = prompt('Enter LaTeX equation:\n\nExamples:\n- E = mc^2\n- \\frac{a}{b}\n- \\sqrt{x}\n- \\int_{0}^{\\infty} x^2 dx\n- \\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}')
    if (latex) {
      editor.chain().focus().insertContent({
        type: 'math_inline',
        attrs: { latex },
      }).run()
    }
  }

  const addImage = () => {
    const url = prompt('Enter image URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  return (
    <div className="border rounded-lg dark:border-slate-700 overflow-hidden">
      {/* Toolbar */}
      <div className="border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-slate-200 dark:bg-slate-700' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-slate-200 dark:bg-slate-700' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'bg-slate-200 dark:bg-slate-700' : ''}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-slate-200 dark:bg-slate-700' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-slate-200 dark:bg-slate-700' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'bg-slate-200 dark:bg-slate-700' : ''}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'bg-slate-200 dark:bg-slate-700' : ''}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'bg-slate-200 dark:bg-slate-700' : ''}
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Math & Image */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addMath}
          className="text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
        >
          <Sigma className="h-4 w-4 mr-1" />
          Math
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addImage}
        >
          <ImageIcon className="h-4 w-4 mr-1" />
          Image
        </Button>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className="prose dark:prose-invert max-w-none p-4"
        style={{ minHeight }}
      />
    </div>
  )
}

