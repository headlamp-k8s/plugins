import { addIcon } from '@iconify/react';
import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { HelmReleases } from './helm-releases/HelmReleaseList';
import { FluxHelmReleaseDetailView } from './helm-releases/HelmReleaseSingle';
import { ImageAutomation } from './image-automation/ImageAutomationList';
import { FluxImageAutomationDetailView } from './image-automation/ImageAutomationSingle';
import { Kustomizations } from './kustomizations/KustomizationList';
import { FluxKustomizationDetailView } from './kustomizations/KustomizationSingle';
import { Notifications } from './notifications/NotificationList';
import { Notification } from './notifications/NotificationSingle';
import { FluxRunTime } from './runtime/RuntimeList';
import { FluxSources } from './sources/SourceList';
import { FluxSourceDetailView } from './sources/SourceSingle';

addIcon('simple-icons:flux', {
  body: '<path fill="currentColor" d="M11.402 23.747q.231.112.454.238c.181.038.37.004.525-.097l.386-.251c-1.242-.831-2.622-1.251-3.998-1.602zm-7.495-5.783a8 8 0 0 1-.222-.236a.696.696 0 0 0 .112 1.075l2.304 1.498c1.019.422 2.085.686 3.134.944c1.636.403 3.2.79 4.554 1.728l.697-.453c-1.541-1.158-3.327-1.602-5.065-2.03c-2.039-.503-3.965-.977-5.514-2.526m1.414-1.322l-.665.432q.033.037.068.073c1.702 1.702 3.825 2.225 5.877 2.731c1.778.438 3.469.856 4.9 1.982l.682-.444c-1.612-1.357-3.532-1.834-5.395-2.293c-2.019-.497-3.926-.969-5.467-2.481m7.502 2.084c1.596.412 3.096.904 4.367 2.036l.67-.436c-1.484-1.396-3.266-1.953-5.037-2.403zm.698-2.337l-.698-.174v.802l.512.127c2.039.503 3.965.978 5.514 2.526l.007.009l.663-.431l-.121-.128c-1.702-1.701-3.824-2.225-5.877-2.731m-.698-1.928v.816c.624.19 1.255.347 1.879.501c2.039.502 3.965.977 5.513 2.526q.116.116.226.239a.704.704 0 0 0-.238-.911l-3.064-1.992c-.744-.245-1.502-.433-2.251-.618a31 31 0 0 1-2.065-.561m-1.646 3.049c-1.526-.4-2.96-.888-4.185-1.955l-.674.439c1.439 1.326 3.151 1.88 4.859 2.319zm0-1.772a8.5 8.5 0 0 1-2.492-1.283l-.686.446c.975.804 2.061 1.293 3.178 1.655zm0-1.946a8 8 0 0 1-.776-.453l-.701.456c.462.337.957.627 1.477.865zm3.533.269l-1.887-1.226v.581q.922.386 1.887.645m5.493-8.863L12.381.112a.7.7 0 0 0-.762 0L3.797 5.198a.698.698 0 0 0 0 1.171l7.38 4.797V7.678a.414.414 0 0 0-.412-.412h-.543a.413.413 0 0 1-.356-.617l1.777-3.079a.412.412 0 0 1 .714 0l1.777 3.079a.413.413 0 0 1-.356.617h-.543a.414.414 0 0 0-.412.412v3.488l7.38-4.797a.7.7 0 0 0 0-1.171" />',
  width: 24,
  height: 24,
});

registerSidebarEntry({
  parent: null,
  name: 'flux',
  label: 'Flux',
  icon: 'simple-icons:flux',
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
  path: '/flux/kustomize/kustomizations/:namespace/:name',
  parent: 'flux',
  sidebar: 'kustomizations',
  component: () => <FluxKustomizationDetailView />,
  exact: true,
  name: 'kustomize',
});

registerRoute({
  path: '/flux/helm/helmreleases/:namespace/:name',
  parent: 'flux',
  sidebar: 'helmreleases',
  component: () => <FluxHelmReleaseDetailView />,
  exact: true,
  name: 'helm',
});

registerRoute({
  path: '/flux/source/:pluralName/:namespace/:name',
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
  path: '/flux/image/:pluralName/:namespace/:name',
  parent: 'flux',
  sidebar: 'image-automations',
  component: () => <FluxImageAutomationDetailView />,
  exact: true,
  name: 'image',
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
  path: '/flux/notification/:pluralName/:namespace/:name',
  parent: 'flux',
  sidebar: 'notifications',
  component: () => <Notification />,
  exact: true,
  name: 'notification',
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
