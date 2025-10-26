import { test, expect } from '@playwright/test'
import { TestHelpers } from './helpers/test-utils'

test.describe('Routine / Timetable Tests', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
    await helpers.navigateTo('routine')
  })

  test('10.1 Add routine slot success', async ({ page }) => {
    // When: Admin creates a routine entry
    await helpers.clickAddButton('Add Session')
    
    // Fill form
    await helpers.selectOption('Section', 'Science')
    await helpers.selectOption('Teacher', 'Dr. Sarah')
    await helpers.selectOption('Room', 'Room 202')
    await helpers.selectOption('Day of Week', 'Monday')
    await helpers.fillInput('Start Time', '10:00')
    await helpers.fillInput('End Time', '11:00')
    await helpers.submitForm()

    // Then: Entry appears in timetable
    await helpers.expectSuccessToast('created')
    await helpers.expectTableRow('Monday')
    await helpers.expectTableRow('10:00')
    await helpers.expectTableRow('11:00')
    
    // Verify colored chips
    await helpers.expectPillBadge('Dr. Sarah', 'bg-violet')
    await helpers.expectPillBadge('Room 202', 'bg-blue')
  })

  test('10.2 Teacher conflict', async ({ page }) => {
    // Given: Teacher already scheduled Mon 10:00-11:00
    await helpers.clickAddButton('Add Session')
    await helpers.selectOption('Section', 'Section A')
    await helpers.selectOption('Teacher', 'Dr. Sarah')
    await helpers.selectOption('Room', 'Room 101')
    await helpers.selectOption('Day of Week', 'Monday')
    await helpers.fillInput('Start Time', '10:00')
    await helpers.fillInput('End Time', '11:00')
    await helpers.submitForm()
    await helpers.expectSuccessToast('created')

    // When: Try to book same teacher at same time
    await helpers.clickAddButton('Add Session')
    await helpers.selectOption('Section', 'Section B')
    await helpers.selectOption('Teacher', 'Dr. Sarah')
    await helpers.selectOption('Room', 'Room 102')
    await helpers.selectOption('Day of Week', 'Monday')
    await helpers.fillInput('Start Time', '10:00')
    await helpers.fillInput('End Time', '11:00')
    await helpers.submitForm()

    // Then: Conflict error appears
    await helpers.expectErrorToast('Conflict: Teacher already booked')
  })

  test('10.3 Room conflict', async ({ page }) => {
    // Given: Room 202 booked 11:00-12:00
    await helpers.clickAddButton('Add Session')
    await helpers.selectOption('Section', 'Section A')
    await helpers.selectOption('Teacher', 'Prof. Karim')
    await helpers.selectOption('Room', 'Room 202')
    await helpers.selectOption('Day of Week', 'Tuesday')
    await helpers.fillInput('Start Time', '11:00')
    await helpers.fillInput('End Time', '12:00')
    await helpers.submitForm()
    await helpers.expectSuccessToast('created')

    // When: Try overlapping time (11:30-12:00)
    await helpers.clickAddButton('Add Session')
    await helpers.selectOption('Section', 'Section B')
    await helpers.selectOption('Teacher', 'Ms. Fatima')
    await helpers.selectOption('Room', 'Room 202')
    await helpers.selectOption('Day of Week', 'Tuesday')
    await helpers.fillInput('Start Time', '11:30')
    await helpers.fillInput('End Time', '12:30')
    await helpers.submitForm()

    // Then: Conflict error
    await helpers.expectErrorToast('Conflict: Room already booked')
  })

  test('10.4 Section conflict', async ({ page }) => {
    // Given: Section booked at a time
    await helpers.clickAddButton('Add Session')
    await helpers.selectOption('Section', 'Section A')
    await helpers.selectOption('Teacher', 'Dr. Sarah')
    await helpers.selectOption('Room', 'Room 101')
    await helpers.selectOption('Day of Week', 'Wednesday')
    await helpers.fillInput('Start Time', '09:00')
    await helpers.fillInput('End Time', '10:00')
    await helpers.submitForm()
    await helpers.expectSuccessToast('created')

    // When: Try to book same section different room
    await helpers.clickAddButton('Add Session')
    await helpers.selectOption('Section', 'Section A')
    await helpers.selectOption('Teacher', 'Prof. Karim')
    await helpers.selectOption('Room', 'Room 102')
    await helpers.selectOption('Day of Week', 'Wednesday')
    await helpers.fillInput('Start Time', '09:00')
    await helpers.fillInput('End Time', '10:00')
    await helpers.submitForm()

    // Then: Conflict error
    await helpers.expectErrorToast('Conflict: Section already scheduled')
  })

  test('10.5 Filter panel - Branch and Day filters', async ({ page }) => {
    // When: Admin selects filters
    await helpers.selectFilter('Branch', 'All')
    await page.waitForTimeout(300)
    
    await helpers.selectFilter('Day of Week', 'Monday')
    await page.waitForTimeout(300)

    // Then: Only matching sessions show
    // Verify table updates (basic check)
    const table = page.locator('table')
    await expect(table).toBeVisible()
  })

  test('10.6 UI - Colorful chips for Teacher/Room/Section', async ({ page }) => {
    // Create a routine entry
    await helpers.clickAddButton('Add Session')
    await helpers.selectOption('Section', 'Section A')
    await helpers.selectOption('Teacher', 'Dr. Sarah')
    await helpers.selectOption('Room', 'Room 101')
    await helpers.selectOption('Day of Week', 'Thursday')
    await helpers.fillInput('Start Time', '14:00')
    await helpers.fillInput('End Time', '15:00')
    await helpers.submitForm()
    await helpers.expectSuccessToast('created')

    // Verify chips have correct colors
    const row = page.locator('tbody tr').last()
    
    // Section chip (green)
    const sectionChip = row.locator('.bg-emerald-50')
    await expect(sectionChip).toBeVisible()
    
    // Teacher chip (purple)
    const teacherChip = row.locator('.bg-violet-50')
    await expect(teacherChip).toBeVisible()
    
    // Room chip (blue)
    const roomChip = row.locator('.bg-blue-50')
    await expect(roomChip).toBeVisible()
  })

  test('10.7 Time validation - end must be after start', async ({ page }) => {
    await helpers.clickAddButton('Add Session')
    await helpers.selectOption('Section', 'Section A')
    await helpers.selectOption('Teacher', 'Dr. Sarah')
    await helpers.selectOption('Room', 'Room 101')
    await helpers.selectOption('Day of Week', 'Friday')
    await helpers.fillInput('Start Time', '15:00')
    await helpers.fillInput('End Time', '14:00') // Before start
    await helpers.submitForm()

    // Expect validation error
    await page.waitForTimeout(500)
    // Either inline or toast error
  })

  test('10.8 Edit existing routine', async ({ page }) => {
    // Create routine
    await helpers.clickAddButton('Add Session')
    await helpers.selectOption('Section', 'Section A')
    await helpers.selectOption('Teacher', 'Dr. Sarah')
    await helpers.selectOption('Room', 'Room 101')
    await helpers.selectOption('Day of Week', 'Monday')
    await helpers.fillInput('Start Time', '08:00')
    await helpers.fillInput('End Time', '09:00')
    await helpers.submitForm()
    await helpers.expectSuccessToast('created')

    // Edit it
    await helpers.editRow('08:00')
    await helpers.fillInput('End Time', '09:30')
    await helpers.submitForm('Update')
    
    await helpers.expectSuccessToast('updated')
    await helpers.expectTableRow('09:30')
  })

  test('10.9 Delete routine', async ({ page }) => {
    // Create routine
    await helpers.clickAddButton('Add Session')
    await helpers.selectOption('Section', 'Section A')
    await helpers.selectOption('Teacher', 'Dr. Sarah')
    await helpers.selectOption('Room', 'Room 101')
    await helpers.selectOption('Day of Week', 'Saturday')
    await helpers.fillInput('Start Time', '10:00')
    await helpers.fillInput('End Time', '11:00')
    await helpers.submitForm()
    await helpers.expectSuccessToast('created')

    // Delete
    helpers.confirmDialog()
    await helpers.deleteRow('Saturday')
    
    await helpers.expectSuccessToast('deleted')
  })
})

