# Node Readiness Controller Plugin Test Fixtures

This directory contains sample `NodeReadinessRule` custom resource manifests designed for manual testing, visual inspection, and end-to-end verification of the Headlamp Node Readiness Controller plugin.

## Included Fixtures

| Fixture                                                                          | Scenario                      | Key Features Tested                                                                                                                        |
| :------------------------------------------------------------------------------- | :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| [`01-healthy-rule.yaml`](./01-healthy-rule.yaml)                                 | All nodes healthy             | All targeted nodes satisfy conditions; managed taint is absent; healthy status chip displayed.                                             |
| [`02-tainted-rule.yaml`](./02-tainted-rule.yaml)                                 | Taint present                 | One node fails condition requirement; managed taint is present; taint present metric chip displayed.                                       |
| [`03-dryrun-rule.yaml`](./03-dryrun-rule.yaml)                                   | Dry-run simulation            | `spec.dryRun: true`; prominent "Dry-Run Simulation" summary box rendered; live cluster enforcement disabled.                               |
| [`04-evaluation-error-rule.yaml`](./04-evaluation-error-rule.yaml)               | Evaluation errors             | Controller encountered timeout/error evaluating node; `status.failedNodes` populated; evaluation errors chip displayed.                    |
| [`05-pending-rule.yaml`](./05-pending-rule.yaml)                                 | Pending / Unreconciled        | Newly submitted rule without controller status; verifies graceful handling of uninitialized status and zero-count states without crashing. |
| [`06-multicondition-fallback-rule.yaml`](./06-multicondition-fallback-rule.yaml) | Multi-condition with fallback | `conditionPolicy: allOf`; multiple condition evaluations with fallback `defaultStatus: "False"` tested in Conditions table.                |

## Quickstart Testing

### 1. Ensure the CRD is Installed

Ensure the `NodeReadinessRule` Custom Resource Definition is registered in your cluster:

```bash
kubectl get crd nodereadinessrules.readiness.node.x-k8s.io
```

If not yet installed, apply the CRD from the controller repository:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/node-readiness-controller/main/config/crd/bases/readiness.node.x-k8s.io_nodereadinessrules.yaml
```

### 2. Apply Fixtures and Seed Status Subresources

> [!WARNING] > **Use an explicitly selected disposable test cluster (e.g., Kind or Minikube).**
>
> - Verify your current context before applying: `kubectl config current-context` (confirm it points to a local disposable cluster, never a shared or production environment).
> - All sample fixtures are isolated using dedicated opt-in test selectors (`test.readiness.k8s.io/*`) so they do not inadvertently match standard worker nodes.
> - The error scenario fixture (`04-evaluation-error-rule.yaml`) specifies a `NoExecute` taint effect. If matched against an active node, Kubernetes immediately evicts non-tolerating pods. **Deleting a rule afterward removes the taint but cannot undo completed pod evictions.**
> - For UI snapshot verification, always disable controller reconciliation before applying.

#### Why Status Seeding is Required

The `NodeReadinessRule` CRD enables the `/status` subresource. In Kubernetes, a standard `kubectl apply` only creates/updates the `.spec` and silently ignores the embedded `.status` block. Furthermore, if the controller is running, it will continuously overwrite the status with live evaluations from actual cluster nodes.

To reproduce the exact visual states (healthy node counts, simulated dry-run summaries, evaluation errors) in Headlamp:

1. **Disable live controller reconciliation** (or test on a cluster where only the CRD is installed).
2. **Apply the resource specifications**.
3. **Seed the `/status` subresource** using `kubectl replace --subresource=status`.

#### Step-by-Step Procedure for Snapshot Testing

**1. Verify current kubectl context:**

```bash
kubectl config current-context
# Ensure active context is a disposable test cluster (e.g., kind-nrc-dev or minikube)
```

**2. Pause controller reconciliation (if controller is running in the cluster):**

```bash
kubectl scale deployment -n node-readiness-controller-system node-readiness-controller-manager --replicas=0 2>/dev/null || true
```

**3. Apply the rule specifications:**

```bash
kubectl apply -f test-files/
```

**4. Seed the status subresources for fixtures with predefined status:**

- **Linux / macOS (bash):**

  ```bash
  for file in test-files/0[1-4,6]*.yaml; do
    kubectl replace --subresource=status -f "$file"
  done
  ```

- **Windows (PowerShell):**

  ```powershell
  Get-ChildItem test-files/0*.yaml | Where-Object { $_.Name -ne '05-pending-rule.yaml' } | ForEach-Object {
    kubectl replace --subresource=status -f $_.FullName
  }
  ```

_(Note: `05-pending-rule.yaml` is intentionally omitted from status seeding to test how Headlamp displays an unreconciled rule with zero status)._

#### Optional: Testing Live Enforcement on Opted-In Test Nodes

If testing controller enforcement dynamics instead of UI snapshots:

1. Re-enable the controller deployment (`--replicas=1`).
2. Opt in a specific worker node by adding the corresponding fixture label:

   ```bash
   # Opt in node for 01-healthy-rule
   kubectl label node <node-name> test.readiness.k8s.io/role=worker

   # Remove opt-in label when done
   kubectl label node <node-name> test.readiness.k8s.io/role-
   ```

### 3. Verify in Headlamp

1. Start Headlamp with the plugin loaded (`npm start` or load via plugins directory).
2. Navigate to **Node Readiness Rules** in the sidebar.
3. Verify that all rules appear in the table with correct status chips, selector badges, and taint tags:
   - `01-healthy-rule`: Targeted: 2, Taint Absent: 2, Taint Present: 0
   - `02-tainted-rule`: Targeted: 2, Taint Absent: 1, Taint Present: 1
   - `03-dryrun-rule`: "Dry-Run Simulation" badge displayed
   - `04-evaluation-error-rule`: Evaluation Errors: 1 chip displayed
   - `05-pending-rule`: Displays cleanly with 0 counts without crashing
   - `06-multicondition-fallback-rule`: Condition policy indicates `allOf` with 2 conditions
4. Click into each rule to verify the details page:
   - **Conditions to Evaluate** table (verify type, required status, and default fallback column).
   - **Targeted Node Selector** details (verify label chips and expression chips).
   - **Dry-Run Simulation** banner (for `03-dryrun-rule`).

### 4. Cleanup

```bash
kubectl delete -f test-files/
```
