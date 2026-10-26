import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { ExternalSecretDetail } from './components/externalsecrets/Detail';
import { ExternalSecretsList } from './components/externalsecrets/List';

interface ResourceRegistrationConfig {
  name: string;
  path: string;
  DetailComponent: React.ComponentType<any>;
  ListComponent: React.ComponentType<any>;
  hasNamespace?: boolean;
}

function registerESOResource(config: ResourceRegistrationConfig) {
  const { name, path, DetailComponent, ListComponent, hasNamespace = true } = config;

  // Register sidebar entry
  registerSidebarEntry({
    name,
    url: `/external-secrets/${path}`,
    parent: 'External Secrets',
    label: name,
  });

  // Register detail route
  registerRoute({
    path: `/external-secrets/${path}/${hasNamespace ? ':namespace/:name' : ':name'}`,
    sidebar: name,
    name: name.slice(0, -1), // Remove 's' from plural form
    component: () => <DetailComponent />,
  });

  // Register list route
  registerRoute({
    path: `/external-secrets/${path}`,
    sidebar: name,
    name,
    component: () => <ListComponent />,
  });
}

// Main External Secrets sidebar entry
registerSidebarEntry({
  name: 'External Secrets',
  url: '/external-secrets/externalsecrets',
  icon: 'mdi:key-chain-variant',
  parent: '',
  label: 'External Secrets',
});

// Register all resources
registerESOResource({
  name: 'ExternalSecrets',
  path: 'externalsecrets',
  DetailComponent: ExternalSecretDetail,
  ListComponent: ExternalSecretsList,
});
