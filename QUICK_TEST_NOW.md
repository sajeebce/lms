# 🧪 Quick Test Now - Step by Step

## ✅ Server Status
- ✅ Dev server running on http://localhost:3000
- ✅ Database migrated
- ✅ All fixes applied

---

## 🎯 Test 1: Branch Field Visibility (2 minutes)

### Steps:
1. Open http://localhost:3000/students/admission
2. Go to Step 2 (Academic Info)
3. **Check:** Branch field is visible
4. **Check:** If single branch exists → shows as read-only text
5. **Check:** If multiple branches → shows as dropdown

### Expected Result:
✅ Branch field visible regardless of cohort setting

---

## 🎯 Test 2: Auto-Submit Prevention (5 minutes)

### Steps:

**Step 1: Fill and click Next**
1. Fill Step 1 (Student Identity) with any data
2. Click "Next" button
3. **Expected:** Move to Step 2 (no auto-submit)

**Step 2: Fill and click Next**
1. Fill Step 2 (Academic Info)
2. Click "Next" button
3. **Expected:** Move to Step 3 (no auto-submit)

**Step 3: Fill and click Next**
1. Fill Step 3 (Guardian Info)
2. Click "Next" button
3. **Expected:** Move to Step 4 (no auto-submit)

**Step 4: Optional, click Next**
1. Step 4 (Previous School) is optional
2. Click "Next" button
3. **Expected:** Move to Step 5 (Review & Submit)

**Step 5: Review & Submit (CRITICAL)**
1. **Verify:** You are on Step 5 (Review & Submit)
2. **Verify:** Form did NOT auto-submit
3. **Verify:** You can see the Submit button
4. **Verify:** You can scroll and review data
5. Click "Submit Admission" button
6. **Expected:** Success message appears
7. **Expected:** Redirects to students list

### Expected Result:
✅ Form does NOT auto-submit, submit button works correctly

---

## 🎯 Test 3: Phone Numeric-Only (2 minutes)

### Steps:
1. Go to Step 1 (Student Identity)
2. Try typing "abc123" in phone field
3. **Expected:** Only "123" appears
4. Try typing "@#$"
5. **Expected:** Blocked

### Expected Result:
✅ Phone field only accepts numbers

---

## 📊 Test Results

| Test | Expected | Result | Status |
|------|----------|--------|--------|
| Branch visible | Yes | ? | ⏳ |
| Branch prefilled | Yes | ? | ⏳ |
| Auto-submit | No | ? | ⏳ |
| Submit button | Works | ? | ⏳ |
| Phone numeric | Yes | ? | ⏳ |

---

## ✅ Success Criteria

All of the following must be true:

- ✅ Branch field visible when cohort disabled
- ✅ Branch field shows read-only when single branch
- ✅ Branch field shows dropdown when multiple branches
- ✅ Form does NOT auto-submit on review step
- ✅ Submit button works correctly
- ✅ Phone fields numeric-only
- ✅ No console errors

---

## 🐛 If Something Fails

### Branch field not visible:
1. Check if cohort is disabled
2. Refresh page
3. Check browser console for errors

### Form still auto-submits:
1. Check browser console for errors
2. Refresh page
3. Try again

### Phone field accepts letters:
1. Refresh page
2. Clear browser cache
3. Try again

---

## 📝 Console Check

Open DevTools (F12) and check Console tab:
- Should see NO errors
- Should see NO warnings about form submission

---

**Ready to test?** Start with Test 1 above! ✅

**Test Date:** 2025-11-04
**Status:** Ready for Testing

