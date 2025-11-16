# Texril - Installation & Setup Guide

## 📋 Prerequisites

Before installing Texril, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Git**: For cloning the repository

Check your versions:
```bash
node --version
npm --version
```

---

## 🚀 Quick Start (Standalone Installation)

### Option 1: Copy the Entire `texril` Folder

1. **Copy the `texril` folder** to your desired location:
   ```bash
   cp -r texril /path/to/your/project/
   cd /path/to/your/project/texril
   ```

2. **Install all dependencies**:
   ```bash
   npm install
   ```
   This will install dependencies for both the root workspace and the `web` subfolder.

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   ```
   http://localhost:3000
   ```

---

### Option 2: Manual Installation (Step by Step)

If you prefer to install manually:

1. **Navigate to the texril folder**:
   ```bash
   cd texril
   ```

2. **Install root dependencies**:
   ```bash
   npm install
   ```

3. **Navigate to the web folder**:
   ```bash
   cd web
   ```

4. **Install web dependencies**:
   ```bash
   npm install
   ```

5. **Go back to root and run dev server**:
   ```bash
   cd ..
   npm run dev
   ```

---

## 📦 What Gets Installed?

### Core Dependencies (from `web/package.json`)

#### **TipTap Editor Extensions** (Rich Text Editing)
- `@tiptap/core` - Core editor functionality
- `@tiptap/react` - React integration
- `@tiptap/starter-kit` - Essential extensions bundle
- `@tiptap/extension-*` - 20+ extensions for formatting, tables, math, etc.

#### **UI Components** (Radix UI + shadcn/ui)
- `@radix-ui/react-*` - Accessible UI primitives (14 components)
- `lucide-react` - Icon library
- `sonner` - Toast notifications

#### **Utilities**
- `class-variance-authority` - CSS class management
- `clsx` - Conditional classnames
- `tailwind-merge` - Merge Tailwind classes
- `katex` - Math rendering
- `lowlight` - Code syntax highlighting

#### **Framework**
- `next` (v16.0.3) - Next.js framework
- `react` (v19.2.0) - React library
- `react-dom` (v19.2.0) - React DOM

#### **Dev Dependencies**
- `typescript` - TypeScript support
- `tailwindcss` (v4) - CSS framework
- `eslint` - Code linting
- `@types/*` - TypeScript type definitions

---

## 🗂️ Project Structure

```
texril/
├── package.json              # Root workspace config
├── INSTALLATION.md           # This file
├── README.md                 # Project overview
├── components/               # Shared components (can be imported by web)
│   └── ui/
│       ├── rich-text-editor.tsx
│       └── editor-styles.css
├── docs/                     # Documentation
│   ├── SAAS_EMBED_PRODUCT_PLAN.md
│   ├── TIPTAP_EDITOR_ROADMAP.md
│   └── PHASE1_LOCAL_TESTING_GUIDE.md
├── web/                      # Next.js web application
│   ├── package.json          # Web app dependencies
│   ├── next.config.ts        # Next.js config
│   ├── tsconfig.json         # TypeScript config
│   ├── postcss.config.mjs    # PostCSS config
│   ├── eslint.config.mjs     # ESLint config
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   ├── components/       # Web-specific components
│   │   └── lib/              # Utilities
│   └── public/               # Static assets
└── wordpress-plugin/         # WordPress integration (future)
```

---

## 🛠️ Available Scripts

Run these from the **root `texril` folder**:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (http://localhost:3000) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run install-all` | Install all dependencies (root + web) |
| `npm run clean` | Remove all node_modules |

---

## 🔧 Configuration Files

### `next.config.ts`
- Enables `externalDir: true` to import shared components from `../components`
- Enables React Compiler for optimization

### `tsconfig.json`
- Path alias: `@/*` maps to `./src/*`
- Strict TypeScript mode enabled

### `postcss.config.mjs`
- Tailwind CSS v4 PostCSS plugin

### `eslint.config.mjs`
- Next.js recommended ESLint rules

---

## 🌐 Environment Variables (Optional)

Create a `.env.local` file in the `web` folder if needed:

```env
# Example (not required for basic usage)
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## 🐛 Troubleshooting

### Issue: `npm install` fails
**Solution**: Delete `node_modules` and `package-lock.json`, then reinstall:
```bash
rm -rf node_modules package-lock.json web/node_modules web/package-lock.json
npm install
```

### Issue: Port 3000 already in use
**Solution**: Use a different port:
```bash
PORT=3001 npm run dev
```

### Issue: TypeScript errors
**Solution**: Regenerate TypeScript types:
```bash
cd web
npx next dev
```

---

## 📚 Next Steps

1. ✅ Installation complete
2. 📖 Read `docs/SAAS_EMBED_PRODUCT_PLAN.md` for product vision
3. 🎨 Explore `docs/TIPTAP_EDITOR_ROADMAP.md` for feature roadmap
4. 🧪 Follow `docs/PHASE1_LOCAL_TESTING_GUIDE.md` for testing

---

## 📞 Support

For issues or questions, refer to the documentation in the `docs/` folder.

