# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025

Initial release.

### Features

- **Kyverno Dashboard**: Overview of cluster policy compliance and active violations
- **Violations View**: Aggregated view of all policy violations with filtering by status, grouping by policy/namespace/kind
- **ClusterPolicy & Policy**: List views with rule counts, action types, ready status, and live violation counts
- **CEL Policies**: Support for `ValidatingPolicy`, `MutatingPolicy`, `GeneratingPolicy`, and `DeletingPolicy` with detail viewers
- **PolicyReport & ClusterPolicyReport**: Summary tables showing pass/fail/warn/error/skip counts per resource
- **Kyverno Reports**: Internal ephemeral report support (`EphemeralReport`, `ClusterEphemeralReport`)
- **ImageValidatingPolicy**: List and detail view for supply-chain image validation policies
- **PolicyException**: List view for policy exception resources
- **CleanupPolicy & ClusterCleanupPolicy**: Schedule and last execution time visibility
- **Storybook integration**: `Pure*` component variants for all major list views, enabling UI testing without a cluster
