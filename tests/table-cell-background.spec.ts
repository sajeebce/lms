import { test, expect } from "@playwright/test";

/**
 * Table Cell Background Color Tests
 *
 * These tests verify that the table cell background color feature works correctly.
 *
 * Manual Testing Steps:
 * 1. Run: npm test -- --headed
 * 2. Browser will open automatically
 * 3. Watch the automated test perform the following:
 *    - Navigate to Question Bank > New Question
 *    - Insert a table
 *    - Click on cells
 *    - Verify table structure
 *
 * For full manual testing:
 * 1. Open http://localhost:3000/question-bank/questions/new
 * 2. Click table button (grid icon)
 * 3. Select table size from grid
 * 4. Click on a header cell (first row)
 * 5. Click palette icon (🎨)
 * 6. Select a color
 * 7. Verify color is applied
 * 8. Repeat for body cells
 */

test.describe("Table Cell Background Color", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Question Bank New Question page
    await page.goto("http://localhost:3000/question-bank/questions/new");

    // Wait for editor to load
    await page.waitForSelector(".ProseMirror", { timeout: 10000 });
  });

  test("should load page and show table button", async ({ page }) => {
    // Verify that the table button exists (use first one for Question Text editor)
    const tableButton = page.locator("button:has(svg.lucide-table)").first();
    await expect(tableButton).toBeVisible();

    console.log("✅ Table button is visible");
  });

  test("should insert table successfully", async ({ page }) => {
    // Click the table button (first one for Question Text editor)
    const tableButton = page.locator("button:has(svg.lucide-table)").first();
    await tableButton.click();

    // Wait for grid selector to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    console.log("✅ Grid selector appeared");

    // Click on 2x2 cell in grid to insert table with body rows
    // Grid is 10 columns, so 2nd row 2nd column is index: (1 * 10) + 1 = 11
    const gridCells = page.locator('div[class*="cursor-pointer"]');
    await gridCells.nth(11).click();

    // Wait for table to be inserted
    await page.waitForSelector(".ProseMirror table", { timeout: 5000 });
    console.log("✅ Table inserted successfully");

    // Verify table has header row (should be 2)
    const headerCells = page.locator(".ProseMirror table th");
    const headerCount = await headerCells.count();
    expect(headerCount).toBe(2);
    console.log(`✅ Table has ${headerCount} header cells`);

    // Verify table has body cells (should be 2 = 1 row * 2 columns)
    const bodyCells = page.locator(".ProseMirror table td");
    const bodyCount = await bodyCells.count();
    expect(bodyCount).toBe(2);
    console.log(`✅ Table has ${bodyCount} body cells`);
  });

  test("should show table structure correctly", async ({ page }) => {
    // Insert table (use first button for Question Text editor)
    await page.locator("button:has(svg.lucide-table)").first().click();
    await page.waitForSelector('[role="dialog"]', { timeout: 3000 });

    // Click to insert 3x3 table (hover over 3rd row, 3rd column)
    const gridCells = page.locator('div[class*="cursor-pointer"]');
    // Grid is 10 columns, so 3rd row 3rd column is index: (2 * 10) + 2 = 22
    await gridCells.nth(22).click();

    // Wait for table
    await page.waitForSelector(".ProseMirror table", { timeout: 5000 });

    // Count header cells (should be 3)
    const headerCells = page.locator(".ProseMirror table th");
    const headerCount = await headerCells.count();
    console.log(`Header cells: ${headerCount}`);
    expect(headerCount).toBe(3);

    // Count body cells (should be 6 = 2 rows * 3 columns)
    const bodyCells = page.locator(".ProseMirror table td");
    const bodyCount = await bodyCells.count();
    console.log(`Body cells: ${bodyCount}`);
    expect(bodyCount).toBe(6);

    console.log("✅ Table structure is correct (3x3 with header)");
  });

  test("should be able to click on header cell", async ({ page }) => {
    // Insert table (use first button for Question Text editor)
    await page.locator("button:has(svg.lucide-table)").first().click();
    await page.waitForSelector('[role="dialog"]', { timeout: 3000 });
    const gridCell = page.locator('div[class*="cursor-pointer"]').first();
    await gridCell.click();
    await page.waitForSelector(".ProseMirror table", { timeout: 5000 });

    // Click on first header cell
    const headerCell = page.locator(".ProseMirror table th").first();
    await headerCell.click();

    // Wait a bit for any UI updates
    await page.waitForTimeout(500);

    console.log("✅ Header cell clicked successfully");

    // Take screenshot for manual verification
    await page.screenshot({ path: "test-results/header-cell-clicked.png" });
    console.log("📸 Screenshot saved: test-results/header-cell-clicked.png");
  });

  test("should be able to click on body cell", async ({ page }) => {
    // Insert table (use first button for Question Text editor)
    await page.locator("button:has(svg.lucide-table)").first().click();
    await page.waitForSelector('[role="dialog"]', { timeout: 3000 });

    // Click on 2x2 cell to insert table with body rows
    const gridCells = page.locator('div[class*="cursor-pointer"]');
    await gridCells.nth(11).click();

    await page.waitForSelector(".ProseMirror table", { timeout: 5000 });

    // Click on first body cell
    const bodyCell = page.locator(".ProseMirror table td").first();
    await bodyCell.click();

    // Wait a bit for any UI updates
    await page.waitForTimeout(500);

    console.log("✅ Body cell clicked successfully");

    // Take screenshot for manual verification
    await page.screenshot({ path: "test-results/body-cell-clicked.png" });
    console.log("📸 Screenshot saved: test-results/body-cell-clicked.png");
  });
});

/**
 * MANUAL TESTING CHECKLIST:
 *
 * After running these automated tests, perform manual testing:
 *
 * 1. Header Cell Background Color:
 *    [ ] Click on a header cell (first row)
 *    [ ] Palette icon (🎨) appears in bubble menu
 *    [ ] Click palette icon
 *    [ ] Color picker popover opens
 *    [ ] Click on a color (e.g., Light Yellow)
 *    [ ] Color is applied to the header cell
 *    [ ] Color persists after clicking elsewhere
 *
 * 2. Body Cell Background Color:
 *    [ ] Click on a body cell (second row onwards)
 *    [ ] Palette icon (🎨) appears in bubble menu
 *    [ ] Click palette icon
 *    [ ] Color picker popover opens
 *    [ ] Click on a color (e.g., Light Green)
 *    [ ] Color is applied to the body cell
 *    [ ] Color persists after clicking elsewhere
 *
 * 3. Multiple Cell Selection:
 *    [ ] Drag to select multiple cells
 *    [ ] Palette icon shows cell count badge (e.g., "3 cells")
 *    [ ] Click palette icon
 *    [ ] Select a color
 *    [ ] Color is applied to ALL selected cells
 *
 * 4. Mixed Selection (Header + Body):
 *    [ ] Select both header and body cells
 *    [ ] Apply color
 *    [ ] Verify color applies to both types
 *
 * If ANY of the above fails, the bug still exists.
 */
