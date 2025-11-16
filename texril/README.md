# Texril - Rich Text Editor

This `texril` folder is a **snapshot** of the LMS rich text editor so you can turn it into a separate SaaS product later without touching the main LMS code.

## What's inside

- `components/ui/rich-text-editor.tsx`
  - Full TipTap-based editor implementation (copied from `components/ui/rich-text-editor.tsx`)
- `components/ui/editor-styles.css`
  - All ProseMirror/editor CSS (copied from `components/ui/editor-styles.css`)
- `docs/TIPTAP_EDITOR_ROADMAP.md`
  - Editor roadmap / architecture notes (copied from `docs/TIPTAP_EDITOR_ROADMAP.md`)

## How to use this as a separate project

1. In VS Code, you can **open just this folder**:
   - `File → Open Folder... → texril`
2. Later you can move/copy `texril` into a **new repo** and add your own:
   - `package.json`
   - Next.js / Vite app shell
   - API routes for SaaS embed / domain locking / JWT, etc.

## Important

- The **original LMS editor is still in place** under `components/ui/rich-text-editor.tsx`.
- Changes you make in `texril` **will NOT affect** the LMS, unless you intentionally point imports back to LMS code.
- For real SaaS embed, you'll want to implement:
  - Domain whitelisting / domain locking
  - Signed JWT tokens per user/session
  - Rate limiting & abuse detection
  - Billing checks before enabling the editor

This folder is just a clean starting point so you don't have to refactor the live LMS while experimenting with the SaaS version.
