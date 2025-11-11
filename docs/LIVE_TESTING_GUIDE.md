# 🧪 Live Testing Guide - Image Description Fix

**URL:** http://localhost:3000/question-bank/questions/new  
**Feature:** Image description persistence during resize  
**Status:** Ready for testing

---

## 🎯 What to Test

The main issue was: **Image description disappears when resizing images**

### ✅ Expected Behavior (After Fix)
1. Insert image with description → Description appears below image
2. Resize image (any handle) → Description stays visible
3. Resize multiple times → Description persists
4. Edit description → Updated description persists through resizes

---

## 📋 Step-by-Step Testing Instructions

### Test 1: Basic Image with Description

1. **Open the page:**
   - URL: http://localhost:3000/question-bank/questions/new
   - You should see the question form with TipTap editor

2. **Insert an image:**
   - Click the **"Image"** button in the toolbar (camera icon)
   - A dialog will open with 4 tabs: Upload, Server Files, Recent, URL

3. **Upload or select an image:**
   - **Option A:** Click "Upload" tab → Choose a file from your computer
   - **Option B:** Click "URL" tab → Paste an image URL (e.g., https://picsum.photos/400/300)
   - **Option C:** Click "Server Files" tab → Select from uploaded files
   - **Option D:** Click "Recent" tab → Select from recent files

4. **Add description:**
   - In the "Alt Text" field, enter: `Sample image for testing`
   - In the "Description" field, enter: `This is a test description that should persist during resize`
   - Leave dimensions as "Auto size" (checked)
   - Alignment: Center (default)

5. **Insert the image:**
   - Click **"Insert Image"** button
   - ✅ **VERIFY:** Image appears in the editor
   - ✅ **VERIFY:** Description appears below the image in italic gray text

---

### Test 2: Resize with Corner Handles (Critical Test)

1. **Select the image:**
   - Click on the image in the editor
   - ✅ **VERIFY:** Blue selection border appears
   - ✅ **VERIFY:** Toolbar appears above image (Delete, Edit, Alignment buttons)
   - ✅ **VERIFY:** 8 resize handles appear (4 corners + 4 sides)
   - ✅ **VERIFY:** Size badge appears showing dimensions (e.g., "400px x 300px")

2. **Resize using corner handle (maintains aspect ratio):**
   - Drag the **bottom-right corner handle (SE)** to make image larger
   - ✅ **VERIFY:** Size badge updates in real-time
   - ✅ **VERIFY:** Description stays visible during drag
   - Release mouse
   - ✅ **VERIFY:** Description still visible after resize
   - ✅ **VERIFY:** Description text is still: "This is a test description that should persist during resize"

3. **Resize again (make smaller):**
   - Drag the **top-left corner handle (NW)** to make image smaller
   - ✅ **VERIFY:** Description persists during resize
   - ✅ **VERIFY:** Description persists after resize

4. **Test other corner handles:**
   - Try **NE (top-right)** handle
   - Try **SW (bottom-left)** handle
   - ✅ **VERIFY:** Description persists for all corner handles

---

### Test 3: Resize with Side Handles (Free Resize)

1. **Resize using side handles (changes aspect ratio):**
   - Drag the **right side handle (E)** to make image wider
   - ✅ **VERIFY:** Description persists
   - Drag the **bottom side handle (S)** to make image taller
   - ✅ **VERIFY:** Description persists
   - Try **left (W)** and **top (N)** handles
   - ✅ **VERIFY:** Description persists for all side handles

---

### Test 4: Edit Description

1. **Click Edit button:**
   - Click on the image to select it
   - Click the **"Edit"** button (pencil icon) in the toolbar
   - ✅ **VERIFY:** Image Properties Dialog opens
   - ✅ **VERIFY:** Current description is shown in the "Description" field

2. **Update description:**
   - Change description to: `Updated description - this should also persist`
   - Click **"Update"** button
   - ✅ **VERIFY:** Description updates to new text
   - ✅ **VERIFY:** New description appears below image

3. **Resize after edit:**
   - Drag any resize handle
   - ✅ **VERIFY:** Updated description persists during resize
   - ✅ **VERIFY:** Updated description persists after resize

---

### Test 5: Remove Description

1. **Edit image again:**
   - Click on image → Click "Edit" button
   - Clear the "Description" field (delete all text)
   - Click **"Update"** button
   - ✅ **VERIFY:** Description disappears from below the image

2. **Resize without description:**
   - Drag any resize handle
   - ✅ **VERIFY:** No description appears (correct behavior)
   - ✅ **VERIFY:** Image resizes normally

---

### Test 6: Description with Different Alignments

1. **Insert new image with description:**
   - Click "Image" button
   - Upload/select an image
   - Add description: `Left aligned description`
   - Set alignment to **"Left"**
   - Click "Insert Image"
   - ✅ **VERIFY:** Image is left-aligned
   - ✅ **VERIFY:** Description is left-aligned

2. **Resize left-aligned image:**
   - Click on image → Drag resize handle
   - ✅ **VERIFY:** Description stays left-aligned during resize
   - ✅ **VERIFY:** Description persists

3. **Change alignment:**
   - Click "Edit" button
   - Change alignment to **"Right"**
   - Click "Update"
   - ✅ **VERIFY:** Image moves to right
   - ✅ **VERIFY:** Description moves to right
   - Resize image
   - ✅ **VERIFY:** Description persists and stays right-aligned

---

### Test 7: Multiple Images with Descriptions

1. **Insert 3 images with descriptions:**
   - Image 1: Description "First image", Alignment: Left
   - Image 2: Description "Second image", Alignment: Center
   - Image 3: Description "Third image", Alignment: Right

2. **Resize each image:**
   - Resize Image 1
   - ✅ **VERIFY:** "First image" description persists
   - Resize Image 2
   - ✅ **VERIFY:** "Second image" description persists
   - Resize Image 3
   - ✅ **VERIFY:** "Third image" description persists

3. **Verify no cross-contamination:**
   - ✅ **VERIFY:** Each image keeps its own description
   - ✅ **VERIFY:** Descriptions don't swap or mix

---

### Test 8: Description with Special Characters

1. **Insert image with special characters in description:**
   - Description: `Test with "quotes", 'apostrophes', & symbols: <html> {code} [brackets]`
   - Click "Insert Image"
   - ✅ **VERIFY:** Description displays correctly
   - Resize image
   - ✅ **VERIFY:** Special characters persist correctly

---

### Test 9: Long Description

1. **Insert image with long description:**
   - Description: `This is a very long description that contains multiple sentences. It should wrap to multiple lines if needed. The description field has a 500 character limit. Let's test if this long description persists correctly during resize operations. This is important for accessibility and metadata purposes.`
   - Click "Insert Image"
   - ✅ **VERIFY:** Long description displays (may wrap to multiple lines)
   - Resize image
   - ✅ **VERIFY:** Full description persists

---

### Test 10: Save and Reload (Persistence Test)

1. **Create a question with image + description:**
   - Fill in question title: "Test Question"
   - Add question text with image that has description
   - Click **"Create Question"** button
   - ✅ **VERIFY:** Question saves successfully

2. **Edit the question:**
   - Go to question list
   - Click "Edit" on the test question
   - ✅ **VERIFY:** Image loads with description
   - Resize the image
   - ✅ **VERIFY:** Description persists
   - Click "Update Question"
   - ✅ **VERIFY:** Changes save

3. **Reload page:**
   - Refresh the browser
   - ✅ **VERIFY:** Image and description still present
   - ✅ **VERIFY:** Description persists after resize

---

## 🐛 What to Look For (Potential Issues)

### ❌ Failure Scenarios (Should NOT happen)
1. ❌ Description disappears during resize
2. ❌ Description disappears after resize completes
3. ❌ Description changes to different text
4. ❌ Description appears on wrong image
5. ❌ Console errors when resizing
6. ❌ Image becomes unresponsive after resize
7. ❌ Description doesn't update when edited
8. ❌ Description doesn't align with image

### ✅ Success Criteria
1. ✅ Description always visible (if set) during resize
2. ✅ Description persists after resize completes
3. ✅ Description updates when edited
4. ✅ Description aligns with image alignment
5. ✅ No console errors
6. ✅ All 8 resize handles work correctly
7. ✅ Description can be removed (cleared)
8. ✅ Multiple images maintain separate descriptions

---

## 🔍 Browser Console Check

1. **Open Developer Tools:**
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Press `Cmd+Option+I` (Mac)

2. **Check Console tab:**
   - ✅ **VERIFY:** No red errors
   - ✅ **VERIFY:** No warnings about missing attributes
   - ✅ **VERIFY:** No "Cannot read property 'description'" errors

3. **Check Network tab:**
   - ✅ **VERIFY:** Image uploads successfully (200 status)
   - ✅ **VERIFY:** No 404 errors for images

---

## 📊 Test Results Template

Copy this template and fill in your results:

```
## Test Results - [Your Name] - [Date/Time]

### Test 1: Basic Image with Description
- [ ] Description appears below image
- [ ] Description is italic and gray
- [ ] Description is centered (default)

### Test 2: Resize with Corner Handles
- [ ] SE handle: Description persists ✅/❌
- [ ] NW handle: Description persists ✅/❌
- [ ] NE handle: Description persists ✅/❌
- [ ] SW handle: Description persists ✅/❌

### Test 3: Resize with Side Handles
- [ ] E handle: Description persists ✅/❌
- [ ] W handle: Description persists ✅/❌
- [ ] N handle: Description persists ✅/❌
- [ ] S handle: Description persists ✅/❌

### Test 4: Edit Description
- [ ] Edit dialog opens with current description ✅/❌
- [ ] Updated description appears ✅/❌
- [ ] Updated description persists during resize ✅/❌

### Test 5: Remove Description
- [ ] Description disappears when cleared ✅/❌
- [ ] No description shown during resize ✅/❌

### Test 6: Alignment
- [ ] Left alignment works ✅/❌
- [ ] Center alignment works ✅/❌
- [ ] Right alignment works ✅/❌
- [ ] Description aligns with image ✅/❌

### Test 7: Multiple Images
- [ ] Each image keeps own description ✅/❌
- [ ] No cross-contamination ✅/❌

### Test 8: Special Characters
- [ ] Special characters display correctly ✅/❌
- [ ] Special characters persist ✅/❌

### Test 9: Long Description
- [ ] Long description displays ✅/❌
- [ ] Long description persists ✅/❌

### Test 10: Save and Reload
- [ ] Description saves to database ✅/❌
- [ ] Description loads after reload ✅/❌
- [ ] Description persists after reload + resize ✅/❌

### Browser Console
- [ ] No errors in console ✅/❌
- [ ] No warnings ✅/❌

### Overall Result
- [ ] ✅ ALL TESTS PASSED
- [ ] ❌ SOME TESTS FAILED (list below)

Failed Tests:
1. 
2. 
3. 

Notes:


```

---

## 🚀 Quick Test (5 Minutes)

If you're short on time, do this quick test:

1. Open http://localhost:3000/question-bank/questions/new
2. Click "Image" button
3. Upload/paste image URL
4. Add description: "Test description"
5. Click "Insert Image"
6. Click on image to select
7. Drag bottom-right corner handle to resize
8. ✅ **VERIFY:** Description stays visible
9. Drag top-left corner handle to resize back
10. ✅ **VERIFY:** Description still visible

**If steps 8 and 10 pass, the fix is working!**

---

## 📞 Reporting Issues

If you find any issues:

1. **Take a screenshot** of the problem
2. **Copy console errors** (if any)
3. **Note the exact steps** to reproduce
4. **Report to development team**

---

## ✅ Sign-Off

After completing all tests, sign off here:

**Tester Name:** ___________________  
**Date/Time:** ___________________  
**Result:** ✅ PASS / ❌ FAIL  
**Notes:** ___________________

---

**Happy Testing! 🎉**

