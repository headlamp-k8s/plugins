import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import ClusterQueueDetail from './components/clusterqueues/Detail';
import ClusterQueueList from './components/clusterqueues/List';
import LocalQueueDetail from './components/localqueues/Detail';
import LocalQueueList from './components/localqueues/List';
import ResourceFlavorDetail from './components/resourceflavors/Detail';
import ResourceFlavorList from './components/resourceflavors/List';
import WorkloadPriorityClassDetail from './components/workloadpriorityclasses/Detail';
import WorkloadPriorityClassList from './components/workloadpriorityclasses/List';
import WorkloadDetail from './components/workloads/Detail';
import WorkloadList from './components/workloads/List';
import { kueueRoutePaths } from './utils/kueueRoutes';

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

registerSidebarEntry({
  parent: 'kueue',
  name: 'kueue-workloads',
  label: 'Workloads',
  url: kueueRoutePaths.workloadsList,
});

registerSidebarEntry({
  parent: 'kueue',
  name: 'kueue-workloadpriorityclasses',
  label: 'WorkloadPriorityClasses',
  url: kueueRoutePaths.workloadPriorityClassesList,
});

registerRoute({
  path: kueueRoutePaths.clusterQueuesList,
  sidebar: 'kueue-clusterqueues',
  name: 'Cluster Queues',
  exact: true,
  component: () => <ClusterQueueList />,
});

registerRoute({
  path: kueueRoutePaths.clusterQueueDetail,
  sidebar: 'kueue-clusterqueues',
  name: 'Cluster Queue Detail',
  exact: true,
  component: () => <ClusterQueueDetail />,
});

registerRoute({
  path: kueueRoutePaths.localQueuesList,
  sidebar: 'kueue-localqueues',
  name: 'Local Queues',
  exact: true,
  component: () => <LocalQueueList />,
});

registerRoute({
  path: kueueRoutePaths.localQueueDetail,
  sidebar: 'kueue-localqueues',
  name: 'Local Queue Detail',
  exact: true,
  component: () => <LocalQueueDetail />,
});

registerRoute({
  path: kueueRoutePaths.resourceFlavorsList,
  sidebar: 'kueue-resourceflavors',
  name: 'Resource Flavors',
  exact: true,
  component: () => <ResourceFlavorList />,
});

registerRoute({
  path: kueueRoutePaths.resourceFlavorDetail,
  sidebar: 'kueue-resourceflavors',
  name: 'Resource Flavor Detail',
  exact: true,
  component: () => <ResourceFlavorDetail />,
});

registerRoute({
  path: kueueRoutePaths.workloadsList,
  sidebar: 'kueue-workloads',
  name: 'Workloads',
  exact: true,
  component: () => <WorkloadList />,
});

registerRoute({
  path: kueueRoutePaths.workloadDetail,
  sidebar: 'kueue-workloads',
  name: 'Workload Detail',
  exact: true,
  component: () => <WorkloadDetail />,
});

registerRoute({
  path: kueueRoutePaths.workloadPriorityClassesList,
  sidebar: 'kueue-workloadpriorityclasses',
  name: 'WorkloadPriorityClasses',
  exact: true,
  component: () => <WorkloadPriorityClassList />,
});

registerRoute({
  path: kueueRoutePaths.workloadPriorityClassDetail,
  sidebar: 'kueue-workloadpriorityclasses',
  name: 'WorkloadPriorityClass Detail',
  exact: true,
  component: () => <WorkloadPriorityClassDetail />,
});