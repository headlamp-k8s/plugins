# Knative

A Headlamp plugin for visualizing and managing Knative Services. Knative is a Kubernetes-based platform for deploying and managing serverless workloads. It provides automatic scaling, traffic management, and simplified deployment workflows for containerized applications.

This plugin adds a new item (Knative) to the sidebar and provides GUI functionality to list and view service details, edit traffic splitting, update concurrency settings, perform redeploy/restart operations.

## Knative Installation

Please refer to the [official installation guide](https://knative.dev/docs/install/) for Knative to learn to install it.

## Plugin Installation in Headlamp for Desktop

Go to the Plugin Catalog, search for the Knative plugin, and click the Install button. Reload the UI (Navigation menu > Reload, or use the notification after installing the plugin) to see the new Knative item in the sidebar.

## Demo

<video src="https://github.com/user-attachments/assets/a5c9cac3-f711-4306-84cd-83178fc876e0" controls width="800">
  Your browser does not support the video tag.
</video>

Watch: https://github.com/user-attachments/assets/a5c9cac3-f711-4306-84cd-83178fc876e0

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
