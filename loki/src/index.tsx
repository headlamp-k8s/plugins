import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import SearchView from './components/SearchView';

registerSidebarEntry({
  parent: null,
  name: 'loki-history',
  label: 'Historical logs',
  icon: 'mdi:history',
  url: '/loki/history',
});
registerRoute({
  path: '/loki/history',
  sidebar: 'loki-history',
  name: 'loki-history',
  exact: true,
  component: SearchView,
});
