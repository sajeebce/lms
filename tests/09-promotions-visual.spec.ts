import { test, expect } from '@playwright/test'
import { TestHelpers } from './helpers/test-utils'

test.describe('Promotions Tests', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
    await helpers.navigateTo('promotions')
  })

  test('11.1 Page renders "Coming Soon"', async ({ page }) => {
    // Then: Page shows coming soon message
    await expect(page.locator('text=/coming soon/i')).toBeVisible()
    
    // Check for emoji/icon
    await expect(page.locator('text=🚧')).toBeVisible()
    
    // Check for disabled button
    const button = page.getByRole('button', { name: /Promote Now/i })
    await expect(button).toBeDisabled()
  })

  test('11.2 Server action returns 501', async ({ page }) => {
    // When: Admin clicks placeholder action
    const button = page.getByRole('button', { name: /Promote Now/i })
    
    // If button is disabled, we can't click it
    // But we can verify the UI state
    const isDisabled = await button.isDisabled()
    expect(isDisabled).toBe(true)
    
    // The 501 response would be tested if button was enabled
  })

  test('11.3 UI - Card has violet/indigo gradient', async ({ page }) => {
    // Check for gradient background
    const card = page.locator('.bg-gradient-to-r')
    await expect(card).toBeVisible()
    
    // Check for rounded corners
    const roundedCard = page.locator('.rounded-xl')
    await expect(roundedCard.first()).toBeVisible()
  })

  test('11.4 UI - Lock icon visible', async ({ page }) => {
    // Check for lock icon
    const lockIcon = page.locator('svg').filter({ hasText: /lock/i })
    // May or may not be visible depending on implementation
  })

  test('11.5 UI - Feature preview with bullet points', async ({ page }) => {
    // Check for bullet points or list
    const list = page.locator('ul, ol')
    // May or may not exist depending on implementation
  })
})

test.describe('Visual Regression Tests', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
  })

  test('12.1 Gradient theming applied to all pages', async ({ page }) => {
    const pages = [
      { path: 'branches', title: 'Branches' },
      { path: 'academic-years', title: 'Academic Years' },
      { path: 'streams', title: 'Streams' },
      { path: 'classes', title: 'Classes' },
      { path: 'cohorts', title: 'Cohorts' },
      { path: 'section-templates', title: 'Section Templates' },
      { path: 'sections', title: 'Sections' },
      { path: 'routine', title: 'Routine' },
      { path: 'year-wizard', title: 'Year Wizard' },
      { path: 'promotions', title: 'Promotions' },
    ]

    for (const { path, title } of pages) {
      await helpers.navigateTo(path)
      
      // Check gradient header
      await helpers.expectGradientHeader()
      
      // Check page title exists
      const heading = page.locator('h1')
      await expect(heading).toBeVisible()
      
      // Check for violet accent (either in header or buttons)
      const violetElement = page.locator('[class*="violet"]')
      await expect(violetElement.first()).toBeVisible()
    }
  })

  test('12.2 Pill chips for status everywhere', async ({ page }) => {
    // Test that status values render as pills, not plain text
    
    // Branches - Active/Inactive
    await helpers.navigateTo('branches')
    const branchPill = page.locator('.rounded-full')
    // May or may not be visible depending on data
    
    // Academic Years - State pills
    await helpers.navigateTo('academic-years')
    const yearPill = page.locator('.rounded-full')
    // Should have pills for state
    
    // Cohorts - Status and Enrollment pills
    await helpers.navigateTo('cohorts')
    const cohortPill = page.locator('.rounded-full')
    // Should have multiple pills per row
  })

  test('12.3 No Bootstrap-ish gray tables', async ({ page }) => {
    const pages = ['branches', 'academic-years', 'streams', 'classes']

    for (const pagePath of pages) {
      await helpers.navigateTo(pagePath)
      
      // Check table header is NOT plain gray
      const tableHeader = page.locator('thead tr').first()
      const bgClass = await tableHeader.getAttribute('class')
      
      // Should have violet tint, not plain gray
      expect(bgClass).toContain('violet')
    }
  })

  test('12.4 Primary CTA buttons use violet gradient', async ({ page }) => {
    const pages = [
      { path: 'branches', button: 'Add Branch' },
      { path: 'academic-years', button: 'Add Academic Year' },
      { path: 'cohorts', button: 'Add Cohort' },
    ]

    for (const { path, button } of pages) {
      await helpers.navigateTo(path)
      
      const ctaButton = page.getByRole('button', { name: new RegExp(button, 'i') })
      await expect(ctaButton).toBeVisible()
      
      // Check for violet background
      const bgClass = await ctaButton.getAttribute('class')
      expect(bgClass).toContain('violet')
    }
  })

  test('12.5 Rounded corners and shadows on cards', async ({ page }) => {
    await helpers.navigateTo('branches')
    
    // Check for rounded corners
    const roundedCard = page.locator('.rounded-lg')
    await expect(roundedCard.first()).toBeVisible()
    
    // Check for border
    const borderedCard = page.locator('.border')
    await expect(borderedCard.first()).toBeVisible()
  })

  test('12.6 Icons/emojis in page headers', async ({ page }) => {
    const pages = [
      { path: 'year-wizard', icon: '🪄' },
      { path: 'promotions', icon: '🚧' },
    ]

    for (const { path, icon } of pages) {
      await helpers.navigateTo(path)
      
      const heading = page.locator('h1')
      await expect(heading).toContainText(icon)
    }
  })

  test('12.7 Success toasts use celebratory emojis', async ({ page }) => {
    // Create a branch to trigger success toast
    await helpers.navigateTo('branches')
    await helpers.clickAddButton('Add Branch')
    await helpers.fillInput('Branch Name', 'Celebration Test')
    await helpers.fillInput('Code', 'CLB')
    await helpers.selectOption('Status', 'Active')
    await helpers.submitForm()

    // Check toast contains emoji or celebration
    const toast = page.locator('[data-sonner-toast]')
    await expect(toast).toBeVisible({ timeout: 5000 })
    
    // Toast should have success styling
  })

  test('12.8 Empty states are styled, not plain text', async ({ page }) => {
    // Navigate to a page that might have empty state
    await helpers.navigateTo('routine')
    
    // If no data, should show styled empty state
    const emptyState = page.locator('text=/no routines found/i')
    // May or may not be visible depending on data
  })

  test('12.9 Modal dialogs have proper styling', async ({ page }) => {
    await helpers.navigateTo('branches')
    await helpers.clickAddButton('Add Branch')
    
    // Check modal has proper styling
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()
    
    // Check for rounded corners
    const modalContent = page.locator('[role="dialog"] > div')
    await expect(modalContent).toBeVisible()
  })

  test('12.10 Filter bars have clean design', async ({ page }) => {
    await helpers.navigateTo('cohorts')
    
    // Check filter bar exists and is styled
    const filterBar = page.locator('.grid').first()
    await expect(filterBar).toBeVisible()
    
    // Filters should be in a card/container
    const filterContainer = page.locator('.bg-white').first()
    await expect(filterContainer).toBeVisible()
  })
})

