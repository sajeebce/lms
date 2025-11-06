# 📝 Text Editor Recommendations for LMS Question Bank

## 🎯 Overview

This document provides comprehensive recommendations for implementing a rich text editor with **math support**, **markdown**, **text formatting**, and **color/decoration** features for the LMS Question Bank.

---

## 🔍 Current Implementation

**What we have now:**
- ✅ **TipTap** + **KaTeX** for basic rich text + math
- ✅ Bold, Italic, Underline
- ✅ Lists (Bullet, Numbered)
- ✅ Text Alignment
- ✅ Math equations (LaTeX via prompt)
- ✅ Image insertion
- ✅ Dark mode support

**What's missing:**
- ❌ Text color / highlight
- ❌ Font size
- ❌ Markdown shortcuts
- ❌ Better math input (templates)
- ❌ Code blocks
- ❌ Tables
- ❌ Subscript / Superscript

---

## 🚀 Recommended Improvements

### **Phase 1: Enhanced Text Formatting (Quick Win)**

Add these TipTap extensions to existing editor:

#### **1. Text Color & Highlight**

```bash
npm install @tiptap/extension-color @tiptap/extension-text-style @tiptap/extension-highlight
```

```tsx
import Color from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'

const editor = useEditor({
  extensions: [
    // ... existing extensions
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true
    }),
  ]
})

// Toolbar buttons
<Button onClick={() => editor.chain().focus().setColor('#FF0000').run()}>
  Red Text
</Button>
<Button onClick={() => editor.chain().focus().toggleHighlight({ color: '#FFFF00' }).run()}>
  Yellow Highlight
</Button>
```

**Features:**
- ✅ Text color picker (16 preset colors)
- ✅ Background highlight (6 colors)
- ✅ Custom color input
- ✅ Remove color option

**UI Design:**
```
┌─────────────────────────────────────┐
│ [A▼] Text Color                     │
│ ┌─┬─┬─┬─┬─┬─┬─┬─┐                  │
│ │█│█│█│█│█│█│█│█│ (Color swatches) │
│ └─┴─┴─┴─┴─┴─┴─┴─┘                  │
│ [Custom: #______]                   │
└─────────────────────────────────────┘
```

---

#### **2. Font Size**

```bash
npm install @tiptap/extension-font-family
```

```tsx
import FontFamily from '@tiptap/extension-font-family'

const editor = useEditor({
  extensions: [
    // ... existing
    FontFamily,
    TextStyle.configure({
      types: ['textStyle'],
    }),
  ]
})

// Custom font size extension
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize,
        renderHTML: attributes => {
          if (!attributes.fontSize) return {}
          return { style: `font-size: ${attributes.fontSize}` }
        },
      },
    }
  },
})

// Toolbar
<Select onValueChange={(size) => editor.chain().focus().setMark('textStyle', { fontSize: size }).run()}>
  <option value="12px">Small</option>
  <option value="16px">Normal</option>
  <option value="20px">Large</option>
  <option value="24px">Huge</option>
</Select>
```

---

#### **3. Subscript & Superscript**

```bash
npm install @tiptap/extension-subscript @tiptap/extension-superscript
```

```tsx
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'

const editor = useEditor({
  extensions: [
    // ... existing
    Subscript,
    Superscript,
  ]
})

// Toolbar
<Button onClick={() => editor.chain().focus().toggleSubscript().run()}>
  X₂ (Subscript)
</Button>
<Button onClick={() => editor.chain().focus().toggleSuperscript().run()}>
  X² (Superscript)
</Button>
```

**Use Cases:**
- Chemical formulas: H₂O, CO₂
- Math: x², x³, aⁿ
- Footnotes: Reference¹, Note²

---

#### **4. Markdown Support**

TipTap has **built-in markdown shortcuts**! Just enable them:

```tsx
import StarterKit from '@tiptap/starter-kit'

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      // Enable markdown shortcuts
      heading: {
        levels: [1, 2, 3],
      },
    }),
  ]
})
```

**Shortcuts that work automatically:**
- `# Heading 1` → Converts to H1
- `## Heading 2` → Converts to H2
- `**bold**` → **bold**
- `*italic*` → *italic*
- `- List item` → Bullet list
- `1. Item` → Numbered list
- `` `code` `` → Inline code
- `> Quote` → Blockquote

---

#### **5. Code Blocks**

```bash
npm install @tiptap/extension-code-block-lowlight lowlight
```

```tsx
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { lowlight } from 'lowlight'

const editor = useEditor({
  extensions: [
    // ... existing
    CodeBlockLowlight.configure({
      lowlight,
      defaultLanguage: 'javascript',
    }),
  ]
})

// Toolbar
<Button onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
  </> Code Block
</Button>
```

**Features:**
- ✅ Syntax highlighting (JavaScript, Python, C++, etc.)
- ✅ Line numbers
- ✅ Language selector
- ✅ Copy button

---

#### **6. Tables**

```bash
npm install @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-header @tiptap/extension-table-cell
```

```tsx
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'

const editor = useEditor({
  extensions: [
    // ... existing
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
  ]
})

// Toolbar
<Button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}>
  Insert Table
</Button>
```

---

### **Phase 2: Better Math Input (Recommended)**

#### **Option A: Template Modal (Best Balance)**

**Concept:** Click "Math" → Modal with templates + LaTeX editor

```tsx
const mathTemplates = [
  // Basic
  { name: 'Fraction', latex: '\\frac{a}{b}', category: 'Basic' },
  { name: 'Square Root', latex: '\\sqrt{x}', category: 'Basic' },
  { name: 'Power', latex: 'x^{n}', category: 'Basic' },
  { name: 'Subscript', latex: 'x_{i}', category: 'Basic' },
  
  // Calculus
  { name: 'Integral', latex: '\\int_{a}^{b} f(x) dx', category: 'Calculus' },
  { name: 'Derivative', latex: '\\frac{d}{dx} f(x)', category: 'Calculus' },
  { name: 'Partial Derivative', latex: '\\frac{\\partial f}{\\partial x}', category: 'Calculus' },
  { name: 'Limit', latex: '\\lim_{x \\to \\infty} f(x)', category: 'Calculus' },
  { name: 'Summation', latex: '\\sum_{i=1}^{n} i', category: 'Calculus' },
  { name: 'Product', latex: '\\prod_{i=1}^{n} i', category: 'Calculus' },
  
  // Linear Algebra
  { name: 'Matrix 2x2', latex: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}', category: 'Matrix' },
  { name: 'Matrix 3x3', latex: '\\begin{bmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{bmatrix}', category: 'Matrix' },
  { name: 'Determinant', latex: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}', category: 'Matrix' },
  { name: 'Vector', latex: '\\vec{v}', category: 'Matrix' },
  { name: 'Unit Vector', latex: '\\hat{v}', category: 'Matrix' },
  
  // Trigonometry
  { name: 'Sin', latex: '\\sin\\theta', category: 'Trig' },
  { name: 'Cos', latex: '\\cos\\theta', category: 'Trig' },
  { name: 'Tan', latex: '\\tan\\theta', category: 'Trig' },
  { name: 'Sin²', latex: '\\sin^2\\theta', category: 'Trig' },
  
  // Greek Letters
  { name: 'Alpha', latex: '\\alpha', category: 'Greek' },
  { name: 'Beta', latex: '\\beta', category: 'Greek' },
  { name: 'Gamma', latex: '\\gamma', category: 'Greek' },
  { name: 'Delta', latex: '\\delta', category: 'Greek' },
  { name: 'Theta', latex: '\\theta', category: 'Greek' },
  { name: 'Pi', latex: '\\pi', category: 'Greek' },
  { name: 'Sigma', latex: '\\sigma', category: 'Greek' },
  
  // Symbols
  { name: 'Infinity', latex: '\\infty', category: 'Symbol' },
  { name: 'Plus/Minus', latex: '\\pm', category: 'Symbol' },
  { name: 'Not Equal', latex: '\\neq', category: 'Symbol' },
  { name: 'Less/Equal', latex: '\\leq', category: 'Symbol' },
  { name: 'Greater/Equal', latex: '\\geq', category: 'Symbol' },
  { name: 'Approximately', latex: '\\approx', category: 'Symbol' },
]
```

**Modal UI:**
```
┌──────────────────────────────────────────────┐
│ Insert Math Equation                    [×]  │
├──────────────────────────────────────────────┤
│ Categories: [All] [Basic] [Calculus]         │
│             [Matrix] [Trig] [Greek] [Symbol] │
│                                              │
│ Templates:                                   │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐         │
│ │ a  │ │ √x │ │ xⁿ │ │ ∫  │ │ Σ  │         │
│ │ ─  │ │    │ │    │ │    │ │    │         │
│ │ b  │ │    │ │    │ │    │ │    │         │
│ └────┘ └────┘ └────┘ └────┘ └────┘         │
│                                              │
│ LaTeX Code:                                  │
│ ┌──────────────────────────────────────────┐ │
│ │ \frac{a}{b}                              │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Live Preview:                                │
│ ┌──────────────────────────────────────────┐ │
│ │   a                                      │ │
│ │   ─                                      │ │
│ │   b                                      │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ [Cancel]                          [Insert]  │
└──────────────────────────────────────────────┘
```

**Pros:**
- ✅ Beginner-friendly (click templates)
- ✅ Advanced users can edit LaTeX
- ✅ Live preview
- ✅ Categorized templates
- ✅ Small bundle size

---

#### **Option B: MathLive (Visual Editor)**

**Best UX but larger bundle:**

```bash
npm install mathlive
```

```tsx
import 'mathlive'

<math-field
  virtual-keyboard-mode="manual"
  onInput={(e) => setLatex(e.target.value)}
>
  {latex}
</math-field>
```

**Features:**
- ✅ Visual editing (like Microsoft Word)
- ✅ Symbol palette
- ✅ Auto-complete
- ✅ Keyboard shortcuts
- ✅ Mobile virtual keyboard

**Demo:** https://cortexjs.io/mathlive/demo/

**Pros:**
- ✅ Best UX (industry standard)
- ✅ No LaTeX knowledge needed
- ✅ Mobile-friendly

**Cons:**
- ⚠️ Larger bundle (~200KB)
- ⚠️ Web component (not pure React)

---

### **Phase 3: Advanced Features (Future)**

#### **1. Collaborative Editing**

```bash
npm install @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor y-websocket yjs
```

**Features:**
- ✅ Real-time collaboration (like Google Docs)
- ✅ See other users' cursors
- ✅ Conflict resolution
- ✅ Undo/redo per user

---

#### **2. Slash Commands**

```bash
npm install @tiptap/extension-slash-command
```

**Usage:**
- Type `/` → Shows command menu
- `/heading1` → Insert H1
- `/table` → Insert table
- `/math` → Insert math
- `/code` → Insert code block

---

#### **3. Drag & Drop**

```bash
npm install @tiptap/extension-dropcursor
```

**Features:**
- ✅ Drag images to reorder
- ✅ Drag text blocks
- ✅ Visual drop indicator

---

## 📊 Complete Feature Comparison

| Feature | Current | Phase 1 | Phase 2 | Phase 3 |
|---------|---------|---------|---------|---------|
| **Text Formatting** |
| Bold, Italic, Underline | ✅ | ✅ | ✅ | ✅ |
| Text Color | ❌ | ✅ | ✅ | ✅ |
| Highlight | ❌ | ✅ | ✅ | ✅ |
| Font Size | ❌ | ✅ | ✅ | ✅ |
| Subscript/Superscript | ❌ | ✅ | ✅ | ✅ |
| **Lists & Alignment** |
| Bullet/Numbered Lists | ✅ | ✅ | ✅ | ✅ |
| Text Alignment | ✅ | ✅ | ✅ | ✅ |
| **Math** |
| LaTeX (Prompt) | ✅ | ✅ | ❌ | ❌ |
| Template Modal | ❌ | ❌ | ✅ | ✅ |
| Visual Editor (MathLive) | ❌ | ❌ | ⚠️ | ✅ |
| **Markdown** |
| Shortcuts | ❌ | ✅ | ✅ | ✅ |
| Code Blocks | ❌ | ✅ | ✅ | ✅ |
| **Tables** | ❌ | ✅ | ✅ | ✅ |
| **Images** | ✅ | ✅ | ✅ | ✅ |
| **Advanced** |
| Slash Commands | ❌ | ❌ | ❌ | ✅ |
| Collaboration | ❌ | ❌ | ❌ | ✅ |
| Drag & Drop | ❌ | ❌ | ❌ | ✅ |

---

## 🎯 Final Recommendations

### **Immediate (This Week):**
1. ✅ Add **Text Color** + **Highlight**
2. ✅ Add **Font Size**
3. ✅ Add **Subscript/Superscript**
4. ✅ Enable **Markdown shortcuts**

**Effort:** 2-3 hours  
**Impact:** High (teachers will love it)

---

### **Short-term (Next 2 Weeks):**
1. ✅ Implement **Math Template Modal**
2. ✅ Add **Code Blocks**
3. ✅ Add **Tables**

**Effort:** 1 day  
**Impact:** Very High (complete editor)

---

### **Long-term (Future):**
1. ⚠️ Consider **MathLive** if users request better math UX
2. ⚠️ Add **Slash Commands** for power users
3. ⚠️ Add **Collaboration** if multiple teachers edit same question

---

## 💡 Implementation Priority

**Must Have (Phase 1):**
- Text Color & Highlight
- Font Size
- Subscript/Superscript
- Markdown shortcuts

**Should Have (Phase 2):**
- Math Template Modal
- Code Blocks
- Tables

**Nice to Have (Phase 3):**
- MathLive
- Slash Commands
- Collaboration

---

## 📦 Bundle Size Impact

| Addition | Size (gzipped) | Total |
|----------|----------------|-------|
| Current (TipTap + KaTeX) | ~60KB | 60KB |
| + Color/Highlight | +5KB | 65KB |
| + Font Size | +2KB | 67KB |
| + Sub/Superscript | +3KB | 70KB |
| + Code Blocks | +15KB | 85KB |
| + Tables | +10KB | 95KB |
| + Math Templates | +5KB | 100KB |
| + MathLive (optional) | +200KB | 300KB |

**Recommendation:** Stay under 100KB (without MathLive) for best performance.

---

## 🔗 Resources

- **TipTap Docs:** https://tiptap.dev/docs
- **TipTap Extensions:** https://tiptap.dev/docs/editor/extensions
- **KaTeX Docs:** https://katex.org/docs/supported.html
- **MathLive Demo:** https://cortexjs.io/mathlive/demo/
- **LaTeX Cheat Sheet:** https://www.overleaf.com/learn/latex/Mathematical_expressions

---

**Last Updated:** 2025-11-06  
**Status:** Ready for Implementation

