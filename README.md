# Headlamp Plugins

This is a repository of official plugins that Headlamp uses or recommends.

## Current Plugins

| Plugin | Description | Notes | Maintainers |
| ---------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------- |
| [app-catalog](./app-catalog) | Provides a new area where users can install Helm charts and manage releases. | Desktop only. Shipped with Headlamp desktop builds by default. | [@ashu8912](https://github.com/ashu8912) |
| [backstage](./backstage) | Provides links to the resource's views in Backstage. | See also the [Headlamp integration for Backstage](https://github.com/headlamp-k8s/backstage-plugin). | [@yolossn](https://github.com/yolossn) |
| [flux](./flux) | Visualize Flux in Headlamp. | |[@ashu8912](https://github.com/ashu8912) |
| [kompose](./kompose) | Translates docker-compose manifests to Kubernetes's. | Runs kompose in a job in the cluster for now. | [@joaquimrocha](https://github.com/joaquimrocha) |
| [opencost](./opencost) | See the costs of your workloads in Headlamp. | |[@yolossn](https://github.com/yolossn)|
| [plugin-catalog](./plugin-catalog) | Install Headlamp plugins with one click. | Shipped with Headlamp desktop builds by default. |[@yolossn](https://github.com/yolossn) |
| [prometheus](./prometheus) | Provides a Prometheus-powered chart in the details views of workloads. | Needs Prometheus installed in the cluster for the chart to be shown. Shipped with Headlamp desktop and CI builds by default. | [@yolossn](https://github.com/yolossn) |
| [cert-manager](./cert-manager) | A UI for viewing and managing cert-manager. | |[@yolossn](https://github.com/yolossn)|
| [minikube](./minikube) | A UI for minikube, for running Kubernetes locally. | |[@illume](https://github.com/illume)|

## Development

For examples of plugins created for learning and documentation purposes, please refer to the [examples folder](https://github.com/headlamp-k8s/headlamp/tree/main/plugins#plugins) in Headlamp's repository.

## License

The plugins in this repository are released under the terms of the [MIT license](./LICENSE).
