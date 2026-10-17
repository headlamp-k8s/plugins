# PipeCD Headlamp Plugin

[PipeCD](https://pipecd.dev/) is a continuous delivery tool for Kubernetes,
Terraform, Cloud Run, Lambda and ECS. This plugin will show your PipeCD
applications inside Headlamp, so you can check what was deployed without
switching to the PipeCD console.

## Current state

The plugin adds a PipeCD section to the sidebar with two entries. Settings
works. Applications is still a placeholder.

The Settings page stores the PipeCD server URL and API key, and can test the
connection to your control plane. It is read-only, and the settings live in the
browser's local storage.

Coming in later changes:

- Applications list with sync status, platform and Git repository
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
