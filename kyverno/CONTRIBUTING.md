# Contributing to Kyverno Headlamp Plugin

Thank you for your interest in contributing to the Kyverno Headlamp Plugin!

## Getting Started

1. Fork the [plugins repository](https://github.com/headlamp-k8s/plugins)
2. Clone your fork locally
3. Navigate to the Kyverno plugin:
   ```bash
   cd plugins/kyverno
   npm install
   ```
4. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feat/my-feature
   ```

## Development Workflow

1. Make your changes in `src/`
2. Format your code:
   ```bash
   npm run format
   ```
3. Run the linter:
   ```bash
   npm run lint
   ```
4. Type-check:
   ```bash
   npm run tsc
   ```
5. Build the plugin:
   ```bash
   npm run build
   ```
6. Test your changes locally (see [STORYBOOK_AND_LOCAL_TESTING.md](STORYBOOK_AND_LOCAL_TESTING.md))

## Code Style

- Use **TypeScript** for all new code
- Use **functional React components** with hooks — no class components
- For new list views that need Storybook support, export a `Pure*` component variant that accepts props directly (no API hooks inside)
- Keep components focused and single-purpose
- Add i18n via `useTranslation()` — all user-visible strings must use `t('...')`
- Follow existing patterns in `src/components/` for new resource views

## Commit Messages

Follow the Headlamp convention:
```
kyverno: <area>: <description of what changed and why>
```

Examples:
- `kyverno: PolicyList: add clickable name with Activity panel`
- `kyverno: ViolationsView: restore scope tracking for ClusterPolicyReports`

## Pull Requests

1. Ensure all lint and type checks pass (`npm run lint && npm run tsc`)
2. Build successfully (`npm run build`)
3. Update documentation if you added/changed features
4. Describe your changes clearly in the PR description
5. Link related issues with `Fixes #<issue_number>`
6. Include screenshots or a short video for UI changes

## Adding New Resource Support

1. Define the CRD class in `src/resources/` following existing examples (e.g. `kyvernoPolicy.ts`)
2. Create a list component in `src/components/` with a `Pure*` variant for Storybook
3. Add a `.stories.tsx` file alongside the component
4. Register the route in `src/index.tsx`

## Questions?

Feel free to open an issue for any questions or discussions about the plugin.
