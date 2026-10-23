# Velero plugin for Headlamp

Contextual Velero backup coverage for Headlamp ([issue #5198](https://github.com/kubernetes-sigs/headlamp/issues/5198)).

## What it does

### Phase 1 — Detail coverage panels

Shows whether a workload is covered by a Velero backup schedule — directly on the resource detail page in Headlamp.

- **Deployment, StatefulSet, PVC** detail views — matching schedules (namespace + resource + label filters), cron, next run, last backup status
- **Namespace** detail view — schedules that _target_ the namespace (namespace include/exclude, and templates that can include namespaced objects). This is not object-level coverage: label selectors are not evaluated against live resources in the namespace.
- Workload coverage matching uses Schedule template include/exclude filters and label selectors (`matchLabels`, `matchExpressions`, `orLabelSelectors`). Unknown selector operators fail closed (not reported as covered).
- **Read-only** — no backup or restore actions
- **Velero not installed** — clear empty state

### Phase 2 — Cluster-wide Velero views

Sidebar entry **Velero** with:

- **Schedules** — cron, status, next run, last backup
- **Backups** — phase, triggered by schedule or manual, namespace scope
- **Restores** — backup source, phase, errors/warnings, progress (list/detail inspired by [reasonerjt prototype](https://github.com/reasonerjt/velero-headlamp-plugin))

Coverage panels and schedule views load schedule-owned Backups via a `velero.io/schedule-name` label selector, then keep the latest Backup per schedule client-side (long TTLs can still return large histories). The Backups sidebar list still shows the full Backup table. Create actions are deferred to a later phase.

### Phase 3 — Storage + CSI / Datamover visibility

Read-only views aligned with [#939](https://github.com/headlamp-k8s/plugins/issues/939) and Daniel’s CSI+Datamover priority:

- **Storage Locations (BSL)** — provider, bucket, access mode, Available/Unavailable
- **Volume Snapshots (VSL)** — volume snapshot location provider/config
- **Backup Repositories** — kopia/restic repos used by datamover / PVB flows
- **Backup detail** — related **PodVolumeBackup** and **DataUpload** tables when present
- **Restore detail** — related **PodVolumeRestore** and **DataDownload** tables when present

On clusters without CSI/datamover CRDs (or backups that only save manifests), those tables stay empty — the metadata views still work.

## Plugin settings

**Settings → Plugins → Velero**

| Setting          | Default  | Purpose                                                     |
| ---------------- | -------- | ----------------------------------------------------------- |
| Velero namespace | `velero` | Namespace where Velero Schedule / Backup / Restore CRs live |

## RBAC

The Headlamp service account (or user token) needs read access to Velero CRDs:

```yaml
rules:
  - apiGroups: ['velero.io']
    resources:
      - backups
      - schedules
      - restores
      - backupstoragelocations
      - volumesnapshotlocations
      - backuprepositories
      - podvolumebackups
      - podvolumerestores
    verbs: ['get', 'list', 'watch']
  - apiGroups: ['velero.io']
    resources: ['datauploads', 'datadownloads']
    verbs: ['get', 'list', 'watch']
```

(`datauploads` / `datadownloads` are often under `velero.io/v2alpha1` depending on Velero version.)

## Development

```bash
cd plugins/velero
npm install
npm start
```

Copy the built plugin into Headlamp, or load from this folder per the [plugin development docs](https://headlamp.dev/docs/latest/tutorials/plugin-development/).

## Manual testing

Apply the fixtures under `test-files/` to a cluster with Velero installed, then:

1. Open a Deployment / StatefulSet / Namespace detail page for Phase 1 panels
2. Open sidebar **Velero → Schedules / Backups / Restores** for Phase 2
3. Open **Storage Locations / Volume Snapshots / Backup Repositories** for Phase 3
4. Open a CSI/datamover Backup detail to see Pod Volume Backups / Data Uploads when those CRs exist

## Screenshots

Deployment covered by a Velero schedule (`nginx-demo`):

![Deployment with Velero backup coverage](./screenshots/deployment-covered.png)

StatefulSet covered by a namespace schedule (`web`):

![StatefulSet with Velero backup coverage](./screenshots/statefulset-covered.png)

Deployment detail view with matching test fixtures in the cluster:

![Deployment detail with backup label](./screenshots/deployment-detail.png)

## Tests

```bash
npm test
# or, if the wrapper fails on paths with spaces:
npx vitest run -c node_modules/@kinvolk/headlamp-plugin/config/vite.config.mjs
```
