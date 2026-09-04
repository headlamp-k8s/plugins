# PipeCD

A UI for viewing [PipeCD](https://pipecd.dev) application sync status and deployment history alongside your Kubernetes resources, no separate tab or login needed.

## Features

- **Applications list** — every PipeCD application with a platform badge (Kubernetes, Terraform, Cloud Run, Lambda, ECS), a colour-coded sync status chip, relative last-deployed time, and Git path
- **Search + filter** — search by name or repo, filter by platform kind
- **Settings page** — enter a server URL and API key, and test the connection live
- **Full error / loading / empty states**

Talks to a real PipeCD control plane over gRPC-Web, using a client generated directly from PipeCD's own `.proto` definitions (`apiservice.APIService`, the same API-key-authenticated surface `pipectl` and CI integrations use).

## Configuration

1. Generate a PipeCD API key from the PipeCD web UI: **Settings → API Keys**. `READ_ONLY` is enough to browse; `READ_WRITE` will be needed once syncing is added.
2. In Headlamp, open **PipeCD → Settings**.
3. Enter your PipeCD server URL and the API key, then **Test Connection**.
4. Open **PipeCD → Applications**.

## Development

```bash
npm install
npm start          # dev server with hot reload
npm run build       # production build
npm run lint        # ESLint
npm test            # unit tests
```

## Status

This plugin is under active development as part of an [LFX Mentorship](https://mentorship.lfx.linuxfoundation.org/) term. See [pipe-cd/pipecd#6706](https://github.com/pipe-cd/pipecd/issues/6706) for the tracking issue. Not yet supported: triggering a sync, live/streaming deployment state, and manual pipeline gates — none of these are exposed on the API-key surface this plugin authenticates against.
