# CloudNativePG

A Headlamp plugin for day-2 visibility into [CloudNativePG](https://cloudnative-pg.io/)
Postgres clusters.

The plugin is **read-only**. It never triggers a failover, switchover, backup, or
any other mutating operation, and it offers no controls that could: everything it
shows is derived from the `postgresql.cnpg.io/v1` custom resources you already
have.

## Status

Alpha. The plugin reads three CRDs — `Cluster`, `Backup` and `ScheduledBackup` —
and nothing else. It queries no metrics backend and makes no network calls of its
own.

## Features

- A **CloudNativePG** sidebar section, present only on clusters where the
  CloudNativePG CRDs are installed. On any other cluster the plugin stays dormant
  and adds nothing to the UI.
- A **Clusters** list with, per cluster: name, namespace, phase (colour-coded by
  severity, with the operator's phase reason on hover), ready/desired instances,
  the current primary, the time of the last successful backup, and age.
- A **cluster detail** view showing:
  - **Insights** — findings from a deterministic rules engine, each with the
    evidence it was derived from. Severity is critical, warning, info, or
    unknown — the last for a question the plugin could not answer, such as a
    check whose input could not be read.
  - **Topology** — every instance with its role, the state the operator reports
    for it, its timeline and its pod IP.
  - **Backup and restore confidence** — the backup destination configured on the
    spec, the operator's WAL-archiving verdict, the last successful and last
    failed backup, any backup in progress, the oldest restorable point, the
    schedules that target the cluster, and the ten most recent `Backup` objects.

### What the insights check

The rules engine is a set of pure functions over the three CRDs. Seven checks
run against every cluster:

- **Backups are behind schedule** — a schedule reports an error, every schedule
  is suspended, or the newest successful backup is older than the shortest
  active cadence. Clusters with no schedule at all are not judged by this rule.
- **No restorable point** — no backup destination is configured, or one is
  configured but nothing recoverable has been produced from it yet.
- **Cluster phase is unhealthy** — the operator's own phase, with the reason it
  gave.
- **Fewer instances ready than the spec asks for**.
- **WAL archiving is failing** — the operator's `ContinuousArchiving` condition.
- **Single instance** — one instance means no failover target.
- **The primary changed recently** — a signal that something moved it.

Findings state what was observed and the evidence behind it. Nothing is inferred
from metrics, logs or events, and no finding suggests a remediation the plugin
could perform, because it performs none. A check that cannot be decided from the
available data reports "unknown" rather than assuming the good case.

The provider interface behind the panel is deliberately open: additional insight
sources can be registered without touching the views. This release ships exactly
one provider, the rules engine described above.

## Requirements

- Headlamp with plugin support. Verified against Headlamp 0.39 and 0.44.
- A cluster running the CloudNativePG operator (`postgresql.cnpg.io/v1`).
  Verified against the CNPG 1.29 and 1.30 API shapes.
- Read access (`get`/`list`/`watch`) to `clusters.postgresql.cnpg.io`, and, for
  the backup facts, to `backups.postgresql.cnpg.io` and
  `scheduledbackups.postgresql.cnpg.io`.

## Behaviour when data is missing

Two situations are common on real clusters, and the plugin distinguishes them
rather than collapsing both into a blank cell.

**A field the operator has not reported** renders as "Unknown" with the reason on
hover — never as a zero, a dash, or a guess. Instance counts the operator has not
published show as `?`, not as `0`.

**A permission you do not hold** renders as an empty state naming the exact
permission, for example `list backups.postgresql.cnpg.io in namespace "prod"`.
Denials are scoped to the affected view: losing access to `Backup` objects leaves
the topology and phase information intact, and the insights panel says which
checks it had to skip instead of silently reporting fewer findings.

One host-version caveat: Headlamp releases before 0.44 do not surface a denied
*namespaced* list to plugins (fixed upstream in 0.44, kubernetes-sigs/headlamp
347c13f16), so on older hosts the cluster detail view shows empty backup sections
instead of naming the permission. The clusters list, which reads across
namespaces, names it on every version, as does the detail view from 0.44 onward.

## A note on the backup timestamps

`Cluster.status.lastSuccessfulBackup` and its `*ByMethod` variant,
`lastFailedBackup` and `firstRecoverabilityPoint` are marked upstream as
_"Deprecated: the field is not set for backup plugins"_. A cluster that archives
through the barman-cloud **plugin** leaves them empty however healthy its backups
are.

This plugin therefore derives backup facts from `Backup` objects, which carry no
such caveat. The one fact with no `Backup`-object equivalent is the oldest
restorable point, so that — and only that — falls back to the deprecated field
and shows "Unknown" when it is absent.

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
