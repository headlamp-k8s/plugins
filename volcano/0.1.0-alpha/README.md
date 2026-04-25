# Volcano Headlamp Plugin

This [Headlamp](https://headlamp.dev/) plugin adds Volcano resources to the Headlamp UI so Kubernetes operators can inspect batch scheduling state with list and detail pages.

## Features

- **Volcano Jobs** (`batch.volcano.sh/v1alpha1`)

  - List view with status, queue, running/min-available, task count, and age
  - Detail view with summary info, Pod status section, tasks section, and events
  - Queue link and related PodGroup link from job detail (when available)

- **Volcano Queues** (`scheduling.volcano.sh/v1beta1`)

  - List view with state, weight, parent, and age
  - Detail view with capacity limits, allocated resources, and events
  - Parent queue navigation links

- **Volcano PodGroups** (`scheduling.volcano.sh/v1beta1`)

  - List view with phase, min member, running count, queue, and age
  - Detail view with progress, conditions, min resources, and events
  - Fallback message when conditions are not reported

- **Plugin Navigation and UX**
  - Dedicated `Volcano` sidebar section in Headlamp
  - Consistent status color rendering across Jobs, Queues, and PodGroups

## Plugin Installation in Headlamp for Desktop

Go to the Plugin Catalog, search for the Volcano plugin, and click the Install button. Reload the UI (Navigation menu > Reload, or use the notification after installing the plugin) to see the new Volcano item in the sidebar.

## Demo

https://github.com/user-attachments/assets/fbdef40e-2130-4e4e-bb18-a93dd129c834
