import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import CreateClusterPage from './CreateClusterPage';

registerSidebarEntry({
  parent: null,
  name: 'minikube',
  label: 'Minikube',
  url: '/create-cluster-minikube',
  icon: 'mdi:comment-quote',
  sidebar: 'HOME',
  useClusterURL: false,
});

registerRoute({
  path: '/create-cluster-minikube',
  sidebar: 'minikube',
  name: 'minikube',
  component: () => <CreateClusterPage />,
  exact: true,
  useClusterURL: false,
  noAuthRequired: true,
});
