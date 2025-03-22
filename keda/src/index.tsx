import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { ClusterTriggerAuthenticationDetail } from './components/clustertriggerauthentication/Detail';
import { ClusterTriggerAuthenticationsList } from './components/clustertriggerauthentication/List';
import { ScaledJobDetail } from './components/scaledjobs/Detail';
import { ScaledJobsList } from './components/scaledjobs/List';
import { ScaledObjectDetail } from './components/scaledobjects/Detail';
import { ScaledObjectsList } from './components/scaledobjects/List';
import { TriggerAuthenticationDetail } from './components/triggerauthentication/Detail';
import { TriggerAuthenticationsList } from './components/triggerauthentication/List';

interface ResourceRegistrationConfig {
  name: string;
  path: string;
  DetailComponent: React.ComponentType<any>;
  ListComponent: React.ComponentType<any>;
  hasNamespace?: boolean;
}

function registerKedaResource(config: ResourceRegistrationConfig) {
  const { name, path, DetailComponent, ListComponent, hasNamespace = true } = config;

  // Register sidebar entry
  registerSidebarEntry({
    name,
    url: `/keda/${path}`,
    parent: 'KEDA',
    label: name,
  });

  // Register detail route
  registerRoute({
    path: `/keda/${path}/${hasNamespace ? ':namespace/:name' : ':name'}`,
    sidebar: name,
    name: name.slice(0, -1), // Remove 's' from plural form
    component: DetailComponent,
  });

  // Register list route
  registerRoute({
    path: `/keda/${path}`,
    sidebar: name,
    name,
    component: ListComponent,
  });
}

// Main KEDA sidebar entry
registerSidebarEntry({
  name: 'KEDA',
  url: '/keda/scaledobjects',
  icon: 'mdi:lightning-bolt',
  parent: '',
  label: 'KEDA',
});

// Register all resources
registerKedaResource({
  name: 'ScaledObjects',
  path: 'scaledobjects',
  DetailComponent: ScaledObjectDetail,
  ListComponent: ScaledObjectsList,
});

registerKedaResource({
  name: 'ScaledJobs',
  path: 'scaledjobs',
  DetailComponent: ScaledJobDetail,
  ListComponent: ScaledJobsList,
});

registerKedaResource({
  name: 'TriggerAuthentications',
  path: 'triggerauthentications',
  DetailComponent: TriggerAuthenticationDetail,
  ListComponent: TriggerAuthenticationsList,
});

registerKedaResource({
  name: 'ClusterTriggerAuthentications',
  path: 'clustertriggerauthentications',
  DetailComponent: ClusterTriggerAuthenticationDetail,
  ListComponent: ClusterTriggerAuthenticationsList,
  hasNamespace: false,
});
