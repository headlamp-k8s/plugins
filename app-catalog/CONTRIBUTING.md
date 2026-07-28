# Contributing to App Catalog Plugin

Thank you for your interest in contributing to the Headlamp App Catalog plugin! This document provides guidelines and instructions for contributors.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Code Style](#code-style)
- [Commit Messages](#commit-messages)

## Getting Started

### Prerequisites

- Node.js 22.x or later
- npm or yarn
- Access to a Kubernetes cluster (for local testing)
- Headlamp installed and running

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/plugins.git
   cd plugins/app-catalog
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/headlamp-k8s/plugins.git
   ```

## Development Setup

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm start
```

This will:
- Build the plugin in watch mode
- Hot reload on file changes
- Connect to your running Headlamp instance

### Enable Plugin in Headlamp

1. Open Headlamp
2. Navigate to Settings → Plugins
3. Enable the App Catalog plugin
4. Refresh the page

## Making Changes

### Branch Naming

Create a feature branch from `main`:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Use prefixes:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation only
- `refactor/` - Code refactoring
- `test/` - Adding tests

### Code Organization

```
app-catalog/
├── src/
│   ├── api/           # API layer (Helm, Charts, Releases)
│   ├── components/    # React components
│   ├── helpers/       # Utility functions
│   ├── constants/     # Constants and config
│   └── __tests__/     # Test setup and mock data
├── locales/           # Translations (i18n)
└── e2e/              # End-to-end tests
```

### Development Workflow

1. **Create a feature branch**
2. **Write failing tests** (TDD approach)
3. **Implement the feature**
4. **Make tests pass**
5. **Refactor if needed**
6. **Update documentation**
7. **Submit pull request**

## Testing

**All contributions must include tests!**

### Run Tests

```bash
# Unit and integration tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# E2E tests
npm run e2e
```

### Writing Tests

See [TESTING.md](./TESTING.md) for comprehensive testing guide.

Quick example:

```typescript
import { describe, expect, it, vi } from 'vitest';

describe('MyFeature', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Test Coverage Requirements

- **Minimum**: 80% overall coverage
- **Critical paths**: 90% coverage
- **New features**: Must include tests

Check coverage:

```bash
npm run test:coverage
open coverage/index.html
```

## Submitting Changes

### Before Submitting

Run these commands to verify your changes:

```bash
# Format code
npm run format

# Lint
npm run lint

# Type check
npm run tsc

# Run tests
npm test

# Run E2E (if applicable)
npm run e2e
```

Or run all checks:

```bash
npm run check
```

### Pull Request Process

1. **Update your fork**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your changes**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request** on GitHub

4. **Fill out PR template**:
   - Description of changes
   - Motivation and context
   - Type of change (bugfix, feature, etc.)
   - Testing done
   - Screenshots (if UI changes)
   - Related issues

5. **Address review feedback**

### PR Title Format

```
type(scope): brief description

Examples:
feat(releases): add bulk delete functionality
fix(charts): correct version sorting
docs(readme): update installation steps
test(api): add tests for release API
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Code Style

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow existing code style
- Use functional components and hooks
- Prefer const over let
- Use meaningful variable names

### React Components

```typescript
// Good
export function ReleaseList() {
  const [releases, setReleases] = useState<Release[]>([]);
  
  useEffect(() => {
    fetchReleases().then(setReleases);
  }, []);
  
  return <div>{/* component JSX */}</div>;
}

// Bad
export const ReleaseList = () => {
  var releases = useState([])[0]; // Use const, add types
  // Missing dependency array in useEffect
  useEffect(() => {
    fetchReleases().then(data => setReleases(data));
  });
  
  return <div></div>;
}
```

### File Naming

- Components: PascalCase (e.g., `ReleaseList.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Tests: Match source file (e.g., `ReleaseList.test.tsx`)
- Constants: UPPER_SNAKE_CASE in file

### Imports

Order imports:

```typescript
// 1. External packages
import React from 'react';
import { Button } from '@mui/material';

// 2. Internal absolute imports
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

// 3. Relative imports
import { formatDate } from '../../helpers';
import { mockRelease } from '../__tests__/mockData';
```

## Commit Messages

### Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Examples

```
feat(releases): add filtering by namespace

Allow users to filter releases by selecting a namespace
from a dropdown menu.

Closes #123
```

```
fix(charts): handle empty chart list

Previously crashed when no charts were available.
Now shows empty state message.
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, missing semicolons)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Best Practices

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Limit first line to 72 characters
- Reference issues and PRs

## Internationalization (i18n)

The plugin supports multiple languages.

### Adding Translations

1. Add English text first in `locales/en/translation.json`
2. Run translation generation:
   ```bash
   npm run i18n
   ```
3. Update translations in other language files

### Using Translations

```typescript
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';

function MyComponent() {
  const { t } = useTranslation();
  
  return <div>{t('key.path')}</div>;
}
```

## Documentation

### Update Documentation

When making changes that affect:
- **User features**: Update `README.md`
- **Testing**: Update `TESTING.md`
- **Development**: Update this file
- **API changes**: Add inline documentation

### Inline Documentation

```typescript
/**
 * Fetches the list of installed Helm releases.
 * 
 * @returns Promise resolving to releases response
 * @throws {Error} When API request fails
 * 
 * @example
 * const releases = await listReleases();
 * console.log(releases.releases);
 */
export function listReleases(): Promise<ReleasesResponse> {
  return request('/helm/releases/list', {
    method: 'GET',
    headers: getHeadlampAPIHeaders(),
  });
}
```

## Questions or Issues?

- Check existing issues and PRs
- Read documentation thoroughly
- Ask in PR comments
- Join Headlamp community channels

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (Apache 2.0).

## Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort!
