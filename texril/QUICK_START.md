# Texril - Quick Start Guide

## 🚀 Fastest Way to Run Texril

### **Windows Users**
```cmd
# Double-click this file:
start.bat

# OR run in Command Prompt:
cd texril
start.bat
```

### **Linux/Mac Users**
```bash
# Make script executable (first time only):
chmod +x start.sh

# Run the script:
./start.sh

# OR manually:
npm install
npm run dev
```

---

## ✅ What the Scripts Do

1. ✅ Check if Node.js and npm are installed
2. ✅ Display Node.js and npm versions
3. ✅ Install dependencies (if not already installed)
4. ✅ Start the development server
5. ✅ Open browser at http://localhost:3000

---

## 📋 Manual Installation (If Scripts Don't Work)

### Step 1: Install Node.js
Download and install from: https://nodejs.org/
- Recommended: LTS version (v18 or higher)

### Step 2: Verify Installation
```bash
node --version
npm --version
```

### Step 3: Install Dependencies
```bash
cd texril
npm install
```

### Step 4: Start Development Server
```bash
npm run dev
```

### Step 5: Open Browser
```
http://localhost:3000
```

---

## 🎯 What You'll See

After running the server, you'll see:
- ✅ Rich text editor with toolbar
- ✅ All formatting options (bold, italic, headings, etc.)
- ✅ Table insertion and editing
- ✅ Image upload
- ✅ Math equation editor
- ✅ Code blocks with syntax highlighting
- ✅ And much more!

---

## 🛑 How to Stop the Server

Press `Ctrl + C` in the terminal/command prompt

---

## 🔧 Troubleshooting

### Problem: "node is not recognized"
**Solution**: Install Node.js from https://nodejs.org/

### Problem: "Port 3000 is already in use"
**Solution**: Use a different port:
```bash
PORT=3001 npm run dev
```

### Problem: "npm install" fails
**Solution**: Delete node_modules and try again:
```bash
# Windows
rmdir /s /q node_modules web\node_modules
npm install

# Linux/Mac
rm -rf node_modules web/node_modules
npm install
```

### Problem: Scripts don't run on Linux/Mac
**Solution**: Make script executable:
```bash
chmod +x start.sh
./start.sh
```

---

## 📚 Next Steps

1. ✅ Server is running
2. 📖 Read [README.md](./README.md) for full documentation
3. 🎨 Explore [DEPENDENCIES.md](./DEPENDENCIES.md) for package details
4. 📝 Check [INSTALLATION.md](./INSTALLATION.md) for advanced setup
5. 🚀 Read [docs/SAAS_EMBED_PRODUCT_PLAN.md](./docs/SAAS_EMBED_PRODUCT_PLAN.md) for SaaS features

---

## 🎉 You're Ready!

The editor is now running at **http://localhost:3000**

Enjoy using Texril! 🚀

