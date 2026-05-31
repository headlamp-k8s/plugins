# Storybook Mockups and Local Testing

## Running Storybook (No Cluster Required)

Storybook runs inside the plugin and does **not** talk to a real cluster. All UI components are rendered with mock data, enabling fast visual development and review.

```bash
cd plugins/kyverno
npm install
npm run storybook
```

The browser opens at `http://localhost:6006`. Stories appear in the sidebar grouped by component (e.g. `kyverno/ViolationsView`, `kyverno/PolicyList`).

### How the Pure Component Pattern Works

Every major list component exports two variants:

| Export | Purpose |
|--------|---------|
| `Pure*` (e.g. `PurePolicyTable`) | Accepts pre-fetched data as props — used in Storybook |
| `PolicyList` etc. | Full component that uses Headlamp hooks to fetch live data from the cluster |

To add a new story, create a `*.stories.tsx` file next to the component and import the `Pure*` variant with mock data. See existing examples in `src/components/`:
- `ViolationsView.stories.tsx` — mock violations with status filter
- `PolicyList.stories.tsx` — mock policy rows
- `PolicyReportList.stories.tsx` — mock report rows with summary chips

### Existing Stories

| Story File | Component |
|---|---|
| `PolicyList.stories.tsx` | Kyverno Policies |
| `ClusterPolicyList.stories.tsx` | Kyverno Cluster Policies |
| `PolicyReportList.stories.tsx` | Policy Reports |
| `ClusterPolicyReportList.stories.tsx` | Cluster Policy Reports |
| `KyvernoReportList.stories.tsx` | Ephemeral Reports |
| `CELPolicyList.stories.tsx` | CEL Policies (Validating/Mutating/Generating/Deleting) |
| `CleanupPolicyList.stories.tsx` | Cleanup Policies |
| `ImageValidatingPolicyList.stories.tsx` | Image Validating Policies |
| `PolicyExceptionList.stories.tsx` | Policy Exceptions |
| `ViolationsView.stories.tsx` | Violations Dashboard |
| `ComplianceBadge.stories.tsx` | Compliance Badge |
| `ResultsTable.stories.tsx` | Results Table |

---

## Testing Against a Real Cluster

To test the Kyverno plugin against a real cluster:

### 1. Install Kyverno

```bash
# Using Helm
helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo update
helm install kyverno kyverno/kyverno -n kyverno --create-namespace
```

Or follow the [official installation guide](https://kyverno.io/docs/installation/).

### 2. Run Headlamp with the Plugin

**Option A — Headlamp Desktop**

1. Build the plugin:
   ```bash
   cd plugins/kyverno && npm run build
   ```
2. Copy `dist/` into Headlamp's plugin dir:
   - **macOS**: `~/Library/Application Support/Headlamp/plugins/kyverno/`
   - **Linux**: `~/.config/Headlamp/plugins/kyverno/`
3. Start Headlamp Desktop, select your cluster context, and navigate to the **Kyverno** sidebar section.

**Option B — Headlamp from Source (Development)**

```bash
# In the Headlamp main repo
export HEADLAMP_PLUGINS_DIR=/path/to/plugins/kyverno/dist
make run-frontend
```

**Option C — Headlamp Server**

```bash
headlamp-server -plugins-dir=/path/to/plugins/kyverno/dist
```

### 3. Apply Sample Kyverno Policies

To populate the UI with data, apply some test policies:

```bash
# A simple validation policy that requires labels
kubectl apply -f - <<EOF
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-labels
spec:
  validationFailureAction: Audit
  rules:
    - name: check-for-labels
      match:
        any:
          - resources:
              kinds:
                - Pod
      validate:
        message: "The label 'app.kubernetes.io/name' is required."
        pattern:
          metadata:
            labels:
              app.kubernetes.io/name: "?*"
EOF
```

Then navigate to **Kyverno → Cluster Policies** in Headlamp to see the policy listed with its status.

---

## Suggested Order for Development

1. **Run Storybook** — `npm run storybook` (see all existing Pure component stories)
2. **Add a new story** — create `MyComponent.stories.tsx` next to your component with mock data
3. **Test against a real cluster** — build and load the plugin into Headlamp, apply test Kyverno resources, and verify the UI
