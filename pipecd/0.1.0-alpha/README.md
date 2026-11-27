# PipeCD Headlamp Plugin

> **Status: alpha.** This plugin is new and still changing.

Requires Headlamp 0.35 or newer for the plugin translation API.

[PipeCD](https://pipecd.dev/) is a continuous delivery tool for Kubernetes,
Terraform, Cloud Run, Lambda and ECS. This plugin shows your PipeCD
applications inside Headlamp, so you can check what was deployed without
switching to the PipeCD console.

The plugin talks to the PipeCD control plane with an API key. It does not need
PipeCD to run in the cluster that Headlamp is showing.

## Key terms

If you are new to PipeCD, these words appear across the plugin:

- **Control plane**: the PipeCD server. It stores your applications and
  deployments and serves the web console and the API this plugin uses.
- **Piped**: the agent that runs next to your workloads and does the actual
  deploying. One control plane can have many pipeds.
- **Application**: one thing PipeCD deploys, such as a Kubernetes app or a
  Terraform module, defined by a folder in a Git repository.
- **Deployment**: one run that brings an application to the state in Git. It
  goes through pipeline stages, and each stage has logs.
- **Sync status**: whether what is running matches Git. `Synced` means it
  does, `Out of Sync` means it has drifted.

## Features

The plugin adds a PipeCD section to the sidebar with Overview, Applications and
Settings.

The Overview page opens first. It shows counts for pipeds, applications and
deployments, the change failure rate, a chart of deployments over the last 24
hours or 7, 14 or 30 days, a list of pipeds and the newest deployments. Click a
deployment to open it.

The full piped list, with online and offline status, needs a PipeCD server newer
than v0.58.0. On an older server the Overview shows only the pipeds that have an
application or a recent deployment. If a piped runs in the cluster Headlamp is
showing, the Overview also says whether its pod is running.

The Applications page lists your applications with their sync status, platform,
last synced time and Git repository. You can search by name or repository, and
filter by platform.

Click an application to open its detail page, with its Git path, piped, labels
and recent deployments. Click a deployment to see its pipeline stages, and open
a stage to read its logs. A rollback stage only appears once it has run.

The application page also has a Sync button. It asks you to confirm first, and
its menu lets you pick Sync, Quick Sync or Pipeline Sync. Syncing needs a
`READ_WRITE` API key. With a read-only key everything else still works, and
Sync tells you the key cannot do it. Sync is turned off for a disabled
application.

Quick Sync and Pipeline Sync need a PipeCD server newer than v0.58.0. An older
server ignores the choice and runs its default sync, so check your version
first.

The Settings page stores the PipeCD server URL and API key, and can test the
connection to your control plane. The settings live in the browser: only the
server URL is persisted in local storage. The API key is kept
in memory for the current page lifetime.

## Before you start

You need:

- Headlamp, either the desktop app or Headlamp in a web browser.
- A PipeCD control plane that Headlamp can reach.
- A PipeCD API key.

Create the key in the PipeCD console under Settings → API Key. A read-only key
is enough to view everything. Use a read-write key if you want to sync.

The plugin calls PipeCD's `APIService` straight from Headlamp over gRPC-Web.
The Headlamp desktop app needs nothing more.

If you open Headlamp in a web browser, PipeCD must also allow CORS for the
origin Headlamp runs on, because the browser sends a preflight request before
every call. A default PipeCD install does not allow it. Allow the `POST` and
`OPTIONS` methods, allow the `authorization`, `content-type`, `x-grpc-web` and
`x-user-agent` headers, and expose `grpc-status` and `grpc-message`.

If CORS is missing, the browser blocks the call before it reaches PipeCD. The
settings page then says the connection failed, even though the server is fine
and the key is valid. In a browser, check this first if the connection test
does not work.

See the [PipeCD installation docs](https://pipecd.dev/docs/installation/) for
where to change the CORS config.

## Installation

### From the Plugin Catalog

Once the plugin is published to Artifact Hub, open the Plugin Catalog in the
Headlamp desktop app, search for PipeCD and install it.

### From source

Build the plugin:

```bash
git clone https://github.com/headlamp-k8s/plugins.git
cd plugins/pipecd
npm install
npm run build
```

Then make a folder named `pipecd` in Headlamp's plugins directory and copy
`package.json` and the whole `dist` folder's contents into it:

| OS      | Plugins directory                                |
| ------- | ------------------------------------------------ |
| Linux   | `~/.config/Headlamp/plugins`                     |
| macOS   | `~/Library/Application Support/Headlamp/plugins` |
| Windows | `%APPDATA%\Headlamp\Config\plugins`              |

Restart Headlamp. A PipeCD entry appears in the sidebar.

## Setting it up

1. In Headlamp, go to PipeCD → Settings.
2. Fill in the server URL, for example `https://pipecd.example.com`, and your
   API key.
3. Click Test Connection to check it works.
4. Click Save Settings.

The URL has to be `https://`. Plain `http://` is rejected because the API key
is sent in a header and would not be encrypted. The exception is `localhost`,
`127.0.0.1` and `::1`, so you can still point it at a local server while
developing.

Save Settings keeps your key available while navigating within Headlamp. After
reloading or closing Headlamp, re-enter the API key; the server URL is remembered.
To clear the key without reloading, empty the API Key field and save.

Previously persisted API keys are deleted from local storage when the plugin
loads, not restored into memory. Deleting a stored key does not revoke it in
PipeCD. If you suspect it was exposed, revoke it and generate a new key.

Memory-only storage prevents the plugin from persisting the key, but it does
not protect against malicious scripts or plugins running in the same renderer.
Only install trusted plugins. Keeping the PipeCD credential out of frontend
JavaScript entirely would require an authenticated, authorization-enforcing
backend or credential broker.

## Troubleshooting

| What you see                                        | What to check                                                                                          |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| "Connection failed" in a browser, but the URL works | CORS is not allowed for Headlamp's origin. See [Before you start](#before-you-start).                  |
| The URL field says to use `https://`                | Use `https://`, or `http://` only for `localhost`, `127.0.0.1` or `::1`.                               |
| An "unauthenticated" error                          | The API key is wrong or was revoked. Create a new one.                                                 |
| The plugin asks for the key again                   | This is expected after Headlamp reloads or restarts. The key is kept in memory only.                   |
| "This API key is read-only"                         | Sync needs a `READ_WRITE` key. Everything else works with a read-only key.                             |
| Quick Sync or Pipeline Sync runs a normal sync      | The PipeCD server is v0.58.0 or older and ignores the choice.                                          |
| The Overview shows fewer pipeds than the console    | The PipeCD server is v0.58.0 or older, so only pipeds with an app or a recent deployment can be found. |

## Limitations

- An API key belongs to one PipeCD project, so the plugin shows one project at
  a time.
- The plugin only reads from PipeCD and starts syncs. It cannot create, edit or
  delete applications; use the PipeCD console for that.

## Development

```bash
npm install
npm start          # watch build, loads into a running Headlamp
npm run build      # production build to dist/
npm run lint       # lint
npm run format     # format the code
npm run tsc        # type-check
npm test           # unit tests (Vitest)
```

The code in `src/generated` is generated from PipeCD's protobuf definitions
with [buf](https://buf.build/) and `protoc-gen-es`. It is committed so the
plugin builds without a generation step, and it is skipped when formatting.

For general Headlamp plugin development, see the
[plugin documentation](https://headlamp.dev/docs/latest/development/plugins/).

## License

Apache License 2.0.
