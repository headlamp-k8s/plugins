# Knative

[Knative](https://knative.dev/) provides powerful serverless capabilities to Kubernetes, such as scale to zero, revision-based deployment, traffic splitting, etc. While the kn CLI provides strong operational control, a visual interface is beneficial for many Kubernetes users.

The [knative plugin for headlamp](https://github.com/headlamp-k8s/plugins/tree/main/knative) fills this very gap by providing an intuitive visual interface for managing Knative resources like KService, Revisions and Networking.

This allows users to Add/Edit KService, View Revisions, Manage traffic splitting between revisions, Autoscaling configuration and Shows Network Details.

## KService

A Knative Service (KService) is the top-level resource that manages the entire lifecycle of your serverless workload. It automatically provisions the underlying routes, configurations, and revisions needed to get your application running and exposed to traffic.

![KService list view](https://github.com/user-attachments/assets/af9a65d2-14f3-4314-9dd5-5149a662986e)

Since many fields may require frequent changes, we have added a toggle switch to switch between Read and Edit mode.

![KService edit mode](https://github.com/user-attachments/assets/f02b1266-fc2f-47be-83e8-d4a24f54e564)

## Traffic Splitting

Traffic splitting between all revisions are shown along with their tags which redirect to their respective URL.

![Traffic splitting](https://github.com/user-attachments/assets/1b04e739-e5bd-4091-ae06-bb9fa966aa8b)

## Autoscaling Configuration

Autoscaling features like Target Utilization %, Container Concurrency, Activation Scale, etc.

![Autoscaling configuration](https://github.com/user-attachments/assets/4950897b-db9e-4e8e-9d69-79aa6cbe86da)

## Revisions

A Revision is a point-in-time, immutable snapshot of your code and configuration. Every time you update a KService, Knative automatically generates a new Revision. This makes it incredibly easy to roll back to previous versions or run multiple versions simultaneously for A/B testing.

![Revisions list](https://github.com/user-attachments/assets/118f2c0a-fb68-41a2-b167-a65aff4d1de0)

The Revision view surfaces information like incoming traffic, tags, parent service, concurrency control, etc.

![Revision detail](https://github.com/user-attachments/assets/6785e04e-9cd3-461c-aa6c-aae2c5bf23d6)

It also provides detailed information about each container, displaying the associated image, exposed ports, and environment variables.

![Container details](https://github.com/user-attachments/assets/e9e1448d-b526-4f4e-a08d-112998c2d83e)

## Networking

A clear overview of the ingress settings.

![Networking overview](https://github.com/user-attachments/assets/ad3c3f12-2109-4f0f-9f75-6d0654415906)

## Custom Domains (DomainMapping)

Map your own custom domains to KServices using DomainMapping and ClusterDomainClaim, with an overview of ready status and associated URLs.

![Custom domains](https://github.com/user-attachments/assets/b926bae3-115d-4a38-9d5b-0813c574637c)

## Knative Installation

Please refer to the [official installation guide](https://knative.dev/docs/install/) for Knative to learn to install it.

## Plugin Installation in Headlamp for Desktop

Go to the Plugin Catalog, search for the Knative plugin, and click the Install button. Reload the UI (Navigation menu > Reload, or use the notification after installing the plugin) to see the new Knative item in the sidebar.

## Contributors

Thanks to all the contributors who made this release possible!

@kahirokunn, @mudit06mah, @intojhanurag, @Sbragul26, @skoeva, @illume, @joaquimrocha
