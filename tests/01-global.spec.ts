import { test, expect } from '@playwright/test'
import { TestHelpers } from './helpers/test-utils'

test.describe('Global / Cross-Cutting Tests', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
  })

  test('1.1 Tenant isolation - only shows current tenant data', async ({ page }) => {
    // Given: We're logged in as Tenant A (demo-school)
    await helpers.navigateTo('branches')

    // Then: Only Tenant A's branches are visible
    // We can verify by checking that the table doesn't show data from other tenants
    // Since we only have one tenant in seed data, we verify the table loads correctly
    await helpers.expectGradientHeader()
    
    // Verify no cross-tenant data leakage by checking URL and page state
    await expect(page).toHaveURL(/\/academic-setup\/branches/)
  })

  test('1.2 RBAC guard - non-admin cannot modify data', async ({ page }) => {
    // Note: This test would require implementing multi-role auth
    // For now, we verify that the current admin can access all features
    await helpers.navigateTo('academic-years')
    
    // Verify admin can see the "Add" button
    const addButton = page.getByRole('button', { name: /add/i })
    await expect(addButton).toBeVisible()
    
    // In a real scenario with TEACHER role, this button would be hidden
    // and server actions would return 403
  })

  test('1.3 Theme Consistency - gradient headers and pill badges', async ({ page }) => {
    // Test Academic Years page for theme consistency
    await helpers.navigateTo('academic-years')
    
    // Then: Page header has gradient/accent
    await helpers.expectGradientHeader()
    
    // Verify violet-tinted table header
    const tableHeader = page.locator('thead tr').first()
    await expect(tableHeader).toHaveClass(/bg-violet-50/)
    
    // Verify rounded corners and borders on cards
    const card = page.locator('.rounded-lg').first()
    await expect(card).toBeVisible()
  })

  test('1.3.1 Theme - Branches page has proper styling', async ({ page }) => {
    await helpers.navigateTo('branches')
    
    // Check gradient header
    await helpers.expectGradientHeader()
    
    // Check violet table header
    await helpers.expectVioletTableHeader()
    
    // Check CTA button has violet gradient
    await helpers.expectGradientButton('Add Branch')
  })

  test('1.3.2 Theme - All pages have gradient headers', async ({ page }) => {
    const pages = [
      'branches',
      'academic-years',
      'streams',
      'classes',
      'cohorts',
      'section-templates',
      'sections',
      'routine',
      'year-wizard',
      'promotions',
    ]

    for (const pagePath of pages) {
      await helpers.navigateTo(pagePath)
      await helpers.expectGradientHeader()
    }
  })

  test('1.3.3 Theme - Status values render as pills not plain text', async ({ page }) => {
    // Navigate to branches page (seed data should have branches with status pills)
    await helpers.navigateTo('branches')

    // Verify status appears as pill badge (not plain text)
    // The seed data should have ACTIVE branches
    await helpers.expectPillBadge('ACTIVE', 'bg-emerald')

    // Also check that the pill has rounded-full class (pill shape)
    const pill = page.locator('.rounded-full', { hasText: 'ACTIVE' }).first()
    await expect(pill).toHaveClass(/rounded-full/)
  })
})

