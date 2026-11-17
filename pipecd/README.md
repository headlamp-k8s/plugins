# PipeCD Headlamp Plugin

[PipeCD](https://pipecd.dev/) is a continuous delivery tool for Kubernetes,
Terraform, Cloud Run, Lambda and ECS. This plugin will show your PipeCD
applications inside Headlamp, so you can check what was deployed without
switching to the PipeCD console.

## Current state

The plugin adds a PipeCD section to the sidebar with Applications and Settings.

The Applications page lists your applications with their sync status, platform,
last synced time and Git repository. You can search by name or repository, and
filter by platform.

The Settings page stores the PipeCD server URL and API key, and can test the
connection to your control plane. It is read-only, and the settings live in the
browser: only the server URL is persisted in local storage. The API key is kept
in memory for the current page lifetime.

Everything is read-only. Coming in later changes:

- Application detail with recent deployments
- Deployment detail with pipeline stages
- Logs for each pipeline stage
- A sync button

## Before you start

You need a PipeCD control plane that your browser can reach, and an API key.

Create the key in the PipeCD console under Settings → API Keys. A read-only key
is enough.

You also need to let the browser talk to PipeCD. The plugin calls PipeCD's
`APIService` straight from the browser over gRPC-Web, and a default PipeCD
install will block that, so two things need setting up in the gateway:

- gRPC-Web has to be turned on for the route that serves `APIService`. PipeCD
  uses Envoy for this.
- CORS has to allow the origin Headlamp runs on. The browser sends a preflight
  request before every call.

For CORS, allow the `POST` and `OPTIONS` methods, allow the `authorization`,
`content-type`, `x-grpc-web` and `x-user-agent` headers, and expose
`grpc-status` and `grpc-message`.

If this is missing, the browser blocks the call before it reaches PipeCD. The
settings page then says the connection failed, even though the server is fine
and the key is valid. It is worth checking this first if the connection test
does not work.

See the [PipeCD installation docs](https://pipecd.dev/docs/installation/) for
where to change the gateway config.

## Setting it up

Go to PipeCD → Settings in Headlamp and fill in the server URL and your API
key, for example `https://pipecd.example.com`.

The URL has to be `https://`. Plain `http://` is rejected because the API key
is sent in a header and would not be encrypted. The exception is localhost, so
you can still point it at a local server while developing.

Use Test connection to check it works.

Save Settings keeps your key available while navigating within Headlamp. After
reloading or closing Headlamp, re-enter the API key; the server URL is remembered.
To clear the key without reloading, empty the API Key field and save.

Previously persisted API keys are deleted from local storage when the plugin
loads, not restored into memory. Deleting a stored key does not revoke it in
PipeCD. If you suspect it was exposed, revoke it and generate a new read-only key.

Memory-only storage prevents the plugin from persisting the key, but it does
not protect against malicious scripts or plugins running in the same renderer.
Only install trusted plugins. Keeping the PipeCD credential out of frontend
JavaScript entirely would require an authenticated, authorization-enforcing
backend or credential broker.

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

The code in `src/generated` is generated from PipeCD's protobuf definitions
with [buf](https://buf.build/) and `protoc-gen-es`. It is committed so the
plugin builds without a generation step, and it is skipped when formatting.
