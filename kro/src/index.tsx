import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
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
  component: () => <SectionBox title="Resource Graph Definitions" />,
});
