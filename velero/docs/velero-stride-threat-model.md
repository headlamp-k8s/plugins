# STRIDE threat model: Headlamp Velero plugin

- Status: draft for discussion, ahead of implementation
- Assessment date: 2026-08-22

This document contains no plugin code. [#939](https://github.com/headlamp-k8s/plugins/issues/939)
asks that the plugin not be started, and that is respected here: what follows is a security
assessment of the system a plugin would sit on top of, meant to be argued with before anyone
writes a component.

## Executive summary

The plugin's purpose is to put a web UI on Velero's `Backup`, `Restore`, `Schedule`,
`BackupStorageLocation` and `VolumeSnapshotLocation` resources, and to let an operator start
backups and restores from it. Almost all of the risk comes from two Velero mechanisms rather
than from anything a plugin would invent.

`DownloadRequest` turns the creation of a namespaced custom resource into a time-limited,
unauthenticated URL serving the contents of a backup. Backups include Secrets unless an operator
explicitly excluded them. `Restore` turns the creation of a namespaced custom resource into the
creation of arbitrary objects across the cluster, including objects that grant permissions.

Both are Velero's design and predate any plugin. What a UI changes is reach: these become one
click for anyone with access to the Velero namespace, and the person clicking is unlikely to
have read Velero's RBAC documentation first.

The recommended posture is to treat the ability to create a `DownloadRequest` as equivalent to
cluster-wide secret read, to keep signed URLs out of the browser, to require an explicit
confirmation naming the target cluster before any restore or deletion, and to document what
Velero namespace access actually confers rather than assuming it is modest.

## Scope and evidence

This assessment covers:

- The plugin surface described in [#939](https://github.com/headlamp-k8s/plugins/issues/939):
  list and detail views for the five kinds above, on-demand backup and restore creation, a
  health dashboard, and map integration.
- Velero at `d2241adba0610dbc1fd57f8df32fdd4a39c36552`, specifically the download request
  controller, the backup store, and the resource filtering documentation.
- Headlamp at `6d2b42cc71d4b958a23e11cd5c3cba3446bf384b`, specifically plugin loading,
  discovery, and the cluster scoping used by object requests.
- `headlamp-k8s/plugins` at `b465910c4fd25de94a3efab65485bee1afdf3e5e` for the conventions
  other plugins follow.

This is a source and design review, not a penetration test. Nothing here was executed against a
multi-tenant cluster with a restricted subject, and threats that depend on it are labelled
accordingly. Object store policy, individual object store provider plugins, Velero's own
server-side controls, and any deployment's CSP are out of scope and need separate assessment.

## Method and lifecycle

This follows the [OWASP Threat Modeling Project](https://owasp.org/www-project-threat-modeling/)
four-question framework, using STRIDE to enumerate threats:

1. **What are we working on?** The system model below records assets, data flows and trust
   boundaries.
2. **What can go wrong?** Threats are enumerated under Spoofing, Tampering, Repudiation,
   Information Disclosure, Denial of Service and Elevation of Privilege.
3. **What are we going to do about it?** Each threat carries a proposed response, collected in
   the response register.
4. **Did we do a good enough job?** Acceptance criteria and open questions are recorded so the
   model can be checked rather than trusted.

### Evidence confidence

| Label | Meaning |
| --- | --- |
| Verified | Directly supported by inspected source or project documentation, cited by file and line. |
| Plausible | The source exposes the necessary behaviour, but the full path was not executed under the conditions described. |
| Open | Depends on deployment configuration or an external control not available here. |

A threat is not a vulnerability because it appears in this list. It becomes an actionable
finding when its preconditions and the absence of a control are both supported by evidence.

### Risk method

Ratings are qualitative, because they depend on how a cluster is configured and on who holds
access to the Velero namespace.

| Rating | Likelihood | Impact |
| --- | --- | --- |
| High | Reachable in normal operation with few preconditions. | Cluster-wide credential disclosure, loss of recovery capability, or privilege escalation. |
| Medium | Requires a specific grant, a user action, or a particular deployment shape. | Bounded disclosure or damage recoverable from another backup. |
| Low | Requires several uncommon conditions or a narrow timing window. | Limited disclosure or short-lived degradation. |

### Maintenance triggers

Revisit this model when any of these change: the `DownloadRequest` API or the lifetime of its
signed URLs; the set of `DownloadTargetKind` values; Velero's default resource filtering; how
the plugin obtains cluster credentials; Headlamp's plugin isolation or CSP; or the addition of
any UI action that writes to the cluster.

## Security objectives

1. The plugin never widens what a user can do beyond what their Kubernetes credentials already
   permit.
2. A user cannot obtain backup contents, and therefore Secrets, without permissions equivalent
   to reading those Secrets directly.
3. Destructive and cluster-modifying actions are unambiguous about what they affect and on which
   cluster, before they happen.
4. Failures are reported as failures, never as an empty or healthy state.

## System model

### Assets

- **Backup contents.** A tarball of the API objects in the backed-up namespaces. Secrets are
  included by default; excluding them is an explicit flag
  (`site/content/docs/main/resource-filtering.md:185`, Verified).
- **Signed download URLs.** Bearer capabilities. Possession is sufficient to fetch the object.
- **Object store credentials**, referenced by `BackupStorageLocation` configuration.
- **The ability to restore**, which is the ability to create objects.
- **The backups themselves**, as the cluster's recovery capability.

### Trust boundaries

1. Browser to Headlamp backend.
2. Headlamp backend to Kubernetes API server, where the user's identity and RBAC apply.
3. Velero controller to object store, where Velero's own service account credentials apply and
   the user's do not.
4. Browser to object store, crossed only if a signed URL is fetched from page JavaScript.

The third boundary is where privilege changes hands. The Velero controller acts with its own
credentials on behalf of whoever created the custom resource, and it does not evaluate that
person's permissions.

## Threats

### I1. Backup contents disclose cluster Secrets to a subject who cannot read them

**Risk: High.**

The `DownloadRequest` flow is: create the CR, wait for the controller to populate
`status.downloadURL`, then fetch that URL.

For `target.kind: BackupContents` the controller signs the backup contents key directly:

```go
return s.objectStore.CreateSignedURL(s.bucket, s.layout.getBackupContentsKey(target.Name), DownloadURLTTL)
```

(`pkg/persistence/object_store.go:642`, Verified.) `DownloadURLTTL` is ten minutes
(`pkg/persistence/object_store.go:96`, Verified).

The controller performs no authorization check on whoever created the request. It reconciles any
`DownloadRequest` that exists and signs a URL for the target named in it
(`pkg/controller/download_request_controller.go:229`, Verified). The URL is then fetched with an
ordinary GET carrying no Kubernetes credentials
(`pkg/cmd/util/downloadrequest/downloadrequest.go`, Verified).

Backups contain Secrets unless excluded, and exclusion is opt-in (Verified, above).

The consequence is that `create` on `downloadrequests` in the Velero namespace is sufficient to
obtain the Secrets of every namespace in any backup, without holding `get` on `secrets`
anywhere. Whether a given cluster grants that combination was not tested here, so the escalation
is **Plausible** while each step above is Verified.

This is Velero's behaviour, not a plugin defect. It matters for the plugin because a download
control in a details view makes the operation discoverable and routine, and because the plugin's
installation documentation is where an operator forms their idea of what Velero namespace access
implies.

**Response.** Do not present backup contents download as an ordinary row action. Where offered,
state what the artifact contains. Document, in the plugin's RBAC guidance, that granting
`create` on `downloadrequests` should be treated as granting cluster-wide secret read. Prefer
the narrower `DownloadTargetKind` values, such as `BackupLog` and `BackupResourceList`, for
routine inspection.

### I2. A signed URL fetched from the browser crosses a boundary the CLI does not

**Risk: Medium.**

`velero backup logs` fetches the signed URL from the Velero client process. A plugin fetching it
from page JavaScript makes a cross-origin request from the Headlamp origin to the object store,
requires CORS on the bucket, and places a capability URL in browser history, within reach of
extensions, and in whatever error reporting the page performs.

Whether the fetch succeeds at all is **Open**: it depends on bucket CORS configuration, which
most Velero installations have no reason to have set.

**Response.** Route the fetch through the Headlamp backend, so the URL is never exposed to the
browser and behaviour does not vary with bucket configuration. Raised as an open question on
[#939](https://github.com/headlamp-k8s/plugins/issues/939).

### E1. Restore is arbitrary object creation

**Risk: High.**

Creating a `Restore` causes Velero to create the objects contained in a backup using its own
credentials. Those objects can include `Role`, `RoleBinding`, `ClusterRole`,
`ClusterRoleBinding` and `ServiceAccount`. A subject who can create a `Restore` can therefore
cause the creation of objects that grant permissions, without holding permission to create those
objects directly (**Plausible**: the mechanism is Verified from Velero's design, the escalation
was not executed).

Namespace mapping extends the reach, since a restore may place a backup's objects into a
different namespace than the one they came from.

**Response.** Treat restore as a privileged action in the UI. Show what it will affect, including
target namespaces after any mapping, before it is submitted. Do not offer restore as a
convenience action on a list row.

### T1. Deleting a backup destroys recovery capability irreversibly

**Risk: Medium.**

Backup deletion removes the stored artifact. There is no undo, and the cluster's recovery
position afterwards is whatever other backups exist.

**Response.** Require an explicit confirmation naming the backup and the cluster. Headlamp
already has this pattern for protected namespaces, where a type-to-confirm step is required
before deletion (`frontend/src/components/common/Resource/DeleteButton.tsx:128`, Verified).

### T2. An action can be addressed to a different cluster than the one displayed

**Risk: Medium.**

Headlamp supports selecting several clusters at once, and a multi-cluster URL carries them as
`a+b`. Object identity in Headlamp carries a cluster name that determines where writes are sent.
Where that name is derived from the route rather than from the object's own origin, only the
first cluster is returned (`frontend/src/lib/cluster.ts`, Verified). A plugin offering restore
and delete inherits any such defect directly, and the consequence is a destructive operation
reaching a cluster the operator was not looking at.

One instance of this pattern in Headlamp core is reported and fixed in
[kubernetes-sigs/headlamp#7399](https://github.com/kubernetes-sigs/headlamp/pull/7399).

**Response.** Take the cluster from the object being acted on, never from the current route.
Name the cluster in every confirmation for a destructive action.

### D1. A failed probe rendered as an empty or healthy state

**Risk: Medium.**

A health dashboard is a deliverable, so the distinction between "nothing is wrong" and "we could
not find out" is a security property here rather than a matter of polish. Install detection in
this repository frequently collapses every probe failure into "not installed"
([#1083](https://github.com/headlamp-k8s/plugins/issues/1083), Verified), and Headlamp's
discovery returns an empty result when every source fails
([kubernetes-sigs/headlamp#7388](https://github.com/kubernetes-sigs/headlamp/pull/7388),
Verified).

A schedule that has stopped firing is the case that matters most, because a healthy-looking
`Schedule` object and an unreachable API produce the same green dashboard, and the operator
learns the difference when they need a backup that does not exist.

**Response.** Model three states rather than two: healthy, unhealthy, unknown. Never render
unknown as healthy. Derive schedule adherence from the most recent `Backup` carrying the
schedule's label rather than from the `Schedule` object alone.

### R1. Actions taken through the UI are attributable only at the API server

**Risk: Low.**

Velero's controllers act with their own service account. The record that a particular person
caused a restore or a deletion is the API server audit entry for the CR creation, not Velero's
own logs, which show the controller acting.

**Response.** Document that Velero namespace access should be audited at the API server, and
that Velero's logs alone do not attribute an operation to a person.

### S1. A plugin executes in Headlamp's shared context

**Risk: Medium, inherited rather than introduced.**

Plugin JavaScript runs in Headlamp's renderer alongside other plugins and the application. A
Velero plugin holds no secrets of its own, but it renders backup metadata and, depending on the
answer to I2, may handle capability URLs. Plugin loading and path handling are part of this
boundary; see
[kubernetes-sigs/headlamp#7320](https://github.com/kubernetes-sigs/headlamp/pull/7320).

**Response.** Hold no capability URL in component state longer than the fetch requires. Do not
log backup metadata to the console. Defer to Headlamp's plugin isolation rather than attempting
anything plugin-local.

## Response register

| ID | Threat | Response | Owner |
| --- | --- | --- | --- |
| I1 | Secrets via backup contents download | Mitigate: restrict the action, document the RBAC equivalence | Plugin design, docs |
| I2 | Signed URL fetched from the browser | Eliminate: proxy through the backend | Open question for maintainers |
| E1 | Restore as arbitrary object creation | Mitigate: privileged action, show effects before submit | Plugin design |
| T1 | Irreversible backup deletion | Mitigate: type-to-confirm naming backup and cluster | Plugin design |
| T2 | Action addressed to the wrong cluster | Mitigate: cluster from object, named in confirmations | Plugin design, Headlamp core |
| D1 | Failure rendered as health | Mitigate: three-state health model | Plugin design |
| R1 | Attribution only at the API server | Accept and document | Docs |
| S1 | Shared renderer context | Transfer to Headlamp's plugin isolation | Headlamp core |

## Acceptance criteria

- No UI path produces a backup contents download for a subject who cannot read Secrets in the
  affected namespaces, or the documentation states plainly that Velero namespace access confers
  that ability.
- Every destructive action names its cluster and its target in the confirmation.
- The health dashboard distinguishes unknown from healthy, and a test covers the unreachable
  case.
- No test asserts that a probe failure means "not installed".

## Open questions

1. Should signed URLs be fetched by the browser or proxied by the Headlamp backend? This decides
   I2 and constrains the whole download surface.
2. Should the plugin assume the `velero` namespace or discover the install namespace? Raised by
   another contributor on [#939](https://github.com/headlamp-k8s/plugins/issues/939) and still
   unanswered.
3. How far back should the plugin support Velero servers? This decides whether terminal-phase
   handling is one code path or two.
4. Is restore in scope for a first release at all, given E1? A read-mostly first version would
   remove the largest privilege concern while still delivering most of the described value.
