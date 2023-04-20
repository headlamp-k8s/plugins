import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import ChartDetails from './components/charts/Details';
import { ChartsList } from './components/charts/List';
import ReleaseDetail from './components/releases/Detail';
import ReleaseList from './components/releases/List';

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
    url: '/helm/releases',
    icon: 'simple-icons:helm',
    parent: '',
    label: 'Helm',
  });

  registerSidebarEntry({
    name: 'Releases',
    url: '/helm/releases',
    icon: '',
    parent: 'Helm',
    label: 'Releases',
  });

  registerSidebarEntry({
    name: 'Charts',
    url: '/helm/charts',
    icon: '',
    parent: 'Helm',
    label: 'Charts',
  });

  // This component rendered at URL: /c/mycluster/feedback3
  registerRoute({
    path: '/helm/releases',
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

  registerRoute({
    path: '/helm/charts',
    sidebar: 'Charts',
    name: 'Charts',
    exact: true,
    component: () => <ChartsList />,
  });

  registerRoute({
    path: '/helm/:repoName/charts/:chartName',
    sidebar: 'Charts',
    name: 'Charts',
    exact: true,
    component: () => <ChartDetails />,
  });
}
