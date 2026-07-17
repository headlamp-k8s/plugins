import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import InstanceDetail from './components/instances/Detail';
import ResourceGraphDefinitionDetail from './components/resourcegraphdefinitions/Detail';
import ResourceGraphDefinitionList from './components/resourcegraphdefinitions/List';
import { kroRouteNames, kroRoutePaths } from './utils/kroRoutes';

registerSidebarEntry({
  parent: null,
  name: 'kro',
  label: 'kro',
  icon: 'mdi:graph-outline',
  url: kroRoutePaths.resourceGraphDefinitionsList,
});

registerSidebarEntry({
  parent: 'kro',
  name: 'kro-resourcegraphdefinitions',
  label: 'Resource Graph Definitions',
  url: kroRoutePaths.resourceGraphDefinitionsList,
});

registerRoute({
  path: kroRoutePaths.resourceGraphDefinitionsList,
  sidebar: 'kro-resourcegraphdefinitions',
  name: kroRouteNames.resourceGraphDefinitionsList,
  exact: true,
  component: () => <ResourceGraphDefinitionList />,
});

registerRoute({
  path: kroRoutePaths.resourceGraphDefinitionDetail,
  sidebar: 'kro-resourcegraphdefinitions',
  name: kroRouteNames.resourceGraphDefinitionDetail,
  exact: true,
  component: () => <ResourceGraphDefinitionDetail />,
});

registerRoute({
  path: kroRoutePaths.instanceDetail,
  sidebar: 'kro-resourcegraphdefinitions',
  name: kroRouteNames.instanceDetail,
  exact: true,
  component: () => <InstanceDetail />,
});

registerRoute({
  path: kroRoutePaths.clusterInstanceDetail,
  sidebar: 'kro-resourcegraphdefinitions',
  name: kroRouteNames.clusterInstanceDetail,
  exact: true,
  component: () => <InstanceDetail />,
});
