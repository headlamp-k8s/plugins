# App Catalog E2E Tests

End-to-end tests for the Headlamp App Catalog plugin using Playwright.

## Prerequisites

1. **Headlamp Instance**: A running Headlamp instance with the app-catalog plugin enabled
2. **Kubernetes Cluster**: An accessible Kubernetes cluster
3. **Helm**: Helm must be installed and configured in the cluster
4. **Dependencies**: Install test dependencies with `npm install`

## Running Tests

### Local Development

```bash
# Run all E2E tests
npm run e2e

# Run tests in UI mode (interactive)
npm run e2e:ui

# Run specific test file
npx playwright test e2e/app-catalog.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Environment Variables

Set the Headlamp URL if not using the default:

```bash
# Windows
set HEADLAMP_URL=http://localhost:4466
npm run e2e

# Linux/Mac
HEADLAMP_URL=http://localhost:4466 npm run e2e
```

### CI/CD

Tests are configured to run in CI with:
- Automatic retries (2 attempts)
- Single worker for consistency
- HTML and list reporters
- Screenshot/video on failure

```bash
# Simulate CI environment
CI=true npm run e2e
```

## Test Structure

```
e2e/
├── app-catalog.spec.ts    # Main E2E test suite
├── playwright.config.ts    # Playwright configuration
└── README.md              # This file
```

## Test Coverage

The E2E tests cover:

### Chart Browsing
- Navigate to chart catalog
- Display chart list
- Search for charts
- Filter by verified publishers
- Pagination

### Chart Details
- View chart details
- Display chart versions
- Show install button
- View chart README

### Release Management
- Navigate to installed releases
- List releases
- Filter by namespace
- Search by name

### Release Actions
- Show actions menu
- Upgrade release
- Rollback release
- Delete release

### Error Handling
- Network errors
- Missing catalogs
- Invalid charts

## Writing New Tests

Follow these patterns:

```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/apps/catalog');
    
    // Act
    await page.click('button:has-text("Install")');
    
    // Assert
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid** attributes for stable selectors
2. **Wait for elements** before interacting
3. **Use semantic selectors** (role, text) over CSS
4. **Avoid hardcoded waits** (use waitForSelector instead)
5. **Clean up** after tests (close dialogs, reset state)
6. **Skip conditionally** when data isn't available

## Debugging

```bash
# Debug mode (pause on failure)
npx playwright test --debug

# Generate test code interactively
npx playwright codegen http://localhost:3000

# Show trace viewer for failed test
npx playwright show-report

# View specific trace file
npx playwright show-trace trace.zip
```

## Troubleshooting

### Tests timing out

- Increase timeout in test or config
- Check if Headlamp is accessible
- Verify cluster connectivity

### Elements not found

- Check if plugin is enabled in Headlamp
- Verify correct URL and routing
- Use Playwright Inspector to debug selectors

### Flaky tests

- Add proper wait conditions
- Avoid hardcoded timeouts
- Check for race conditions
- Use retry logic for network requests

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Headlamp Plugin Development](https://headlamp.dev/docs/latest/development/)
- [Best Practices](https://playwright.dev/docs/best-practices)
