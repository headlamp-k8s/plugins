# Violation Drill-Down dialog test fixtures

These fixtures exercise the **Violation Drill-Down dialog** introduced in PR-4:
one failing resource per validation mechanism (pattern, anyPattern, conditional deny,
foreach, legacy CEL inside a kyverno.io/v1 rule, CEL ValidatingPolicy), so every
code path in `suggestFix`, `suggestCELFix`, `describeMatchReasons`, and
`describeCELMatchReasons` can be confirmed against real report data in the browser.

## Prerequisites

| Requirement        | Required condition                                                           | How to check                                                |
| ------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Kubernetes context | `kubectl` points to a disposable development cluster                           | `kubectl config current-context`                             |
| Kyverno            | Kyverno v1.14+ installed (for legacy rules); v1.16+ for the ValidatingPolicy   | `kubectl get crd validatingpolicies.policies.kyverno.io`     |
| Headlamp           | Headlamp can access the same cluster and this plugin is loaded                 | Open the Violations view or a policy's detail page           |

## Apply the fixtures

```bash
kubectl apply -f 01-namespaces.yaml
kubectl apply -f 02-pattern-validation.yaml
kubectl apply -f 03-anypattern-validation.yaml
kubectl apply -f 04-deny-conditional.yaml
kubectl apply -f 05-foreach-validation.yaml
kubectl apply -f 06-cel-validating-policy.yaml
kubectl apply -f 07-sample-workloads.yaml
```

Background scanning fills the reports automatically; admission reports appear
immediately for `07-sample-workloads.yaml` when applied after the policies.

## What each fixture is for

| File                                    | Rule type exercised                       | Expected drill-down output                                                                |
| ---------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `01-namespaces.yaml`                     | (infrastructure only)                      | Creates `drilldown-test` namespace                                                           |
| `02-pattern-validation.yaml`             | `validate.pattern`                         | "Update the manifest so every field matches the pattern, then re-apply it."                 |
| `03-anypattern-validation.yaml`          | `validate.anyPattern`                      | "Compare the resource against each entry in validate.anyPattern..."                         |
| `04-deny-conditional.yaml`               | `validate.deny` with conditions            | "Review those conditions and adjust the resource so they evaluate to false..."               |
| `05-foreach-validation.yaml`             | `validate.foreach`                         | "This rule uses validate.foreach over the list expression ..."                               |
| `06-cel-validating-policy.yaml`          | CEL `ValidatingPolicy`                     | `describeCELMatchReasons` output + CEL expression shown in the dialog                        |
| `07-sample-workloads.yaml`               | (workloads triggering failures above)      | Each Pod/ConfigMap fails exactly one policy; opens each dialog to compare output             |

## What to verify per dialog

1. **Match reasons section** -- shows the kind and rule/constraint that caused this resource to be evaluated.
2. **Suggested fix section** -- the text corresponds to the rule type (pattern / anyPattern / foreach / deny / CEL).
3. **For the CEL ValidatingPolicy** -- the CEL expression is shown verbatim in the monospace box.
4. **For the foreach rule** -- the `list` JMESPath expression is named in the fix text.
5. **BasicContent fallback** -- open the `04-deny-conditional.yaml` violation from the Violations view (where the policy object has to be fetched lazily) and confirm the dialog still shows the fix text, not just the message.

## Clean up

```bash
kubectl delete -f 07-sample-workloads.yaml
kubectl delete -f 06-cel-validating-policy.yaml
kubectl delete -f 05-foreach-validation.yaml
kubectl delete -f 04-deny-conditional.yaml
kubectl delete -f 03-anypattern-validation.yaml
kubectl delete -f 02-pattern-validation.yaml
kubectl delete -f 01-namespaces.yaml
```
