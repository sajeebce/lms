# Texril - Complete Dependencies List

This document lists ALL packages used in the Texril project with their purposes.

---

## 📦 Production Dependencies (from `web/package.json`)

### **TipTap Editor Core** (4 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| `@tiptap/core` | ^3.10.7 | Core editor functionality |
| `@tiptap/react` | ^3.10.7 | React integration for TipTap |
| `@tiptap/pm` | ^3.10.7 | ProseMirror core (editor engine) |
| `@tiptap/starter-kit` | ^3.10.7 | Bundle of essential extensions |

### **TipTap Extensions** (20 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| `@tiptap/extension-blockquote` | ^3.10.7 | Blockquote formatting |
| `@tiptap/extension-bullet-list` | ^3.10.7 | Bullet lists |
| `@tiptap/extension-code-block-lowlight` | ^3.10.7 | Code blocks with syntax highlighting |
| `@tiptap/extension-color` | ^3.10.7 | Text color |
| `@tiptap/extension-font-family` | ^3.10.7 | Font family selection |
| `@tiptap/extension-heading` | ^3.10.7 | Headings (H1-H6) |
| `@tiptap/extension-highlight` | ^3.10.7 | Text highlighting |
| `@tiptap/extension-horizontal-rule` | ^3.10.7 | Horizontal rules |
| `@tiptap/extension-image` | ^3.10.7 | Image insertion |
| `@tiptap/extension-link` | ^3.10.7 | Hyperlinks |
| `@tiptap/extension-list` | ^3.10.7 | List utilities (TaskList, TaskItem) |
| `@tiptap/extension-list-item` | ^3.10.7 | List items |
| `@tiptap/extension-mathematics` | ^3.10.7 | LaTeX math equations |
| `@tiptap/extension-ordered-list` | ^3.10.7 | Ordered lists |
| `@tiptap/extension-placeholder` | ^3.10.7 | Placeholder text |
| `@tiptap/extension-subscript` | ^3.10.7 | Subscript text |
| `@tiptap/extension-superscript` | ^3.10.7 | Superscript text |
| `@tiptap/extension-table` | ^3.10.7 | Tables |
| `@tiptap/extension-table-cell` | ^3.10.7 | Table cells |
| `@tiptap/extension-table-header` | ^3.10.7 | Table headers |
| `@tiptap/extension-table-row` | ^3.10.7 | Table rows |
| `@tiptap/extension-text-align` | ^3.10.7 | Text alignment |
| `@tiptap/extension-text-style` | ^3.10.7 | Text styling |
| `@tiptap/extension-underline` | ^3.10.7 | Underline text |

### **Radix UI Components** (14 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| `@radix-ui/react-alert-dialog` | ^1.1.15 | Alert dialogs |
| `@radix-ui/react-checkbox` | ^1.3.3 | Checkboxes |
| `@radix-ui/react-collapsible` | ^1.1.12 | Collapsible sections |
| `@radix-ui/react-dialog` | ^1.1.15 | Modal dialogs |
| `@radix-ui/react-dropdown-menu` | ^2.1.16 | Dropdown menus |
| `@radix-ui/react-label` | ^2.1.8 | Form labels |
| `@radix-ui/react-popover` | ^1.1.15 | Popovers |
| `@radix-ui/react-progress` | ^1.1.8 | Progress bars |
| `@radix-ui/react-radio-group` | ^1.3.8 | Radio button groups |
| `@radix-ui/react-select` | ^2.2.6 | Select dropdowns |
| `@radix-ui/react-separator` | ^1.1.8 | Visual separators |
| `@radix-ui/react-switch` | ^1.2.6 | Toggle switches |
| `@radix-ui/react-tabs` | ^1.1.13 | Tab navigation |
| `@radix-ui/react-tooltip` | ^1.2.8 | Tooltips |

### **Utilities** (7 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| `class-variance-authority` | ^0.7.1 | CSS variant management |
| `clsx` | ^2.1.1 | Conditional classnames |
| `tailwind-merge` | ^3.4.0 | Merge Tailwind classes |
| `katex` | ^0.16.25 | Math equation rendering |
| `lowlight` | ^3.3.0 | Code syntax highlighting |
| `lucide-react` | ^0.553.0 | Icon library (1000+ icons) |
| `sonner` | ^2.0.7 | Toast notifications |

### **Framework** (3 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.0.3 | Next.js framework |
| `react` | 19.2.0 | React library |
| `react-dom` | 19.2.0 | React DOM rendering |

---

## 🛠️ Development Dependencies (from `web/package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| `@tailwindcss/postcss` | ^4 | Tailwind CSS v4 PostCSS plugin |
| `@types/node` | ^20 | TypeScript types for Node.js |
| `@types/react` | ^19 | TypeScript types for React |
| `@types/react-dom` | ^19 | TypeScript types for React DOM |
| `babel-plugin-react-compiler` | 1.0.0 | React Compiler (optimization) |
| `eslint` | ^9 | JavaScript/TypeScript linter |
| `eslint-config-next` | 16.0.3 | Next.js ESLint configuration |
| `tailwindcss` | ^4 | Tailwind CSS framework |
| `typescript` | ^5 | TypeScript compiler |

---

## 📊 Package Count Summary

- **Total Production Dependencies**: 48 packages
  - TipTap Core: 4
  - TipTap Extensions: 24
  - Radix UI: 14
  - Utilities: 7
  - Framework: 3

- **Total Dev Dependencies**: 9 packages

- **Grand Total**: 57 packages

---

## 🔄 How to Update Dependencies

### Update all packages to latest versions:
```bash
cd web
npm update
```

### Update specific package:
```bash
cd web
npm install @tiptap/core@latest
```

### Check for outdated packages:
```bash
cd web
npm outdated
```

---

## 🔒 Version Pinning Strategy

- **Framework packages** (Next.js, React): Pinned to specific versions for stability
- **TipTap packages**: All use same version (^3.10.7) for compatibility
- **Radix UI packages**: Use caret (^) for minor updates
- **Utilities**: Use caret (^) for minor updates

---

## 📝 Notes

1. **All packages are installed via npm** - No manual downloads needed
2. **Workspace setup** - Root `package.json` manages the `web` workspace
3. **No peer dependency warnings** - All peer dependencies are satisfied
4. **TypeScript support** - All packages have TypeScript types
5. **Tree-shakeable** - Most packages support tree-shaking for smaller bundles

---

## 🚀 Installation Command

```bash
# From texril root
npm install

# This will install all 57 packages automatically
```

---

## 📦 Bundle Size (Approximate)

- **node_modules size**: ~500 MB (includes all packages + dependencies)
- **Production build size**: ~2-3 MB (after tree-shaking and minification)
- **Initial page load**: ~500 KB (gzipped)

---

## 🔗 Useful Links

- **TipTap Docs**: https://tiptap.dev/docs
- **Radix UI Docs**: https://www.radix-ui.com/primitives
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev/icons

