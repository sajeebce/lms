'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mathematics from '@tiptap/extension-mathematics'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Highlight } from '@tiptap/extension-highlight'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { common, createLowlight } from 'lowlight'
import { Button } from '@/components/ui/button'
import 'katex/dist/katex.min.css' // ✅ KaTeX CSS for math rendering
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
  Redo,
  Palette,
  Highlighter,
  Type,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Code,
  Table as TableIcon
} from 'lucide-react'
import 'katex/dist/katex.min.css'
import './editor-styles.css'
import { useEffect, useRef, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import MathLiveModal from './mathlive-modal'

const lowlight = createLowlight(common)

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
  const [showMathLive, setShowMathLive] = useState(false)
  const wasMathLiveOpen = useRef(false)

  const editor = useEditor({
    immediatelyRender: false, // ✅ Fix SSR hydration mismatch
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default code block (we use lowlight)
        underline: false, // Avoid duplicate underline extension
      }),
      Mathematics.configure({
        // ✅ Configure inline and block math nodes
        inlineOptions: {
          HTMLAttributes: {
            class: 'math-inline',
          },
        },
        blockOptions: {
          HTMLAttributes: {
            class: 'math-block',
          },
        },
        katexOptions: {
          throwOnError: false, // Don't throw on LaTeX errors
        },
      }),
      Image,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
      // Phase 1: Text Color & Highlight
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      // Phase 1: Subscript & Superscript
      Subscript,
      Superscript,
      // Phase 1: Code Blocks with Syntax Highlighting
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'javascript',
      }),
      // Phase 1: Tables
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
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

  useEffect(() => {
    if (!editor) {
      wasMathLiveOpen.current = showMathLive
      return
    }

    if (!showMathLive && wasMathLiveOpen.current) {
      const timer = window.setTimeout(() => {
        requestAnimationFrame(() => {
          editor.commands.focus('end')
        })
      }, 0)
      wasMathLiveOpen.current = false

      return () => window.clearTimeout(timer)
    }

    wasMathLiveOpen.current = showMathLive
  }, [showMathLive, editor])

  if (!editor) {
    return null
  }

  const insertMathNode = (rawLatex: string) => {
    if (!editor) return

    const latex = rawLatex.trim()
    if (!latex) return

    const shouldUseBlock = latex.includes('\n') || latex.startsWith('\\begin')

    if (shouldUseBlock) {
      const inserted = editor.chain().focus().insertBlockMath({ latex }).run()
      if (!inserted) {
        editor.chain().focus().insertInlineMath({ latex }).run()
      }
    } else {
      editor.chain().focus().insertInlineMath({ latex }).run()
    }
  }

  const addMath = () => {
    const latex = prompt('Enter LaTeX equation:\n\nExamples:\n- E = mc^2\n- \\frac{a}{b}\n- \\sqrt{x}\n- \\int_{0}^{\\infty} x^2 dx\n- \\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}')
    if (latex) {
      insertMathNode(latex)
    }
  }

  const addImage = () => {
    const url = prompt('Enter image URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const handleMathLiveInsert = (latex: string) => {
    insertMathNode(latex)
    setShowMathLive(false)
  }

  // Color presets
  const textColors = [
    '#000000', '#374151', '#DC2626', '#EA580C', '#D97706', '#CA8A04',
    '#65A30D', '#16A34A', '#059669', '#0891B2', '#0284C7', '#2563EB',
    '#4F46E5', '#7C3AED', '#C026D3', '#DB2777'
  ]

  const highlightColors = [
    '#FEF3C7', '#FED7AA', '#FECACA', '#E9D5FF', '#DBEAFE', '#D1FAE5'
  ]

  const fontSizes = [
    { label: 'Small', value: '12px' },
    { label: 'Normal', value: '16px' },
    { label: 'Large', value: '20px' },
    { label: 'Huge', value: '24px' },
  ]

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

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1"
            >
              <Palette className="h-4 w-4" />
              <div
                className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600"
                style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000000' }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Text Color</Label>
              <div className="grid grid-cols-8 gap-2">
                {textColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded border-2 border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => editor.chain().focus().setColor(color).run()}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => editor.chain().focus().unsetColor().run()}
              >
                Remove Color
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Highlight */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Highlight</Label>
              <div className="grid grid-cols-6 gap-2">
                {highlightColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-8 h-8 rounded border-2 border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => editor.chain().focus().unsetHighlight().run()}
              >
                Remove Highlight
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Font Size */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
            >
              <Type className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Font Size</Label>
              {fontSizes.map((size) => (
                <Button
                  key={size.value}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => editor.chain().focus().setMark('textStyle', { fontSize: size.value }).run()}
                >
                  {size.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Subscript & Superscript */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={editor.isActive('subscript') ? 'bg-slate-200 dark:bg-slate-700' : ''}
        >
          <SubscriptIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={editor.isActive('superscript') ? 'bg-slate-200 dark:bg-slate-700' : ''}
        >
          <SuperscriptIcon className="h-4 w-4" />
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

        {/* Code Block */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'bg-slate-200 dark:bg-slate-700' : ''}
        >
          <Code className="h-4 w-4" />
        </Button>

        {/* Table */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertTable}
        >
          <TableIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Math (LaTeX Prompt) */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addMath}
          className="text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
          title="Insert LaTeX (Prompt)"
        >
          <Sigma className="h-4 w-4 mr-1" />
          LaTeX
        </Button>

        {/* Math (MathLive Visual Editor) */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowMathLive(true)}
          className="bg-gradient-to-r from-violet-600 to-orange-500 hover:from-violet-700 hover:to-orange-600 text-white"
          title="Insert Math (Visual Editor)"
        >
          <Sigma className="h-4 w-4 mr-1" />
          Math
        </Button>

        {/* Image */}
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

      {/* MathLive Modal */}
      <MathLiveModal
        open={showMathLive}
        onClose={() => setShowMathLive(false)}
        onInsert={handleMathLiveInsert}
      />
    </div>
  )
}


