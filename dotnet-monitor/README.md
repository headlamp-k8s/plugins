# Headlamp .NET Monitor Plugin

Headlamp plugin that adds .NET diagnostic actions to Pod detail views when a Pod contains a `dotnet-monitor` sidecar.

It uses Headlamp's authenticated Kubernetes API path and the Kubernetes pod proxy:

`Browser -> Headlamp -> Kubernetes API server -> Pod proxy -> dotnet-monitor`

## Current API basis

Implemented against current Headlamp plugin APIs and the current dotnet-monitor documentation on `main` as of 2026-08.

- Headlamp plugin SDK: `@kinvolk/headlamp-plugin` `0.14.x`
- Headlamp extension points used: `registerDetailsViewSection`, `registerPluginSettings`, `ConfigStore`
- dotnet-monitor routes used:
  - `GET /processes`
  - `GET /info`
  - `GET /env`
  - `GET /metrics`
  - `GET /stacks`
  - `GET /exceptions`
  - `GET /logs`
  - `GET /dump`
  - `GET /gcdump`
  - `GET /trace`

Current dotnet-monitor docs show:

- `dump` types are `Mini`, `Full`, and `WithHeap` for heap-inclusive dumps.
- `trace` uses `profile` and `durationSeconds` query parameters on `GET /trace`.
- `logs`, `stacks`, and `exceptions` can be requested as text or structured JSON formats.

## Features

- Detects Pods with a `dotnet-monitor` or `dotnetmonitor` sidecar.
- Optionally requires a Pod label or annotation selector.
- Adds a Pod details section with per-application-container actions.
- Discovers processes from `GET /processes` and refreshes them every time the dialog opens.
- Supports:
  - full dump
  - heap-inclusive dump
  - mini dump
  - GC dump
  - trace download
  - metrics view
  - stacks
  - exceptions
  - logs
  - process info
  - environment info
- Shows confirmations for expensive operations.
- Handles `Pod` proxy errors, authorization failures, missing Pods, missing containers, invalid PIDs, and malformed responses.

## Settings

Plugin settings are stored in Headlamp's plugin configuration store.

Defaults:

- Monitor container name: `dotnet-monitor`
- Monitor port: `52323`
- Pod label selector: empty
- Pod annotation selector: empty

Optional API key support:

- dotnet-monitor API key auth uses the `Authorization: Bearer <token>` header.
- This plugin can send an API key from browser memory, but there is no secure server-side secret store in a pure Headlamp plugin.
- Prefer configuring dotnet-monitor without API-key auth on the pod proxy path, or use a browser-local session prompt only when required.

## Security review

Review these points before using this in production:

- `pods/proxy` grants access to Pod-proxied services, so scope RBAC tightly to namespaces where diagnostics are allowed.
- Dumps, traces, logs, and heap artifacts can contain secrets, tokens, connection strings, personally identifiable information, and other sensitive runtime state.
- Full dumps can be large and expensive to create.
- `dotnet-monitor` API-key auth cannot be kept server-side from a pure browser plugin. If you enable it, the key will be handled in the browser.
- A user with access to a Pod's proxy endpoint can invoke diagnostics for that Pod. That is expected, but it may be broader than the level of control you want for sensitive workloads.
- Cross-namespace access depends on the user's Headlamp/Kubernetes authorization. The plugin does not bypass Kubernetes authorization.

## Build

```bash
npm install
npm run build
```

## Local development

```bash
npm install
npm run start
```

Then load the plugin in a Headlamp instance configured for plugin development.

## Headlamp installation

Build the plugin and install the generated package into Headlamp's plugin directory.

```bash
npm run build
npm run package
```

The package command writes the tarball into `artifacts/` with the version in the filename:

```text
artifacts/headlamp-dotnet-monitor-0.1.8.tar.gz
```

Example local install into Headlamp Desktop's plugin directory:

```bash
mkdir -p ~/.config/Headlamp/plugins/headlamp-dotnet-monitor
tar -xzf artifacts/headlamp-dotnet-monitor-0.1.8.tar.gz -C ~/.config/Headlamp/plugins/headlamp-dotnet-monitor
```

If your Headlamp installation uses a different plugin directory, extract the tarball there instead. You can also publish the tarball through your preferred plugin catalog workflow.

## Release notes

Initial production-ready release of the plugin with:

- Pod/container detection for `dotnet-monitor` sidecars
- per-application-container action placement
- process discovery through the Kubernetes pod proxy
- dump, GC dump, trace, metrics, stacks, exceptions, logs, process info, and environment actions
- confirmation prompts for expensive operations
- structured runtime views for logs, stacks, and exceptions
- minimal RBAC guidance for `pods/proxy`

## RBAC

Minimum permission required for the plugin's network path:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: headlamp-dotnet-monitor
  namespace: default
rules:
  - apiGroups: [""]
    resources: ["pods/proxy"]
    verbs: ["get"]
```

Use a `ClusterRole` only if you want the same permission across multiple namespaces.

## Example Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-api-7d8c9f
  labels:
    app: my-api
    dotnet-monitor: "true"
spec:
  containers:
    - name: api
      image: my-api:1.2.3
      ports:
        - containerPort: 8080
    - name: dotnet-monitor
      image: mcr.microsoft.com/dotnet/monitor:9
      ports:
        - name: dotnet-monitor
          containerPort: 52323
      env:
        - name: DOTNETMONITOR_Urls
          value: http://+:52323
        - name: DOTNETMONITOR_DiagnosticPort__ConnectionMode
          value: Listen
```

## UX

- On a Pod details page, the plugin adds a `.NET Monitor` section.
- Each detected .NET application container gets its own action group.
- Clicking an action opens a dialog with:
  - process list and auto-selection
  - dump buttons
  - GC dump
  - trace configuration
  - metrics view
  - runtime actions for stacks, exceptions, logs, environment, and info
- Loading states are shown during collection.
- Expensive actions require confirmation.

## Supported versions

- Headlamp: current plugin SDK `0.14.x`
- dotnet-monitor: current `main` documentation and APIs as of 2026-08, including the current `WithHeap` dump type and `GET /trace` profile query API
- Kubernetes: any version that supports pod proxying and RBAC for `pods/proxy`
