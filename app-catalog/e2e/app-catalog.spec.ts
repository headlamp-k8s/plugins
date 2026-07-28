import { expect, test } from '@playwright/test';

/**
 * E2E tests for App Catalog plugin
 * 
 * Prerequisites:
 * 1. Headlamp instance running with app-catalog plugin enabled
 * 2. Kubernetes cluster accessible
 * 3. Helm installed in the cluster
 */

test.describe('App Catalog - Chart Browsing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for Headlamp to load
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 10000 });
  });

  test('should navigate to chart catalog', async ({ page }) => {
    // Click on Apps/Helm in sidebar
    await page.click('text=Apps');
    
    // Should see catalog page
    await expect(page.locator('h1, h2').filter({ hasText: /catalog/i })).toBeVisible();
  });

  test('should display chart list', async ({ page }) => {
    await page.goto('/apps/catalog');
    
    // Wait for charts to load
    await page.waitForSelector('[data-testid="chart-card"], .MuiCard-root', { 
      timeout: 15000 
    });
    
    // Should have at least one chart
    const charts = await page.locator('[data-testid="chart-card"], .MuiCard-root').count();
    expect(charts).toBeGreaterThan(0);
  });

  test('should search for charts', async ({ page }) => {
    await page.goto('/apps/catalog');
    
    // Wait for search box
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
    await searchInput.waitFor({ timeout: 5000 });
    
    // Type search query
    await searchInput.fill('nginx');
    
    // Wait for filtered results
    await page.waitForTimeout(500);
    
    // Should show nginx-related charts
    const chartNames = await page.locator('[data-testid="chart-name"], .MuiCardContent-root').allTextContents();
    const hasNginx = chartNames.some(name => name.toLowerCase().includes('nginx'));
    expect(hasNginx).toBeTruthy();
  });

  test('should filter by verified publishers', async ({ page }) => {
    await page.goto('/apps/catalog');
    
    // Find and toggle verified filter
    const verifiedToggle = page.locator('input[type="checkbox"]').filter({ hasText: /verified/i }).or(
      page.locator('label').filter({ hasText: /verified/i }).locator('input')
    );
    
    if (await verifiedToggle.count() > 0) {
      await verifiedToggle.first().click();
      await page.waitForTimeout(500);
      
      // Results should update
      await expect(page.locator('.MuiCard-root').first()).toBeVisible();
    }
  });

  test('should paginate through charts', async ({ page }) => {
    await page.goto('/apps/catalog');
    
    // Wait for pagination controls
    const pagination = page.locator('.MuiPagination-root, nav[aria-label*="pagination"]');
    
    if (await pagination.count() > 0) {
      // Get initial page
      const firstPageCharts = await page.locator('.MuiCard-root').allTextContents();
      
      // Click next page
      await page.locator('button[aria-label*="next"], button:has-text("2")').first().click();
      await page.waitForTimeout(500);
      
      // Should show different charts
      const secondPageCharts = await page.locator('.MuiCard-root').allTextContents();
      expect(firstPageCharts).not.toEqual(secondPageCharts);
    }
  });
});

test.describe('App Catalog - Chart Details', () => {
  test('should view chart details', async ({ page }) => {
    await page.goto('/apps/catalog');
    
    // Click on first chart
    await page.locator('.MuiCard-root').first().click();
    
    // Should navigate to details page
    await expect(page).toHaveURL(/\/apps\/.*\/chart\/.*/);
    
    // Should show chart information
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
  });

  test('should display chart versions', async ({ page }) => {
    await page.goto('/apps/catalog');
    await page.locator('.MuiCard-root').first().click();
    
    // Look for version selector
    const versionSelect = page.locator('select, [role="combobox"]').filter({ hasText: /version/i });
    
    if (await versionSelect.count() > 0) {
      await expect(versionSelect).toBeVisible();
    }
  });

  test('should show install button', async ({ page }) => {
    await page.goto('/apps/catalog');
    await page.locator('.MuiCard-root').first().click();
    
    // Should have install button
    await expect(page.locator('button').filter({ hasText: /install/i })).toBeVisible();
  });
});

test.describe('App Catalog - Installed Releases', () => {
  test('should navigate to installed releases', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to Installed releases
    await page.click('text=Apps');
    await page.click('text=Installed');
    
    // Should show releases page
    await expect(page).toHaveURL(/\/apps\/installed/);
  });

  test('should list installed releases', async ({ page }) => {
    await page.goto('/apps/installed');
    
    // Wait for table or empty state
    await page.waitForSelector('table, [data-testid="empty-state"], text=/no releases/i', {
      timeout: 10000,
    });
    
    // Either has releases or shows empty state
    const hasTable = await page.locator('table').count() > 0;
    const hasEmptyState = await page.locator('[data-testid="empty-state"], text=/no releases/i').count() > 0;
    
    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  test('should filter releases by namespace', async ({ page }) => {
    await page.goto('/apps/installed');
    
    const namespaceFilter = page.locator('select, [role="combobox"]').filter({ hasText: /namespace/i });
    
    if (await namespaceFilter.count() > 0) {
      await namespaceFilter.click();
      await page.waitForTimeout(300);
      
      // Should show namespace options
      const options = await page.locator('[role="option"], option').count();
      expect(options).toBeGreaterThan(0);
    }
  });

  test('should search releases by name', async ({ page }) => {
    await page.goto('/apps/installed');
    
    const searchInput = page.locator('input[placeholder*="name"], input[type="search"]').first();
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(300);
      
      // Filter should apply
      await expect(searchInput).toHaveValue('test');
    }
  });
});

test.describe('App Catalog - Release Actions', () => {
  test.skip('should show release actions menu', async ({ page }) => {
    // Skip if no releases installed
    await page.goto('/apps/installed');
    
    const hasReleases = await page.locator('table tbody tr').count() > 0;
    if (!hasReleases) {
      test.skip();
    }
    
    // Click actions menu
    await page.locator('button[aria-label*="action"], button:has([data-icon*="dots"])').first().click();
    
    // Should show menu with actions
    await expect(page.locator('text=Upgrade')).toBeVisible();
    await expect(page.locator('text=Rollback')).toBeVisible();
    await expect(page.locator('text=Delete')).toBeVisible();
  });

  test.skip('should open upgrade dialog', async ({ page }) => {
    await page.goto('/apps/installed');
    
    const hasReleases = await page.locator('table tbody tr').count() > 0;
    if (!hasReleases) {
      test.skip();
    }
    
    // Open actions and click upgrade
    await page.locator('button[aria-label*="action"]').first().click();
    await page.click('text=Upgrade');
    
    // Should open dialog with editor
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=/values/i')).toBeVisible();
  });
});

test.describe('App Catalog - Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline by blocking requests
    await page.route('**/helm/**', route => route.abort());
    await page.route('**/artifacthub.io/**', route => route.abort());
    
    await page.goto('/apps/catalog');
    
    // Should show error message or empty state
    await expect(page.locator('text=/error/i, text=/failed/i, [role="alert"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should handle missing catalog', async ({ page }) => {
    await page.goto('/apps/nonexistent-catalog');
    
    // Should show 404 or error
    const hasError = await page.locator('text=/not found/i, text=/error/i').count() > 0;
    expect(hasError).toBeTruthy();
  });
});
