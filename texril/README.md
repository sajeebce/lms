# Texril - Advanced Rich Text Editor (SaaS-Ready)

**Texril** is a powerful, embeddable rich text editor built with **TipTap**, **Next.js 16**, and **React 19**. This project is designed to be a standalone SaaS product that can be embedded into any website or used as a standalone editor.

---

## 🚀 Quick Start

### **Installation**

```bash
# Clone or copy this folder to your desired location
cd texril

# Install all dependencies
npm install

# Start development server
npm run dev

# Open browser at http://localhost:3000
```

**📖 For detailed installation instructions, see [INSTALLATION.md](./INSTALLATION.md)**

---

## 📦 What's Inside

### **Core Components**

- `components/ui/rich-text-editor.tsx` - Full TipTap-based editor implementation
- `components/ui/editor-styles.css` - All ProseMirror/editor CSS
- `web/` - Next.js 16 web application with App Router

### **Documentation**

- `docs/SAAS_EMBED_PRODUCT_PLAN.md` - SaaS product vision & roadmap
- `docs/TIPTAP_EDITOR_ROADMAP.md` - Editor features & architecture
- `docs/PHASE1_LOCAL_TESTING_GUIDE.md` - Testing guide
- `INSTALLATION.md` - Complete installation guide

### **Configuration**

- `package.json` - Root workspace configuration
- `web/package.json` - Web app dependencies (all packages listed)
- `web/next.config.ts` - Next.js configuration
- `web/tsconfig.json` - TypeScript configuration
- `.gitignore` - Git ignore rules
- `.npmrc` - npm configuration

---

## 🎯 Features

### **Rich Text Editing**

- ✅ **Formatting**: Bold, Italic, Underline, Strikethrough
- ✅ **Headings**: H1-H6 with custom styling
- ✅ **Lists**: Bullet lists, Ordered lists, Task lists
- ✅ **Alignment**: Left, Center, Right, Justify
- ✅ **Colors**: Text color, Highlight color
- ✅ **Typography**: Font family, Subscript, Superscript
- ✅ **Tables**: Insert, edit, delete rows/columns
- ✅ **Media**: Images, Audio (with custom player)
- ✅ **Code**: Code blocks with syntax highlighting (Lowlight)
- ✅ **Math**: LaTeX equations (KaTeX)
- ✅ **Links**: Insert/edit hyperlinks
- ✅ **Blockquotes**: Quote formatting
- ✅ **Horizontal Rules**: Visual separators

### **Modern Tech Stack**

- ⚡ **Next.js 16** - Latest App Router with React Server Components
- ⚛️ **React 19** - Latest React with React Compiler
- 🎨 **Tailwind CSS v4** - Modern utility-first CSS
- 🧩 **Radix UI** - Accessible UI primitives
- 📝 **TipTap 3.10** - Extensible rich text editor
- 🔤 **TypeScript** - Type-safe development

---

## 📂 Project Structure

```
texril/
├── package.json              # Root workspace config
├── INSTALLATION.md           # Installation guide
├── README.md                 # This file
├── .gitignore                # Git ignore rules
├── .npmrc                    # npm configuration
├── components/               # Shared components
│   └── ui/
│       ├── rich-text-editor.tsx
│       └── editor-styles.css
├── docs/                     # Documentation
│   ├── SAAS_EMBED_PRODUCT_PLAN.md
│   ├── TIPTAP_EDITOR_ROADMAP.md
│   └── PHASE1_LOCAL_TESTING_GUIDE.md
├── web/                      # Next.js web application
│   ├── package.json          # All dependencies listed here
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── postcss.config.mjs
│   ├── eslint.config.mjs
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   ├── components/       # Web-specific components
│   │   └── lib/              # Utilities
│   └── public/               # Static assets
└── wordpress-plugin/         # WordPress integration (future)
```

---

## 🛠️ Available Scripts

| Command               | Description              |
| --------------------- | ------------------------ |
| `npm run dev`         | Start development server |
| `npm run build`       | Build for production     |
| `npm run start`       | Start production server  |
| `npm run lint`        | Run ESLint               |
| `npm run install-all` | Install all dependencies |
| `npm run clean`       | Remove all node_modules  |

---

## 📦 Dependencies (Complete List)

All dependencies are listed in `web/package.json`:

### **TipTap Extensions** (20+ packages)

- Core, React, Starter Kit
- Blockquote, Lists, Tables, Math, Code, Images, Links, etc.

### **UI Components** (14 Radix UI packages)

- Alert Dialog, Checkbox, Dialog, Dropdown, Popover, etc.

### **Utilities**

- `lucide-react` - Icons
- `katex` - Math rendering
- `lowlight` - Code syntax highlighting
- `sonner` - Toast notifications
- `clsx`, `tailwind-merge` - CSS utilities

**📖 See `web/package.json` for the complete list with versions**

---

## 🚀 How to Use as a Standalone Project

### **Option 1: Copy Entire Folder**

```bash
# Copy texril folder to a new location
cp -r texril /path/to/new/location/

# Navigate and install
cd /path/to/new/location/texril
npm install
npm run dev
```

### **Option 2: Create New Git Repository**

```bash
# Copy texril folder
cp -r texril /path/to/new/repo/

# Initialize new git repo
cd /path/to/new/repo
git init
git add .
git commit -m "Initial commit - Texril Editor"
git remote add origin <your-repo-url>
git push -u origin main
```

---

## 🔐 SaaS Features (Planned)

For production SaaS deployment, implement:

- ✅ **Domain Whitelisting** - Restrict embed to specific domains
- ✅ **JWT Authentication** - Secure user sessions
- ✅ **Rate Limiting** - Prevent abuse
- ✅ **Billing Integration** - Stripe/Paddle integration
- ✅ **Usage Analytics** - Track editor usage
- ✅ **Custom Branding** - White-label options
- ✅ **API Keys** - Secure API access
- ✅ **Webhooks** - Event notifications

**📖 See `docs/SAAS_EMBED_PRODUCT_PLAN.md` for detailed roadmap**

---

## 🔗 Relationship to LMS Project

- This folder is a **standalone snapshot** of the LMS rich text editor
- Changes in `texril` **do NOT affect** the main LMS project
- The original LMS editor remains at `../components/ui/rich-text-editor.tsx`
- You can develop Texril independently without touching LMS code

---

## 📚 Documentation

- **[INSTALLATION.md](./INSTALLATION.md)** - Complete installation guide
- **[SAAS_EMBED_PRODUCT_PLAN.md](./docs/SAAS_EMBED_PRODUCT_PLAN.md)** - Product vision
- **[TIPTAP_EDITOR_ROADMAP.md](./docs/TIPTAP_EDITOR_ROADMAP.md)** - Feature roadmap
- **[PHASE1_LOCAL_TESTING_GUIDE.md](./docs/PHASE1_LOCAL_TESTING_GUIDE.md)** - Testing guide

---

## 🤝 Contributing

This is a standalone project. Feel free to:

- Add new TipTap extensions
- Improve UI/UX
- Add SaaS features
- Create WordPress/Shopify plugins

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🎉 Ready to Run!

```bash
npm install
npm run dev
```

**Open http://localhost:3000 and start editing!** 🚀
