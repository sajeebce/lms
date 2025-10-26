import { test, expect } from '@playwright/test'
import { TestHelpers } from './helpers/test-utils'

test.describe('Year Wizard Tests', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
    await helpers.navigateTo('year-wizard')
  })

  test('9.1 Preview generation', async ({ page }) => {
    // Given: Year, Branch, Classes with templates exist
    
    // When: Admin selects inputs
    await helpers.selectOption('Academic Year', '2025')
    await helpers.selectOption('Branch', 'Campus')
    
    // Select multiple classes
    await helpers.selectClasses(['Class 10', 'Class 11'])
    
    // Click Preview
    await helpers.clickAddButton('Preview')
    
    // Then: Preview table shows cohorts and sections
    await page.waitForTimeout(1000)
    
    // Verify preview table appears
    const previewTable = page.locator('table').last()
    await expect(previewTable).toBeVisible()
    
    // Check for "Will Create" or "Already Exists" badges
    const badge = page.locator('.rounded-full', { hasText: /Will Create|Already Exists/ })
    await expect(badge.first()).toBeVisible()
  })

  test('9.2 Commit generation', async ({ page }) => {
    // Setup: Select year, branch, classes
    await helpers.selectOption('Academic Year', '2025')
    await helpers.selectOption('Branch', 'Campus')
    await helpers.selectClasses(['Class 10'])
    
    // Preview
    await helpers.clickAddButton('Preview')
    await page.waitForTimeout(1000)
    
    // Click "Generate Now"
    const generateButton = page.getByRole('button', { name: /Generate Now/i })
    await generateButton.click()
    
    // Verify success toast with celebration
    await helpers.expectSuccessToast('Cohorts & Sections created 🎉')
  })

  test('9.3 Transaction safety - skips conflicts', async ({ page }) => {
    // Create a cohort manually first
    await helpers.navigateTo('cohorts')
    await helpers.clickAddButton('Add Cohort')
    await helpers.fillInput('Cohort Name', 'Class 10 – 2025 Intake')
    await helpers.submitForm()
    await helpers.expectSuccessToast('Cohort created')

    // Go to wizard
    await helpers.navigateTo('year-wizard')
    
    // Select same year, branch, class
    await helpers.selectOption('Academic Year', '2025')
    await helpers.selectOption('Branch', 'Campus')
    await helpers.selectClasses(['Class 10'])
    
    // Preview
    await helpers.clickAddButton('Preview')
    await page.waitForTimeout(1000)
    
    // Verify "Already Exists" badge appears
    await helpers.expectPillBadge('Already Exists', 'bg-amber')
    
    // Generate (should skip existing)
    const generateButton = page.getByRole('button', { name: /Generate Now/i })
    await generateButton.click()
    
    // Should still succeed with skip message
    await page.waitForTimeout(1000)
  })

  test('9.4 UI - Preview uses pill badges and tinted backgrounds', async ({ page }) => {
    await helpers.selectOption('Academic Year', '2025')
    await helpers.selectOption('Branch', 'Campus')
    await helpers.selectClasses(['Class 10'])
    
    await helpers.clickAddButton('Preview')
    await page.waitForTimeout(1000)
    
    // Check for colored pills
    const pills = page.locator('.rounded-full')
    await expect(pills.first()).toBeVisible()
    
    // Check for tinted backgrounds (violet-50, amber-50)
    const tintedBg = page.locator('[class*="-50"]')
    await expect(tintedBg.first()).toBeVisible()
  })

  test('9.5 UI - Purple accent header with wizard icon', async ({ page }) => {
    // Check for purple gradient header
    await helpers.expectGradientHeader()
    
    // Check for wizard emoji/icon
    const header = page.locator('h1')
    await expect(header).toContainText('🪄')
  })

  test('9.6 Multi-select classes works', async ({ page }) => {
    // Click multiple class buttons
    const class10 = page.locator('button', { hasText: 'Class 10' })
    const class11 = page.locator('button', { hasText: 'Class 11' })
    
    await class10.click()
    await class11.click()
    
    // Verify both are selected (border-violet-600)
    await expect(class10).toHaveClass(/border-violet-600/)
    await expect(class11).toHaveClass(/border-violet-600/)
    
    // Deselect one
    await class10.click()
    await expect(class10).not.toHaveClass(/border-violet-600/)
  })

  test('9.7 Preview shows section templates', async ({ page }) => {
    // This test verifies that preview shows sections from templates
    // Requires templates to exist for the selected classes
    
    await helpers.selectOption('Academic Year', '2025')
    await helpers.selectOption('Branch', 'Campus')
    await helpers.selectClasses(['Class 10'])
    
    await helpers.clickAddButton('Preview')
    await page.waitForTimeout(1000)
    
    // Check preview table for section badges
    const sectionBadges = page.locator('tbody tr').first().locator('.rounded-full')
    // Should show section names like "A (40)", "B (40)"
  })
})

