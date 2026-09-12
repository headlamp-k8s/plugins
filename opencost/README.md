# OpenCost

This plugin uses the [OpenCost](https://www.opencost.io/) project to add information about a cluster's cost to [Headlamp](https://headlamp.dev).
It will add a new column to tables listing Kubernetes resources, as well as charts, showing the cost of each resource over the selected time.

## Requirements

This plugins needs the following projects running in your cluster:
- OpenCost ([instructions](https://www.opencost.io/docs/installation/helm))
- Prometheus ([instructions](https://prometheus.io/docs/prometheus/latest/installation/))

## Configuration

Once the plugin is installed, go to the plugin's settings page and configure the service's URL
and any other desired customizations.

By default, the plugin talks to OpenCost through the Kubernetes apiserver's service-proxy path
(`/api/v1/namespaces/<namespace>/services/<service>/proxy/...`). Some clusters (for example, EKS
with certain CNI/networking configurations) reject this kind of apiserver proxying with
`error trying to reach service: Address is not allowed`. If you hit that error, set the
**Service URL** setting to a full `http(s)://` URL that OpenCost is reachable at directly (e.g. an
Ingress or Gateway API address) instead of a `<service-name>:<port-name>` value, and the plugin
will query it directly instead of going through the apiserver proxy. Note that the URL must be
directly reachable from your browser, including CORS if OpenCost is exposed on a different origin
than Headlamp.
