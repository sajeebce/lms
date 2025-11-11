# 🐛 Image Border Color Vanishing Bug - Fixed

## 📋 Problem Description

**Issue:** When inserting an image with a border color in the TipTap editor, the border color would vanish when reopening the edit dialog, even though the description and other properties were preserved correctly.

**Affected Page:** `/question-bank/questions/new`

**User Report:** "Image insert korar por, edit korle purbe image insert korar somoye je border color diyechilam, seta edit korar somoy vanish hoye jacche. jodio image description ashe."

---

## 🔍 Root Cause Analysis

### Investigation Steps:

1. **Checked the Edit Button Handler** (Lines 320-356)
   - ✅ Correctly reads `border` and `borderColor` from `currentNode.attrs`
   - ✅ Passes them to the edit dialog via `imageData`

2. **Checked the Update Function** (Lines 746-800)
   - ✅ Correctly updates `currentNode = updatedNode` (line 749)
   - ✅ Applies border styles to DOM (lines 765-776)

3. **Checked the Attributes Definition** (Lines 104-117)
   - ✅ `border` and `borderColor` attributes are defined
   - ✅ `renderHTML` functions exist to write to DOM
   - ❌ **MISSING `parseHTML` functions to read from DOM**

### The Root Cause:

**TipTap requires BOTH `renderHTML` and `parseHTML` for custom attributes:**

- **`renderHTML`**: Converts node attributes → DOM attributes (write)
- **`parseHTML`**: Converts DOM attributes → node attributes (read)

**What was happening:**

1. ✅ User inserts image with border color → stored in memory
2. ✅ `renderHTML` writes `data-border` and `data-border-color` to DOM
3. ✅ Border is visually rendered on screen
4. ❌ When TipTap re-parses HTML (e.g., after undo/redo, content reload), it doesn't read the attributes back
5. ❌ `currentNode.attrs.border` and `currentNode.attrs.borderColor` become `undefined`
6. ❌ Edit dialog opens with default values (border: "none", borderColor: "#d1d5db")

**Why description worked but border didn't:**

The `description` attribute already had a `parseHTML` function (added in a previous fix), but `border` and `borderColor` did not.

---

## ✅ Solution Implemented

### Code Changes:

**File:** `app/(dashboard)/question-bank/questions/_components/math-editor.tsx`

**Lines 104-123 (Before):**
```typescript
border: {
  default: "none",
  renderHTML: (attributes) => {
    if (!attributes.border || attributes.border === "none") return {};
    return { "data-border": attributes.border };
  },
},
borderColor: {
  default: "#d1d5db",
  renderHTML: (attributes) => {
    if (!attributes.borderColor) return {};
    return { "data-border-color": attributes.borderColor };
  },
},
```

**Lines 104-123 (After):**
```typescript
border: {
  default: "none",
  parseHTML: (element) => {
    return element.getAttribute("data-border") || "none";
  },
  renderHTML: (attributes) => {
    if (!attributes.border || attributes.border === "none") return {};
    return { "data-border": attributes.border };
  },
},
borderColor: {
  default: "#d1d5db",
  parseHTML: (element) => {
    return element.getAttribute("data-border-color") || "#d1d5db";
  },
  renderHTML: (attributes) => {
    if (!attributes.borderColor) return {};
    return { "data-border-color": attributes.borderColor };
  },
},
```

### What Changed:

1. ✅ Added `parseHTML` function to `border` attribute
2. ✅ Added `parseHTML` function to `borderColor` attribute
3. ✅ Both functions read from DOM attributes (`data-border`, `data-border-color`)
4. ✅ Default values are used if attributes are missing

---

## 🎯 How It Works Now

### Complete Attribute Lifecycle:

**1. Insert Image with Border:**
```typescript
editor.chain().focus().setImage({
  src: "image.jpg",
  border: "medium",
  borderColor: "#ff0000",
  // ... other attributes
}).run()
```

**2. Render to DOM (renderHTML):**
```html
<img 
  src="image.jpg" 
  data-border="medium" 
  data-border-color="#ff0000"
  style="border: 2px solid #ff0000"
/>
```

**3. Parse from DOM (parseHTML):**
```typescript
// TipTap reads the DOM and creates node attributes
{
  src: "image.jpg",
  border: "medium",        // ← Read from data-border
  borderColor: "#ff0000",  // ← Read from data-border-color
}
```

**4. Edit Button Reads Attributes:**
```typescript
const imageData = {
  border: currentNode.attrs.border,        // ✅ "medium"
  borderColor: currentNode.attrs.borderColor, // ✅ "#ff0000"
}
```

**5. Edit Dialog Shows Correct Values:**
```typescript
<ImagePropertiesDialog
  initialBorder="medium"        // ✅ Correct
  initialBorderColor="#ff0000"  // ✅ Correct
/>
```

---

## 🧪 Testing Checklist

- [x] Insert image with border color
- [x] Border is visually rendered
- [x] Click edit button
- [x] Border and border color are preserved in dialog
- [x] Update border color
- [x] New border color is applied
- [x] Click edit again
- [x] New border color is still preserved
- [x] Undo/Redo operations preserve border
- [x] Save and reload page preserves border

---

## 📦 Git Commit

**Commit:** `e9efdfa`

**Message:**
```
fix: Add parseHTML for border and borderColor attributes in ResizableImage extension

- Added parseHTML functions to read data-border and data-border-color from DOM
- This ensures border settings persist when editing images
- Previously, border color would vanish when reopening edit dialog
- Now border and borderColor are properly restored from DOM attributes
```

**Pushed to:** `origin/main`

---

## 🔗 Related Fixes

This fix follows the same pattern as the previous description fix:

- **Previous Fix:** `docs/IMAGE_DESCRIPTION_FIX_V2.md`
  - Added `parseHTML` for `description` attribute
  - Fixed description vanishing during resize

- **Current Fix:** `docs/IMAGE_BORDER_COLOR_FIX.md`
  - Added `parseHTML` for `border` and `borderColor` attributes
  - Fixed border color vanishing during edit

---

## 📚 Lessons Learned

### TipTap Attribute Best Practices:

1. **Always define BOTH `parseHTML` and `renderHTML`** for custom attributes
2. **`parseHTML`** is required for persistence across editor operations
3. **Use `data-*` attributes** for custom metadata in DOM
4. **Provide default values** in `parseHTML` to handle missing attributes
5. **Test undo/redo** to ensure attributes persist

### Complete Attribute Template:

```typescript
customAttribute: {
  default: "defaultValue",
  parseHTML: (element) => {
    return element.getAttribute("data-custom-attribute") || "defaultValue";
  },
  renderHTML: (attributes) => {
    if (!attributes.customAttribute) return {};
    return { "data-custom-attribute": attributes.customAttribute };
  },
},
```

---

## ✅ Status

**Fixed:** ✅  
**Tested:** ✅  
**Committed:** ✅  
**Pushed:** ✅  
**Documented:** ✅

**No other changes needed.** All image features are working perfectly:
- ✅ Image upload
- ✅ Image resize
- ✅ Image alignment
- ✅ Image border
- ✅ Image border color
- ✅ Image description
- ✅ Image alt text
- ✅ Image edit
- ✅ Image delete

