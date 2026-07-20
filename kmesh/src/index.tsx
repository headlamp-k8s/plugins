import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import type { ComponentType } from 'react';
import HealthDashboard from './components/daemon/HealthDashboard';
import XdsConfigDump from './components/daemon/XdsConfigDump';
import WaypointDetail from './components/waypoints/Detail';
import WaypointList from './components/waypoints/List';
import { kmeshRouteNames, kmeshRoutePaths } from './utils/kmeshRoutes';

/**
 * Configuration for registering a new KMesh resource view in Headlamp.
 */
interface KmeshResourceRegistration {
  /** Name of the sidebar section to group the resource under */
  sidebarName: string;
  /** Label for the resource in the sidebar */
  label: string;
  /** URL path for the list view */
  listPath: string;
  /** URL path for the detail view */
  detailPath: string;
  /** Route name identifier for the list view */
  listRouteName: string;
  /** Route name identifier for the detail view */
  detailRouteName: string;
  /** React component rendered for the list view */
  ListComponent: ComponentType<Record<string, never>>;
  /** React component rendered for the detail view */
  DetailComponent: ComponentType<Record<string, never>>;
}

function registerKmeshResource(config: KmeshResourceRegistration) {
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
    parent: 'kmesh',
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

// Parent sidebar entry
registerSidebarEntry({
  parent: null,
  name: 'kmesh',
  label: 'KMesh',
  icon: 'mdi:vector-triangle',
  url: kmeshRoutePaths.waypointsList,
});

const kmeshResources: KmeshResourceRegistration[] = [
  {
    sidebarName: 'kmesh-waypoints',
    label: 'Waypoints',
    listPath: kmeshRoutePaths.waypointsList,
    detailPath: kmeshRoutePaths.waypointDetail,
    listRouteName: kmeshRouteNames.waypointsList,
    detailRouteName: kmeshRouteNames.waypointDetail,
    ListComponent: WaypointList,
    DetailComponent: WaypointDetail,
  },
];

kmeshResources.forEach(registerKmeshResource);

// xDS Config Dump viewer (Single Route — tabs are internal to the component)
registerSidebarEntry({
  parent: 'kmesh',
  name: 'kmesh-xds-config',
  label: 'xDS Config Dump',
  url: kmeshRoutePaths.xdsConfigDump,
});

registerRoute({
  path: kmeshRoutePaths.xdsConfigDump,
  sidebar: 'kmesh-xds-config',
  name: kmeshRouteNames.xdsConfigDump,
  exact: true,
  component: () => <XdsConfigDump />,
});

// Health Dashboard (Single Route)
registerSidebarEntry({
  parent: 'kmesh',
  name: 'kmesh-health',
  label: 'Daemon Health',
  url: kmeshRoutePaths.healthDashboard,
});

registerRoute({
  path: kmeshRoutePaths.healthDashboard,
  sidebar: 'kmesh-health',
  name: kmeshRouteNames.healthDashboard,
  exact: true,
  component: () => <HealthDashboard />,
});
