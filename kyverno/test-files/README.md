# Kyverno plugin test resources

These fixtures exercise the **Policy Engine Health** panel, in particular the "Policies Not Ready"
tile: it has to count every policy kind this plugin supports (legacy `kyverno.io/v1`
Policy/ClusterPolicy, `kyverno.io/v2` CleanupPolicy/ClusterCleanupPolicy, and the five
`policies.kyverno.io` CEL kinds), and it has to count namespaced policies correctly even when two
of them share a name in different namespaces.

## Prerequisites

| Requirement        | Required condition                                              | How to check                          |
| ------------------- | ----------------------------------------------------------- | -------------------------------------- |
| Kubernetes context | `kubectl` points to a disposable development cluster        | `kubectl config current-context`       |
| Kyverno            | Kyverno is installed (any recent version)                   | `kubectl get crd clusterpolicies.kyverno.io` |
| Prometheus         | A Prometheus server this plugin can discover is scraping Kyverno | See the plugin's [monitoring guide](../README.md) |
| Headlamp           | Headlamp can access the same cluster and this plugin is loaded | Open the Kyverno Dashboard page       |

The CleanupPolicy/ClusterCleanupPolicy fixtures only apply if the cleanup controller is enabled
(`kubectl get crd cleanuppolicies.kyverno.io`); skip `05-` and `06-` otherwise, everything else is
independent of it.

## Apply the fixtures

```bash
kubectl apply -f 02-team-namespaces.yaml
kubectl apply -f 01-require-app-label-clusterpolicy.yaml
kubectl apply -f 03-require-cost-center-label-policy-team-a.yaml
kubectl apply -f 04-require-cost-center-label-policy-team-b.yaml
kubectl apply -f 05-cleanup-policy-team-a.yaml
kubectl apply -f 06-cluster-cleanup-policy.yaml
kubectl apply -f 07-violating-pods.yaml
```

## What each fixture is for

| File                                               | What it produces                                                                      | What to check in the Dashboard                                                                     |
| --------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `01-require-app-label-clusterpolicy.yaml`           | A legacy `ClusterPolicy` requiring an `app` label on every Pod, audit mode              | Combined with `07-violating-pods.yaml`, drives real Admission Rate and Latency chart data |
| `02-team-namespaces.yaml`                           | `team-a` and `team-b` namespaces                                                       | Hosts the two namespaced policies below                                                              |
| `03-…-team-a.yaml`, `04-…-team-b.yaml`              | Two namespaced `Policy` objects with the **identical name**, `require-cost-center-label`, one in each namespace | See "Verifying the distinct-policy-count fix" below                                                  |
| `05-cleanup-policy-team-a.yaml`                     | A namespaced `CleanupPolicy` (valid, harmless: it only ever matches ConfigMaps explicitly labeled for this demo) | Confirms CleanupPolicy is now included in "Policies Not Ready" at all (previously omitted entirely) |
| `06-cluster-cleanup-policy.yaml`                    | The cluster-scoped equivalent, `ClusterCleanupPolicy`                                  | Same, for the cluster-scoped kind                                                                    |
| `07-violating-pods.yaml`                            | Two Pods that each fail exactly one of the policies above                              | Generates real `fail` policy-report results for the Admission Rate tile and the Policy Impact Map (if that panel is open on these policies); does not exercise Denied, see note below |

All three validation policies above (`01`, `03`, `04`) are `validationFailureAction: Audit`, so
`07`'s violating Pods are admitted, not rejected, they only produce `fail` entries in the policy
reports Kyverno writes after the fact. The "Denied" tile counts
`kyverno_admission_requests_total{request_allowed="false"}`, which only increments on an actual
webhook rejection, so these fixtures deliberately don't exercise it. Verifying Denied needs a
separate policy in `Enforce` mode and a request that violates it.

## Verifying the distinct-policy-count fix

This is the scenario the fix is about: Kyverno's own Helm chart disables the `policy_namespace`
label on `kyverno_policy_rule_info_total` by default, so a Prometheus-based count that grouped by
`(policy_namespace, policy_name)` would silently collapse two same-named namespaced policies in
different namespaces into one. `03-…-team-a.yaml` and `04-…-team-b.yaml` are deliberately that
exact pair, same name, different namespace, so it can't be mistaken for a 404/absent-CRD edge
case.

For this check, skip or remove fixtures `05-` and `06-`, and use a cluster with no other cleanup
policies lacking a `Ready` condition. Such policies make the entire "Policies Not Ready" tile
unavailable (`—`), so the numeric count below cannot be observed while they exist.

Readiness itself is transient for legacy Policy/ClusterPolicy: Kyverno marks a policy `Not Ready`
only in the brief window before its webhook configuration finishes syncing, then flips it back to
`Ready` on its own, normally within a few seconds (confirmed against Kyverno's own
`pkg/controllers/webhook/legacy_status.go`). So right after `kubectl apply`, refreshing the
Dashboard quickly (the panel refreshes every 30 seconds) may briefly show "Policies Not Ready: 2"
before both settle to ready. That brief "2", not "1", is the actual thing to verify: it confirms
the two distinct namespaces are being counted separately rather than collapsing into one, the same
check the apply-and-watch test below makes a little more deterministic, since both policies
reliably transition at nearly the same moment:

```bash
kubectl delete -f 03-require-cost-center-label-policy-team-a.yaml -f 04-require-cost-center-label-policy-team-b.yaml --ignore-not-found
kubectl apply -f 03-require-cost-center-label-policy-team-a.yaml -f 04-require-cost-center-label-policy-team-b.yaml
# Immediately open or refresh the Dashboard's Policy Engine Health panel.
```

## Clean up

```bash
kubectl delete -f .
kubectl delete namespace team-a team-b
```
