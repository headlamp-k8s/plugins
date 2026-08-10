# CloudNativePG

A Headlamp plugin for day-2 visibility into [CloudNativePG](https://cloudnative-pg.io/)
Postgres clusters.

The plugin is **read-only**. It never triggers a failover, switchover, backup, or
any other mutating operation — everything it shows is derived from the
`postgresql.cnpg.io/v1` custom resources you already have.

## Status

Phase 1 (alpha): the sidebar entry and the cluster list view.

## What it shows

- A **CloudNativePG** sidebar section, present only on clusters where the
  CloudNativePG CRDs are installed. On any other cluster the plugin stays
  dormant and adds nothing to the UI.
- A **Clusters** list with, per cluster: name, namespace, phase (colour-coded by
  severity, with the operator's phase reason on hover), ready/desired instances,
  the current primary, the last reported successful backup, and age.

## Requirements

- Headlamp with plugin support.
- A cluster running the CloudNativePG operator (`postgresql.cnpg.io/v1`).
  Verified against the CNPG 1.29 and 1.30 API shapes.
- Read access (`get`/`list`/`watch`) to `clusters.postgresql.cnpg.io`. Without
  it the view renders an empty state naming the exact permission you are
  missing, rather than failing silently.

## Known limitation: the "Last Backup" column

`Cluster.status.lastSuccessfulBackup` (and its `*ByMethod` variant,
`lastFailedBackup`, and `firstRecoverabilityPoint`) are marked upstream as
_"Deprecated: the field is not set for backup plugins"_. Clusters that back up
through the barman-cloud **plugin** leave these fields empty, so the column
reads "Unknown" for them. That means "the Cluster object does not say", not "no
backup exists". Backup objects are the authoritative source and are surfaced in
a later phase.

## Development

```bash
npm install
npm run start    # runs against a locally running Headlamp
npm run test
npm run tsc
npm run lint
npm run build
```

See the [Headlamp plugin docs](https://headlamp.dev/docs/latest/development/plugins/)
for the general plugin workflow.
