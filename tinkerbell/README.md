# Tinkerbell Headlamp Plugin

This plugin adds read-only Tinkerbell views to Headlamp for bare metal provisioning resources.
The current implementation targets Tinkerbell v0.23.0.

## MVP Scope

The first milestone focuses on read-only views for Tinkerbell v0.23.0 CRDs:

- Hardware
- Template
- Workflow
- WorkflowRuleSet
- BMC Machine
- BMC Job
- BMC Task

The plugin will provide sidebar navigation, list views, detail views, status display, raw YAML/spec sections, and relationship navigation between hardware, workflows, templates, and BMC resources.

Mutating actions such as retrying workflows or creating resources are intentionally out of scope for the initial MVP until the expected behavior is reviewed.

## Tinkerbell References

- [Tinkerbell documentation](https://tinkerbell.org/docs/)
- [Tinkerbell getting started guide](https://tinkerbell.org/docs/v0.22/setup/getting_started)
- [Tinkerbell installation guide](https://tinkerbell.org/docs/v0.22/setup/install)
- [Tinkerbell v0.23.0 release](https://github.com/tinkerbell/tinkerbell/releases/tag/v0.23.0)
- [Tinkerbell v0.23.0 CRDs](https://github.com/tinkerbell/tinkerbell/tree/v0.23.0/crd/bases)

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
