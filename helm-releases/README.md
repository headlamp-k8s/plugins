# Helm Releases

Browse the Helm releases installed in a cluster from Headlamp, without changing anything.

The plugin adds a **Helm > Releases** entry to the sidebar:

- **Release list**, like `helm ls -A`: name, namespace, revision, last update, status, chart and
  app version. A summary counts the releases in each status, so a failed one is noticed.
- **Release details**, like `helm history`: every revision Helm kept, with its status, chart and
  description.
- **Revision content**: the user-supplied, chart default and computed values, like
  `helm get values`. A comparison of the values of two revisions, the release notes and the
  rendered manifest are available on demand.

## How it works

Helm keeps each revision of a release in a Secret named `sh.helm.release.v1.<name>.v<revision>`.
The plugin lists these Secrets through the Kubernetes API, with the permissions of the connected
user, and decodes them in the browser. It only sends `GET` requests.

It does not use Headlamp's backend Helm service, so an in-cluster deployment does not need the
`-enable-helm` flag. It lists the releases written by the `helm` CLI, Flux and other tools built
on the Helm SDK alike.

## Relation to App Catalog

[App Catalog](../app-catalog) installs charts and manages releases (upgrade, rollback, uninstall)
through Headlamp's backend Helm service. This plugin is a read-only complement that focuses on
what a revision contains. Both can be loaded together: their routes and sidebar entries do not
overlap.

## Permissions

A user sees the releases of the namespaces where they can `list` Secrets.

- With cluster-wide access, every release is listed, or only those of the namespaces picked in
  Headlamp's namespace filter.
- Without it, the page asks the user to pick namespaces in the namespace filter and reads those
  only. When the filter is empty, the allowed namespaces of the cluster settings are used.
- Namespaces that could not be read are reported above the list, so a partial list is not
  mistaken for a complete one.

## Sensitive values

Values and manifests often hold credentials. The entries that look like one, by their key (such
as `password` or `token`) or by their content (a private key, a URL with credentials), and the
data of the rendered `Secret` resources are masked until **Show sensitive values** is turned on.

This is a display courtesy, not an access control: whoever can open a release can already read
the Secret Helm stores it in.

## Chart icons

A release shows the icon its chart declares (`icon` in `Chart.yaml`) when it is an HTTPS URL. The
browser fetches that image from the chart publisher, not from the cluster, and sends no referrer.
Where the publisher cannot be reached, the icon is left out.

## Limitations

- Only Helm's default storage driver (Secrets) is supported, not the ConfigMap or SQL drivers.
- Helm does not keep the default values of subcharts in the release record, so the computed
  values only hold the subchart values that the parent chart or the user sets.
- Releases are read from the current cluster only.
- The interface is in English only.

## Local development

From this directory, with Node.js 22:

```sh
npm ci
npm run build
npm run tsc
npm run lint
npm run format -- --check
npm test
```

Use `npm run start` to load the plugin in a development Headlamp instance. See the
[Headlamp plugin development guide](https://headlamp.dev/docs/latest/development/plugins/).
