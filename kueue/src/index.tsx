import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import ClusterQueueDetail from './components/clusterqueues/Detail';
import ClusterQueueList from './components/clusterqueues/List';
import LocalQueueDetail from './components/localqueues/Detail';
import LocalQueueList from './components/localqueues/List';
import ResourceFlavorDetail from './components/resourceflavors/Detail';
import ResourceFlavorList from './components/resourceflavors/List';
import { kueueRouteNames, kueueRoutePaths } from './utils/kueueRoutes';

registerSidebarEntry({
  parent: null,
  name: 'kueue',
  label: 'Kueue',
  icon: 'mdi:queue-first-in-last-out',
  url: kueueRoutePaths.clusterQueuesList,
});

registerSidebarEntry({
  parent: 'kueue',
  name: 'kueue-clusterqueues',
  label: 'ClusterQueues',
  url: kueueRoutePaths.clusterQueuesList,
});

registerSidebarEntry({
  parent: 'kueue',
  name: 'kueue-localqueues',
  label: 'LocalQueues',
  url: kueueRoutePaths.localQueuesList,
});

registerSidebarEntry({
  parent: 'kueue',
  name: 'kueue-resourceflavors',
  label: 'ResourceFlavors',
  url: kueueRoutePaths.resourceFlavorsList,
});

registerRoute({
  path: kueueRoutePaths.clusterQueuesList,
  sidebar: 'kueue-clusterqueues',
  name: kueueRouteNames.clusterQueuesList,
  exact: true,
  component: () => <ClusterQueueList />,
});

registerRoute({
  path: kueueRoutePaths.clusterQueueDetail,
  sidebar: 'kueue-clusterqueues',
  name: kueueRouteNames.clusterQueueDetail,
  exact: true,
  component: () => <ClusterQueueDetail />,
});

registerRoute({
  path: kueueRoutePaths.localQueuesList,
  sidebar: 'kueue-localqueues',
  name: kueueRouteNames.localQueuesList,
  exact: true,
  component: () => <LocalQueueList />,
});

registerRoute({
  path: kueueRoutePaths.localQueueDetail,
  sidebar: 'kueue-localqueues',
  name: kueueRouteNames.localQueueDetail,
  exact: true,
  component: () => <LocalQueueDetail />,
});

registerRoute({
  path: kueueRoutePaths.resourceFlavorsList,
  sidebar: 'kueue-resourceflavors',
  name: kueueRouteNames.resourceFlavorsList,
  exact: true,
  component: () => <ResourceFlavorList />,
});

registerRoute({
  path: kueueRoutePaths.resourceFlavorDetail,
  sidebar: 'kueue-resourceflavors',
  name: kueueRouteNames.resourceFlavorDetail,
  exact: true,
  component: () => <ResourceFlavorDetail />,
});
