# App Catalog Testing Guide

This document provides comprehensive information about testing the App Catalog plugin for Headlamp.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Testing Patterns](#testing-patterns)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

The App Catalog plugin uses a multi-layered testing approach:

1. **Unit Tests**: Test individual functions and utilities in isolation
2. **Component Tests**: Test React components with mocked dependencies
3. **Integration Tests**: Test API interactions and data flow
4. **E2E Tests**: Test complete user workflows in a real browser

### Tech Stack

- **Test Framework**: Vitest
- **Component Testing**: React Testing Library
- **E2E Testing**: Playwright
- **Coverage**: V8
- **Assertions**: expect (Vitest/Jest-compatible)

## Test Structure

```
app-catalog/
├── src/
│   ├── __tests__/
│   │   ├── setup.ts           # Global test setup
│   │   ├── testUtils.tsx      # Custom render utilities
│   │   └── mockData/          # Mock data for tests
│   │       ├── charts.ts
│   │       ├── releases.ts
│   │       ├── catalogs.ts
│   │       └── index.ts
│   ├── api/
│   │   ├── releases.ts
│   │   └── releases.test.ts   # API layer tests
│   ├── components/
│   │   └── releases/
│   │       ├── ReleaseActionsMenu.tsx
│   │       └── ReleaseActionsMenu.test.tsx
│   ├── helpers/
│   │   ├── catalog.ts
│   │   ├── catalog.test.ts
│   │   ├── index.ts
│   │   └── index.test.ts
│   └── ...
├── e2e/
│   ├── app-catalog.spec.ts    # E2E test suite
│   ├── playwright.config.ts   # Playwright config
│   └── README.md
├── vitest.config.ts           # Vitest configuration
└── TESTING.md                 # This file
```

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests once
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage

# UI mode (interactive)
npm run test:ui

# Run specific test file
npx vitest src/helpers/catalog.test.ts

# Run tests matching pattern
npx vitest --grep "should fetch"
```

### E2E Tests

```bash
# Run all E2E tests
npm run e2e

# UI mode (recommended for development)
npm run e2e:ui

# Specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug

# See full E2E documentation
cat e2e/README.md
```

## Writing Tests

### Unit Tests

Test pure functions and utilities in isolation:

```typescript
import { describe, expect, it } from 'vitest';
import { yamlToJSON, jsonToYAML } from './index';

describe('YAML Helpers', () => {
  it('should convert YAML to JSON', () => {
    const yaml = 'name: test\nversion: 1.0.0';
    const result = yamlToJSON(yaml);
    
    expect(result).toEqual({
      name: 'test',
      version: '1.0.0',
    });
  });
});
```

### Component Tests

Test React components with mocked dependencies:

```typescript
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../__tests__/testUtils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render and handle click', () => {
    const mockOnClick = vi.fn();
    
    renderWithProviders(<MyComponent onClick={mockOnClick} />);
    
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
```

### API Tests

Test API layer with mocked HTTP requests:

```typescript
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listReleases } from './releases';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: {
    request: vi.fn(),
  },
  getHeadlampAPIHeaders: vi.fn(() => ({})),
}));

describe('Releases API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch releases', async () => {
    const mockData = { releases: [] };
    vi.mocked(ApiProxy.request).mockResolvedValue(mockData);

    const result = await listReleases();

    expect(ApiProxy.request).toHaveBeenCalledWith(
      '/helm/releases/list',
      expect.objectContaining({ method: 'GET' })
    );
    expect(result).toEqual(mockData);
  });
});
```

### E2E Tests

Test complete user workflows:

```typescript
import { expect, test } from '@playwright/test';

test('should install a chart', async ({ page }) => {
  await page.goto('/apps/catalog');
  
  // Find and click first chart
  await page.locator('.MuiCard-root').first().click();
  
  // Click install button
  await page.click('button:has-text("Install")');
  
  // Fill in release name
  await page.fill('input[name="releaseName"]', 'my-release');
  
  // Submit
  await page.click('button:has-text("Install")');
  
  // Verify success
  await expect(page.locator('text=/successfully installed/i')).toBeVisible();
});
```

## Testing Patterns

### Mock Data

Use centralized mock data from `src/__tests__/mockData/`:

```typescript
import { mockRelease, mockChartList } from '../__tests__/mockData';

// Use in tests
expect(result).toEqual(mockRelease);
```

### Custom Render

Use `renderWithProviders` for components needing providers:

```typescript
import { renderWithProviders } from '../__tests__/testUtils';

// Wraps component with Router, SnackbarProvider, etc.
renderWithProviders(<MyComponent />, {
  route: '/apps/installed',
});
```

### Async Testing

Handle async operations properly:

```typescript
import { waitFor } from '@testing-library/react';

test('should fetch data', async () => {
  renderWithProviders(<MyComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### Mocking APIs

Mock external dependencies consistently:

```typescript
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { request: vi.fn() },
  useTranslation: () => ({ t: (key: string) => key }),
}));
```

### Testing User Interactions

Use user-event for realistic interactions:

```typescript
import userEvent from '@testing-library/user-event';

test('should handle form input', async () => {
  const user = userEvent.setup();
  renderWithProviders(<MyForm />);
  
  const input = screen.getByLabelText(/name/i);
  await user.type(input, 'test value');
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(input).toHaveValue('test value');
});
```

## Test Coverage Goals

Target coverage metrics:

- **Overall**: > 80%
- **Critical paths** (install, upgrade, delete): > 90%
- **Helper functions**: 100%
- **UI components**: > 75%

Check coverage:

```bash
npm run test:coverage
```

View HTML report:

```bash
# Report generated in coverage/index.html
open coverage/index.html
```

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Release tags

Configuration in `.github/workflows/`:

```yaml
- name: Run tests
  run: |
    npm install
    npm test
    npm run test:coverage

- name: Run E2E tests
  run: |
    npm run e2e
```

### Pre-commit Hook

Consider adding pre-commit hooks:

```bash
# .husky/pre-commit
npm test
npm run lint
npm run tsc
```

## Troubleshooting

### Tests Not Found

```bash
# Clear cache
npx vitest --clearCache

# Verify test pattern
npx vitest --reporter=verbose
```

### Mock Not Working

```bash
# Check mock path matches import
vi.mock('./exact/path/to/module')

# Use factory function for complex mocks
vi.mock('./module', () => ({
  default: vi.fn(),
  namedExport: vi.fn(),
}))
```

### Component Not Rendering

```bash
# Check for missing providers
renderWithProviders(<Component />)

# Add debug output
const { debug } = render(<Component />)
debug()
```

### E2E Timeouts

```bash
# Increase timeout
test.setTimeout(60000);

# Use proper waits
await page.waitForSelector('selector', { timeout: 10000 });
```

### Coverage Too Low

1. Identify uncovered lines:
   ```bash
   npm run test:coverage
   open coverage/index.html
   ```

2. Add tests for uncovered code
3. Focus on critical paths first
4. Consider excluding generated/config files

## Best Practices

1. **Write tests first** (TDD) for critical features
2. **One assertion per test** (when possible)
3. **Use descriptive test names** (should/when/given patterns)
4. **Clean up after tests** (clear mocks, reset state)
5. **Avoid testing implementation details**
6. **Test behavior, not structure**
7. **Keep tests focused and fast**
8. **Use data-testid** for stable selectors
9. **Mock external dependencies**
10. **Document complex test setups**

## Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Contributing

When adding new features:

1. Write tests for new functionality
2. Ensure existing tests pass
3. Maintain or improve coverage
4. Update this documentation if needed
5. Add E2E tests for user-facing features

## Questions?

- Check existing tests for examples
- Review this guide
- Ask in pull request reviews
- Consult team documentation
