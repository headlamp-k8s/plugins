import { Icon } from '@iconify/react';
import {
  registerKindIcon,
  registerKubeObjectGlance,
  registerMapSource,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import { ResourceClasses } from '@kinvolk/headlamp-plugin/lib/k8s';
import { useMemo } from 'react';
import { ClusterClassDetail } from './components/clusterclasses/Detail';
import { ClusterClassesList } from './components/clusterclasses/List';
import { ClusterDetail } from './components/clusters/Detail';
import { ClustersList } from './components/clusters/List';
import { KubeadmConfigDetail } from './components/kubeadmconfigs/Detail';
import { KubeadmConfigsList } from './components/kubeadmconfigs/List';
import { KubeadmConfigTemplateDetail } from './components/kubeadmconfigtemplates/Detail';
import { KubeadmConfigTemplatesList } from './components/kubeadmconfigtemplates/List';
import { KubeadmControlPlaneDetail } from './components/kubeadmcontrolplanes/Detail';
import { KubeadmControlPlanesList } from './components/kubeadmcontrolplanes/List';
import { KubeadmControlPlaneTemplateDetail } from './components/kubeadmcontrolplanetemplates/Detail';
import { KubeadmControlPlaneTemplatesList } from './components/kubeadmcontrolplanetemplates/List';
import { MachineDeploymentDetail } from './components/machinedeployments/Detail';
import { MachineDeploymentsList } from './components/machinedeployments/List';
import { MachineDrainRuleDetail } from './components/machinedrainrules/Detail';
import { MachineDrainRulesList } from './components/machinedrainrules/List';
import { MachineHealthCheckDetail } from './components/machinehealthchecks/Detail';
import { MachineHealthChecksList } from './components/machinehealthchecks/List';
import { MachinePoolDetail } from './components/machinepools/Detail';
import { MachinePoolsList } from './components/machinepools/List';
import { MachineDetail } from './components/machines/Detail';
import { MachinesList } from './components/machines/List';
import { MachineSetDetail } from './components/machinesets/Detail';
import { MachineSetsList } from './components/machinesets/List';
import { Cluster } from './resources/cluster';
import { ClusterClass } from './resources/clusterclass';
import { KubeadmConfig } from './resources/kubeadmconfig';
import { KubeadmConfigTemplate } from './resources/kubeadmconfigtemplate';
import { KubeadmControlPlane } from './resources/kubeadmcontrolplane';
import { KubeadmControlPlaneTemplate } from './resources/kubeadmcontrolplanetemplate';
import { Machine } from './resources/machine';
import { MachineDeployment } from './resources/machinedeployment';
import { MachineDrainRule } from './resources/machinedrainrule';
import { MachineHealthCheck } from './resources/machinehealthcheck';
import { MachinePool } from './resources/machinepool';
import { MachineSet } from './resources/machineset';

interface ResourceRegistrationConfig {
  name: string;
  kind: string;
  path: string;
  DetailComponent: React.ComponentType<any>;
  ListComponent: React.ComponentType<any>;
  icon: string;
  hasNamespace?: boolean;
}

function registerClusterApiResource(config: ResourceRegistrationConfig) {
  const { name, kind, path, DetailComponent, ListComponent, icon, hasNamespace = true } = config;

  // Register sidebar entry
  registerSidebarEntry({
    name,
    url: `/cluster-api/${path}`,
    parent: 'Cluster-api',
    label: name,
  });

  // Register detail route
  registerRoute({
    path: `/cluster-api/${path}/${hasNamespace ? ':namespace/:name' : ':name'}`,
    sidebar: name,
    name: path === 'clusterclasses' ? 'clusterclass' : path.slice(0, -1), // Remove 's' from plural form
    component: () => <DetailComponent />,
  });

  // Register list route
  registerRoute({
    path: `/cluster-api/${path}`,
    sidebar: name,
    name: path,
    component: () => <ListComponent />,
  });

  // Register icon for the resource kind
  registerKindIcon(kind, {
    icon: <Icon icon={icon} width="70%" height="70%" style={{ color: 'rgb(50, 108, 229)' }} />,
  });
}

// Register main Cluster API sidebar entry
registerSidebarEntry({
  name: 'Cluster-api',
  url: '/cluster-api/capiclusters',
  icon: 'mdi:turtle',
  parent: null,
  label: 'Cluster API',
});

const clusterApiResources: ResourceRegistrationConfig[] = [
  {
    name: 'Cluster Classes',
    kind: 'ClusterClass',
    path: 'clusterclasses',
    DetailComponent: ClusterClassDetail,
    ListComponent: ClusterClassesList,
    icon: 'mdi:cloud-print-outline',
  },
  {
    name: 'Clusters ', // Use a trailing space because "Clusters" is taken
    kind: 'Cluster',
    path: 'capiclusters',
    DetailComponent: ClusterDetail,
    ListComponent: ClustersList,
    icon: 'mdi:cloud',
  },
  {
    name: 'Kubeadm Configs',
    kind: 'KubeadmConfig',
    path: 'kubeadmconfigs',
    DetailComponent: KubeadmConfigDetail,
    ListComponent: KubeadmConfigsList,
    icon: 'mdi:list-box',
  },
  {
    name: 'Kubeadm Config Templates',
    kind: 'KubeadmConfigTemplate',
    path: 'kubeadmconfigtemplates',
    DetailComponent: KubeadmConfigTemplateDetail,
    ListComponent: KubeadmConfigTemplatesList,
    icon: 'mdi:list-box-outline',
  },
  {
    name: 'Kubeadm Control Planes',
    kind: 'KubeadmControlPlane',
    path: 'kubeadmcontrolplanes',
    DetailComponent: KubeadmControlPlaneDetail,
    ListComponent: KubeadmControlPlanesList,
    icon: 'mdi:controller-classic',
  },
  {
    name: 'Kubeadm Control Plane Templates',
    kind: 'KubeadmControlPlaneTemplate',
    path: 'kubeadmcontrolplanetemplates',
    DetailComponent: KubeadmControlPlaneTemplateDetail,
    ListComponent: KubeadmControlPlaneTemplatesList,
    icon: 'mdi:controller-classic-outline',
  },
  {
    name: 'Machines',
    kind: 'Machine',
    path: 'machines',
    DetailComponent: MachineDetail,
    ListComponent: MachinesList,
    icon: 'mdi:desktop-classic',
  },
  {
    name: 'Machine Deployments',
    kind: 'MachineDeployment',
    path: 'machinedeployments',
    DetailComponent: MachineDeploymentDetail,
    ListComponent: MachineDeploymentsList,
    icon: 'mdi:knob',
  },
  {
    name: 'Machine Drain Rules',
    kind: 'MachineDrainRule',
    path: 'machinedrainrules',
    DetailComponent: MachineDrainRuleDetail,
    ListComponent: MachineDrainRulesList,
    icon: 'mdi:vacuum-outline',
  },
  {
    name: 'Machine Health Checks',
    kind: 'MachineHealthCheck',
    path: 'machinehealthchecks',
    DetailComponent: MachineHealthCheckDetail,
    ListComponent: MachineHealthChecksList,
    icon: 'mdi:bottle-tonic-plus',
  },
  {
    name: 'Machine Pools',
    kind: 'MachinePool',
    path: 'machinepools',
    DetailComponent: MachinePoolDetail,
    ListComponent: MachinePoolsList,
    icon: 'mdi:pool',
  },
  {
    name: 'Machine Sets',
    kind: 'MachineSet',
    path: 'machinesets',
    DetailComponent: MachineSetDetail,
    ListComponent: MachineSetsList,
    icon: 'mdi:set-split',
  },
];

// Register all CAPI resources
clusterApiResources.forEach(registerClusterApiResource);

const resourceClassMap = {
  Cluster,
  ClusterClass,
  KubeadmConfig,
  KubeadmConfigTemplate,
  KubeadmControlPlane,
  KubeadmControlPlaneTemplate,
  Machine,
  MachineDeployment,
  MachineDrainRule,
  MachineHealthCheck,
  MachinePool,
  MachineSet,
};

// Add resource classes to the ResourceClasses object
// so links to the resources work in built-in details views.
Object.assign(ResourceClasses, resourceClassMap);

registerMapSource({
  id: 'cluster-api',
  label: 'Cluster API',
  icon: <Icon icon="mdi:turtle" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  useData() {
    // Build a map of resources and their details components
    const resourceLists = clusterApiResources.map(r => {
      const [items] = resourceClassMap[r.kind].useList();
      return { items, detailsComponent: r.DetailComponent };
    });

    // Create map nodes for each resource found
    return useMemo(() => {
      const nodes = [];
      resourceLists.forEach(({ items, detailsComponent }) => {
        items?.forEach(it => {
          nodes.push({
            id: it.metadata.uid,
            kubeObject: it,
            detailsComponent,
          });
        });
      });

      // Create map edges based on owner references
      const edges = [];
      for (const node of nodes) {
        if (node.kubeObject.metadata.ownerReferences) {
          node.kubeObject.metadata.ownerReferences.forEach(ownerRef => {
            const ownerNode = nodes.find(n => n.kubeObject.metadata.uid === ownerRef.uid);
            if (ownerNode) {
              edges.push({
                id: `${ownerNode.id}-${node.id}`,
                source: ownerNode.id,
                target: node.id,
                label: `owned by ${ownerRef.kind}`,
              });
            }
          });
        }
      }

      return { nodes, edges };
    }, [resourceLists.map(r => r.items)]);
  },
});

// Register on-hover "glance" tooltips
import { ClusterGlance } from './components/clusters/Glance';
import { KubeadmControlPlaneGlance } from './components/kubeadmcontrolplanes/Glance';
import { MachineDeploymentGlance } from './components/machinedeployments/Glance';
import { MachinePoolGlance } from './components/machinepools/Glance';
import { MachineGlance } from './components/machines/Glance';
import { MachineSetGlance } from './components/machinesets/Glance';
registerKubeObjectGlance({ id: 'cluster-glance', component: ClusterGlance });
registerKubeObjectGlance({ id: 'kcp-glance', component: KubeadmControlPlaneGlance });
registerKubeObjectGlance({ id: 'machine-glance', component: MachineGlance });
registerKubeObjectGlance({ id: 'machineset-glance', component: MachineSetGlance });
registerKubeObjectGlance({ id: 'machinedeployment-glance', component: MachineDeploymentGlance });
registerKubeObjectGlance({ id: 'machinepool-glance', component: MachinePoolGlance });
