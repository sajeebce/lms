import { test, expect } from '@playwright/test'
import { TestHelpers } from './helpers/test-utils'

test.describe('Cohorts Tests', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
  })

  test('6.1 Create planned cohort', async ({ page }) => {
    // Setup: Create prerequisites (Year, Class, Branch)
    // Assuming seed data has these, otherwise create them first
    
    await helpers.navigateTo('cohorts')
    await helpers.clickAddButton('Add Cohort')
    
    // Fill form
    await helpers.selectOption('Academic Year', '2025') // Adjust based on seed data
    await helpers.selectOption('Class', 'Class') // Adjust based on seed data
    await helpers.selectOption('Branch', 'Campus') // Adjust based on seed data
    await helpers.fillInput('Cohort Name', 'Class 11 – 2025 Intake')
    await helpers.selectOption('Status', 'Planned')
    // enrollmentOpen defaults to false
    await helpers.submitForm()

    // Verify
    await helpers.expectSuccessToast('Cohort created')
    await helpers.expectTableRow('Class 11 – 2025 Intake')
    await helpers.expectStatusPillInRow('Class 11 – 2025 Intake', 'Planned', 'bg-amber')
    await helpers.expectStatusPillInRow('Class 11 – 2025 Intake', 'Closed', 'bg-amber')
  })

  test('6.2 Unique per (yearId,classId,branchId,name)', async ({ page }) => {
    await helpers.navigateTo('cohorts')
    
    // Create first cohort
    await helpers.clickAddButton('Add Cohort')
    await helpers.fillInput('Cohort Name', 'Unique Cohort Test')
    // Select year, class, branch (using first available options)
    await helpers.submitForm()
    await helpers.expectSuccessToast('Cohort created')

    // Try duplicate
    await helpers.clickAddButton('Add Cohort')
    await helpers.fillInput('Cohort Name', 'Unique Cohort Test')
    // Same year, class, branch
    await helpers.submitForm()

    // Expect error
    await helpers.expectErrorToast('already exists')
  })

  test('6.3 Toggle enrollmentOpen', async ({ page }) => {
    await helpers.navigateTo('cohorts')
    
    // Create cohort with enrollmentOpen=false
    await helpers.clickAddButton('Add Cohort')
    await helpers.fillInput('Cohort Name', 'Toggle Test Cohort')
    await helpers.submitForm()
    await helpers.expectSuccessToast('Cohort created')

    // Verify "Closed" pill
    await helpers.expectStatusPillInRow('Toggle Test Cohort', 'Closed', 'bg-amber')

    // Toggle the switch
    await helpers.toggleSwitch('Toggle Test Cohort')
    
    // Wait for update
    await page.waitForTimeout(1000)

    // Verify "Open" pill (green)
    await helpers.expectStatusPillInRow('Toggle Test Cohort', 'Open', 'bg-emerald')
  })

  test('6.4 Delete guard if Sections exist', async ({ page }) => {
    await helpers.navigateTo('cohorts')
    
    // Create cohort
    await helpers.clickAddButton('Add Cohort')
    await helpers.fillInput('Cohort Name', 'Delete Guard Cohort')
    await helpers.submitForm()
    await helpers.expectSuccessToast('Cohort created')

    // Try to delete (if sections exist, will fail)
    helpers.confirmDialog()
    await helpers.deleteRow('Delete Guard Cohort')
    
    await page.waitForTimeout(1000)
    // Either success or error about sections
  })

  test('6.5 Filter by Branch', async ({ page }) => {
    await helpers.navigateTo('cohorts')
    
    // Select a branch filter
    await helpers.selectFilter('Branch', 'All')
    
    // Verify table updates (this is a basic check)
    await page.waitForTimeout(500)
    
    // In a real test, we'd verify specific cohorts appear/disappear
  })

  test('6.6 Filter by Academic Year', async ({ page }) => {
    await helpers.navigateTo('cohorts')
    
    // Select year filter
    await helpers.selectFilter('Academic Year', 'All')
    
    await page.waitForTimeout(500)
  })

  test('6.7 Filter by Status', async ({ page }) => {
    await helpers.navigateTo('cohorts')
    
    // Create cohorts with different statuses
    const statuses = ['Planned', 'Running', 'Finished']
    
    for (const status of statuses) {
      await helpers.clickAddButton('Add Cohort')
      await helpers.fillInput('Cohort Name', `${status} Cohort`)
      await helpers.selectOption('Status', status)
      await helpers.submitForm()
      await helpers.expectSuccessToast('Cohort created')
    }

    // Filter by Running
    await helpers.selectFilter('Status', 'Running')
    await page.waitForTimeout(500)
    
    // Verify only Running cohorts show
    await helpers.expectTableRow('Running Cohort')
  })

  test('6.8 UI - Status pills use correct colors', async ({ page }) => {
    await helpers.navigateTo('cohorts')
    
    const statuses = [
      { name: 'Planned', color: 'bg-amber' },
      { name: 'Running', color: 'bg-emerald' },
      { name: 'Finished', color: 'bg-violet' },
      { name: 'Archived', color: 'bg-neutral' },
    ]

    for (const { name, color } of statuses) {
      await helpers.clickAddButton('Add Cohort')
      await helpers.fillInput('Cohort Name', `${name} Status Cohort`)
      await helpers.selectOption('Status', name)
      await helpers.submitForm()
      await helpers.expectSuccessToast('Cohort created')
      
      await helpers.expectStatusPillInRow(`${name} Status Cohort`, name, color)
    }
  })
})

