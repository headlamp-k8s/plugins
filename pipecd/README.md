# PipeCD Headlamp Plugin

[PipeCD](https://pipecd.dev/) is a continuous delivery tool for Kubernetes,
Terraform, Cloud Run, Lambda and ECS. This plugin shows your PipeCD
applications inside Headlamp, so you can check what was deployed without
switching to the PipeCD console.

## What it does

The plugin is read-only. It adds a PipeCD section to the sidebar with two
pages, Applications and Settings.

The Applications page lists your applications with their sync status, platform,
last synced time and Git repository. You can search by name or repository and
filter by platform.

Clicking an application opens its details: repository, path, piped, platform
provider, labels and its recent deployments. Clicking a deployment shows its
status, commit, who triggered it, how long it took, and the pipeline stages.
Each stage can be opened to read its logs.

You cannot trigger a sync or anything else that changes state. Those actions
need a read-write API key, so use the PipeCD console for them.

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

Use Test connection to check it works. The settings are saved in the browser's
local storage.

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
