import { Page, expect } from '@playwright/test'

/**
 * Test utilities for Academic Setup E2E tests
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to a specific academic setup page
   */
  async navigateTo(path: string) {
    await this.page.goto(`/academic-setup/${path}`)
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Check if a success toast appears with specific message
   */
  async expectSuccessToast(message: string) {
    const toast = this.page.locator('[data-sonner-toast]', { hasText: message })
    await expect(toast).toBeVisible({ timeout: 5000 })
  }

  /**
   * Check if an error toast appears with specific message
   */
  async expectErrorToast(message: string) {
    const toast = this.page.locator('[data-sonner-toast]', { hasText: message })
    await expect(toast).toBeVisible({ timeout: 5000 })
  }

  /**
   * Check if a pill badge exists with specific text and color class
   */
  async expectPillBadge(text: string, colorClass?: string) {
    const badge = this.page.locator('.rounded-full', { hasText: text }).first()
    await expect(badge).toBeVisible()

    if (colorClass) {
      await expect(badge).toHaveClass(new RegExp(colorClass))
    }
  }

  /**
   * Check if gradient header exists on page
   */
  async expectGradientHeader() {
    const header = this.page.locator('.bg-gradient-to-r').first()
    await expect(header).toBeVisible()
  }

  /**
   * Check if table header has violet tint
   */
  async expectVioletTableHeader() {
    const tableHeader = this.page.locator('thead tr').first()
    await expect(tableHeader).toHaveClass(/bg-violet-50/)
  }

  /**
   * Click "Add" or "Create" button to open modal
   */
  async clickAddButton(buttonText: string = 'Add') {
    const button = this.page.getByRole('button', { name: new RegExp(buttonText, 'i') })
    await button.click()
    await this.page.waitForTimeout(300) // Wait for modal animation
  }

  /**
   * Fill input field by label
   */
  async fillInput(label: string, value: string) {
    const input = this.page.getByLabel(label, { exact: false })
    await input.fill(value)
  }

  /**
   * Select option from dropdown by label
   */
  async selectOption(label: string, option: string) {
    // Try to find by label first
    let select = this.page.getByLabel(label, { exact: false })
    const count = await select.count()

    // If not found by label, try to find the select trigger near the label text
    if (count === 0) {
      const labelElement = this.page.locator('label', { hasText: label })
      const parent = labelElement.locator('..')
      select = parent.locator('[role="combobox"]')
    }

    await select.click()
    // Use .first() to handle cases where multiple options with same name exist
    await this.page.getByRole('option', { name: option }).first().click()
  }

  /**
   * Submit form (click Create/Update button in modal)
   */
  async submitForm(buttonText: string = 'Create') {
    const button = this.page.getByRole('button', { name: buttonText, exact: true })
    await button.click()
  }

  /**
   * Check if a row exists in table with specific text
   */
  async expectTableRow(text: string) {
    const row = this.page.locator('tbody tr', { hasText: text })
    await expect(row).toBeVisible()
  }

  /**
   * Check if table row does NOT exist
   */
  async expectNoTableRow(text: string) {
    const row = this.page.locator('tbody tr', { hasText: text })
    await expect(row).not.toBeVisible()
  }

  /**
   * Click delete button for a specific row
   */
  async deleteRow(rowText: string) {
    const row = this.page.locator('tbody tr', { hasText: rowText })
    const deleteButton = row.getByRole('button').filter({ has: this.page.locator('svg') }).last()
    await deleteButton.click()
  }

  /**
   * Click edit button for a specific row
   */
  async editRow(rowText: string) {
    const row = this.page.locator('tbody tr', { hasText: rowText })
    const editButton = row.getByRole('button').filter({ has: this.page.locator('svg') }).first()
    await editButton.click()
    await this.page.waitForTimeout(300)
  }

  /**
   * Confirm browser dialog (for delete confirmations)
   */
  async confirmDialog() {
    this.page.once('dialog', dialog => dialog.accept())
  }

  /**
   * Dismiss browser dialog
   */
  async dismissDialog() {
    this.page.once('dialog', dialog => dialog.dismiss())
  }

  /**
   * Check if lock icon exists (for delete guards)
   */
  async expectLockIcon() {
    const lockIcon = this.page.locator('svg').filter({ hasText: /lock/i })
    await expect(lockIcon).toBeVisible()
  }

  /**
   * Wait for network to be idle
   */
  async waitForNetwork() {
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Check if element has specific CSS class
   */
  async expectElementClass(selector: string, className: string) {
    const element = this.page.locator(selector)
    await expect(element).toHaveClass(new RegExp(className))
  }

  /**
   * Get count of table rows
   */
  async getTableRowCount(): Promise<number> {
    return await this.page.locator('tbody tr').count()
  }

  /**
   * Check if inline validation error exists
   */
  async expectValidationError(message: string) {
    const error = this.page.locator('text=' + message)
    await expect(error).toBeVisible()
  }

  /**
   * Check if CTA button has gradient
   */
  async expectGradientButton(buttonText: string) {
    const button = this.page.getByRole('button', { name: new RegExp(buttonText, 'i') })
    await expect(button).toHaveClass(/bg-violet-600/)
  }

  /**
   * Toggle a switch in a table row
   */
  async toggleSwitch(rowText: string) {
    const row = this.page.locator('tbody tr', { hasText: rowText })
    const switchButton = row.locator('button[role="switch"]')
    await switchButton.click()
  }

  /**
   * Select filter option
   */
  async selectFilter(filterLabel: string, option: string) {
    const filter = this.page.locator('label', { hasText: filterLabel }).locator('..')
    const select = filter.locator('button[role="combobox"]')
    await select.click()
    await this.page.getByRole('option', { name: option }).click()
  }

  /**
   * Check if specific status pill exists in row
   */
  async expectStatusPillInRow(rowText: string, statusText: string, colorClass?: string) {
    const row = this.page.locator('tbody tr', { hasText: rowText })
    const badge = row.locator('.rounded-full', { hasText: statusText })
    await expect(badge).toBeVisible()
    
    if (colorClass) {
      await expect(badge).toHaveClass(new RegExp(colorClass))
    }
  }

  /**
   * Check if modal/dialog is open
   */
  async expectModalOpen(title: string) {
    const modal = this.page.locator('[role="dialog"]', { hasText: title })
    await expect(modal).toBeVisible()
  }

  /**
   * Close modal
   */
  async closeModal() {
    const cancelButton = this.page.getByRole('button', { name: 'Cancel' })
    await cancelButton.click()
  }

  /**
   * Check if empty state message exists
   */
  async expectEmptyState(message: string) {
    const emptyState = this.page.locator('text=' + message)
    await expect(emptyState).toBeVisible()
  }

  /**
   * Multi-select classes (for Year Wizard)
   */
  async selectClasses(classNames: string[]) {
    for (const className of classNames) {
      const classButton = this.page.locator('button', { hasText: className })
      await classButton.click()
    }
  }

  /**
   * Check if preview table shows specific cohort
   */
  async expectPreviewRow(cohortName: string, status: 'Will Create' | 'Already Exists') {
    const row = this.page.locator('tbody tr', { hasText: cohortName })
    await expect(row).toBeVisible()
    
    const statusBadge = row.locator('.rounded-full', { hasText: status })
    await expect(statusBadge).toBeVisible()
  }
}

/**
 * Database helpers for test setup/teardown
 */
export class DatabaseHelpers {
  /**
   * Clean up test data (call in afterEach)
   */
  static async cleanup() {
    // This would connect to Prisma and clean up test data
    // For now, we rely on the seed data being consistent
  }

  /**
   * Create test tenant
   */
  static async createTestTenant(name: string) {
    // Would create a test tenant via Prisma
  }

  /**
   * Create test data for specific scenarios
   */
  static async seedTestData(scenario: string) {
    // Would seed specific test data
  }
}

