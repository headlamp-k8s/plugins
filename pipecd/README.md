# PipeCD Headlamp Plugin

This plugin adds a Headlamp UI for [PipeCD](https://pipecd.dev/), a continuous
delivery system for Kubernetes, Terraform, Cloud Run, Lambda, and ECS.

It shows the delivery state of your PipeCD applications alongside the Kubernetes
resources in Headlamp.

## Current Scope

The plugin is read-only. It adds a PipeCD section to the sidebar with
Applications and Settings pages.

- **Applications** — a list of applications with sync status, platform kind,
  last synced time, and Git repository, with search and a platform filter.
- **Application detail** — repository, path, piped, platform provider, labels,
  last synced time, and recent deployments.
- **Deployment detail** — status, commit, who triggered it, duration, and the
  pipeline stages.
- **Stage logs** — logs for each pipeline stage, with timestamps.
- **Settings** — PipeCD server URL and API key, with a connection test.

Actions that change state, such as triggering a sync, are not supported. Use the
PipeCD console for those.

## Prerequisites

A running PipeCD control plane and an API key for your project.

Create the key in the PipeCD console under **Settings → API Keys**. A read-only
key is sufficient.

## Configuration

Open **PipeCD → Settings** in Headlamp and enter:

| Field             | Example                      |
| ----------------- | ---------------------------- |
| PipeCD server URL | `https://pipecd.example.com` |
| API key           | the key created above        |

Use **Test connection** to check that the server is reachable and the key is
accepted. The settings are stored in the browser's local storage.

The PipeCD server must accept gRPC-Web requests from the Headlamp origin.

## Development

```bash
npm install
npm start
npm run build
npm run lint
npm run format
npm run tsc
npm test
```

The API client in `src/generated` is generated from PipeCD's protocol buffer
definitions using [buf](https://buf.build/) and `protoc-gen-es`. It is committed
so that the plugin builds without a generation step, and it is excluded from
formatting.
