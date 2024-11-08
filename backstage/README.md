# Backstage

The Backstage plugin adds a Open with Backstage button to the resource detail view. If
the plugin detects that the page is inside a Backstage iframe, it will send a
message to the parent page to open the resource in the Backstage UI.

## Steps to run in dev mode

1. Install the dependencies

```bash
npm install
```

2. Run the plugin

```bash
npm run start
```

## Steps to build the plugin

1. Install the dependencies

```bash
npm install
```

2. Build the plugin

```bash
npm run build
```

## Developing Headlamp plugins

For more information on developing Headlamp plugins, please refer to:

- [Getting Started](https://headlamp.dev/docs/latest/development/plugins/), How to create a new Headlamp plugin.
- [API Reference](https://headlamp.dev/docs/latest/development/api/), API documentation for what you can do
- [UI Component Storybook](https://headlamp.dev/docs/latest/development/frontend/#storybook), pre-existing components you can use when creating your plugin.
- [Plugin Examples](https://github.com/headlamp-k8s/headlamp/tree/main/plugins/examples), Example plugins you can look at to see how it's done.
