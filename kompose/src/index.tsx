import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { KomposeUI } from './ui';

registerSidebarEntry({
  parent: null,
  name: 'kompose',
  label: 'Kompose',
  url: '/kompose',
  icon: 'mdi:lead-pencil',
});

registerRoute({
  path: '/kompose',
  sidebar: 'kompose',
  name: 'kompose',
  exact: true,
  component: () => {
    return <KomposeUI />;
  },
});
