# Knative

A Headlamp plugin for operating Knative Serving workloads and inspecting the resources that
Serving creates for them. Application owners can manage Services and traffic, while platform
operators can follow a request from its Route and Ingress through to autoscaling and image
resolution resources. Event-driven application owners can manage the Knative Eventing Brokers,
Triggers, Channels, channel implementations and Subscriptions that route events, and the Sources
that send them.

## Requirements

| Requirement | Required condition | Why |
|---|---|---|
| Headlamp | 0.44.0 or later | The plugin targets the sidebar APIs available in Headlamp 0.44.0 and later. |
| Knative | Knative Serving, Knative Eventing, or both installed on the selected cluster | The plugin discovers Serving and Eventing separately from their CustomResourceDefinitions and shows only the views for what is installed. |

## Resource Views

Headlamp adds the selected cluster to each route. For example, selecting a cluster named
`development` and opening Routes navigates to `/c/development/knative/routes`.

The sidebar uses non-clickable section headings to group the views into four sections:
**Serving** for the resources application and domain owners manage, **Serving Internals** for
internal resources, including the read-only resources Serving derives and manages itself,
**Configuration** for cluster-level Knative settings, and **Eventing** for the Brokers, Triggers,
Channels and Subscriptions that route events and the Sources that send them. Serving and Eventing
are detected separately, so a cluster that runs only one of them shows only its sections.

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

### Eventing

| Who uses this view | Sidebar item | Registered URL | Example question it answers | Actions |
|---|---|---|---|---|
| Event-driven application owner | Brokers | `/knative/brokers` | Which address do producers send events to, and is the `default` Broker ready? | Manage |
| Event-driven application owner | Triggers | `/knative/triggers` | Which subscriber receives events from the `default` Broker, and why is a Trigger not ready? | Manage |
| Event-driven application owner | Channels | `/knative/channels` | Which kind of channel backs `orders`, and how many Subscriptions does it have? | Manage; view only when Knative created it |
| Event-driven application owner | Channel Implementations | `/knative/channel-implementations` | Which KafkaChannels and NatsJetStreamChannels are there, how are they set up, and where do their failed events go? | Manage; view only when Knative created it |
| Event-driven application owner | Subscriptions | `/knative/subscriptions` | Where do events from the `orders` Channel go, and which Subscriptions did a Broker create for its Triggers? | Manage; view only when Knative created it |
| Event-driven application owner | Sources | `/knative/sources` | Which Sources send events to the `default` Broker, which event types do they send, and why is a Source not ready? | Manage; view only when Knative created it |

The Sources view lists the Sources of every kind in one table: Knative's own, such as
ApiServerSource, PingSource and SinkBinding, and those of other projects, found through the
`duck.knative.dev/source=true` label on their CustomResourceDefinitions. Users who may not list
CustomResourceDefinitions see Knative's own kinds, ApiServerSource, ContainerSource, PingSource and
SinkBinding, with a note saying so. A Source's page shows its kind, its sink and the URI Knative
resolved it to, the settings of its own kind as read-only YAML, such as a PingSource's schedule, the
type and source of the events it sends, its conditions and its events.

Selecting a Broker or Trigger opens its detail page. A Broker's page shows its class, address, and
settings ConfigMap; a Trigger's page shows its Broker, filter, subscriber, and the URI the
subscriber resolved to. Both show conditions and events.

Users who may create Brokers or Triggers in the cluster get a create button on their list, as on
Headlamp's own lists. It opens Headlamp's create dialog with a Form tab next to the YAML editor, and
an edit in either shows in the other:

- The Broker form takes a name, namespace, labels, class, and delivery settings: a dead letter
  sink, retries, backoff policy and delay, and the timeout of each attempt.
- The Trigger form takes the Broker, picked from those in the Trigger's namespace, the filter
  attributes, the subscriber, and the same delivery settings. A subscriber or dead letter sink is a
  Knative Service, Kubernetes Service, Broker or Channel picked by name, or a URL.

On the Form tab, Apply stays disabled until the required fields are filled in and the Broker or
Trigger settings pass Knative's own checks. Kubernetes checks the name and labels on Apply. Settings
the form does not show, such as a Trigger's `spec.filters` or a Broker's `spec.config`, can be set in
the YAML editor.

The Channel Implementations view lists the channels of every kind in one table: Knative's
InMemoryChannel and the implementations installed in the cluster, such as KafkaChannel and
NatsJetStreamChannel, found through the `messaging.knative.dev/subscribable=true` label on their
CustomResourceDefinitions. A channel's page shows its kind, address, delivery settings, the
settings of its own kind as read-only YAML, and its Subscriptions. A Subscription's Channel and a
Channel's backing Channel link to this page.

Selecting a Channel or Subscription opens its detail page. A Channel's page shows its backing
Channel, address, and Subscriptions with the state of each; a Subscription's page shows its
Channel, subscriber, reply, and the endpoints Knative resolved for them. Both show conditions and
events.

## Resource Map

Application owners and Serving troubleshooters use Headlamp's Map to see how a Service expands
into routing, revision, autoscaling, and Kubernetes resources, and event-driven application owners
use it to follow events from their Sources to their subscribers. Select a cluster and choose **Map**
in the main Headlamp sidebar; for a cluster named `development`, the URL is
`/c/development/map`.

The Map source selector at the top of the page contains a **Knative** group with four sections:

| Source section | Shown when Map opens | Resources | Example question it answers |
|---|---|---|---|
| Serving API | Yes | Services, Configurations, Revisions, Routes, Domain Mappings, Cluster Domain Claims | Which Configuration created `checkout-00004`, and which Route sends traffic to it? |
| Serving Internals | No | Images, Pod Autoscalers, Metrics, KIngresses, Serverless Services, Certificates | Which autoscaler, scrape target, and networking resources back `checkout-00004`? |
| Eventing | Yes | Brokers, Triggers, Channels, Channel Implementations, Subscriptions, Sources | Which Triggers deliver the events `heartbeat` sends to the `default` Broker, and where do they go? |
| Eventing Internals | No | Broker Channels, Trigger Subscriptions | Which channel does the `default` Broker use, and which Subscription delivers a Trigger's events? |

To investigate controller-generated resources, open the source selector, expand **Knative**, and
enable **Serving Internals** or an individual resource type. Route-to-Revision edges show the
resolved traffic percentage and tag, for example `100%` or `0% (candidate)`. Selecting a node
opens its Ready condition and the same identifying fields used in the corresponding list view.

Eventing edges follow the events: from a Source to its sink, from a Broker to its Triggers, from a
Channel to the channel implementation behind it and from a channel to its Subscriptions, and from
each Trigger or Subscription to its subscriber and reply. An edge to a dead letter sink is labelled
`dead letter sink`. A subscriber or sink given only as a URI, or one that names a missing object,
has no edge. The channel a Broker creates and the Subscriptions its Triggers create are in
**Eventing Internals**, which is off when the Map opens. The Map draws these channel and Source
kinds wherever they are installed: InMemoryChannel, KafkaChannel and NatsJetStreamChannel;
ApiServerSource, ContainerSource, IntegrationSource, KafkaSource, PingSource and SinkBinding. Other
kinds, such as a RabbitmqSource, are listed in the Sources and Channel Implementations views but not
drawn on the Map. When a list fails, for example because the user may not list Triggers, the Map
shows a node that says what could not be listed, with the reason in its details; when the channel or
Source CustomResourceDefinitions cannot be listed, a warning node says that only Knative's own kinds
are shown. These nodes belong to no namespace, so the Map hides them while a namespace is selected.

Knative nodes also connect to Headlamp's standard Kubernetes Map sources when those sources are
enabled:

| Headlamp source | Knative relationship shown |
|---|---|
| Workloads | Revision and Pod Autoscaler to Deployment; Serverless Service to Deployment; Source to the Deployment it runs |
| Network | Route-owned Services; KIngress backends; Metric scrape targets; Serverless Service public and private Services; Eventing subscribers, sinks and dead letter sinks that are Kubernetes Services; channel, or the Broker whose channel it is, to the channel's Service |
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

#### Serving

The Prometheus plugin provides the following metric charts on KService and Revision detail pages when Prometheus is installed and the PodMonitor is active:

| Chart | KService | Revision | What it shows |
|---|---|---|---|
| **Request Rate** | ✅ | ✅ | HTTP requests/sec grouped by response code class (`2xx`, `4xx`, `5xx`) |
| **By Revision** | ✅ | — | Total request rate broken down by individual revision (shows traffic split distribution) |
| **Latency** | ✅ | ✅ | P50, P95, P99 request latency from `revision_request_latencies_bucket` histogram |
| **Resources** | ✅ | ✅ | CPU usage (cores) and Memory usage (bytes) for pods matching the service/revision |

The `podmonitor.yaml` file configures Prometheus to scrape the Knative `queue-proxy` sidecar (port 9091) on all pods with the `serving.knative.dev/revision` label.

#### Eventing

The Prometheus plugin adds these charts to Eventing detail pages:

| Detail page | Charts | Recorded by |
|---|---|---|
| Broker of the default class, and its Triggers | Deliveries, Delivery latency | The Broker filter |
| Kafka Broker | Events received | The Kafka Broker receiver |
| Trigger of a Kafka Broker | Deliveries, Queued events | The Kafka Broker dispatcher, and Kafka Exporter |
| InMemoryChannel, a Channel it backs, and their Subscriptions | Events received (channels only), Deliveries, Delivery latency | The InMemoryChannel dispatcher |
| KafkaChannel, and a Channel it backs | Events received, Deliveries, Queued events | The KafkaChannel receiver and dispatcher, and Kafka Exporter |
| Subscription to a KafkaChannel | Queued events | Kafka Exporter |
| NatsJetStreamChannel, and a Channel it backs | Events received, Queued events | The NatsJetStreamChannel dispatcher, and the NATS exporter |
| Subscription to a NatsJetStreamChannel | Queued events | The NATS exporter |
| KafkaSource | Deliveries, Queued events | The KafkaSource dispatcher, and Kafka Exporter |
| ApiServerSource | Deliveries, Delivery latency | The source's adapter pods |
| All of the above, PingSource, ContainerSource and SinkBinding | Admission requests, Reconciles | The admission webhooks, and the controllers' work queues |

- **Deliveries**: deliveries per second that the subscriber answered with `2xx` (Succeeded), and
  those that got another status or no answer (Failed), stacked on them; the top line is all
  deliveries.
- **Delivery latency**: P50, P95 and P99 of the time successful deliveries took. P50 is the median;
  P95 and P99 mean that 95% and 99% of deliveries took less time than that. The lines go no higher
  than 10 seconds, so a line at 10 seconds means that percentile is 10 seconds or more.
- **Events received**: events per second that the resource accepted with `2xx`, and those it
  rejected, stacked on them.
- **Queued events**: events that a Trigger, Subscription or KafkaSource has not received yet. On
  Kafka this is Kafka Exporter's consumer group lag, with a partition that has no committed offset
  counted as 0, and for a KafkaSource only the topics it reads; the lag that Knative's Kafka client
  reports counts only events it has not fetched, so it stays at 0 while fetched events wait. Kafka
  Exporter does not name the Kafka cluster, so when Prometheus scrapes exporters of several Kafka
  clusters, a group, topic and partition found in two of them count once. On NATS it is the
  JetStream consumer's pending events plus those delivered but not yet answered, as the NATS server
  that leads the consumer counts them.
- **Admission requests**: requests per second for all resources of the page's kind that the
  admission webhooks allowed, and those they rejected. Status updates by controllers are left out.
  When several webhooks handle the kind, such as the Eventing and the Kafka webhook for Brokers,
  each line shows the webhook that counted the most, which can be less than their sum. The chart
  has no data until a webhook has handled a request for the kind since it started, a controller's
  status update included.
- **Reconciles**: how many times per second the controller of the page's kind reconciled one of its
  resources, and how many times it put one back in its queue to reconcile later.

Each component records deliveries in its own way:

- The Broker filter sends each event once, and the channel behind the Broker retries by sending the
  event to the filter again. Each try counts as a delivery: an event that fails with `retry: 3` and
  a status that Knative retries, such as `503` or no answer, shows as 4 failed deliveries, while a
  `405` is not retried and counts once. The latency is the time of one try.
- The InMemoryChannel dispatcher records a delivery once, after its retries, and its time includes
  them. When a delivery fails and the dead letter sink accepts the event, the dispatcher records
  the dead letter sink's answer and how long the dead letter sink took, so the delivery shows as
  succeeded, with that time. The channel rejects an event when any of its Subscriptions failed
  without a dead letter sink. The dispatcher names a Subscription by its name and the channel's
  namespace, so with cross-namespace event links, Subscriptions of the same name from different
  namespaces to one channel share their charts.
- The Kafka data plane records no delivery that got no answer, such as a timeout or a refused
  connection, and its latency buckets start at 50 milliseconds, too coarse for a latency chart. A
  KafkaChannel adds up the deliveries of all its Subscriptions. A Kafka Broker records deliveries
  per Trigger only, and keeps no queue per Broker: the consumer groups of deleted Triggers stay in
  Kafka.
- The NatsJetStreamChannel dispatcher records the events it accepts, but its deliveries carry no
  status, so NATS channels have no Deliveries chart. Their queue comes from the NATS exporter.
  It names a channel as the InMemoryChannel dispatcher does, so the Events received charts of
  both read the dispatcher pods' `messaging.knative.dev/channel` label, which the monitors copy to
  the metrics.
- No component counts the events sent to a dead letter sink. For a Trigger with a dead letter sink,
  its failed deliveries come closest.
- Source metrics do not name the source since Eventing 1.24. Each ApiServerSource runs its own
  adapter pods, so its charts read the adapter pods' `eventing.knative.dev/sourceName` label, which
  the monitor copies to the metrics. PingSource, ContainerSource and SinkBinding have only the
  admission and reconcile charts. KafkaSink has no charts: the Knative plugin has no page for it,
  and Headlamp's Custom Resources page has no place for them.
- A Broker of the default class has no Events received chart: in Eventing 1.24 its ingress counts
  each request twice, and records only the events that the channel behind it accepted. Brokers of
  other classes, such as the Kafka release's `KafkaNamespaced`, and their Triggers, have only the
  admission chart. A Trigger does not name its Broker's class, and a Subscription to a Channel does
  not name the channel implementation, so their pages read the Broker or Channel, while metrics are
  on, before they show their charts; this needs permission to list Brokers or Channels in its
  namespace.

The charts need Knative Eventing 1.20 or later; they read the metrics of Eventing 1.24, the Kafka
release 1.23 and the NATS release 1.23. To turn the metrics on, as in
[Collecting Metrics](https://knative.dev/docs/eventing/observability/metrics/collecting-metrics/):

1. Set `metrics-protocol: prometheus` in the `config-observability` ConfigMap in
   `knative-eventing`, and restart the Eventing, Kafka and NATS Deployments and StatefulSets in
   `knative-eventing`.
2. Scrape them: the Broker, the Eventing controller and the Eventing webhook with Knative's
   [Eventing monitors](https://github.com/knative-extensions/monitoring/blob/main/config/eventing-monitors.yaml);
   the Kafka components with the `eventing-kafka-*-prometheus-operator.yaml` files of the
   [Kafka release](https://github.com/knative-extensions/eventing-kafka-broker/releases); and the
   InMemoryChannel and NATS dispatchers and controllers, the Broker controller, the NATS webhook and
   the ApiServerSource adapters with monitors such as
   [`metrics-monitors.yaml`](test-files/eventing/metrics-monitors.yaml). None of these monitors
   has the `release` label that kube-prometheus-stack selects by default, so set its
   `podMonitorSelectorNilUsesHelmValues` and `serviceMonitorSelectorNilUsesHelmValues` to `false`.
3. For **Queued events**, run [Kafka Exporter](https://github.com/danielqsj/kafka_exporter) against
   the Kafka cluster (with Strimzi, turn on `kafkaExporter` in the `Kafka` resource) and the
   [NATS exporter](https://github.com/nats-io/prometheus-nats-exporter) with `-jsz=all` against
   every NATS server, such as the exporter sidecar of the NATS Helm chart, and scrape them.
