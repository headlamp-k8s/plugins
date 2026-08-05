# Knative plugin test resources

Plugin contributors and reviewers use these resources to exercise the Knative list views, detail
views, and Resource Map against real controller output. The setup script applies the revision
scenarios in a deterministic order, waits only for resources that should become Ready, and leaves
the expected failures available for inspection.

Run all commands in this document from the `knative/` directory unless the command says otherwise.

## Prerequisites

| Requirement          | Required condition                                                   | How to check                                        |
| -------------------- | -------------------------------------------------------------------- | --------------------------------------------------- |
| Kubernetes context   | `kubectl` points to a disposable development cluster                 | `kubectl config current-context`                    |
| Knative Serving      | The `services.serving.knative.dev` CRD exists                        | `kubectl get crd services.serving.knative.dev`      |
| Headlamp             | Headlamp can access the same cluster and this plugin is loaded       | Open `/c/<cluster>/knative/services`                |
| Metrics testing only | Prometheus Operator and the Headlamp Prometheus plugin are installed | `kubectl get crd podmonitors.monitoring.coreos.com` |

## Create the fixtures

```bash
./test-files/setup.sh
```

The script creates the `knative-map-test` namespace. It defaults to a 180-second Ready timeout per
healthy Service; increase it for a slow image pull or a small development cluster:

```bash
WAIT_TIMEOUT=300s ./test-files/setup.sh
```

Do not replace the script with `kubectl apply -f test-files/deploy/`. The traffic-split and rollback
fixtures refer to named v1 revisions, so each v1 Service must become Ready before its v2 manifest is
applied.

## Fixture scenarios

| Manifest                                                                    | Resources or state it produces                                                                                                              | What to verify in Headlamp                                                         |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `01-service-healthy.yaml`                                                   | A Ready Service, Configuration, Revision, and Route                                                                                         | The normal Ready state and a `100%` Route-to-Revision edge                         |
| `01-service-serving-internals.yaml`                                         | A dedicated ServiceAccount plus Image, PodAutoscaler, Metric, Ingress, ServerlessService, Deployment, Services, and other controller output | Cross-source Map edges, explicit ServiceAccount resolution, and autoscaling fields |
| `01-service-failed-revision.yaml`                                           | A Revision whose container exits immediately                                                                                                | False or Unknown Ready conditions remain visible without breaking the graph        |
| `01-service-image-resolution-failure.yaml`                                  | A Revision whose tag-to-digest lookup uses the reserved `.invalid` domain                                                                   | The Configuration and Revision expose the expected image resolution failure        |
| `01-service-scaled-to-zero.yaml`                                            | A Service fixed at `min-scale: 0` and `max-scale: 0`                                                                                        | An inactive workload still has its Serving and autoscaling relationships           |
| `01-service-traffic-split-v1.yaml`, then `02-service-traffic-split-v2.yaml` | Two named Revisions receiving 50% traffic each                                                                                              | The Route has two edges labelled `50%`                                             |
| `01-service-rollback-v1.yaml`, then `02-service-rollback-v2.yaml`           | A stable v1 target at 100% and canary v2 target at 0%                                                                                       | Edge labels show `100% (stable)` and `0% (canary)`                                 |
| `03-domainmapping-healthy.yaml`                                             | A DomainMapping and cluster-scoped ClusterDomainClaim targeting `healthy-service`                                                           | The claim-to-mapping and mapping-to-Service relationships appear                   |
| `03-domainmapping-broken-ref.yaml`                                          | A DomainMapping targeting a missing Knative Service                                                                                         | The broken reference does not create a false edge                                  |
| `03-domainmapping-core-svc.yaml`                                            | A DomainMapping targeting a core Kubernetes Service                                                                                         | The target is not mistaken for a Knative Service                                   |
| `01-service-metrics-demo.yaml`                                              | A Ready HTTP endpoint for optional traffic generation                                                                                       | Prometheus charts populate after the PodMonitor and traffic steps below            |

Knative owns the exact internal resources it generates, and their names may differ by Knative
version or networking implementation. Inspect the resources by kind instead of relying on a
generated name.

## Check every plugin view

For a Headlamp cluster named `development`, `/c/development/knative/configurations` opens the
Configurations list. Replace `development` with the selected Headlamp cluster name.

| View                                        | Representative resource or configuration                                           | Expected result                                                                             |
| ------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Services, Configurations, Revisions, Routes | `serving-internals-service`                                                        | Ready conditions, URLs, resolved image, and traffic are populated                           |
| Images                                      | Image generated for `serving-internals-service`                                    | The resolved digest and `serving-internals-service` ServiceAccount link are visible         |
| Pod Autoscalers                             | PodAutoscaler generated for `serving-internals-service`                            | Revision, desired/actual scale, Ready state, and target Deployment relationship are visible |
| Metrics                                     | Metric generated for `serving-internals-service`                                   | Scrape target, stable window, and panic window are visible                                  |
| KIngresses                                  | Ingress generated for a test Route                                                 | Hosts, rules, backends, and generated Service relationships are visible                     |
| Serverless Services                         | ServerlessService generated for a test Revision                                    | Target Deployment plus public and private Service relationships are visible                 |
| Domain Mappings, Cluster Domain Claims      | `healthy.knative-map-test.local`                                                   | Both resources remain actionable and link to the target namespace or Service                |
| Certificates                                | A Certificate generated by Auto TLS                                                | DNS names, expiry, Ready state, and Secret relationship are visible                         |
| Networking                                  | Existing `knative-serving/config-network` and `config-gateway` ConfigMaps          | Parsed ingress class and gateway readiness are shown without changing cluster configuration |
| Resource Map                                | Enable both **Serving API** and **Serving Internals** under the **Knative** source | Controller ownership and cross-source Kubernetes relationships connect the fixtures         |

To see every cross-source Map edge, also enable Headlamp's **Workloads**, **Network**,
**Security**, and **Configuration** sources. For example, the Image-to-ServiceAccount edge is
hidden until **Security** is enabled.

The generated internal resources are intentionally view-only in the plugin. Their list pages must
not show create controls or row actions, and their detail pages must hide Edit, Delete, Scale, and
Restart actions when the object is controller-owned.

Useful command-line checks are:

```bash
kubectl get ksvc,configuration,revision,route -n knative-map-test
kubectl api-resources --api-group=autoscaling.internal.knative.dev
kubectl api-resources --api-group=networking.internal.knative.dev
kubectl get podautoscalers.autoscaling.internal.knative.dev,metrics.autoscaling.internal.knative.dev -n knative-map-test
kubectl get ingresses.networking.internal.knative.dev,serverlessservices.networking.internal.knative.dev -n knative-map-test
```

Image resources belong to the `caching.internal.knative.dev` API group. Their availability and
namespace depend on the installed Knative version, so discover them before listing them:

```bash
kubectl api-resources --api-group=caching.internal.knative.dev
```

### Certificates and gateway readiness

Certificates are generated only when the cluster has [Auto TLS](https://knative.dev/docs/serving/encryption/external-domain-tls/), a supported certificate provider such as cert-manager, and working DNS/domain configuration. The fixtures do not create a controller-internal Certificate directly because that would not represent the ownership and status produced by a real Knative installation.

The Networking page evaluates the current cluster's `knative-serving/config-network` and
`config-gateway` ConfigMaps and their referenced Gateways or Kubernetes Services. The fixtures do
not overwrite those cluster-level ConfigMaps. Use the
[Knative gateway configuration guide](https://knative.dev/docs/serving/setting-up-custom-ingress-gateway/)
when a specific Gateway API or Service readiness state is required.

## Populate the Prometheus charts

Apply the PodMonitor after setup on clusters that have the Prometheus Operator:

```bash
kubectl apply -f test-files/podmonitor.yaml
```

The traffic scripts create short-lived Pods in the cluster and send requests to
`metrics-demo-service`. Run the complete traffic mix with:

```bash
./test-files/traffic/run-all-traffic.sh
```

Pass a namespace and Service name when testing a different endpoint:

```bash
./test-files/traffic/run-all-traffic.sh knative-map-test metrics-demo-service
```

The individual scripts cover response-code classes, controlled latency, CPU and memory pressure,
and sustained mixed traffic. Run them directly from `test-files/traffic/` when only one chart needs
data; `generate-sustained-traffic.sh` also accepts a duration in seconds.

## Remove the fixtures

```bash
./test-files/cleanup.sh
```

Cleanup removes the optional PodMonitor, the `knative-map-test` namespace, and the cluster-scoped
`healthy.knative-map-test.local` ClusterDomainClaim. It does not change Knative's cluster-level
networking or certificate configuration.
