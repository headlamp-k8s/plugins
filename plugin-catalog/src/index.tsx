import {
  Headlamp,
  registerPluginSettings,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import { PluginDetail } from './components/plugins/Detail';
import { PluginInstalledList } from './components/plugins/InstalledList';
import { PluginList } from './components/plugins/List';
import { Settings } from './components/plugins/Settings';

if (Headlamp.isRunningAsApp()) {
  registerSidebarEntry({
    name: 'catalog',
    url: '/plugin-catalog',
    icon: 'mdi:storefront',
    parent: '',
    label: 'Plugin Catalog',
    useClusterURL: false,
    sidebar: 'HOME',
  });

  registerSidebarEntry({
    name: 'Catalog',
    url: '/plugin-catalog',
    icon: '',
    parent: 'catalog',
    label: 'Catalog',
    useClusterURL: false,
    sidebar: 'HOME',
  });

  registerSidebarEntry({
    name: 'Installed',
    url: '/plugin-catalog/installed',
    icon: '',
    parent: 'catalog',
    label: 'Installed',
    useClusterURL: false,
    sidebar: 'HOME',
  });

  registerRoute({
    path: '/plugin-catalog/installed',
    component: () => <PluginInstalledList />,
    name: 'Installed Plugins',
    sidebar: {
      item: 'Installed',
      sidebar: 'HOME',
    },
    exact: true,
    noAuthRequired: true,
    useClusterURL: false,
  });

  registerRoute({
    path: '/plugin-catalog',
    component: () => <PluginList />,
    name: 'Plugin Catalog',
    sidebar: {
      item: 'Catalog',
      sidebar: 'HOME',
    },
    exact: true,
    noAuthRequired: true,
    useClusterURL: false,
  });

  registerRoute({
    path: '/plugin-catalog/:repoName/:pluginName',
    component: () => <PluginDetail />,
    name: 'Plugin Info',
    sidebar: {
      item: 'Catalog',
      sidebar: 'HOME',
    },
    exact: true,
    noAuthRequired: true,
    useClusterURL: false,
  });
}

registerPluginSettings('@headlamp-k8s/plugin-catalog', Settings, true);
