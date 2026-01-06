# Headlamp Plugins

This is a repository of official plugins that Headlamp uses or recommends.

[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/7551/badge)](https://www.bestpractices.dev/projects/7551)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/headlamp-k8s/plugins/badge)](https://scorecard.dev/viewer/?uri=github.com/headlamp-k8s/plugins)


## Current Plugins

| Plugin | Description | Notes | Maintainers |
| ---------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------- |
| [ai-assistant](./ai-assistant) | Integrates AI capabilities directly into Headlamp. | | [@ashu8912](https://github.com/ashu8912) |
| [app-catalog](./app-catalog) | Provides a new area where users can install Helm charts and manage releases. | Desktop only. Shipped with Headlamp desktop builds by default. | [@ashu8912](https://github.com/ashu8912) |
| [backstage](./backstage) | Provides links to the resource's views in Backstage. | See also the [Headlamp integration for Backstage](https://github.com/headlamp-k8s/backstage-plugin). | [@yolossn](https://github.com/yolossn) |
| [cert-manager](./cert-manager) | A UI for viewing and managing cert-manager. | | [@yolossn](https://github.com/yolossn) |
| [flux](./flux) | Visualize Flux in Headlamp. | |[@ashu8912](https://github.com/ashu8912) |
| [karpenter](./karpenter) | Adds Karpenter-specific custom resources to the Headlamp UI. | | [@SinghaAnirban005](https://github.com/SinghaAnirban005) |
| [keda](./keda) | A UI for viewing and managing KEDA resources. | | [@adwait-godbole](https://github.com/adwait-godbole), [@yolossn](https://github.com/yolossn) |
| [knative](./knative) | A UI for viewing and managing Knative. | | [@kahirokunn](https://github.com/kahirokunn) |
| [kompose](./kompose) | Translates docker-compose manifests to Kubernetes's. | Runs kompose in a job in the cluster for now. | [@joaquimrocha](https://github.com/joaquimrocha) |
| [minikube](./minikube) | A UI for minikube, for running Kubernetes locally. | | [@illume](https://github.com/illume) |
| [opencost](./opencost) | See the costs of your workloads in Headlamp. | | [@yolossn](https://github.com/yolossn) |
| [plugin-catalog](./plugin-catalog) | Install Headlamp plugins with one click. | Shipped with Headlamp desktop builds by default. |[@yolossn](https://github.com/yolossn) |
| [prometheus](./prometheus) | Provides a Prometheus-powered chart in the details views of workloads. | Needs Prometheus installed in the cluster for the chart to be shown. Shipped with Headlamp desktop and CI builds by default. | [@yolossn](https://github.com/yolossn) |

## External plugins

These are some of the plugins maintained outside of the plugins repo by others.

Please see [headlamp plugins on Artifact Hub](https://artifacthub.io/packages/search?kind=21&sort=relevance&page=1) for a list of plugins published there.

| Plugin | Description | Notes | Maintainers |
| ---------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------- |
| [inspektor-gadget](https://github.com/inspektor-gadget/headlamp-plugin/) | This is a Headlamp plugin exposing and show-casing IG gadgets. |  | [@ashu8912](https://github.com/ashu8912) |
| [Trivy](https://github.com/kubebeam/trivy-headlamp-plugin) | Trivy compliance and vulnerabilities in Headlamp. |   | [@mgalesloot](https://github.com/mgalesloot) |
| [Kyverno](https://github.com/kubebeam/kyverno-headlamp-plugin) | The Kyverno Headlamp plugin provides views in Headlamp for Policies and Reports. | Archived.  | [@mgalesloot](https://github.com/mgalesloot) |
| [Kubescape](https://github.com/kubescape/headlamp-plugin) | The Kubescape Headlamp plugin provides views in Headlamp for configuration and vulnerabilities scanning, based on information delivered by the Kubescape operator. |  | [@mgalesloot](https://github.com/mgalesloot) |
| [KubeVirt](https://github.com/buttahtoast/headlamp-plugins/tree/main/kubevirt) | A plugin for managing KubeVirt virtual machines within a Kubernetes cluster. |   | [@buttahtoast](https://github.com/buttahtoast) |
| [Gatekeeper](https://github.com/sozercan/gatekeeper-headlamp-plugin) | A Headlamp plugin for managing [Gatekeeper](https://open-policy-agent.github.io/gatekeeper/) policies, violations, and a library of community-sourced policies. | | [@sozercan](https://github.com/sozercan) |
| [KAITO](https://github.com/kaito-project/headlamp-kaito) | Enhances the KAITO AKS extension with a visual interface in Headlamp for model deployment and GPU provisioning. | |[@chloe608](https://github.com/chloe608), [@chewong](https://github.com/chewong)|



## Development

For examples of plugins created for learning and documentation purposes, please refer to the [examples folder](https://github.com/headlamp-k8s/headlamp/tree/main/plugins#plugins) in Headlamp's repository.

## License

The plugins in this repository are released under the terms of the [MIT license](./LICENSE).
