# Test manifests for the CloudNativePG Headlamp plugin

Sample manifests for exercising this plugin against a **real cluster**. They
cover the states the plugin is built to report — including the degraded and
permission-denied ones, which are the states that are easiest to get wrong and
hardest to reach by accident.

Everything here is read by the plugin and never written by it: the plugin is
read-only, so nothing in this directory is undone by using the UI.

## Prerequisites

- A Kubernetes cluster you can `kubectl apply` to.
- The [CloudNativePG operator](https://cloudnative-pg.io/documentation/current/installation_upgrade/)
  installed, serving `postgresql.cnpg.io/v1`.
- A default StorageClass. The Cluster manifests deliberately omit
  `spec.storage.storageClass` so they use whatever the cluster's default is; set
  it explicitly if your cluster has no default.

Everything under `clusters/` is admitted on any cluster running the operator.
Two files under `backups/` additionally need **volume-snapshot support** — the
external-snapshotter CRDs, a snapshot controller, and a default
`VolumeSnapshotClass`. Managed clusters usually have the first two; plain `kind`
has none of them, and CNPG rejects a snapshot backup at admission without them:

```console
$ kubectl apply -f backups/on-demand.yaml
The Backup "pg-backed-manual-1" is invalid: spec.method: Invalid value:
"volumeSnapshot": Cannot use volumeSnapshot backup method due to missing
VolumeSnapshot CRD.
```

If you see that, the cluster lacks snapshot support. Everything except the two
files that say so still works.

## Layout

| Path | Purpose |
|------|---------|
| `namespace.yaml` | Namespace `cnpg-headlamp-test` |
| `clusters/healthy.yaml` | Three instances, no backup configuration |
| `clusters/single-instance.yaml` | One instance — the "1/1 is not degraded" case |
| `clusters/degraded.yaml` | Unresolvable image, so instances never become ready |
| `clusters/backed-up.yaml` | Configured for volume-snapshot backups |
| `backups/on-demand.yaml` | A Backup that should succeed, against `pg-backed` *(needs snapshots)* |
| `backups/scheduled-suspended.yaml` | A **suspended** schedule for `pg-backed` *(needs snapshots)* |
| `backups/doomed.yaml` | A Backup against a cluster with no backup destination |
| `rbac/reader-full.yaml` | Baseline read-only account — everything the plugin reads |
| `rbac/reader-no-backups.yaml` | Same, minus `list backups` |
| `rbac/reader-no-scheduledbackups.yaml` | Same, minus `list scheduledbackups` |
| `rbac/reader-clusters-only.yaml` | Clusters only — both backup denials at once |
| `rbac/reader-no-clusters.yaml` | No CloudNativePG permissions at all |

## Applying

```bash
kubectl apply -f namespace.yaml
kubectl apply -f clusters/
```

Wait for the operator to settle the healthy ones before judging anything:

```bash
kubectl get cluster -n cnpg-headlamp-test -w
```

`pg-degraded` never becomes ready — that is the point of it.

Then, once `pg-backed` is ready, give the backup views something to show:

```bash
kubectl apply -f backups/on-demand.yaml
kubectl apply -f backups/scheduled-suspended.yaml
```

`backups/doomed.yaml` is separate because it is meant to fail; apply it only
when you want to see the failure states, and delete it afterwards.

## Scenario → expected state

### Cluster list

| Scenario | Expected |
|---|---|
| `pg-healthy` after the operator settles | Phase `Cluster in healthy state` (green), Instances Ready `3/3`, a primary named, Last Backup `Never` |
| `pg-single` | Phase healthy, `1/1`, Last Backup `Never`. Must **not** be flagged as under-replicated |
| `pg-degraded` | A non-healthy phase — in a local run it sat at `Setting up primary`, which is progressing rather than failed — and Instances Ready below the declared `3`. The operator leaves `status.readyInstances` absent entirely here, which is not the same as zero |
| `pg-backed`, before `backups/on-demand.yaml` is applied | Last Backup `Never` |
| `pg-backed`, after the backup completes | Last Backup shows the age of the completed Backup object, **not** blank. This is read from Backup objects rather than `Cluster.status.lastSuccessfulBackup`, which the operator leaves empty for plugin-based backups |
| Phase changes while the reason changes underneath | The phase tooltip tracks `status.phaseReason` rather than staying pinned to whatever it read at first paint (see `phaseCellValue`) |

### Cluster detail

| Scenario | Expected |
|---|---|
| `pg-healthy` | Backup configuration `None configured on this cluster`; Last successful backup `No completed Backup object exists for this cluster` |
| `pg-healthy` immediately after creation | WAL archiving `Unknown`, hover reads "The operator has not reported a ContinuousArchiving condition yet." — an absent condition is reported as unknown, never as healthy |
| A cluster whose operator reports archiving healthy with no destination configured (no fixture reaches this; it depends on the operator version) | Archiving shown as reported, with the caveat that this alone does not mean WAL is stored anywhere |
| `pg-backed`, no backup taken yet | First recoverability point `Unknown`. It has no Backup-object equivalent, so it is shown as unknown rather than inferred |
| `pg-backed` with `pg-backed-nightly` suspended | The schedule is listed as suspended. The view must not imply backups are running |
| `backups/doomed.yaml` applied | A "Last failed backup" row appears with the operator's error — `cannot proceed with the backup as the cluster has no backup section`. A failure is always worth a row; the absence of one is not |
| `pg-degraded` | Instance topology shows fewer ready instances than `spec.instances`; insights raise the phase and readiness findings |

### Permissions

Each RBAC file creates a ServiceAccount, a ClusterRole and a ClusterRoleBinding.
They are cluster-scoped rather than namespaced because the cluster list reads
Backups across all namespaces in one request — a namespaced Role reproduces the
detail-view states but not the list-view one.

Get a kubeconfig for one of them:

```bash
kubectl apply -f rbac/reader-no-backups.yaml
kubectl create token cnpg-reader-no-backups -n cnpg-headlamp-test --duration=8h
```

Then point Headlamp at a context using that token. `kubectl auth can-i` against
the same account is the quickest way to confirm you are testing what you think:

```bash
kubectl auth can-i list backups.postgresql.cnpg.io \
  -n cnpg-headlamp-test \
  --as=system:serviceaccount:cnpg-headlamp-test:cnpg-reader-no-backups
```

| Account | Where | Expected |
|---|---|---|
| `reader-full` | Everywhere | No permission warnings anywhere. This is the control: if it shows a denial, the fixture is wrong, not the plugin |
| `reader-no-backups` | Cluster list | Rows still render — phase, readiness and primary are all still readable. Only the Last Backup column degrades, to `Unknown`, with `list backups.postgresql.cnpg.io at the cluster scope` on hover |
| `reader-no-backups` | Cluster detail | Warning naming `list backups.postgresql.cnpg.io in namespace "cnpg-headlamp-test"`; backup facts shown as `Unknown` rather than as zero |
| `reader-no-backups` | Insights panel | Backup-related checks skipped, naming the same rule. Skipped checks must not appear as passing |
| `reader-no-scheduledbackups` | Cluster detail | Warning naming `list scheduledbackups.postgresql.cnpg.io in namespace "cnpg-headlamp-test"` |
| `reader-no-scheduledbackups` | Insights panel | Same rule named, one line per denied resource |
| `reader-clusters-only` | Insights panel | Both denials at once: two rules on two lines. They must not run together into one line that reads as a single malformed rule |
| `reader-clusters-only` | Cluster list and detail | Clusters render normally throughout. A backup denial degrades backup facts and nothing else |
| `reader-no-clusters` | Cluster list | `list clusters.postgresql.cnpg.io at the cluster scope` |
| `reader-no-clusters` | Cluster detail | `get clusters.postgresql.cnpg.io in namespace "cnpg-headlamp-test"` |

The strings above are the whole point of the exercise: each is the rule as the
API server and `kubectl auth can-i` spell it, so a reader can paste it straight
into an RBAC policy or a request to their admin. A bare "forbidden" would be a
regression even though it is technically accurate.

## What these manifests cannot reproduce

- **The operator being absent.** The plugin treats only a 404 on the API group
  as evidence that CloudNativePG is not installed; a 403 means "cannot tell" and
  must leave the sidebar entry in place. Reaching the 404 needs a cluster with
  the operator uninstalled — no manifest here can produce it. The 403 case is
  not reachable through RBAC either, because Kubernetes grants discovery to
  `system:authenticated` by default.
- **Most `status` shapes.** The operator owns `status`, so states like a
  mid-failover phase or a specific `phaseReason` cannot be applied directly.
  `clusters/degraded.yaml` reaches a non-healthy phase the honest way, by giving
  the operator something it genuinely cannot do.
- **A phase the plugin does not recognise.** The plugin degrades unknown phases
  to `Unknown` rather than assuming they are healthy. Exercising that needs an
  operator version reporting a phase this plugin predates; the behaviour is
  covered in `src/utils/clusterPhase.test.ts` instead.

## Cleaning up

```bash
kubectl delete -f rbac/
kubectl delete namespace cnpg-headlamp-test
```

Deleting the namespace removes the clusters, their backups and their PVCs.
