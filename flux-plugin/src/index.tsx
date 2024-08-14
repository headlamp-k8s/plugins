import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import FluxApplicationDetailView from './flux-applications/application';
import FluxApplications from './flux-applications/applications';
import { FluxImageAutomationDetailView } from './flux-image-automation/image-automation';
import ImageAutomation from './flux-image-automation/image-automations';
import Notification from './flux-notifications/notification';
import Notifications from './flux-notifications/notifications';
import FluxRunTime from './flux-runtime/runtime';
import FluxSourceDetailView from './flux-sources/source';
import FluxSources from './flux-sources/sources';
import { Kustomizations } from './flux-kustomizations/kustomizations';
import { HelmReleases } from './flux-helmreleases/helmreleases';
import FluxHelmReleaseDetailView from './flux-helmreleases/helmrelease';
import FluxKustomizationDetailView from './flux-kustomizations/kustomization';

registerSidebarEntry({
  parent: null,
  name: 'flux',
  label: 'Flux',
  icon: 'mdi:source-branch',
  url: '/flux/kustomizations',
});

registerSidebarEntry({
  parent: 'flux',
  name: 'kustomizations',
  label: 'Kustomizations',
  url: '/flux/kustomizations',
});

registerRoute({
  path: '/flux/kustomizations',
  parent: 'flux',
  sidebar: 'kustomizations',
  component: () => <Kustomizations />,
  exact: true,
  name: 'kustomizations',
});

registerRoute({
  path: '/flux/helmreleases',
  parent: 'flux',
  sidebar: 'helmreleases',
  component: () => <HelmReleases />,
  exact: true,
  name: 'helmreleases',
});

registerSidebarEntry({
  parent: 'flux',
  name: 'helmreleases',
  label: 'HelmReleases',
  url: '/flux/helmreleases',
});

registerSidebarEntry({
  parent: 'flux',
  name: 'sources',
  label: 'Sources',
  url: '/flux/sources',
});

registerRoute({
  path: '/flux/sources',
  parent: 'flux',
  sidebar: 'sources',
  component: () => <FluxSources />,
  exact: true,
  name: 'sources',
});

registerRoute({
  path: '/flux/kustomizations/:namespace/:name',
  parent: 'flux',
  sidebar: 'kustomizations',
  component: () => <FluxKustomizationDetailView />,
  exact: true,
  name: 'kustomizations',
});

registerRoute({
  path: '/flux/helmreleases/:namespace/:name',
  parent: 'flux',
  sidebar: 'helmreleases',
  component: () => <FluxHelmReleaseDetailView />,
  exact: true,
  name: 'helmrelease',
});

registerRoute({
  path: '/flux/sources/:namespace/:type/:name',
  parent: 'flux',
  sidebar: 'sources',
  component: () => <FluxSourceDetailView />,
  exact: true,
  name: 'source',
});

registerSidebarEntry({
  parent: 'flux',
  name: 'image-automations',
  label: 'Image Automations',
  url: '/flux/image-automations',
});

registerRoute({
  path: '/flux/image-automations',
  parent: 'flux',
  sidebar: 'image-automations',
  component: () => <ImageAutomation />,
  exact: true,
  name: 'image-automations',
});

registerRoute({
  path: '/flux/image-automations/:namespace/:type/:name',
  parent: 'flux',
  sidebar: 'image-automations',
  component: () => <FluxImageAutomationDetailView />,
  exact: true,
  name: 'image-automation',
});

registerSidebarEntry({
  parent: 'flux',
  name: 'notifications',
  label: 'Notifications',
  url: '/flux/notifications',
});

registerRoute({
  path: '/flux/notifications',
  parent: 'flux',
  sidebar: 'notifications',
  component: () => <Notifications />,
  exact: true,
});

registerRoute({
  path: '/flux/notifications/:namespace/:type/:name',
  parent: 'flux',
  sidebar: 'notifications',
  component: () => <Notification />,
  exact: true,
});

registerSidebarEntry({
  parent: 'flux',
  name: 'flux-runtime',
  label: 'Flux Runtime',
  url: '/flux/runtime',
});

registerRoute({
  path: '/flux/runtime',
  parent: 'flux',
  sidebar: 'flux-runtime',
  component: () => <FluxRunTime />,
});
