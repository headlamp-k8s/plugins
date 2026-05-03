import { Icon } from '@iconify/react';
import {
  registerKindIcon,
  registerKubeObjectGlance,
  registerMapSource,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import { registerDetailsViewHeaderAction } from '@kinvolk/headlamp-plugin/lib';
import { Loader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { ResourceClasses } from '@kinvolk/headlamp-plugin/lib/k8s';
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { registerCapiIcon } from './clusterapiIcon';
import { ClusterClassDetail } from './components/clusterclasses/Detail';
import { ClusterClassGlance } from './components/clusterclasses/Glance';
import { ClusterClassesList } from './components/clusterclasses/List';
import { ClusterDetail } from './components/clusters/Detail';
import { ClusterGlance } from './components/clusters/Glance';
import { ClustersList } from './components/clusters/List';
import { TopologyHeaderAction } from './components/common/util';
import Dashboard from './components/Dashboard';
import { KubeadmConfigDetail } from './components/kubeadmconfigs/Detail';
import { KubeadmConfigGlance } from './components/kubeadmconfigs/Glance';
import { KubeadmConfigsList } from './components/kubeadmconfigs/List';
import { KubeadmConfigTemplateDetail } from './components/kubeadmconfigtemplates/Detail';
import { KubeadmConfigTemplateGlance } from './components/kubeadmconfigtemplates/Glance';
import { KubeadmConfigTemplatesList } from './components/kubeadmconfigtemplates/List';
import { KubeadmControlPlaneDetail } from './components/kubeadmcontrolplanes/Detail';
import { KubeadmControlPlaneGlance } from './components/kubeadmcontrolplanes/Glance';
import { KubeadmControlPlanesList } from './components/kubeadmcontrolplanes/List';
import { KubeadmControlPlaneTemplateDetail } from './components/kubeadmcontrolplanetemplates/Detail';
import { KubeadmControlPlaneTemplatesList } from './components/kubeadmcontrolplanetemplates/List';
import { MachineDeploymentDetail } from './components/machinedeployments/Detail';
import { MachineDeploymentGlance } from './components/machinedeployments/Glance';
import { MachineDeploymentsList } from './components/machinedeployments/List';
import { MachineDrainRuleDetail } from './components/machinedrainrules/Detail';
import { MachineDrainRuleGlance } from './components/machinedrainrules/Glance';
import { MachineDrainRulesList } from './components/machinedrainrules/List';
import { MachineHealthCheckDetail } from './components/machinehealthchecks/Detail';
import { MachineHealthCheckGlance } from './components/machinehealthchecks/Glance';
import { MachineHealthChecksList } from './components/machinehealthchecks/List';
import { MachinePoolDetail } from './components/machinepools/Detail';
import { MachinePoolGlance } from './components/machinepools/Glance';
import { MachinePoolsList } from './components/machinepools/List';
import { MachineDetail } from './components/machines/Detail';
import { MachineGlance } from './components/machines/Glance';
import { MachinesList } from './components/machines/List';
import { MachineSetDetail } from './components/machinesets/Detail';
import { MachineSetGlance } from './components/machinesets/Glance';
import { MachineSetsList } from './components/machinesets/List';
import { clusterApiSource } from './mapView';
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

registerCapiIcon();

interface ResourceRegistrationConfig {
  name: string;
  kind: string;
  path: string;
  DetailComponent: React.ComponentType<any>;
  ListComponent: React.ComponentType<any>;
  icon: string;
  hasNamespace?: boolean;
  section?: string;
}
/**
 * Registers a sidebar section under the Cluster API group in Headlamp.
 *
 * This helper simplifies adding new sidebar entries by encapsulating
 * the common configuration (parent, label, icon, and URL).
 *
 * @param name - Unique identifier for the sidebar entry (used internally).
 * @param label - Display name shown in the sidebar UI.
 * @param icon - Icon name (e.g., Material Design Icons string like 'mdi:cloud').
 * @param url - Route path that the sidebar entry should navigate to.
 *
 * @example
 * registerSection(
 *   'clusters',
 *   'Clusters',
 *   'mdi:kubernetes',
 *   '/cluster-api/clusters'
 * );
 */
function registerSection(name: string, label: string, icon: string, url: string) {
  registerSidebarEntry({
    parent: 'Cluster-api',
    name,
    label,
    url,
    icon,
  });
}
/**
 * Wrapper component for CAPI routes that checks if the management cluster is initialized.
 * Displays the Dashboard (Empty State) if Cluster API CRDs are missing.
 *
 * @param props.children - The component to render if CAPI is active.
 */
function CapiRouteWrapper({ children }: { children: React.ReactNode }) {
  const [crd, error] = CustomResourceDefinition.useGet(Cluster.crdName);
  if (error) {
    return <Dashboard />;
  }
  if (!crd) {
    return <Loader title="Detecting Cluster API status..." />;
  }
  return <>{children}</>;
}

/**
 * Helper to register a Cluster API resource with Headlamp's sidebar, routes, and iconography.
 *
 * @param config - The registration configuration for the resource.
 */
function registerClusterApiResource(config: ResourceRegistrationConfig) {
  const {
    name,
    kind,
    path,
    DetailComponent,
    ListComponent,
    icon,
    hasNamespace = true,
    section = 'Cluster-api',
  } = config;

  // Register sidebar entry
  registerSidebarEntry({
    name,
    url: `/cluster-api/${path}`,
    parent: section,
    label: name,
  });

  // Register detail route
  registerRoute({
    path: `/cluster-api/${path}/${hasNamespace ? ':namespace/:name' : ':name'}`,
    sidebar: name,
    name: path === 'clusterclasses' ? 'clusterclass' : path.slice(0, -1), // Remove 's' from plural form
    component: () => (
      <CapiRouteWrapper>
        <DetailComponent />
      </CapiRouteWrapper>
    ),
  });

  // Register list route
  registerRoute({
    path: `/cluster-api/${path}`,
    sidebar: name,
    name: path,
    component: () => (
      <CapiRouteWrapper>
        <ListComponent />
      </CapiRouteWrapper>
    ),
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
  icon: 'capi:logo',
  parent: null,
  label: 'Cluster API',
});

// Register sections for a logical sidebar structure
registerSection('capi-fleet', 'Cluster Management', 'mdi:cloud', '/cluster-api/capiclusters');
registerSection(
  'capi-cp',
  'Control Planes',
  'mdi:shield-crown-outline',
  '/cluster-api/kubeadmcontrolplanes'
);
registerSection('capi-compute', 'Workers', 'mdi:server', '/cluster-api/machinedeployments');
registerSection(
  'capi-config',
  'Bootstrap',
  'mdi:file-document-outline',
  '/cluster-api/kubeadmconfigs'
);
registerSection('capi-ops', 'Operations', 'mdi:heart-pulse', '/cluster-api/machinehealthchecks');

const clusterApiResources: ResourceRegistrationConfig[] = [
  {
    name: 'Clusters ', // Trailing space: "Clusters" is reserved in Headlamp
    kind: 'Cluster',
    path: 'capiclusters',
    DetailComponent: ClusterDetail,
    ListComponent: ClustersList,
    icon: 'mdi:cloud',
    section: 'capi-fleet',
  },
  {
    name: 'Cluster Classes',
    kind: 'ClusterClass',
    path: 'clusterclasses',
    DetailComponent: ClusterClassDetail,
    ListComponent: ClusterClassesList,
    icon: 'mdi:cloud-print-outline',
    section: 'capi-fleet',
  },
  {
    name: 'Kubeadm Control Planes',
    kind: 'KubeadmControlPlane',
    path: 'kubeadmcontrolplanes',
    DetailComponent: KubeadmControlPlaneDetail,
    ListComponent: KubeadmControlPlanesList,
    icon: 'mdi:controller-classic',
    section: 'capi-cp',
  },
  {
    name: 'Kubeadm Control Plane Templates',
    kind: 'KubeadmControlPlaneTemplate',
    path: 'kubeadmcontrolplanetemplates',
    DetailComponent: KubeadmControlPlaneTemplateDetail,
    ListComponent: KubeadmControlPlaneTemplatesList,
    icon: 'mdi:controller-classic-outline',
    section: 'capi-cp',
  },
  {
    name: 'Machine Deployments',
    kind: 'MachineDeployment',
    path: 'machinedeployments',
    DetailComponent: MachineDeploymentDetail,
    ListComponent: MachineDeploymentsList,
    icon: 'mdi:knob',
    section: 'capi-compute',
  },
  {
    name: 'Machine Pools',
    kind: 'MachinePool',
    path: 'machinepools',
    DetailComponent: MachinePoolDetail,
    ListComponent: MachinePoolsList,
    icon: 'mdi:pool',
    section: 'capi-compute',
  },
  {
    name: 'Machine Sets',
    kind: 'MachineSet',
    path: 'machinesets',
    DetailComponent: MachineSetDetail,
    ListComponent: MachineSetsList,
    icon: 'mdi:set-split',
    section: 'capi-compute',
  },
  {
    name: 'Machines',
    kind: 'Machine',
    path: 'machines',
    DetailComponent: MachineDetail,
    ListComponent: MachinesList,
    icon: 'mdi:desktop-classic',
    section: 'capi-compute',
  },
  {
    name: 'Kubeadm Config Templates',
    kind: 'KubeadmConfigTemplate',
    path: 'kubeadmconfigtemplates',
    DetailComponent: KubeadmConfigTemplateDetail,
    ListComponent: KubeadmConfigTemplatesList,
    icon: 'mdi:list-box-outline',
    section: 'capi-config',
  },
  {
    name: 'Kubeadm Configs',
    kind: 'KubeadmConfig',
    path: 'kubeadmconfigs',
    DetailComponent: KubeadmConfigDetail,
    ListComponent: KubeadmConfigsList,
    icon: 'mdi:list-box',
    section: 'capi-config',
  },
  {
    name: 'Machine Health Checks',
    kind: 'MachineHealthCheck',
    path: 'machinehealthchecks',
    DetailComponent: MachineHealthCheckDetail,
    ListComponent: MachineHealthChecksList,
    icon: 'mdi:bottle-tonic-plus',
    section: 'capi-ops',
  },
  {
    name: 'Machine Drain Rules',
    kind: 'MachineDrainRule',
    path: 'machinedrainrules',
    DetailComponent: MachineDrainRuleDetail,
    ListComponent: MachineDrainRulesList,
    icon: 'mdi:vacuum-outline',
    section: 'capi-ops',
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

// Register on-hover "glance" tooltips for all resource types
registerKubeObjectGlance({ id: 'cluster-glance', component: ClusterGlance });
registerKubeObjectGlance({ id: 'kcp-glance', component: KubeadmControlPlaneGlance });
registerKubeObjectGlance({ id: 'machineset-glance', component: MachineSetGlance });
registerKubeObjectGlance({ id: 'machinedeployment-glance', component: MachineDeploymentGlance });
registerKubeObjectGlance({ id: 'machinepool-glance', component: MachinePoolGlance });
registerKubeObjectGlance({ id: 'machine-glance', component: MachineGlance });
registerKubeObjectGlance({ id: 'machinehealthcheck-glance', component: MachineHealthCheckGlance });
registerKubeObjectGlance({ id: 'machinedrainrule-glance', component: MachineDrainRuleGlance });
registerKubeObjectGlance({ id: 'clusterclass-glance', component: ClusterClassGlance });
registerKubeObjectGlance({ id: 'kubeadmconfig-glance', component: KubeadmConfigGlance });
registerKubeObjectGlance({
  id: 'kubeadmconfigtemplate-glance',
  component: KubeadmConfigTemplateGlance,
});

// Register the combined map source — builds one unified graph with all cross-resource
// edges and correct weights, so Cluster (weight=7000) anchors at left-center.
registerMapSource(clusterApiSource);

// Register the header action for use in resource details views.
registerDetailsViewHeaderAction(TopologyHeaderAction);
