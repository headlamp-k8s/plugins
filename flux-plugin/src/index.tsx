import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import FluxSources from './flux-sources/sources';
import FluxApplications from './flux-applications/applications';
import FluxApplicationDetailView from './flux-applications/application';
import FluxSourceDetailView from './flux-sources/source';
import Notifications from './flux-notifications/notifications';
import FluxRunTime from './flux-runtime/runtime';
import ImageAutomation from './flux-image-automation/image-automations';
import { FluxImageAutomationDetailView } from './flux-image-automation/image-automation';

registerSidebarEntry({
  parent: null,
  name: 'flux',
  label: 'Flux',
  icon: 'mdi:source-branch',
  url: '/flux/applications',
});

registerSidebarEntry({
  parent: 'flux',
  name: 'applications',
  label: 'Applications',
  url: '/flux/applications',
});

registerRoute({
  path: '/flux/applications',
  parent: 'flux',
  sidebar: 'applications',
  component: () => <FluxApplications />,
  exact: true,
  name: 'applications',
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
  path: '/flux/applications/:namespace/:type/:name',
  parent: 'flux',
  sidebar: 'applications',
  component: () => <FluxApplicationDetailView />,
  exact: true,
  name: 'application',
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
