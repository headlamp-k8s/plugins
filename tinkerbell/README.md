# Tinkerbell Headlamp Plugin

The Tinkerbell plugin brings bare metal provisioning resources into
[Headlamp](https://headlamp.dev/). It provides structured Kubernetes-native
views for inspecting hardware, provisioning templates, workflows, workflow
rules, and BMC operations.

The current implementation targets
[Tinkerbell v0.23.0](https://github.com/tinkerbell/tinkerbell/releases/tag/v0.23.0).

## What Is Tinkerbell?

[Tinkerbell](https://tinkerbell.org/) is a CNCF project for provisioning and
managing bare metal machines. It represents provisioning infrastructure through
Kubernetes Custom Resource Definitions (CRDs).

The main provisioning flow uses:

- **Hardware** to describe a machine, including its network interfaces, disks,
  boot configuration, and observed hardware information.
- **Template** to define the provisioning recipe as tasks and actions.
- **Workflow** to apply a Template to Hardware and track its execution.
- **WorkflowRuleSet** to define rules that can automatically create workflows.
- **BMC resources** to represent out-of-band machine management operations,
  jobs, and tasks.

## Why Use This Plugin?

Tinkerbell resources can be inspected with `kubectl`, but understanding a
provisioning run through raw YAML alone can be difficult. Operators often need
to connect several pieces of information:

- which machine is being provisioned
- which template is being used
- which workflow action is currently running
- which action failed
- how the machine is configured to boot
- which BMC operations are associated with the machine

The plugin presents this information through Headlamp list views, detail pages,
status labels, relationship maps, and optional controller-health metrics.

## Supported Resources

| API group            | Kind            | Information shown                                                                                              |
| -------------------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| `tinkerbell.org`     | Hardware        | Machine identity, interfaces, boot configuration, disks, BMC reference, and observed hardware attributes       |
| `tinkerbell.org`     | Template        | Provisioning tasks, actions, images, commands, environments, and timeouts                                      |
| `tinkerbell.org`     | Workflow        | Execution state, hardware and template references, boot options, tasks, actions, timing, and failure summaries |
| `tinkerbell.org`     | WorkflowRuleSet | Matching rules and the Template used when creating Workflows                                                   |
| `bmc.tinkerbell.org` | Machine         | BMC configuration, power information, and reported conditions                                                  |
| `bmc.tinkerbell.org` | Job             | Machine reference, requested tasks, execution status, and timing                                               |
| `bmc.tinkerbell.org` | Task            | BMC operation, parameters, status, result, and timing                                                          |

## Headlamp Integration

The plugin adds a dedicated Tinkerbell section to the Headlamp sidebar with
routes for:

- Hardware
- Templates
- Workflows
- WorkflowRuleSets
- BMC Machines
- BMC Jobs
- BMC Tasks
- Tinkerbell CRD status

Each supported resource has Headlamp-style list and detail views. Standard
Headlamp resource actions, including viewing or editing YAML, remain controlled
by the current user's Kubernetes RBAC permissions.

The plugin does not currently add specialized mutating operations such as
workflow retry or machine power controls.

## CRD Detection

Before displaying a resource page, the plugin checks whether its required
Tinkerbell CRDs are installed in the active Kubernetes cluster.

When CRDs are missing, the page displays:

- which CRDs could not be found
- that Tinkerbell must be installed in the connected management cluster
- an unavailable state instead of a broken or permanently loading page

The **CRDs** page shows the detection status, Kind, and API group for every
resource supported by the plugin.

## Resource Relationships in Map View

The plugin registers Tinkerbell resources with Headlamp's Map view. This helps
operators follow the provisioning and machine-management relationships
visually.

The following relationships are shown when their references exist:

```text
Hardware -> Workflow -> Template
Hardware -> BMC Machine -> BMC Job -> BMC Task
WorkflowRuleSet -> Template
```

More specifically:

- a Workflow is connected to its referenced Hardware
- a Workflow is connected to its referenced Template
- Hardware is connected to its referenced BMC Machine
- a BMC Machine is connected to Jobs that reference it
- a BMC Job is connected to Tasks that identify it through Kubernetes owner
  references
- a WorkflowRuleSet is connected to its configured Template

References are resolved by name and namespace. Kubernetes ownership
relationships are matched by UID to avoid connecting a Task to a different Job
that later reused the same name.

## Controller Health Metrics

When the Headlamp Prometheus plugin is installed and configured, controller
health charts are available on the detail pages for:

- Workflow
- BMC Machine
- BMC Job
- BMC Task

These are **controller-wide metrics** for the selected Tinkerbell installation.
They do not represent only the resource whose detail page is open.

| Chart           | Meaning                                                                            |
| --------------- | ---------------------------------------------------------------------------------- |
| Reconciliations | Controller reconciliation attempts and errors per second over a five-minute window |
| Duration        | p50 and p95 controller reconciliation duration in seconds                          |
| Queue           | Reconciliation work waiting to be processed                                        |
| Workers         | Active controller workers and configured worker capacity                           |

Requeues are not treated as reconciliation errors. Worker values refer to
controller-runtime workers, not Tinkerbell provisioning agents.

Hardware, Template, and WorkflowRuleSet do not expose equivalent standalone
controller metrics in the verified Tinkerbell v0.23.0 setup. Their resource and
provisioning state remains available through the Tinkerbell views.

### Configure Prometheus Scraping

Configure Prometheus to scrape Tinkerbell's `/controllers/metrics` endpoint:

```yaml
scrape_configs:
  - job_name: tinkerbell
    scrape_interval: 15s
    metrics_path: /controllers/metrics
    static_configs:
      - targets:
          - tinkerbell.tinkerbell.svc.cluster.local:7080
```

The combined `/metrics` endpoint also includes controller metrics. Scrape
either `/controllers/metrics` or `/metrics`, but not both, to avoid counting the
same measurements twice.

Adjust the service address and namespace for your Tinkerbell installation. For
a replicated installation, configure service discovery so every controller
replica is scraped once instead of scraping through a load-balanced Service.

### Configure Headlamp

In the Prometheus plugin settings:

1. Enable metrics for the selected Headlamp cluster.
2. Configure the Prometheus Service or Pod address.
3. Set **Tinkerbell Scrape Job** to the exact Prometheus `job` label used for
   the Tinkerbell installation.

The default scrape job is:

```text
tinkerbell
```

Using an exact job label prevents metrics from unrelated controller-runtime
applications or other Tinkerbell installations from being mixed into the
charts.

The Prometheus plugin accesses metrics through the Kubernetes API proxy using
the current user's permissions. It does not require a separate browser
connection or separate Tinkerbell credentials.

### Understanding Empty Charts

A chart may have no visible data when:

- Prometheus has not completed at least two scrapes
- the selected scrape job does not match the Prometheus `job` label
- the controller has not reconciled during the selected time range
- a duration histogram has not recorded an observation
- Prometheus cannot reach the Tinkerbell metrics endpoint
- Kubernetes RBAC does not allow access through the Service or Pod proxy

An idle controller can correctly report zero reconciliation activity. Missing
data and unavailable duration measurements are not converted into artificial
zero values.

### Optional Vagrant Lab Setup

The Prometheus plugin includes an optional test manifest for the Tinkerbell
Vagrant lab:

```bash
kubectl --context tinkerbell-vagrant apply \
  -f prometheus/test-files/tinkerbell/prometheus.yaml

kubectl --context tinkerbell-vagrant \
  -n tinkerbell-metrics-demo \
  rollout status deployment/prometheus
```

The manifest creates a small, single-replica Prometheus deployment with
ephemeral storage. It does not modify Hardware, Template, Workflow,
WorkflowRuleSet, or BMC resources.

If automatic discovery is unavailable, use the following Prometheus address in
Headlamp:

```text
tinkerbell-metrics-demo/prometheus:9090
```

Remove only the demo monitoring installation with:

```bash
kubectl --context tinkerbell-vagrant delete \
  -f prometheus/test-files/tinkerbell/prometheus.yaml
```

This manifest is intended for development and verification, not production
monitoring.

## Requirements

- Headlamp `0.20.0` or newer
- a Kubernetes cluster accessible from Headlamp
- Tinkerbell v0.23.0 CRDs installed in the connected management cluster
- Kubernetes RBAC permission to list and view the required resources
- the Headlamp Prometheus plugin and a configured Prometheus installation for
  controller-health charts

## Installation

### Headlamp Plugin Catalog

1. Open Headlamp.
2. Go to **Settings**.
3. Open **Plugins**.
4. Search for **Tinkerbell**.
5. Install and enable the plugin.
6. Open a cluster containing the Tinkerbell CRDs.
7. Select **Tinkerbell** from the sidebar.

The first published release is available from the
[Tinkerbell plugin 0.1.0-alpha release](https://github.com/headlamp-k8s/plugins/releases/tag/tinkerbell-0.1.0-alpha).

### Development Setup

From the plugins repository:

```bash
cd tinkerbell
npm install
npm run start
```

The development command builds the plugin and makes it available to a local
Headlamp Desktop installation.

Create a production build with:

```bash
npm run build
```

## Development Verification

Run the plugin checks before submitting changes:

```bash
npm run format -- --check
npm run tsc
npm run lint
npm run test
npm run build
```

Test manifests under `test-files/` can be applied to a development Kubernetes
cluster to verify different resource states without requiring physical bare
metal machines for every UI scenario.

## Validation

The Hardware, Template, and Workflow views have been validated with Tinkerbell
v0.23.0 using the Vagrant and VirtualBox lab while observing an actual
provisioning run.

WorkflowRuleSet and BMC views have also been exercised by Tinkerbell users and
maintainers against real server environments.

The plugin includes unit coverage for shared resource parsing, workflow state
handling, and Map relationship helpers.

## Current Limitations

- The resource types and fields currently target Tinkerbell v0.23.0.
- Metrics describe controller health, not per-resource CPU or memory usage.
- Controller reconciliation duration is different from complete provisioning
  duration.
- The Overview route currently contains planned summary content.
- Specialized retry, power, and guided create operations are not included.
- Standard create, edit, and delete actions depend on Headlamp and Kubernetes
  RBAC rather than plugin-specific safety checks.
- The quality of relationship maps depends on resources containing valid
  references or Kubernetes owner references.

## References

- [Tinkerbell documentation](https://tinkerbell.org/docs/)
- [Tinkerbell v0.23.0 release](https://github.com/tinkerbell/tinkerbell/releases/tag/v0.23.0)
- [Tinkerbell v0.23.0 CRDs](https://github.com/tinkerbell/tinkerbell/tree/v0.23.0/crd/bases)
- [Headlamp documentation](https://headlamp.dev/docs/latest/)
- [Headlamp plugin development](https://headlamp.dev/docs/latest/tutorials/plugin-development/)
- [Tinkerbell metrics endpoints](https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/cmd/tinkerbell/http.go)
- [Prometheus query functions](https://prometheus.io/docs/prometheus/latest/querying/functions/)
