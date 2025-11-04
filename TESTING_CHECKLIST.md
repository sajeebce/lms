# 🧪 Testing Checklist - New Admission Form Fixes

## ✅ Test 1: Mobile Number Field - Numeric Only Input

### Student Phone Field (Step 1)
- [ ] Open admission form
- [ ] Go to "Student Identity" step
- [ ] Try typing letters in phone field → Should NOT appear
- [ ] Try typing special characters (@, #, $) → Should NOT appear
- [ ] Try typing numbers (0-9) → Should appear ✅
- [ ] Try pasting text with letters → Should only keep numbers
- [ ] Verify `inputMode="numeric"` shows numeric keyboard on mobile

### Guardian Phone Field (Step 2)
- [ ] Go to "Guardian Info" step
- [ ] Add a guardian
- [ ] Try typing letters in guardian phone field → Should NOT appear
- [ ] Try typing numbers → Should appear ✅
- [ ] Verify country code prefix is preserved (e.g., +880)
- [ ] Verify combined phone number is saved correctly

---

## ✅ Test 2: Branch Prefilling

### Single Branch Scenario
- [ ] Go to Academic Setup → Branches
- [ ] Ensure only ONE branch exists (e.g., "Mirpur")
- [ ] Go to Student Admission
- [ ] Go to "Academic Info" step
- [ ] Verify Branch field shows as read-only display (NOT dropdown)
- [ ] Verify branch name is displayed (e.g., "Mirpur")
- [ ] Verify text says "Only one branch available"
- [ ] Verify branchId is automatically set in form

### Multiple Branches Scenario
- [ ] Create another branch (e.g., "Dhanmondi")
- [ ] Refresh admission page
- [ ] Go to "Academic Info" step
- [ ] Verify Branch field now shows as dropdown
- [ ] Verify both branches appear in dropdown
- [ ] Verify you can select different branches

---

## ✅ Test 3: Auto-Submit Prevention

### Review & Submit Step
- [ ] Fill all form fields in steps 1-3
- [ ] Navigate to "Review & Submit" step (Step 4)
- [ ] Verify form does NOT auto-submit
- [ ] Verify all data is displayed correctly
- [ ] Verify "Submit Admission" button is visible

### Accidental Enter Key Prevention
- [ ] Go back to "Student Identity" step
- [ ] Fill in name field
- [ ] Press Enter key → Should NOT submit form
- [ ] Verify you stay on same step
- [ ] Go to "Academic Info" step
- [ ] Fill in Academic Year field
- [ ] Press Enter key → Should NOT submit form
- [ ] Verify you stay on same step

### Manual Submit Only
- [ ] Go to "Review & Submit" step
- [ ] Click "Submit Admission" button
- [ ] Verify form submits successfully
- [ ] Verify redirect to student list page
- [ ] Verify success toast message appears

---

## ✅ Test 4: Edit Student Form

### Phone Field in Edit Mode
- [ ] Go to Students list
- [ ] Click on a student to view profile
- [ ] Click "Edit" button
- [ ] Go to "Student Identity" step
- [ ] Verify phone field shows numeric-only input
- [ ] Try typing letters → Should NOT appear
- [ ] Try typing numbers → Should appear ✅

### Guardian Phone in Edit Mode
- [ ] Go to "Guardian Info" step
- [ ] Try editing guardian phone
- [ ] Verify numeric-only input works
- [ ] Verify country code is preserved

### Branch in Edit Mode
- [ ] Go to "Academic Info" step
- [ ] If single branch: Verify branch shows as read-only
- [ ] If multiple branches: Verify branch dropdown works
- [ ] Verify existing branch is prefilled

---

## ✅ Test 5: Form Validation

### Phone Number Validation
- [ ] Try submitting form with empty phone → Should show error
- [ ] Try submitting with only letters → Should show error
- [ ] Try submitting with valid number → Should pass ✅

### Branch Validation (Cohort Enabled)
- [ ] Ensure cohorts are enabled in settings
- [ ] Try submitting without selecting branch → Should show error
- [ ] Select branch → Should pass ✅

### Section Validation
- [ ] Try submitting without selecting section → Should show error
- [ ] Select section → Should pass ✅

---

## 🎯 Expected Behavior Summary

| Feature | Before | After |
|---------|--------|-------|
| **Phone Input** | Accepts any text | Only numbers ✅ |
| **Single Branch** | Hidden field | Read-only display ✅ |
| **Multiple Branches** | Dropdown | Dropdown ✅ |
| **Auto-Submit** | Submits on review page | Manual submit only ✅ |
| **Enter Key** | Submits form | Prevented ✅ |

---

## 📝 Notes

- All changes are backward compatible
- No database migrations needed
- Changes apply to both new admission and edit forms
- Phone validation works on both client and server side

---

## 🚀 Browser Testing

1. Open: `http://localhost:3000/students/admission`
2. Test each scenario above
3. Check browser console for any errors
4. Test on mobile device for numeric keyboard

---

**Status:** Ready for testing ✅

