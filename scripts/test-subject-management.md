# Subject Management Testing Checklist

## ✅ Week 1 - Subject Management Testing

### **Test Environment:**
- URL: http://localhost:3000/academic-setup/subjects
- User: ADMIN (mock auth)
- Tenant: tenant_1

---

## **1. Page Load Test ✅**

- [ ] Navigate to `/academic-setup/subjects`
- [ ] Page loads without errors
- [ ] Header shows "Subject Management" with gradient (violet to orange)
- [ ] "Add Subject" button visible
- [ ] Search bar visible
- [ ] Status filter dropdown visible
- [ ] Table shows 10 subjects (from seed script)

**Expected Result:** Page loads successfully with all UI elements visible

---

## **2. Table Display Test ✅**

- [ ] Table shows columns: Icon, Name, Code, Status, Courses, Chapters, Actions
- [ ] Icons display correctly (📐, ⚛️, 🧪, 🧬, 📖, 📚, 💻, 🏛️, 🌍, 💰)
- [ ] Status badges show "ACTIVE" in green
- [ ] Courses count shows "0" (no courses yet)
- [ ] Chapters count shows "0" (no chapters yet)
- [ ] Edit and Delete buttons visible for each row

**Expected Result:** All data displays correctly in table

---

## **3. Search Functionality Test ✅**

- [ ] Type "Math" in search box
- [ ] Table filters to show only "Mathematics"
- [ ] Type "Phys" in search box
- [ ] Table filters to show only "Physics"
- [ ] Clear search box
- [ ] Table shows all 10 subjects again

**Expected Result:** Search filters subjects in real-time

---

## **4. Status Filter Test ✅**

- [ ] Click status filter dropdown
- [ ] Select "Active"
- [ ] Table shows all 10 subjects (all are active)
- [ ] Select "Inactive"
- [ ] Table shows "No subjects found"
- [ ] Select "All Status"
- [ ] Table shows all 10 subjects again

**Expected Result:** Status filter works correctly

---

## **5. Create Subject Test ✅**

- [ ] Click "Add Subject" button
- [ ] Dialog opens with title "Add Subject"
- [ ] Form shows all fields:
  - Subject Name (required)
  - Subject Code (optional)
  - Icon (optional)
  - Color (color picker)
  - Order (number)
  - Status (dropdown)
  - Description (textarea)
- [ ] Fill form:
  - Name: "Art & Craft"
  - Code: "ART"
  - Icon: "🎨"
  - Color: #ec4899 (pink)
  - Order: 11
  - Status: Active
  - Description: "Art and craft subject"
- [ ] Click "Create Subject"
- [ ] Success toast appears: "Subject created successfully"
- [ ] Dialog closes
- [ ] Page refreshes
- [ ] New subject appears in table

**Expected Result:** Subject created successfully

---

## **6. Duplicate Name Test ✅**

- [ ] Click "Add Subject" button
- [ ] Fill form:
  - Name: "Mathematics" (duplicate)
  - Code: "MATH2"
- [ ] Click "Create Subject"
- [ ] Error toast appears: "Subject with this name already exists"
- [ ] Dialog stays open
- [ ] Form shows error

**Expected Result:** Duplicate name prevented

---

## **7. Duplicate Code Test ✅**

- [ ] Click "Add Subject" button
- [ ] Fill form:
  - Name: "Advanced Math"
  - Code: "MATH" (duplicate)
- [ ] Click "Create Subject"
- [ ] Error toast appears: "Subject with this code already exists"

**Expected Result:** Duplicate code prevented

---

## **8. Edit Subject Test ✅**

- [ ] Click Edit button on "Mathematics"
- [ ] Dialog opens with title "Edit Subject"
- [ ] Form pre-filled with existing data
- [ ] Change name to "Advanced Mathematics"
- [ ] Change description to "Advanced mathematics for higher classes"
- [ ] Click "Update Subject"
- [ ] Success toast appears: "Subject updated successfully"
- [ ] Dialog closes
- [ ] Page refreshes
- [ ] Table shows updated name

**Expected Result:** Subject updated successfully

---

## **9. Delete Subject Test (Success) ✅**

- [ ] Click Delete button on "Art & Craft"
- [ ] AlertDialog opens with title "Delete Subject"
- [ ] Message shows: "Are you sure you want to delete 'Art & Craft'? This action cannot be undone."
- [ ] Click "Delete" button (red)
- [ ] Success toast appears: "Subject deleted successfully"
- [ ] Dialog closes
- [ ] Page refreshes
- [ ] Subject removed from table

**Expected Result:** Subject deleted successfully

---

## **10. Delete Subject Test (Guard - Has Courses) ✅**

**Note:** This test will be done in Week 2 after creating courses

- [ ] Create a course linked to "Mathematics"
- [ ] Try to delete "Mathematics"
- [ ] Error toast appears: "Cannot delete subject. 1 course(s) are using this subject."
- [ ] Subject NOT deleted

**Expected Result:** Delete prevented when courses exist

---

## **11. Dark Mode Test ✅**

- [ ] Toggle dark mode (if theme switcher available)
- [ ] Check header gradient visible
- [ ] Check table background dark
- [ ] Check text readable (white/light gray)
- [ ] Check badges visible
- [ ] Check dialog background dark
- [ ] Check form inputs dark
- [ ] Check buttons visible
- [ ] Toggle back to light mode
- [ ] Everything looks good in light mode

**Expected Result:** Dark mode works perfectly

---

## **12. Character Limit Test ✅**

- [ ] Click "Add Subject"
- [ ] Try to type 101 characters in Name field
- [ ] Input stops at 100 characters (maxLength)
- [ ] Try to type 21 characters in Code field
- [ ] Input stops at 20 characters
- [ ] Try to type 501 characters in Description
- [ ] Input stops at 500 characters

**Expected Result:** Character limits enforced

---

## **13. Validation Test ✅**

- [ ] Click "Add Subject"
- [ ] Leave Name field empty
- [ ] Click "Create Subject"
- [ ] Error message appears: "Name is required"
- [ ] Fill Name with 1 character
- [ ] Click "Create Subject"
- [ ] Should work (min 1 character)

**Expected Result:** Validation works correctly

---

## **14. Existing Pages Test ✅**

- [ ] Navigate to `/academic-setup/branches`
- [ ] Page loads without errors
- [ ] Create/Edit/Delete works
- [ ] Navigate to `/academic-setup/academic-years`
- [ ] Page loads without errors
- [ ] Navigate to `/academic-setup/streams`
- [ ] Page loads without errors
- [ ] Navigate to `/academic-setup/classes`
- [ ] Page loads without errors
- [ ] Navigate to `/academic-setup/cohorts`
- [ ] Page loads without errors
- [ ] Navigate to `/academic-setup/sections`
- [ ] Page loads without errors
- [ ] Navigate to `/academic-setup/routine`
- [ ] Page loads without errors

**Expected Result:** All existing pages work perfectly (NO BREAKS)

---

## **15. Navigation Test ✅**

- [ ] Check left sidebar
- [ ] "Academic Setup" section visible
- [ ] "Subjects" menu item visible (after "Classes / Grades")
- [ ] Click "Subjects"
- [ ] Navigates to `/academic-setup/subjects`
- [ ] Menu item highlighted/active

**Expected Result:** Navigation works correctly

---

## **16. RBAC Test (Future) ⏳**

**Note:** This will be tested when real auth is implemented

- [ ] Login as TEACHER
- [ ] Navigate to `/academic-setup/subjects`
- [ ] Can view subjects
- [ ] "Add Subject" button NOT visible
- [ ] Edit/Delete buttons NOT visible

**Expected Result:** TEACHER can only view, not modify

---

## **Summary Checklist:**

- [ ] ✅ Database migration successful
- [ ] ✅ Prisma client generated
- [ ] ✅ Server actions work (create, update, delete, get)
- [ ] ✅ Page loads without errors
- [ ] ✅ Table displays data correctly
- [ ] ✅ Search works
- [ ] ✅ Filter works
- [ ] ✅ Create subject works
- [ ] ✅ Duplicate prevention works
- [ ] ✅ Edit subject works
- [ ] ✅ Delete subject works
- [ ] ✅ Delete guard works (will test in Week 2)
- [ ] ✅ Dark mode works
- [ ] ✅ Character limits enforced
- [ ] ✅ Validation works
- [ ] ✅ Navigation works
- [ ] ✅ Existing pages NOT broken
- [ ] ✅ Modern UI (gradient header, badges, pills)
- [ ] ✅ Best practices followed (React Hook Form, Zod, Server Actions)

---

## **Next Steps (Week 2):**

Once all tests pass:

1. ✅ Update Course model integration
2. ✅ Add Class, Subject, Stream dropdowns to Course form
3. ✅ Add academic badges to Course list
4. ✅ Add academic filters to Course list
5. ✅ Test course isolation (Class 8 Math ≠ Class 9 Math)
6. ✅ Test delete guard (subject with courses)

---

**Status:** Ready for manual testing by user
**Estimated Time:** 15-20 minutes for complete testing

