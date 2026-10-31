# Policy Impact panel test resources

These fixtures exercise the **Policy Impact Map** panel on a policy's detail page: which live
resources it actually evaluated, grouped by kind, with a plain-language reason for each group drawn
from the policy's own match/exclude selectors.

## Prerequisites

| Requirement        | Required condition                                    | How to check                                   |
| ------------------- | ------------------------------------------------------- | ----------------------------------------------- |
| Kubernetes context | `kubectl` points to a disposable development cluster    | `kubectl config current-context`                |
| Kyverno            | Kyverno is installed with the reports controller enabled (default) | `kubectl get crd policyreports.wgpolicyk8s.io` |
| Headlamp           | Headlamp can access the same cluster and this plugin is loaded | Open a Policy's detail page                |

## Apply the fixtures

```bash
kubectl apply -f 01-namespaces.yaml
kubectl apply -f 02-require-team-label-clusterpolicy.yaml
kubectl apply -f 03-restrict-cost-center-to-team-b.yaml
kubectl apply -f 04-exempt-system-pods-policy.yaml
kubectl apply -f 05-sample-workloads.yaml
```

Background scanning on each policy means the panel fills in on its own shortly after apply,
regardless of order; admission also reports immediately for `05-sample-workloads.yaml` if it's
applied after the policies.

## What each fixture is for

| File                                               | What it produces                                                                          |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `01-namespaces.yaml`                                | `policy-impact-a` and `policy-impact-b` namespaces                                           |
| `02-require-team-label-clusterpolicy.yaml`          | A `ClusterPolicy` matching only kind `Pod`, with default autogen so Kyverno also generates an equivalent rule for `Deployment` and the other Pod controller kinds |
| `03-restrict-cost-center-to-team-b.yaml`            | A `ClusterPolicy` with a `match.all` block whose two selectors' namespace lists intersect down to `policy-impact-b` only |
| `04-exempt-system-pods-policy.yaml`                 | A namespaced `Policy` in `policy-impact-a` with an `exclude` block covering the same kind (`Pod`) it matches |
| `05-sample-workloads.yaml`                          | Pods and a `Deployment` crafted to pass, fail, or get excluded by the policies above          |

## What to check per policy

Open each policy's detail page and look at its Policy Impact Map.

**`require-team-label`** (ClusterPolicy)

- Two kind groups: `Pod` and `Deployment`.
- The `Pod` group's reason text names rule `check-for-team-label` explicitly (it's in `spec.rules`).
- The `Deployment` group's reason instead says the kind "was likely reached through a generated
  rule or a background scan" — `demo-app` was flagged via Kyverno's autogen rule, which never
  appears in `spec.rules`, so the panel is honest that it can't attribute it to a named rule.
- `exempt-pod-a` shows up as **failing** here (this policy has no exclude block), alongside
  `unlabeled-pod-a` and `unlabeled-pod-b`. `compliant-pod-a` and `compliant-pod-b` show as
  **passing**.

**`restrict-cost-center-to-team-b`** (ClusterPolicy)

- Only resources from `policy-impact-b` appear: `unlabeled-pod-b` failing, `compliant-pod-b`
  passing (and `demo-app`, via its own autogen rule). Nothing from `policy-impact-a` appears, even
  though `policy-impact-a` is named in the first `match.all` selector — this is the actual bug this
  fixture is for: a naive reading of that selector list would wrongly include it.
- The reason text for kind `Pod` lists both selectors' namespaces separately (`namespaces
  [policy-impact-a, policy-impact-b]` **and** `namespaces [policy-impact-b]`), not merged into one
  list, since `match.all` is an intersection, not a union.

**`exempt-system-pods`** (namespaced Policy, `policy-impact-a`)

- `unlabeled-pod-a` fails, `compliant-pod-a` passes.
- `exempt-pod-a` does **not** appear at all, even though it exists and was admitted into this
  namespace: it matches the `exclude` selector (`policy-impact/exempt: "true"`), so Kyverno never
  evaluated it against this rule. Compare this against `require-team-label` above, where the exact
  same Pod does show up (failing) since that policy has no exclude block — the two panels
  disagreeing on this one Pod is the expected, correct behavior.
- The `Pod` group's reason text also carries a caveat that this rule "has an exclude block
  covering kind Pod", since the panel only has the policy spec to go on and can't know from a bare
  kind whether a specific resource was actually excluded.

## RBAC / error scenarios

```bash
kubectl apply -f error-scenarios/06-namespace-scoped-viewer-rbac.yaml
kubectl apply -f error-scenarios/07-no-report-access-rbac.yaml
```

To view a policy's detail page as one of these identities in Headlamp, mint it a token and add it
as a separate context (Kubernetes 1.24+ for `create token`):

```bash
CLUSTER=$(kubectl config view --minify -o jsonpath='{.clusters[0].name}')

kubectl create token policy-impact-ns-viewer -n policy-impact-a --duration=1h |
  xargs -I{} kubectl config set-credentials policy-impact-ns-viewer --token={}
kubectl config set-context policy-impact-ns-viewer --cluster="$CLUSTER" --user=policy-impact-ns-viewer

kubectl create token policy-impact-denied-viewer -n policy-impact-a --duration=1h |
  xargs -I{} kubectl config set-credentials policy-impact-denied-viewer --token={}
kubectl config set-context policy-impact-denied-viewer --cluster="$CLUSTER" --user=policy-impact-denied-viewer
```

Then add each context as a cluster in Headlamp (or `kubectl config use-context <name>` if Headlamp
is reading the active context) and open a policy's detail page. A quick CLI sanity check works too:

```bash
kubectl auth can-i list policyreports --as=system:serviceaccount:policy-impact-a:policy-impact-ns-viewer -n policy-impact-a   # yes
kubectl auth can-i list clusterpolicyreports --as=system:serviceaccount:policy-impact-a:policy-impact-ns-viewer              # no
kubectl auth can-i list policyreports --as=system:serviceaccount:policy-impact-a:policy-impact-denied-viewer -n policy-impact-a  # no
```

**`06-namespace-scoped-viewer-rbac.yaml`** (`policy-impact-ns-viewer`): can read `PolicyReport` in
`policy-impact-a` only, nothing cluster-scoped. Viewing the namespaced `exempt-system-pods` Policy
with this identity should render normally with real data — this is the regression case for the
fix that scopes a namespaced Policy's report reads to its own namespace instead of also requiring
cluster-wide `ClusterPolicyReport` access it doesn't need.

**`07-no-report-access-rbac.yaml`** (`policy-impact-denied-viewer`): can read policies but has no
access to `wgpolicyk8s.io` at all. Viewing *either* policy above with this identity should show
the panel's red error state, `Could not load report data for this policy: ...`, instead of an
empty state or a silently wrong zero count.

## Clean up

```bash
kubectl delete -f error-scenarios/ -f .
kubectl delete namespace policy-impact-a policy-impact-b
kubectl config delete-context policy-impact-ns-viewer
kubectl config delete-context policy-impact-denied-viewer
kubectl config delete-user policy-impact-ns-viewer
kubectl config delete-user policy-impact-denied-viewer
```
