# Velero plugin manual test fixtures

Apply to a cluster with Velero CRDs installed:

```bash
kubectl apply -f plugins/velero/test-files/sample-schedule.yaml
kubectl apply -f plugins/velero/test-files/matching-cases.yaml
kubectl apply -f plugins/velero/test-files/web-label-only-schedule.yaml
kubectl apply -f plugins/velero/test-files/sample-backups.yaml
kubectl apply -f plugins/velero/test-files/sample-restores.yaml
```

Then enable the plugin in Headlamp and verify:

1. Phase 1 coverage panels on Deployment / StatefulSet / PVC / Namespace detail pages
2. Phase 2 sidebar **Velero → Schedules / Backups / Restores**
3. Schedule “Last backup” links when Backup fixtures are present
4. Restore rows with Backup source (and Schedule source when only `spec.scheduleName` is set)

## Automated tests

```bash
cd plugins/velero
npm test
```

Coverage matching rules exercised in `src/coverage.test.ts` mirror the fixtures below.

## Local verification

Manually verified on **minikube** with Velero installed: applied these fixtures, opened the resources in Headlamp, and confirmed covered vs not-covered panels (see screenshots in `../screenshots/`).

## Quick demo

| Open in Headlamp                                    | Expected                                      |
| --------------------------------------------------- | --------------------------------------------- |
| Deployment `nginx-demo` (default, `backup=enabled`) | Covered by `default-deployments-daily`        |
| Deployment `case-wrong-namespace` (default)         | Not covered (no matching schedule)            |
| Deployment `case-apps-covered` (apps)               | Covered by `apps-namespace-only`              |
| Deployment `case-label-web`                         | Not covered                                   |
| Deployment `case-label-api`                         | Covered by `api-label-only`                   |
| PVC `case-pvc-only`                                 | Not covered (deployments-only schedules)      |
| Deployment `case-partial-uncovered`                 | Not covered                                   |
| Namespace `default`                                 | Lists schedules for default                   |
| Velero → Backups                                    | Demo Backup rows from `sample-backups.yaml`   |
| Velero → Restores                                   | Demo Restore rows from `sample-restores.yaml` |

### Why `case-wrong-namespace` is not covered

That deployment lives in `default` without the `backup=enabled` label, so `default-deployments-daily` does not match. It is also outside the `apps` namespace, so `apps-namespace-only` does not match. No schedule covers it.

Unit tests in `src/coverage.test.ts` cover the same matching rules without a cluster.
