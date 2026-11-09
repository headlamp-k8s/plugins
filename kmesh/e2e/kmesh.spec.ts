import { expect, test } from '@playwright/test';

test.describe.serial('Kmesh plugin on KWOK', () => {
  test('covers the main Kmesh scenarios', async ({ page }) => {
    await page.goto('/c/main/nodes');

    const tokenLogin = page.getByRole('button', { name: 'Use A Token' });
    if (await tokenLogin.isVisible()) {
      const token = process.env.HEADLAMP_TOKEN;
      expect(
        token,
        'HEADLAMP_TOKEN must be set when Headlamp requires authentication'
      ).toBeTruthy();
      await tokenLogin.click();
      await page.getByRole('textbox', { name: 'ID token' }).fill(token!);
      await page.getByRole('button', { name: 'Authenticate' }).click();
    }

    await expect(page.getByText('kwok-worker', { exact: true })).toBeVisible();

    // Sidebar entry is registered and navigates to the Waypoints list.
    await page.getByRole('link', { name: 'KMesh' }).click();
    await expect(page).toHaveURL(/\/kmesh\/waypoints$/);

    // The fixture Gateway (gatewayClassName: kmesh-waypoint) shows up as a Waypoint.
    await expect(page.getByText('demo-waypoint')).toBeVisible();

    // Drilling into the Waypoint detail page shows its Programmed condition.
    await page.getByText('demo-waypoint').click();
    await expect(page.getByText('Programmed', { exact: true }).first()).toBeVisible();

    // Node Security list detects the SPI mismatch between the two fixture nodes.
    await page.goto('/kmesh/node-security');
    await expect(page.getByText('kwok-worker', { exact: true })).toBeVisible();
    await expect(page.getByText('kwok-worker-stale', { exact: true })).toBeVisible();
    await expect(page.getByText('SPI Mismatch Detected')).toBeVisible();
  });
});
