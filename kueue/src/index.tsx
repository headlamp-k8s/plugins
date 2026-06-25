import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import ResourceFlavorDetail from './components/resourceflavors/Detail';
import ResourceFlavorList from './components/resourceflavors/List';
import { kueueRouteNames, kueueRoutePaths } from './utils/kueueRoutes';

registerSidebarEntry({
  parent: null,
  name: 'kueue',
  label: 'Kueue',
  icon: 'mdi:queue-first-in-last-out',
  url: kueueRoutePaths.resourceFlavorsList,
});

registerSidebarEntry({
  parent: 'kueue',
  name: 'kueue-resourceflavors',
  label: 'ResourceFlavors',
  url: kueueRoutePaths.resourceFlavorsList,
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
