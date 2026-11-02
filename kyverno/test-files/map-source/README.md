# Map view source test fixtures

These fixtures exercise the **Kyverno Map view source** introduced in PR-5.
Apply them to a development cluster, wait ~60 seconds for Kyverno's background
scanner to fill the reports, then open Headlamp's Map view
(`/headlamp/map`) and enable the **Kyverno** source in the source toggle.

## Prerequisites

| Requirement | Condition | How to check |
|---|---|---|
| Kubernetes context | Points to a disposable development cluster | `kubectl config current-context` |
| Kyverno | v1.14+ installed via Helm or manifest | `kubectl get crd clusterpolicies.kyverno.io` |
| Headlamp | Can access the same cluster, Kyverno plugin loaded | Open Kyverno > Overview in the sidebar |

## Apply the fixtures

```bash
kubectl apply -f 01-namespaces.yaml
kubectl apply -f 02-clusterpolicy-require-app-label.yaml
kubectl apply -f 03-policy-require-owner-label.yaml
kubectl apply -f 04-clusterpolicy-no-matching-resources.yaml
kubectl apply -f 05-workloads.yaml
```

Background scanning runs every ~60 seconds by default. To force an immediate
scan, restart the Kyverno background-controller pod:

```bash
kubectl -n kyverno rollout restart deployment kyverno-background-controller
```

## What each fixture is for

| File | Role | Expected Map behavior |
|---|---|---|
| `01-namespaces.yaml` | Infrastructure | Creates `map-source-test` namespace |
| `02-clusterpolicy-require-app-label.yaml` | ClusterPolicy (fail case) | Red (failing) policy node; edges to `ms-pod-no-labels` (fail) and `ms-pod-no-owner` (pass) and `ms-pod-pass` (pass) |
| `03-policy-require-owner-label.yaml` | Namespaced Policy (fail case) | Separate policy node under `map-source-test`; edges to all three pods; `ms-pod-no-owner` and `ms-pod-no-labels` in red |
| `04-clusterpolicy-no-matching-resources.yaml` | ClusterPolicy (no data case) | Grey (no reports) policy node; no edges (Secrets are not present in the namespace) |
| `05-workloads.yaml` | Workloads | Three Pods triggering all the above policies |

## What to verify in the Map view

1. **Three policy nodes visible** after enabling the Kyverno source: `ms-require-app-label` (ClusterPolicy), `ms-require-owner-label` (Policy, inside the `map-source-test` namespace group), `ms-require-secret-label` (ClusterPolicy, grey).
2. **Edge deduplication**: `ms-pod-no-owner` appears as a single resource node with two edges (one from each of the first two policies), not as two separate nodes.
3. **Color coding**: `ms-require-secret-label` is grey (no data), the other two are red (at least one failing resource).
4. **Click a policy node** to open the sidebar details panel: shows enforcement action, pass/fail counts, and a list of up to 5 affected resources with status icons.
5. **Hover a policy node** to see the glance tooltip: shows enforcement action, rule count, and pass/total ratio.
6. **Zero-resource policy**: clicking `ms-require-secret-label` shows "No evaluated resources yet." in the sidebar.
7. **Clipping**: if you have a policy with more than 50 affected resources elsewhere in the cluster, open it to confirm the "More resources not shown" message appears.

## Clean up

```bash
kubectl delete -f 05-workloads.yaml
kubectl delete -f 04-clusterpolicy-no-matching-resources.yaml
kubectl delete -f 03-policy-require-owner-label.yaml
kubectl delete -f 02-clusterpolicy-require-app-label.yaml
kubectl delete -f 01-namespaces.yaml
```
