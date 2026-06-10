# Tinkerbell Headlamp Plugin

This plugin adds read-only Tinkerbell views to Headlamp for bare metal provisioning resources.

## MVP Scope

The first milestone focuses on read-only views for the main Tinkerbell CRDs:

- Hardware
- Workflow
- Template

The plugin will provide sidebar navigation, list views, detail views, status display, raw YAML/spec sections, and relationship navigation between hardware, workflows, and templates.

Mutating actions such as retrying workflows or creating resources are intentionally out of scope for the initial MVP until the expected behavior is reviewed.

## Development

```bash
npm install
npm run start
```

## Verification

```bash
npm run tsc
npm run lint
npm run build
```
