# Headlamp Plugins

This is a repository of official plugins that Headlamp uses or recommends.

## Current Plugins

Plugin                                                          | Description                                                                   | Obs.
------                                                          | -----------                                                                   | ----------
[app-catalog](./app-catalog)                                    | Provides a new area where users can install Helm charts and manage releases.  | Desktop only. Shipped with Headlmp desktop builds by default.
[backstage](./backstage)                                    | Provides links to the resource's views in Backstage.  | See also the [Headlamp integration for Backstage](https://github.com/headlamp-k8s/backstage-plugin)
[flux](./flux)                                      | Visualize Flux in Headlamp. |
[kompose](./kompose)                                            | Translates docker-compose manifests to Kubernetes's.                          | Runs kompose in a job in the cluster for now.
[opencost](./opencost)                                      | See the costs of your workloads in Headlamp. |
[plugin-catalog](./plugin-catalog)                                      | Install Headlamp plugins with one click. | Shipped with Headlmp desktop builds by default.
[prometheus](./prometheus)                                      | Provides a Prometheus powered chart in the details views of workloads.  | Needs Prometheus installed in the cluster for the chart to be shown. Shipped with Headlmp desktop and CI builds by default.

## Development

For examples of plugins created for learning and documentation purposes, please refer to the [examples folder](https://github.com/headlamp-k8s/headlamp/tree/main/plugins#plugins) in Headlamp's repository.

## License

The plugins in this repository are released under the terms of the [MIT license](./LICENSE).
