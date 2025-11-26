import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { CommunityChartList, HelmChartList } from './api/catalogs';
import ChartDetails from './components/charts/Details';
import { ChartsList } from './components/charts/List';
import ReleaseDetail from './components/releases/Detail';
import ReleaseList from './components/releases/List';
import { ARTIFACTHUB_PROTOCOL, HELM_PROTOCOL, VANILLA_HELM_REPO } from './constants/catalog';
import { CatalogLists } from './helpers/catalog';

export function isElectron(): boolean {
  // Renderer process
  if (
    typeof window !== 'undefined' &&
    typeof window.process === 'object' &&
    (window.process as any).type === 'renderer'
  ) {
    return true;
  }

  // Main process
  if (
    typeof process !== 'undefined' &&
    typeof process.versions === 'object' &&
    !!(process.versions as any).electron
  ) {
    return true;
  }

  // Detect the user agent when the `nodeIntegration` option is set to true
  if (
    typeof navigator === 'object' &&
    typeof navigator.userAgent === 'string' &&
    navigator.userAgent.indexOf('Electron') >= 0
  ) {
    return true;
  }

  return false;
}

if (isElectron()) {
  registerSidebarEntry({
    name: 'Helm',
    url: '/apps/catalog',
    icon: 'mdi:apps-box',
    parent: '',
    label: 'Apps',
  });

  registerSidebarEntry({
    name: 'Charts',
    url: '/apps/catalog',
    icon: '',
    parent: 'Helm',
    label: 'Catalog',
  });

  registerSidebarEntry({
    name: 'Releases',
    url: '/apps/installed',
    icon: '',
    parent: 'Helm',
    label: 'Installed',
  });
} else {
  // Iterate the list of catalogs to register the sidebar and the respective routes
  CatalogLists().then(chart => {
    for (let i = 0; i < chart.length; i++) {
      // Register the sidebar for Apps, with the URL pointing to the first chart returned
      if (i === 0) {
        registerSidebarEntry({
          name: 'Helm',
          url: '/apps/' + chart[i].name,
          icon: 'mdi:apps-box',
          parent: '',
          label: 'Apps',
        });
      }

      // Register the sidebars for the catalogs, as returned by the API
      registerSidebarEntry({
        name: 'Charts ' + chart[i].name,
        url: '/apps/' + chart[i].name,
        icon: '',
        parent: 'Helm',
        label: chart[i].displayName,
      });

      // Register the sidebar with label - Installed, as the last entry under Apps
      if (i === chart.length - 1) {
        registerSidebarEntry({
          name: 'Releases',
          url: '/apps/installed',
          icon: '',
          parent: 'Helm',
          label: 'Installed',
        });
      }

      if (chart[i].protocol === HELM_PROTOCOL) {
        registerRoute({
          path: '/apps/' + chart[i].name,
          sidebar: 'Charts ' + chart[i].name,
          name: 'Charts ' + chart[i].name,
          exact: true,
          component: () => HelmChartList(chart[i].metadataName, chart[i].namespace, chart[i].uri),
        });
      } else if (chart[i].protocol === ARTIFACTHUB_PROTOCOL) {
        registerRoute({
          path: '/apps/' + chart[i].name,
          sidebar: 'Charts ' + chart[i].name,
          name: 'Charts ' + chart[i].name,
          exact: true,
          component: () =>
            CommunityChartList(chart[i].metadataName, chart[i].namespace, chart[i].uri),
        });
      }
    }
  });
}

registerRoute({
  path: '/apps/installed',
  sidebar: 'Releases',
  name: 'Releases',
  exact: true,
  component: () => <ReleaseList />,
});

registerRoute({
  path: '/helm/:namespace/releases/:releaseName',
  sidebar: 'Releases',
  name: 'Release Detail',
  exact: true,
  component: () => <ReleaseDetail />,
});

if (isElectron()) {
  registerRoute({
    path: '/apps/catalog',
    sidebar: 'Charts',
    name: 'Charts',
    exact: true,
    component: () => <ChartsList />,
  });
}

registerRoute({
  path: '/helm/:repoName/charts/:chartName',
  sidebar: 'Charts',
  name: 'Charts',
  exact: true,
  component: () => <ChartDetails vanillaHelmRepo={VANILLA_HELM_REPO} />,
});
