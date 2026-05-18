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
* **`01-service-rollback-v1.yaml`**: Step 1 for the rollback scenario, deploying the initial `v1` revision.
* **`02-service-rollback-v2.yaml`**: Step 2 for the rollback scenario, deploying `v2` but pinning 100% traffic to `v1` (`stable`) and 0% to `v2` (`canary`) to test tag visualization.
* **`03-domainmapping-healthy.yaml`**: Creates a healthy `DomainMapping` and its requisite `ClusterDomainClaim` to test active mapping edges on the graph.
* **`03-domainmapping-broken-ref.yaml`**: Creates a `DomainMapping` targeting a non-existent Knative Service to verify the map handles broken references gracefully.
* **`03-domainmapping-core-svc.yaml`**: Creates a `DomainMapping` targeting a core Kubernetes `v1 Service` to ensure the map ignores non-Knative targets.
