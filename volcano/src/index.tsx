import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { ComponentType } from 'react';
import JobFlowDetail from './components/jobflows/Detail';
import JobFlowList from './components/jobflows/List';
import JobDetail from './components/jobs/Detail';
import JobList from './components/jobs/List';
import JobTemplateDetail from './components/jobtemplates/Detail';
import JobTemplateList from './components/jobtemplates/List';
import PodGroupDetail from './components/podgroups/Detail';
import PodGroupList from './components/podgroups/List';
import QueueDetail from './components/queues/Detail';
import QueueList from './components/queues/List';
import { registerVolcanoMapExtensions } from './mapRegistration';
import { volcanoRouteNames, volcanoRoutePaths } from './utils/volcanoRoutes';
import { registerVolcanoIcon, volcanoIconName } from './volcanoIcon';

registerVolcanoIcon();
registerVolcanoMapExtensions();

/**
 * Route and sidebar registration settings for a Volcano resource section.
 */
interface VolcanoResourceRegistration {
  /** Sidebar entry key used by Headlamp. */
  sidebarName: string;
  /** Sidebar label shown in the UI. */
  label: string;
  /** List route path for this resource. */
  listPath: string;
  /** Detail route path for this resource. */
  detailPath: string;
  /** Route name for the list page. */
  listRouteName: string;
  /** Route name for the detail page. */
  detailRouteName: string;
  /** List page component for the resource. */
  ListComponent: ComponentType<any>;
  /** Detail page component for the resource. */
  DetailComponent: ComponentType<any>;
}

/**
 * Registers sidebar, list route, and detail route for a Volcano resource.
 *
 * @param config Registration configuration for one resource type.
 */
function registerVolcanoResource(config: VolcanoResourceRegistration) {
  const {
    sidebarName,
    label,
    listPath,
    detailPath,
    listRouteName,
    detailRouteName,
    ListComponent,
    DetailComponent,
  } = config;

  registerSidebarEntry({
    parent: 'volcano',
    name: sidebarName,
    label,
    url: listPath,
  });

  registerRoute({
    path: listPath,
    sidebar: sidebarName,
    name: listRouteName,
    exact: true,
    component: () => <ListComponent />,
  });

  registerRoute({
    path: detailPath,
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
  icon: volcanoIconName,
  url: volcanoRoutePaths.jobsList,
});

const volcanoResources: VolcanoResourceRegistration[] = [
  {
    sidebarName: 'volcano-jobs',
    label: 'Jobs',
    listPath: volcanoRoutePaths.jobsList,
    detailPath: volcanoRoutePaths.jobDetail,
    listRouteName: volcanoRouteNames.jobsList,
    detailRouteName: volcanoRouteNames.jobDetail,
    ListComponent: JobList,
    DetailComponent: JobDetail,
  },
  {
    sidebarName: 'volcano-jobtemplates',
    label: 'JobTemplates',
    listPath: volcanoRoutePaths.jobTemplatesList,
    detailPath: volcanoRoutePaths.jobTemplateDetail,
    listRouteName: volcanoRouteNames.jobTemplatesList,
    detailRouteName: volcanoRouteNames.jobTemplateDetail,
    ListComponent: JobTemplateList,
    DetailComponent: JobTemplateDetail,
  },
  {
    sidebarName: 'volcano-jobflows',
    label: 'JobFlows',
    listPath: volcanoRoutePaths.jobFlowsList,
    detailPath: volcanoRoutePaths.jobFlowDetail,
    listRouteName: volcanoRouteNames.jobFlowsList,
    detailRouteName: volcanoRouteNames.jobFlowDetail,
    ListComponent: JobFlowList,
    DetailComponent: JobFlowDetail,
  },
  {
    sidebarName: 'volcano-queues',
    label: 'Queues',
    listPath: volcanoRoutePaths.queuesList,
    detailPath: volcanoRoutePaths.queueDetail,
    listRouteName: volcanoRouteNames.queuesList,
    detailRouteName: volcanoRouteNames.queueDetail,
    ListComponent: QueueList,
    DetailComponent: QueueDetail,
  },
  {
    sidebarName: 'volcano-podgroups',
    label: 'PodGroups',
    listPath: volcanoRoutePaths.podGroupsList,
    detailPath: volcanoRoutePaths.podGroupDetail,
    listRouteName: volcanoRouteNames.podGroupsList,
    detailRouteName: volcanoRouteNames.podGroupDetail,
    ListComponent: PodGroupList,
    DetailComponent: PodGroupDetail,
  },
];

volcanoResources.forEach(registerVolcanoResource);
