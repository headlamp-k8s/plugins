# Headlamp Node Readiness Controller Plugin

A Headlamp plugin for managing and observing [Node Readiness Controller](https://github.com/kubernetes-sigs/node-readiness-controller) resources in Kubernetes clusters.

> [!NOTE]
> This plugin is under active development as part of the LFX Mentorship program. It provides an intuitive, Kubernetes-native interface for observing `NodeReadinessRule` custom resources, node evaluation states, and dry-run simulations.

---

## Features

- **Sidebar Navigation**: Dedicated **Node Readiness Rules** entry under the Headlamp cluster navigation.
- **Rule Overview Table**:
  - Rule name and link to details view.
  - Managed taint representation (`key=value:effect`) with descriptive tooltips.
  - Enforcement mode (`bootstrap-only` vs `continuous`).
  - Target node selector summary chips (labels and expressions).
  - Condition evaluation policy (`allOf` / `anyOf`) and enforcement mode.
  - Real-time status chips (**Dry-Run Simulation**, **Healthy**, **Taint Present**, **Evaluation Errors**).
  - Resource age.
- **Detailed Rule Inspection**:
  - Complete resource metadata and creation details.
  - Target node selector configuration chips.
  - **Conditions to Evaluate** table listing required conditions, expected status, and default fallback states.
  - **Dry-Run Simulation** section detailing affected nodes, risky operations, and predicted taint additions/removals.

---

## Architecture & Code Structure

The plugin codebase is structured following established Headlamp plugin standards:

```
src/
|-- resources/              # Upstream CRD definitions & types
|   |-- types.ts            # TypeScript interfaces for NodeReadinessRule spec & status
|   |-- nodeReadinessRule.ts # Headlamp KubeObject class definition
|   `-- index.ts
|-- components/             # Reusable UI components
|   |-- common/             # Atomic, reusable presentation widgets
|   |   |-- TaintChip.tsx
|   |   |-- NodeSelectorSummary.tsx
|   |   |-- NodeSelectorDetails.tsx
|   |   |-- NodeStatusChips.tsx
|   |   `-- index.ts
|   `-- rules/              # Domain-specific rule views & sections
|       |-- RuleList.tsx
|       |-- RuleDetails.tsx
|       |-- RuleConditionsTable.tsx
|       |-- DryRunResultsSection.tsx
|       |-- RuleDetails.test.tsx
|       `-- index.ts
|-- utils/                  # Pure utility functions & routes
|   |-- routes.ts           # Centralized route paths and helpers
|   |-- ruleStats.ts        # Pure status computation & failure precedence
|   |-- ruleStats.test.ts
|   `-- index.ts
|-- index.tsx               # Declarative plugin entrypoint
`-- index.test.tsx          # Registration test suite
```

---

## Prerequisites

1. **Kubernetes Cluster**: A dedicated, disposable test cluster (Kind or Minikube recommended; Kubernetes 1.28+). Never use a production or shared cluster for test fixtures.
2. **CRD Installed**: The `NodeReadinessRule` CRD must be present in the cluster:
   ```bash
   kubectl get crd nodereadinessrules.readiness.node.x-k8s.io
   ```
   To apply the CRD directly:
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/node-readiness-controller/main/config/crd/bases/readiness.node.x-k8s.io_nodereadinessrules.yaml
   ```
3. **Node.js**: Node 18+ and npm installed.

---

## Developer Quickstart

### 1. Installation

Clone the plugins repository and install dependencies:

```bash
cd plugins/node-readiness-controller
npm install
```

### 2. Running Locally with Headlamp

To develop and test live inside a running Headlamp instance:

```bash
npm start
```

Alternatively, build the plugin and copy it to your local Headlamp plugins directory:

```bash
npm run build
# The compiled bundle will be in dist/
```

### 3. Running Automated Tests

Run the Vitest test suite:

```bash
npm test
```

### 4. Code Quality & Linting

Verify TypeScript types, ESLint rules, and Prettier formatting:

```bash
# TypeScript verification
npx tsc --noEmit

# Linting
npm run lint

# Prettier check
npx prettier --check src test-files README.md
```

---

## Testing with Sample Fixtures

The [`test-files/`](./test-files/) directory contains pre-configured fixtures covering common rule states and error scenarios.

> [!WARNING] > **Use an explicitly selected disposable cluster (e.g., Kind or Minikube).**
>
> - Verify your active context (`kubectl config current-context`) before applying fixtures to avoid running against shared environments.
> - Fixtures are isolated to opt-in labels (`test.readiness.k8s.io/*`) to protect standard worker nodes.
> - For UI snapshot verification, disable controller reconciliation before applying fixtures. If testing live enforcement, only apply matching test labels to dedicated, opted-in sandbox nodes.
> - The fixture `04-evaluation-error-rule.yaml` specifies a `NoExecute` taint, which triggers immediate pod evictions if matched against live nodes. Deleting the rule afterward clears the taint but cannot undo completed pod evictions.

### Status Subresource Seeding (Snapshot Testing)

Because the `NodeReadinessRule` CRD enables the `/status` subresource, standard `kubectl apply` only creates or updates `.spec` and silently ignores the embedded `.status` block.

> [!IMPORTANT] > **Why pausing controller reconciliation is essential:**
> If the controller is running, its reconciliation loop will continuously evaluate cluster nodes against the applied test rules and overwrite (tamper with) the pre-configured `.status` fields in your test fixtures. This will wipe out the simulated test scenarios (healthy node counts, dry-run simulation outcomes, or evaluation errors) and replace them with live evaluations from your local cluster. Disabling or pausing reconciliation is essential to keep the seeded fixture statuses intact for UI verification.

```bash
# 1. Verify active context is a disposable cluster
kubectl config current-context

# 2. Pause controller reconciliation (if controller is running; skip if CRD-only test)
kubectl scale deployment -n nrr-system nrr-controller-manager --replicas=0
# Note: Custom installations should adjust namespace/deployment name accordingly.

# 3. Apply rule specifications
kubectl apply -f test-files/

# 4. Seed the status subresource for fixtures with predefined status (01-04, 06)
for file in test-files/0[1-4,6]*.yaml; do
  kubectl replace --subresource=status -f "$file"
done
```

See the [Status Seeding Guide in `test-files/README.md`](./test-files/README.md#2-apply-fixtures-and-seed-status-subresources) for PowerShell instructions, individual scenario details, and live enforcement opt-in workflows.

```bash
# Cleanup fixtures
kubectl delete -f test-files/
```

See [`test-files/README.md`](./test-files/README.md) for full details on each test scenario.

---

## Contributing & License

This project is licensed under the Apache License 2.0. Contributions and feedback are welcome! Please refer to the root [CONTRIBUTING.md](../../CONTRIBUTING.md) and [AGENTS.md](./AGENTS.md) guidelines.
