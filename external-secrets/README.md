# External Secrets Operator plugin for Headlamp

This plugin shows [External Secrets Operator](https://external-secrets.io/) (ESO) resources in
[Headlamp](https://headlamp.dev/). ESO syncs secrets from external providers (AWS Secrets
Manager, HashiCorp Vault, Google Secret Manager, and many more) into Kubernetes Secrets.

## Features

- ExternalSecrets list: referenced store, target Secret (linked), Ready condition, refresh
  interval, and last refresh time.
- ExternalSecret details: sync status with the Ready condition reason and message, the
  data mappings from provider entries to target Secret keys, and status conditions.
- Detects whether ESO is installed on the cluster and links to the install guide when not.

## Prerequisites

- External Secrets Operator installed in the cluster, serving `external-secrets.io/v1`
  (ESO v0.17 and later). Clusters that only serve `v1beta1` are not supported yet. If you have
  not installed it yet, see the ESO
  [getting started guide](https://external-secrets.io/latest/introduction/getting-started/).

## Development

Run Headlamp and point it at this plugin's build output:

```bash
cd external-secrets
npm install
npm run start
```

Then run your Headlamp desktop app or dev instance, which picks up the plugin from the
default plugins directory.

## Testing

```bash
npm test        # unit tests and story snapshots
npm run lint
npm run tsc
npm run storybook   # interactive stories
```

## Roadmap

- SecretStore and ClusterSecretStore views with the Valid condition.
- PushSecret, ClusterExternalSecret, and ClusterPushSecret views.
- A map view source for the Headlamp resource map.
