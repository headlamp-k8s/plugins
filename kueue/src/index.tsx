import { Icon } from '@iconify/react';
import {
  registerKindIcon,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import { ClusterQueues } from './ClusterQueue/List';
import { LocalQueues } from './LocalQueue/List';
import { Workloads } from './Workload/List';

registerSidebarEntry({
  parent: null,
  name: 'kueue',
  icon: 'mdi:tray-full',
  label: 'Kueue',
  url: '/kueue/clusterqueues',
});

registerSidebarEntry({
  parent: 'kueue',
  name: 'kueue-clusterqueues',
  label: 'ClusterQueues',
  url: '/kueue/clusterqueues',
});

registerRoute({
  path: '/kueue/clusterqueues',
  sidebar: 'kueue-clusterqueues',
  component: ClusterQueues,
  name: 'kueue-clusterqueue-list',
});

registerSidebarEntry({
  parent: 'kueue',
  name: 'kueue-localqueues',
  label: 'LocalQueues',
  url: '/kueue/localqueues',
});

registerRoute({
  path: '/kueue/localqueues',
  sidebar: 'kueue-localqueues',
  component: LocalQueues,
  name: 'kueue-localqueue-list',
});

registerSidebarEntry({
  parent: 'kueue',
  name: 'kueue-workloads',
  label: 'Workloads',
  url: '/kueue/workloads',
});

registerRoute({
  path: '/kueue/workloads',
  sidebar: 'kueue-workloads',
  component: Workloads,
  name: 'kueue-workload-list',
});

registerKindIcon('ClusterQueue', {
  icon: <Icon icon="mdi:tray-full" width="70%" height="70%" />,
  color: 'rgb(50, 108, 229)',
});

registerKindIcon('LocalQueue', {
  icon: <Icon icon="mdi:tray-arrow-down" width="70%" height="70%" />,
  color: 'rgb(50, 108, 229)',
});

registerKindIcon('Workload', {
  icon: <Icon icon="mdi:briefcase-outline" width="70%" height="70%" />,
  color: 'rgb(50, 108, 229)',
});
