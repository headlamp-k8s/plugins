# Kyverno Headlamp Plugin — Demo Script

Step-by-step guide for demoing the plugin: cluster prep → apply Kyverno policies → Headlamp UI walkthrough.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Kubernetes cluster | e.g. Minikube, Kind, or any cloud cluster |
| `kubectl` | Context pointing at your cluster |
| Kyverno operator | [Install guide](https://kyverno.io/docs/installation/) |
| Headlamp + Kyverno plugin | Same kube context as `kubectl` — [plugin README](../README.md) |

**Minikube quick setup:**

```bash
minikube start --cpus=4 --memory=8192
kubectl cluster-info
```

**Verify Kyverno CRDs are installed:**

```bash
kubectl get crd | grep kyverno.io
```

---

## 1. Install Kyverno

```bash
helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo update
helm install kyverno kyverno/kyverno -n kyverno --create-namespace

# Wait for Kyverno pods to be ready
kubectl wait --for=condition=Ready pods --all -n kyverno --timeout=5m
```

---

## 2. Apply Sample Policies and Reports

Apply sample resources to populate all plugin views:

```bash
# Validation Policy (Audit mode - won't block anything)
kubectl apply -f - <<EOF
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-app-label
spec:
  validationFailureAction: Audit
  rules:
    - name: check-for-app-label
      match:
        any:
          - resources:
              kinds: [Pod]
      validate:
        message: "The label 'app' is required on all Pods."
        pattern:
          metadata:
            labels:
              app: "?*"
EOF

# Mutation Policy - adds a default label
kubectl apply -f - <<EOF
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: add-default-labels
spec:
  rules:
    - name: add-managed-by
      match:
        any:
          - resources:
              kinds: [Deployment]
      mutate:
        patchStrategicMerge:
          metadata:
            labels:
              managed-by: kyverno
EOF
```

---

## 3. Headlamp UI Walkthrough

After loading the plugin (see [README](../README.md)), open Headlamp and walk through:

1. **Kyverno → Dashboard** — Overview panel with compliance summary and violation count.
2. **Kyverno → Violations** — Toggle between grouping by Policy / Namespace / Kind; filter by Pass/Fail/Warn/Error/Skip.
3. **Kyverno → Cluster Policies** — See `require-app-label` and `add-default-labels`, click a policy name to open the detail viewer in a split-right panel.
4. **Kyverno → Cluster Policy Reports** — After Kyverno has scanned the cluster, reports appear here with pass/fail counts.
5. **Kyverno → CEL Policies** — If any `ValidatingPolicy` CRDs are installed, they show up here.
6. **Kyverno → Cleanup Policies** — If any cleanup policies are deployed, view their schedule and last run.

---

## 4. Verify via kubectl

```bash
# Check all Kyverno resources in the cluster
kubectl get clusterpolicy
kubectl get clusterpolr
kubectl get polr --all-namespaces

# Check violations (non-pass results)
kubectl get clusterpolr -o jsonpath='{.items[*].results[?(@.result!="pass")].message}' | tr ' ' '\n'
```

---

## 5. Storybook Demo (No Cluster)

To show the UI components without a cluster:

```bash
cd plugins/kyverno
npm run storybook
```

Open `http://localhost:6006` and navigate stories like `kyverno/ViolationsView`, `kyverno/PolicyList`, etc.

---

## 6. Cleanup

```bash
kubectl delete clusterpolicy require-app-label add-default-labels
# To uninstall Kyverno entirely:
helm uninstall kyverno -n kyverno
kubectl delete namespace kyverno
```

---

## References

- [Plugin README](../README.md)
- [Storybook & Local Testing Guide](../STORYBOOK_AND_LOCAL_TESTING.md)
- [Kyverno Documentation](https://kyverno.io/docs/)
- [Headlamp](https://headlamp.dev/)
