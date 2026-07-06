# Velero plugin manual test fixtures

Apply to a cluster with Velero installed:

```bash
kubectl apply -f plugins/velero/test-files/sample-schedule.yaml
kubectl apply -f plugins/velero/test-files/matching-cases.yaml
```

Then enable the plugin in Headlamp and verify the Velero section on each resource.

## Automated tests

```bash
cd plugins/velero
npm test
```

Coverage matching rules exercised in `src/coverage.test.ts` mirror the fixtures below.

## Local verification

Manually verified on **minikube** with Velero installed: applied these fixtures, opened the resources in Headlamp, and confirmed covered vs not-covered panels (see screenshots in `../screenshots/`).

## Quick demo

| Open in Headlamp                                    | Expected                                 |
| --------------------------------------------------- | ---------------------------------------- |
| Deployment `nginx-demo` (default, `backup=enabled`) | Covered by `default-deployments-daily`   |
| Deployment `case-wrong-namespace` (default)         | Not covered (no matching schedule)       |
| Deployment `case-apps-covered` (apps)               | Covered by `apps-namespace-only`         |
| Deployment `case-label-web`                         | Not covered                              |
| Deployment `case-label-api`                         | Covered by `api-label-only`              |
| PVC `case-pvc-only`                                 | Not covered (deployments-only schedules) |
| Deployment `case-partial-uncovered`               | Not covered                              |
| Namespace `default`                                 | Lists schedules for default              |

### Why `case-wrong-namespace` is not covered

That deployment lives in `default` without the `backup=enabled` label, so `default-deployments-daily` does not match. It is also outside the `apps` namespace, so `apps-namespace-only` does not match. No schedule covers it.

Unit tests in `src/coverage.test.ts` cover the same matching rules without a cluster.
