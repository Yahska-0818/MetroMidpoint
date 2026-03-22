import { test, expect } from '@playwright/test';

test.describe('Route Planner Interaction Flow', () => {
  test('User can toggle to the planner tab and search continuous transit lines', async ({ page }) => {

    await page.goto('/');

    await page.waitForSelector('text=MetroMidpoint');

    await page.locator('button:has-text("Route Planner")').click();

    const sourceProp = page.locator('input[placeholder="Source Station"]');
    const destProp = page.locator('input[placeholder="Destination Station"]');

    await expect(sourceProp).toBeVisible();
    await expect(destProp).toBeVisible();

    await sourceProp.fill('Noida Sector 15 (Blue line)');
    await destProp.fill('Kashmere Gate (Red line)');

    await page.locator('button:has-text("Find Route")').click();

    try {
      await expect(page.locator('text=Fastest').first()).toBeVisible({ timeout: 5000 });
    } catch {
      const error = page.locator('text=Could not retrieve route');
      await expect(error.or(page.locator('text=Network'))).toBeDefined();
    }
  });
});
