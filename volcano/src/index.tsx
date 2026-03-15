import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { ComponentType } from 'react';
import JobDetail from './components/jobs/Detail';
import JobList from './components/jobs/List';
import PodGroupDetail from './components/podgroups/Detail';
import PodGroupList from './components/podgroups/List';
import QueueDetail from './components/queues/Detail';
import QueueList from './components/queues/List';

interface VolcanoResourceRegistration {
  sidebarName: string;
  label: string;
  path: string;
  listRouteName: string;
  detailRouteName: string;
  ListComponent: ComponentType<any>;
  DetailComponent: ComponentType<any>;
  hasNamespace: boolean;
}

function registerVolcanoResource(config: VolcanoResourceRegistration) {
  const {
    sidebarName,
    label,
    path,
    listRouteName,
    detailRouteName,
    ListComponent,
    DetailComponent,
    hasNamespace,
  } = config;

  registerSidebarEntry({
    parent: 'volcano',
    name: sidebarName,
    label,
    url: `/volcano/${path}`,
  });

  registerRoute({
    path: `/volcano/${path}`,
    sidebar: sidebarName,
    name: listRouteName,
    exact: true,
    component: () => <ListComponent />,
  });

  registerRoute({
    path: `/volcano/${path}/${hasNamespace ? ':namespace/:name' : ':name'}`,
    sidebar: sidebarName,
    name: detailRouteName,
    exact: true,
    component: () => <DetailComponent />,
  });
}

registerSidebarEntry({
  parent: null,
  name: 'volcano',
  label: 'Volcano',
  icon: 'mdi:fire',
  url: '/volcano/jobs',
});

const volcanoResources: VolcanoResourceRegistration[] = [
  {
    sidebarName: 'volcano-jobs',
    label: 'Jobs',
    path: 'jobs',
    listRouteName: 'volcano-jobs-list',
    detailRouteName: 'volcano-job-detail',
    ListComponent: JobList,
    DetailComponent: JobDetail,
    hasNamespace: true,
  },
  {
    sidebarName: 'volcano-queues',
    label: 'Queues',
    path: 'queues',
    listRouteName: 'volcano-queues-list',
    detailRouteName: 'volcano-queue-detail',
    ListComponent: QueueList,
    DetailComponent: QueueDetail,
    hasNamespace: false,
  },
  {
    sidebarName: 'volcano-podgroups',
    label: 'PodGroups',
    path: 'podgroups',
    listRouteName: 'volcano-podgroups-list',
    detailRouteName: 'volcano-podgroup-detail',
    ListComponent: PodGroupList,
    DetailComponent: PodGroupDetail,
    hasNamespace: true,
  },
];

volcanoResources.forEach(registerVolcanoResource);
