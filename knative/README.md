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

## Resource Map

Application owners and Serving troubleshooters use Headlamp's Map to see how a Service expands
into routing, revision, autoscaling, and Kubernetes resources. Select a cluster and choose **Map**
in the main Headlamp sidebar; for a cluster named `development`, the URL is
`/c/development/map`.

The Map source selector at the top of the page contains a **Knative** group with two sections:

| Source section | Shown when Map opens | Resources | Example question it answers |
|---|---|---|---|
| Serving API | Yes | Services, Configurations, Revisions, Routes, Domain Mappings, Cluster Domain Claims | Which Configuration created `checkout-00004`, and which Route sends traffic to it? |
| Serving Internals | No | Images, Pod Autoscalers, Metrics, KIngresses, Serverless Services, Certificates | Which autoscaler, scrape target, and networking resources back `checkout-00004`? |

To investigate controller-generated resources, open the source selector, expand **Knative**, and
enable **Serving Internals** or an individual resource type. Route-to-Revision edges show the
resolved traffic percentage and tag, for example `100%` or `0% (candidate)`. Selecting a node
opens its Ready condition and the same identifying fields used in the corresponding list view.

Knative nodes also connect to Headlamp's standard Kubernetes Map sources when those sources are
enabled:

| Headlamp source | Knative relationship shown |
|---|---|
| Workloads | Revision and Pod Autoscaler to Deployment; Serverless Service to Deployment |
| Network | Route-owned Services; KIngress backends; Metric scrape targets; Serverless Service public and private Services |
| Security | Image to its Service Account, using `default` when the Image does not specify one |
| Configuration | KIngress and Certificate to referenced Secrets |

The Networking view parses Knative's YAML-list values in `external-gateways` and
`local-gateways`. It distinguishes controller defaults from malformed configuration and API
access errors, and links configured Gateway and Kubernetes Service references to their Headlamp
detail views. With Gateway API ingress, the view requires the Gateway's `Accepted` and `Programmed`
conditions to be true and checks the address or port allocation promised by the referenced Service.

| Referenced Service type | What the Networking view checks | Representative result |
|---|---|---|
| `LoadBalancer` | An address in `status.loadBalancer.ingress` or `spec.externalIPs` | An empty `status.loadBalancer` is **Not Ready** until an external address is assigned. |
| `NodePort` | Every Service port has an assigned `nodePort` | `80:30080/TCP` is **Ready** without requiring a LoadBalancer address. |
| `ClusterIP` | A non-headless `clusterIP` has been assigned | `clusterIP: 10.96.0.10` is **Ready** for cluster-local traffic. |

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

Contributors and reviewers can create a representative set of healthy, failed, traffic-split,
rollback, autoscaling, image-resolution, domain-mapping, and Serving-internal resources:

```bash
./test-files/setup.sh
```

The setup script preserves the required revision order and waits for expected-ready Services. The
[test resource guide](test-files/README.md) maps each fixture to the list view, detail view, Map
relationship, or Prometheus chart that it exercises and documents optional TLS and gateway checks.

Remove the test namespace, optional PodMonitor, and cluster-scoped test claim with:

```bash
./test-files/cleanup.sh
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
