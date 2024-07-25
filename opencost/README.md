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
