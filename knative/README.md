# Knative

A Headlamp plugin for operating Knative Serving workloads and inspecting the resources that
Serving creates for them. Application owners can manage Services and traffic, while platform
operators can follow a request from its Route and Ingress through to autoscaling and image
resolution resources.

## Requirements

| Requirement | Required condition | Why |
|---|---|---|
| Headlamp | 0.44.0 or later | The plugin targets the sidebar APIs available in Headlamp 0.44.0 and later. |
| Knative | Knative Serving installed on the selected cluster | The plugin discovers Serving from its CustomResourceDefinitions. |

## Serving Resource Views

Headlamp adds the selected cluster to each route. For example, selecting a cluster named
`development` and opening Routes navigates to `/c/development/knative/routes`.

The sidebar uses non-clickable section headings to group the views into three sections:
**Serving** for the resources application and domain owners manage, **Serving Internals** for
internal resources, including the read-only resources Serving derives and manages itself, and
**Configuration** for cluster-level Knative settings.

### Serving

| Who uses this view | Sidebar item | Registered URL | Example question it answers | Actions |
|---|---|---|---|---|
| Application owner | Services | `/knative/services` | Which URL serves `checkout`, and which revision receives its traffic? | Manage |
| Application owner | Revisions | `/knative/revisions` | Is `checkout-00004` ready, and is it receiving traffic? | View & delete |
| Domain operator | Domain Mappings | `/knative/domain-mappings` | Does `shop.example.com` point to a ready Service? | Manage |
| Domain operator | Cluster Domain Claims | `/knative/cluster-domain-claims` | Has `shop.example.com` been claimed for cluster-wide use? | Manage |

### Serving Internals

| Who uses this view | Sidebar item | Registered URL | Example question it answers | Actions |
|---|---|---|---|---|
| Serving troubleshooter | Configurations | `/knative/configurations` | Which ready Revision did the `checkout` Configuration most recently create? | View only |
| Serving troubleshooter | Routes | `/knative/routes` | What URL and traffic targets did Serving resolve for `checkout`? | View only |
| Platform operator | Images | `/knative/images` | Which image and service account are being resolved for a Revision? | View only |
| Platform operator | Pod Autoscalers | `/knative/pod-autoscalers` | Why does `checkout-00004` have a desired scale of 3 but an actual scale of 1? | View only |
| Platform operator | Metrics | `/knative/metrics` | Which scrape target and stable/panic windows drive autoscaling? | View only |
| Network operator | KIngresses | `/knative/ingresses` | Which hosts were generated for a Route, and is the Ingress ready? | View only |
| Network operator | Serverless Services | `/knative/serverless-services` | Which public and private Kubernetes Services back a Revision? | View only |
| Network operator | Certificates | `/knative/certificates` | Which Secret contains a host's certificate, and when does it expire? | View only |

### Configuration

| Who uses this view | Sidebar item | Registered URL | Example question it answers | Actions |
|---|---|---|---|---|
| Network operator | Networking | `/knative/networking` | Which ingress class and gateways are configured in `knative-serving/config-network` and `config-gateway`? | View only |

The Networking view parses Knative's YAML-list values in `external-gateways` and
`local-gateways`. It distinguishes controller defaults from malformed configuration and API
access errors, and links configured Gateway and Kubernetes Service references to their Headlamp
detail views.

The generated Serving resources marked **View only** do not show create controls or row actions.
Selecting their name opens Headlamp's standard Custom Resource detail view, where the default
Edit, Delete, Scale, and Restart actions are hidden for controller-owned objects of those exact
Knative resource kinds.
Cluster Domain Claims remain actionable, so claims can be created manually on clusters where
`autocreate-cluster-domain-claims` is disabled.

## Knative Installation

Please refer to the [official installation guide](https://knative.dev/docs/install/) for Knative to learn to install it.

## Plugin Installation in Headlamp for Desktop

Go to the Plugin Catalog, search for the Knative plugin, and click the Install button. Reload the UI (Navigation menu > Reload, or use the notification after installing the plugin) to see the new Knative item in the sidebar.

## Demo

<div align="center">
  <a href="https://www.youtube.com/watch?v=9HAcUsopSYE" target="_blank"><img src="https://img.youtube.com/vi/9HAcUsopSYE/0.jpg" style="width:100%;"></a>
  <br>Watch video demo <a href="https://www.youtube.com/watch?v=9HAcUsopSYE" target="_blank">https://www.youtube.com/watch?v=9HAcUsopSYE</a>
</div>

## Development

To make contributions and UI testing easier, this repository includes a suite of test manifests. You can apply these to your local development cluster to instantly generate a robust set of Knative resources covering various states and edge cases (like traffic splits, rollbacks, scaled-to-zero services, and broken domain mappings).

To deploy the test suite:
```bash
kubectl apply -f test-files/deploy/
```

### Test Suite Manifests

* **`00-namespace.yaml`**: Creates the `knative-map-test` namespace to isolate the test suite resources.
* **`01-service-healthy.yaml`**: Deploys a baseline, fully healthy Knative Service with 100% traffic routed to a single revision.
* **`01-service-failed-revision.yaml`**: Deploys a Knative Service containing a revision designed to fail (invalid container command) to verify the map's error rendering (`Ready: False`).
* **`01-service-traffic-split-v1.yaml`**: Step 1 for the traffic split scenario, deploying the initial `v1` revision.
* **`02-service-traffic-split-v2.yaml`**: Step 2 for the traffic split scenario, deploying `v2` and configuring a 50/50 traffic split across targets to test edge percentages on the map.
* **`01-service-scaled-to-zero.yaml`**: Deploys a Knative Service explicitly locked to `min-scale: 0` and `max-scale: 0` to verify idle/inactive rendering.
* **`01-service-metrics-demo.yaml`**: Deploys a Knative Service running `go-httpbin` specifically designed to test error rates and metric visualization.
* **`01-service-rollback-v1.yaml`**: Step 1 for the rollback scenario, deploying the initial `v1` revision.
* **`02-service-rollback-v2.yaml`**: Step 2 for the rollback scenario, deploying `v2` but pinning 100% traffic to `v1` (`stable`) and 0% to `v2` (`canary`) to test tag visualization.
* **`03-domainmapping-healthy.yaml`**: Creates a healthy `DomainMapping` and its requisite `ClusterDomainClaim` to test active mapping edges on the graph.
* **`03-domainmapping-broken-ref.yaml`**: Creates a `DomainMapping` targeting a non-existent Knative Service to verify the map handles broken references gracefully.
* **`03-domainmapping-core-svc.yaml`**: Creates a `DomainMapping` targeting a core Kubernetes `v1 Service` to ensure the map ignores non-Knative targets.

### Traffic Shell Scripts

To test the Knative metrics charts (integrated via the Prometheus plugin), a suite of traffic generation scripts is included in `test-files/traffic/`. These scripts deploy ephemeral pods inside the cluster that send HTTP requests to the `metrics-demo-service`, generating realistic data for all chart views.

Before running any traffic script, ensure you have:
1. Deployed the test namespace and metrics demo service (`kubectl apply -f test-files/deploy/00-namespace.yaml && kubectl apply -f test-files/deploy/01-service-metrics-demo.yaml`)
2. Applied the PodMonitor so Prometheus scrapes the queue-proxy metrics (`kubectl apply -f test-files/podmonitor.yaml`)

**Individual Scripts**:
* **`generate-traffic.sh`**: The original mixed traffic generator. Runs 3 phases: 100% success, 5% errors (split between 400 and 500 codes), and 40% errors. Tests the **Request Rate** chart's ability to show `2xx`/`4xx`/`5xx` response code class breakdown.
* **`generate-error-traffic.sh`**: Targets specific HTTP status codes (200, 400, 403, 404, 500, 502, 503) in phased patterns. Useful for validating that the **Request Rate** chart correctly buckets various codes into their response code classes.
* **`generate-latency-traffic.sh`**: Sends requests with controlled delays (0.1s, 0.5s, 2s) using go-httpbin's `/delay` endpoint. Tests the **Latency** chart's P50/P95/P99 histogram visualization.
* **`generate-resource-stress.sh`**: Creates CPU and memory pressure via large response bodies (`/bytes/102400`) and high concurrency. Tests the **Resources** chart's CPU and Memory panels.
* **`generate-sustained-traffic.sh`**: Runs continuous mixed traffic for a configurable duration (default 5 minutes). Produces a realistic traffic mix (70% success, 10% slow, 10% client errors, 10% server errors) suitable for testing all charts over a longer window. Usage: `./test-files/traffic/generate-sustained-traffic.sh [namespace] [service-name] [duration-seconds]`

#### Running All Scripts

The master script sets up two revisions with a 70/30 traffic split, then runs all traffic generators sequentially:

```bash
./test-files/traffic/run-all-traffic.sh
```

You can also pass a custom namespace and service name:

```bash
./test-files/traffic/run-all-traffic.sh knative-map-test metrics-demo-service
```

### Prometheus Metrics Integration

The Prometheus plugin provides the following metric charts on KService and Revision detail pages when Prometheus is installed and the PodMonitor is active:

| Chart | KService | Revision | What it shows |
|---|---|---|---|
| **Request Rate** | ✅ | ✅ | HTTP requests/sec grouped by response code class (`2xx`, `4xx`, `5xx`) |
| **By Revision** | ✅ | — | Total request rate broken down by individual revision (shows traffic split distribution) |
| **Latency** | ✅ | ✅ | P50, P95, P99 request latency from `revision_request_latencies_bucket` histogram |
| **Resources** | ✅ | ✅ | CPU usage (cores) and Memory usage (bytes) for pods matching the service/revision |

The `podmonitor.yaml` file configures Prometheus to scrape the Knative `queue-proxy` sidecar (port 9091) on all pods with the `serving.knative.dev/revision` label.
