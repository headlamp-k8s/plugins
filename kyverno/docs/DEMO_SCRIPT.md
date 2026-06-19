# Kyverno Headlamp Plugin — Demo Script

Step-by-step guide for demoing the plugin: cluster preparation, applying Kyverno policies, and walking through the Headlamp UI.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Kubernetes cluster | Minikube, Kind, or any cloud cluster |
| `kubectl` | Context pointing at your cluster |
| Kyverno | [Install guide](https://kyverno.io/docs/installation/) |
| Headlamp + Kyverno plugin | Same kube context as `kubectl` — see [README](../README.md) |

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

# Wait for pods to be ready
kubectl wait --for=condition=Ready pods --all -n kyverno --timeout=5m
```

---

## 2. Apply Sample Policies

Apply sample resources to populate all plugin views:

```bash
# Validation policy (Audit mode — does not block requests)
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

# Mutation policy — adds a default label to Deployments
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

After loading the plugin (see [README](../README.md)), open Headlamp and navigate through:

1. **Kyverno → Dashboard** — Compliance summary showing total policies, pass/fail counts, and active violations.
2. **Kyverno → Violations** — Toggle between grouping by Policy, Namespace, or Kind; filter by Pass/Fail/Warn/Error/Skip.
3. **Kyverno → Cluster Policies** — See `require-app-label` and `add-default-labels`. Click a policy name to open the detail viewer.
4. **Kyverno → Cluster Policy Reports** — After Kyverno scans the cluster, reports appear here with pass/fail counts per resource.
5. **Kyverno → CEL Policies** — Shows `ValidatingPolicy` and other CEL-based CRDs if installed.
6. **Kyverno → Cleanup Policies** — Shows schedule and last run time for any deployed cleanup policies.

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

## 5. Cleanup

```bash
kubectl delete clusterpolicy require-app-label add-default-labels

# To uninstall Kyverno entirely:
helm uninstall kyverno -n kyverno
kubectl delete namespace kyverno
```

---

## References

- [Plugin README](../README.md)
- [Kyverno Documentation](https://kyverno.io/docs/)
- [Headlamp](https://headlamp.dev/)
