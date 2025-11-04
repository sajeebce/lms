# ✅ Student Enrollment Implementation Checklist

## PHASE 1: DATABASE CHANGES (Week 1)

### Schema Updates
- [ ] Open `prisma/schema.prisma`
- [ ] Update `StudentEnrollment` model:
  - [ ] Add `streamId: String?`
  - [ ] Add `isOnline: Boolean @default(false)`
  - [ ] Change `branchId: String?` (make optional)
  - [ ] Add `stream: Stream?` relation
- [ ] Update `Stream` model:
  - [ ] Add `enrollments: StudentEnrollment[]` relation
- [ ] Update `Section` model:
  - [ ] Add `isOnline: Boolean @default(false)`
- [ ] Verify all relations are correct

### Migration
- [ ] Run: `npx prisma migrate dev --name add_stream_online_enrollment_fields`
- [ ] Verify migration file created
- [ ] Check migration SQL is correct

### Data Migration
- [ ] Run migration SQL to populate `streamId` from cohorts:
  ```sql
  UPDATE student_enrollments se
  SET streamId = c.streamId
  FROM cohorts c
  WHERE se.cohortId = c.id AND se.enrollmentType = 'COHORT_BASED';
  ```
- [ ] Verify all COHORT_BASED enrollments have streamId:
  ```sql
  SELECT COUNT(*) FROM student_enrollments 
  WHERE enrollmentType = 'COHORT_BASED' AND streamId IS NULL;
  -- Should return 0
  ```

### Testing
- [ ] Test database queries work
- [ ] Test relations work (stream, branch, cohort)
- [ ] Test null values handled correctly
- [ ] Verify no data loss

---

## PHASE 2: ADMISSION FORM (Week 2)

### AcademicInfoStep Component
- [ ] Add `streams` prop to component
- [ ] Add `isOnline` state variable
- [ ] Add `isOnline` checkbox field:
  - [ ] Label: "This is an Online Student"
  - [ ] Styling: Consistent with other checkboxes
  - [ ] Behavior: Hides branch selection when checked

### Conditional Rendering
- [ ] COHORT mode (enableCohorts=true, !isOnline):
  - [ ] Show: Branch, Year, Class, Cohort, Section
  - [ ] Hide: Stream field
- [ ] DIRECT mode (enableCohorts=false, !isOnline):
  - [ ] Show: Year, Class, Stream (optional), Section
  - [ ] Hide: Branch, Cohort
- [ ] ONLINE mode (isOnline=true):
  - [ ] Show: Year, Class, Stream (optional), Section (online only)
  - [ ] Hide: Branch, Cohort

### Stream Field
- [ ] Add `streamId` field for DIRECT & ONLINE modes
- [ ] Use SearchableDropdown component
- [ ] Make it optional
- [ ] Add placeholder: "Select stream (optional)"
- [ ] Add description: "Select the stream for this student"

### Validation Schema
- [ ] Update `admissionSchema`:
  - [ ] Add `isOnline: z.boolean().default(false)`
  - [ ] Add `streamId: z.string().optional().or(z.literal(''))`
  - [ ] Change `branchId: z.string().optional().or(z.literal(''))`
- [ ] Update validation logic based on enrollment type

### Server Action (admitStudent)
- [ ] Determine `enrollmentType` based on `isOnline` and `enableCohorts`
- [ ] Add validation for each enrollment type:
  - [ ] COHORT_BASED: branchId, cohortId required
  - [ ] DIRECT: academicYearId, classId, sectionId required
  - [ ] ONLINE: academicYearId, classId, sectionId required
- [ ] Update StudentEnrollment creation:
  - [ ] Set `enrollmentType` correctly
  - [ ] Set `streamId` from form
  - [ ] Set `isOnline` flag
  - [ ] Set `branchId` to null for DIRECT & ONLINE

### Section Filtering
- [ ] Update `getAvailableSections` function:
  - [ ] Add `isOnline` parameter
  - [ ] Filter sections by `isOnline` flag when needed
  - [ ] Return only online sections for online students

### Testing
- [ ] Test COHORT mode flow
- [ ] Test DIRECT mode flow
- [ ] Test ONLINE mode flow
- [ ] Test isOnline checkbox behavior
- [ ] Test stream field visibility
- [ ] Test validation for all modes
- [ ] Test form submission for all modes
- [ ] Test prefilled data in edit mode

---

## PHASE 3: STUDENT EDIT FORM (Week 3)

### EditStudentForm Component
- [ ] Add `streams` prop
- [ ] Update form schema to include new fields
- [ ] Add `isOnline` field (read-only):
  - [ ] Show as disabled checkbox
  - [ ] Add description: "Cannot change enrollment type after admission"

### Stream Field
- [ ] Add `streamId` field for DIRECT & ONLINE modes
- [ ] Use SearchableDropdown component
- [ ] Make it editable
- [ ] Prefill with current value

### Conditional Rendering
- [ ] Show `isOnline` flag for all modes
- [ ] Show `streamId` field for DIRECT & ONLINE modes
- [ ] Hide `streamId` field for COHORT mode

### Validation
- [ ] Update validation to allow editing stream
- [ ] Prevent changing enrollment type
- [ ] Validate stream exists

### Server Action (updateStudent)
- [ ] Allow updating `streamId` for DIRECT & ONLINE
- [ ] Prevent changing `enrollmentType`
- [ ] Prevent changing `branchId` for COHORT mode
- [ ] Update StudentEnrollment correctly

### Testing
- [ ] Test COHORT mode edit
- [ ] Test DIRECT mode edit
- [ ] Test ONLINE mode edit
- [ ] Test stream field prefilled
- [ ] Test isOnline flag shows correctly
- [ ] Test cannot change enrollment type
- [ ] Test stream can be edited

---

## PHASE 4: SECTIONS MANAGEMENT (Week 4)

### Section Creation Form
- [ ] Add `isOnline` checkbox:
  - [ ] Label: "This is an Online Section"
  - [ ] Default: false
- [ ] Update validation schema
- [ ] Update server action to save `isOnline` flag

### Section List Page
- [ ] Show `isOnline` badge/indicator
- [ ] Filter by online/offline
- [ ] Update section count display

### Section Edit Form
- [ ] Allow editing `isOnline` flag
- [ ] Update server action

### Testing
- [ ] Test creating online section
- [ ] Test creating offline section
- [ ] Test editing section
- [ ] Test filtering sections

---

## PHASE 5: QUERIES & REPORTS (Week 4)

### Student Queries
- [ ] Update queries to include `stream` relation
- [ ] Update queries to include `isOnline` flag
- [ ] Test queries return correct data

### Student List Page
- [ ] Show enrollment type badge
- [ ] Show stream information
- [ ] Show online indicator

### Student Profile Page
- [ ] Show complete enrollment context
- [ ] Show stream information
- [ ] Show online indicator

### Reports
- [ ] Update enrollment report to include stream
- [ ] Update enrollment report to show enrollment type
- [ ] Update enrollment report to show online indicator
- [ ] Test reports for all enrollment types

### Testing
- [ ] Test student list shows correct info
- [ ] Test student profile shows correct info
- [ ] Test reports show correct info
- [ ] Test filtering by enrollment type
- [ ] Test filtering by stream

---

## PHASE 5: COMPREHENSIVE TESTING

### Admission Form Tests
- [ ] COHORT mode:
  - [ ] Branch dropdown shows
  - [ ] Year dropdown shows
  - [ ] Class dropdown shows
  - [ ] Cohort dropdown shows
  - [ ] Section dropdown shows
  - [ ] Stream field hidden
  - [ ] isOnline checkbox unchecked
  - [ ] Form submits successfully
  - [ ] Student enrolled with correct data

- [ ] DIRECT mode:
  - [ ] Branch dropdown hidden
  - [ ] Year dropdown shows
  - [ ] Class dropdown shows
  - [ ] Cohort dropdown hidden
  - [ ] Stream dropdown shows (optional)
  - [ ] Section dropdown shows
  - [ ] isOnline checkbox unchecked
  - [ ] Form submits successfully
  - [ ] Student enrolled with correct data

- [ ] ONLINE mode:
  - [ ] Branch dropdown hidden
  - [ ] Year dropdown shows
  - [ ] Class dropdown shows
  - [ ] Cohort dropdown hidden
  - [ ] Stream dropdown shows (optional)
  - [ ] Section dropdown shows (online only)
  - [ ] isOnline checkbox checked
  - [ ] Form submits successfully
  - [ ] Student enrolled with correct data

### Student Edit Tests
- [ ] COHORT mode:
  - [ ] All fields prefilled
  - [ ] Stream field hidden
  - [ ] isOnline flag shows as unchecked
  - [ ] Cannot change enrollment type
  - [ ] Form updates successfully

- [ ] DIRECT mode:
  - [ ] All fields prefilled
  - [ ] Stream field shows and prefilled
  - [ ] isOnline flag shows as unchecked
  - [ ] Can edit stream
  - [ ] Cannot change enrollment type
  - [ ] Form updates successfully

- [ ] ONLINE mode:
  - [ ] All fields prefilled
  - [ ] Stream field shows and prefilled
  - [ ] isOnline flag shows as checked
  - [ ] Can edit stream
  - [ ] Cannot change enrollment type
  - [ ] Form updates successfully

### Database Tests
- [ ] StudentEnrollment has all new fields
- [ ] Stream relation works
- [ ] Section.isOnline works
- [ ] Existing data migrated correctly
- [ ] No data loss

### Query Tests
- [ ] Get student with full context
- [ ] Filter sections by isOnline
- [ ] Get students by enrollment type
- [ ] Get students by stream

### Report Tests
- [ ] Enrollment report shows stream
- [ ] Enrollment report shows enrollment type
- [ ] Enrollment report shows online indicator
- [ ] All reports work for all enrollment types

---

## PHASE 6: DEPLOYMENT

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Database migration tested
- [ ] Rollback plan documented

### Deployment
- [ ] Backup database
- [ ] Run migration on production
- [ ] Deploy code
- [ ] Verify all features work
- [ ] Monitor for errors

### Post-Deployment
- [ ] Test admission form
- [ ] Test student edit form
- [ ] Test reports
- [ ] Monitor database performance
- [ ] Gather user feedback

---

## ROLLBACK PLAN

If something goes wrong:

1. **Database Rollback:**
   ```bash
   npx prisma migrate resolve --rolled-back add_stream_online_enrollment_fields
   ```

2. **Code Rollback:**
   ```bash
   git revert <commit-hash>
   ```

3. **Data Recovery:**
   - Restore from backup
   - Re-run previous migration

---

## SUCCESS CRITERIA

✅ All three enrollment modes work
✅ Stream information available for all modes
✅ No branch selection for online students
✅ All existing data migrated correctly
✅ All tests passing
✅ No breaking changes
✅ Reports show complete context
✅ User feedback positive

---

## TIMELINE

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Database | 1 week | ⏳ Pending |
| Phase 2: Admission Form | 1 week | ⏳ Pending |
| Phase 3: Student Edit | 1 week | ⏳ Pending |
| Phase 4: Sections & Reports | 1 week | ⏳ Pending |
| Phase 5: Testing | 1 week | ⏳ Pending |
| Phase 6: Deployment | 1 week | ⏳ Pending |
| **Total** | **6 weeks** | ⏳ Pending |

---

## NOTES

- Keep existing cohort functionality intact
- Ensure backward compatibility
- Test thoroughly before deployment
- Document all changes
- Get user feedback
- Monitor performance
- Plan for future enhancements

---

**Status:** ✅ Ready for Implementation
**Last Updated:** 2025-11-04
**Next Step:** Start Phase 1 - Database Changes

