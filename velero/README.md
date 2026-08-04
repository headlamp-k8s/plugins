# Velero Headlamp Plugin

This plugin adds a Velero section to Headlamp so you can see your backups,
restores and schedules without dropping to `velero` on the CLI.

It is an early skeleton. Right now everything is read only: list views for the
main Velero CRDs and detail views for backups, restores and schedules.

## What is Velero?

[Velero](https://velero.io/docs) is an open source tool for backing up and
restoring Kubernetes cluster resources and persistent volumes. It runs in the
cluster, stores backups in object storage, and can restore them into the same
cluster or a different one. People generally use it for disaster recovery and
for migrating workloads between clusters.

## Prerequisites

Velero has to be installed in the cluster before the plugin shows anything,
since the plugin reads the Velero CRDs directly.

See the [Velero basic install guide](https://velero.io/docs/main/basic-install/)
for installation instructions.

You can check that the CRDs are there with:

```bash
kubectl get crd backups.velero.io
kubectl get crd restores.velero.io
kubectl get crd schedules.velero.io
kubectl get crd backupstoragelocations.velero.io
kubectl get crd volumesnapshotlocations.velero.io
```

## Features

Sidebar entries and list views for:

| Resource | API | View |
| --- | --- | --- |
| Backups | `velero.io/v1/backups` | list + detail |
| Restores | `velero.io/v1/restores` | list + detail |
| Schedules | `velero.io/v1/schedules` | list + detail |
| Storage Locations | `velero.io/v1/backupstoragelocations` | list |
| Snapshot Locations | `velero.io/v1/volumesnapshotlocations` | list |

Things that are not done yet and are worth adding later:

- creating and deleting backups from the UI
- triggering a restore from a backup
- pausing and resuming schedules
- downloading backup logs
- a banner when Velero is not installed, like the cert-manager plugin has

## Installation

Not published yet. For now build it from source (see below) and drop the
generated folder into your Headlamp plugins directory.

## Development

```bash
cd velero
npm install
npm start
```

`npm start` builds in watch mode and copies the plugin into the local Headlamp
plugins folder, so a browser refresh picks up changes.

Before opening a PR run the same checks CI runs:

```bash
npm run build
npm run tsc
npm run lint
npm run format -- --check
```

## Layout

```
src/
  index.tsx          sidebar entries and routes
  components/        list and detail views, one file per view
  resources/         KubeObject classes for the Velero CRDs
```

The resource classes live in `src/resources` so the list and detail views can
share them, which is how the other plugins in this repo are laid out.

## Note

This plugin is being developed as part of an
**LFX Mentorship 2026 Term 3** application for Headlamp.

## Links

- [Velero documentation](https://velero.io/docs)
- [Headlamp](https://headlamp.dev)
