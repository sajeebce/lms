# Academic Setup Module - E2E Test Suite

Comprehensive Playwright test suite for the Academic Setup module covering all 10 pages with UI, validation, and business logic tests.

## 📋 Test Coverage

### Test Files

1. **`01-global.spec.ts`** - Global/Cross-Cutting Tests
   - Tenant isolation
   - RBAC guards
   - Theme consistency across all pages

2. **`02-branches.spec.ts`** - Branches Tests
   - Create, edit, delete operations
   - Unique name validation
   - Delete guards for in-use branches
   - Status pill styling

3. **`03-academic-years.spec.ts`** - Academic Years Tests
   - CRUD operations
   - Date range validation
   - "Current" badge for active years
   - Delete guards for years with cohorts
   - State pill colors

4. **`04-streams-classes.spec.ts`** - Streams & Classes Tests
   - Stream CRUD with delete guards
   - Class order sorting (ASC)
   - Duplicate order validation
   - Promotion path badges
   - Stream relation

5. **`05-cohorts.spec.ts`** - Cohorts Tests
   - CRUD operations
   - Enrollment toggle with live pill updates
   - Filters (Branch, Year, Class, Status)
   - Delete guards for cohorts with sections
   - Status pill colors

6. **`06-sections.spec.ts`** - Section Templates & Sections Tests
   - Template CRUD with capacity validation
   - Section CRUD with cohort relation
   - Cascading filters (Branch → Year → Class → Cohort)
   - Delete guards
   - Safe delete info chip

7. **`07-year-wizard.spec.ts`** - Year Wizard Tests
   - Preview generation
   - Multi-select classes
   - Transaction safety
   - Conflict detection ("Already Exists" badges)
   - Bulk cohort/section creation

8. **`08-routine.spec.ts`** - Routine/Timetable Tests
   - CRUD operations
   - Teacher conflict validation
   - Room conflict validation
   - Section conflict validation
   - Time overlap detection
   - Colorful chips (Teacher=purple, Room=blue, Section=green)

9. **`09-promotions-visual.spec.ts`** - Promotions & Visual Regression Tests
   - 501 placeholder page
   - Gradient theming on all pages
   - Pill chips for all status values
   - CTA button styling
   - Modal/card styling
   - Empty states

## 🚀 Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### Run All Tests

```bash
# Run all tests (headless)
npm test

# Run with UI mode (interactive)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Debug mode (step through tests)
npm run test:debug
```

### Run Specific Test Files

```bash
# Run only branches tests
npx playwright test 02-branches

# Run only routine tests
npx playwright test 08-routine

# Run visual regression tests
npx playwright test 09-promotions-visual
```

### View Test Report

```bash
# Generate and open HTML report
npm run test:report
```

## 📊 Test Statistics

- **Total Test Files:** 9
- **Total Test Cases:** 100+
- **Coverage:**
  - ✅ All 10 Academic Setup pages
  - ✅ CRUD operations
  - ✅ Validation rules
  - ✅ Delete guards
  - ✅ Conflict detection
  - ✅ UI theme consistency
  - ✅ Status pill styling
  - ✅ Filter functionality

## 🎯 Test Scenarios Covered

### Functional Tests

- **Create Operations:** All pages support creating new records with validation
- **Read Operations:** List views, filters, sorting
- **Update Operations:** Edit existing records
- **Delete Operations:** Delete with guards and confirmations

### Validation Tests

- **Unique Constraints:** Name/code uniqueness per tenant
- **Date Validation:** End date after start date
- **Order Validation:** Unique order for classes
- **Capacity Validation:** Minimum capacity >= 1
- **Time Validation:** End time after start time
- **Conflict Detection:** Teacher/room/section overlaps

### Business Logic Tests

- **Delete Guards:**
  - Branch → Cohorts
  - Academic Year → Cohorts
  - Stream → Classes
  - Class → Cohorts + Section Templates
  - Cohort → Sections
  - Section → Students (placeholder)

- **Derived Fields:**
  - "Current" badge for active academic years
  - Promotion path badges for classes

- **Transactional Operations:**
  - Year Wizard bulk creation
  - Conflict skipping (not failure)

### UI/Visual Tests

- **Theme Consistency:**
  - Gradient headers on all pages
  - Violet-tinted table headers
  - Pill badges for all status values
  - CTA buttons with violet gradient

- **Status Pills:**
  - Active/Inactive (emerald/neutral)
  - Planned/Running/Finished/Archived (amber/emerald/violet/neutral)
  - Open/Closed (emerald/amber)
  - Will Create/Already Exists (emerald/amber)

- **Colorful Chips:**
  - Section (green)
  - Teacher (purple)
  - Room (blue)

## 🧪 Test Utilities

### `TestHelpers` Class

Located in `tests/helpers/test-utils.ts`, provides:

- **Navigation:** `navigateTo(path)`
- **Toast Assertions:** `expectSuccessToast()`, `expectErrorToast()`
- **Pill Badge Checks:** `expectPillBadge(text, colorClass)`
- **Form Helpers:** `fillInput()`, `selectOption()`, `submitForm()`
- **Table Helpers:** `expectTableRow()`, `getTableRowCount()`
- **CRUD Helpers:** `clickAddButton()`, `editRow()`, `deleteRow()`
- **Filter Helpers:** `selectFilter()`, `toggleSwitch()`
- **Theme Checks:** `expectGradientHeader()`, `expectVioletTableHeader()`

### Example Usage

```typescript
import { test } from '@playwright/test'
import { TestHelpers } from './helpers/test-utils'

test('Create branch', async ({ page }) => {
  const helpers = new TestHelpers(page)
  
  await helpers.navigateTo('branches')
  await helpers.clickAddButton('Add Branch')
  await helpers.fillInput('Branch Name', 'Test Campus')
  await helpers.selectOption('Status', 'Active')
  await helpers.submitForm()
  
  await helpers.expectSuccessToast('Branch created')
  await helpers.expectPillBadge('Active', 'bg-emerald')
})
```

## 📝 Test Data

Tests use the existing seed data:
- 1 Tenant: "Demo School"
- 1 Admin User
- 4 Teachers
- 6 Rooms

Additional test data is created during test execution and should be cleaned up (future enhancement).

## 🔍 Debugging Failed Tests

### View Screenshots

Failed tests automatically capture screenshots:
```
test-results/
  <test-name>/
    test-failed-1.png
```

### View Traces

Traces are captured on first retry:
```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

### Run Single Test

```bash
npx playwright test --grep "Create valid branch"
```

### Debug Mode

```bash
npx playwright test --debug
```

## ✅ Acceptance Criteria Verification

All test cases map to the acceptance criteria in `ACADEMIC_SETUP_TESTS.md`:

- ✅ **1.1-1.3:** Global tests (tenant isolation, RBAC, theme)
- ✅ **2.1-2.3:** Branches tests
- ✅ **3.1-3.5:** Academic Years tests
- ✅ **4.1-4.3:** Streams tests
- ✅ **5.1-5.4:** Classes tests
- ✅ **6.1-6.4:** Cohorts tests
- ✅ **7.1-7.3:** Section Templates tests
- ✅ **8.1-8.4:** Sections tests
- ✅ **9.1-9.3:** Year Wizard tests
- ✅ **10.1-10.5:** Routine tests
- ✅ **11.1-11.2:** Promotions tests
- ✅ **12.1-12.2:** Visual regression tests

## 🚧 Future Enhancements

- [ ] Add test data cleanup (afterEach hooks)
- [ ] Add multi-tenant test scenarios
- [ ] Add RBAC tests with TEACHER/STUDENT roles
- [ ] Add performance tests
- [ ] Add accessibility tests
- [ ] Add mobile responsive tests
- [ ] Add API-level tests (server actions)
- [ ] Add visual regression screenshots
- [ ] Add CI/CD integration

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Test Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)

---

**Built with ❤️ for comprehensive quality assurance of the LMS Academic Setup module.**

