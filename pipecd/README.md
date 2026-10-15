# PipeCD Headlamp Plugin

[PipeCD](https://pipecd.dev/) is a continuous delivery tool for Kubernetes,
Terraform, Cloud Run, Lambda and ECS. This plugin will show your PipeCD
applications inside Headlamp, so you can check what was deployed without
switching to the PipeCD console.

## Current state

This is the project scaffold. It adds a PipeCD section to the sidebar with a
single placeholder page, so the plugin builds and loads in Headlamp. There is
nothing to configure yet, and it does not talk to a PipeCD server.

Planned, in later changes:

- Applications list with sync status, platform and Git repository
- Application detail with recent deployments
- Deployment detail with pipeline stages
- Logs for each pipeline stage
- A settings page for the PipeCD server URL and API key
- A sync button

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

The PipeCD API client will be generated from PipeCD's protocol buffer
definitions using [buf](https://buf.build/) and `protoc-gen-es`. None of it is
in this change. `src/generated` is already listed in `.prettierignore` so the
generated files are skipped when formatting once they arrive.
