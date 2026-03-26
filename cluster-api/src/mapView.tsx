import { Icon } from '@iconify/react';
import { useMemo } from 'react';
import { ClusterClassDetail } from './components/clusterclasses/Detail';
import { ClusterDetail } from './components/clusters/Detail';
import { KubeadmControlPlaneDetail } from './components/kubeadmcontrolplanes/Detail';
import { KubeadmControlPlaneTemplateDetail } from './components/kubeadmcontrolplanetemplates/Detail';
import { MachineDeploymentDetail } from './components/machinedeployments/Detail';
import { MachinePoolDetail } from './components/machinepools/Detail';
import { MachineDetail } from './components/machines/Detail';
import { MachineSetDetail } from './components/machinesets/Detail';
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

const mapResources = [
  {
    name: 'Clusters',
    kind: 'Cluster',
    path: 'capiclusters',
    DetailComponent: ClusterDetail,
    icon: 'mdi:cloud',
  },
  {
    name: 'Cluster Classes',
    kind: 'ClusterClass',
    path: 'clusterclasses',
    DetailComponent: ClusterClassDetail,
    icon: 'mdi:cloud-print-outline',
  },
  {
    name: 'Kubeadm Control Planes',
    kind: 'KubeadmControlPlane',
    path: 'kubeadmcontrolplanes',
    DetailComponent: KubeadmControlPlaneDetail,
    icon: 'mdi:controller-classic',
  },
  {
    name: 'Kubeadm Control Plane Templates',
    kind: 'KubeadmControlPlaneTemplate',
    path: 'kubeadmcontrolplanetemplates',
    DetailComponent: KubeadmControlPlaneTemplateDetail,
    icon: 'mdi:controller-classic-outline',
  },
  {
    name: 'Machine Deployments',
    kind: 'MachineDeployment',
    path: 'machinedeployments',
    DetailComponent: MachineDeploymentDetail,
    icon: 'mdi:knob',
  },
  {
    name: 'Machine Pools',
    kind: 'MachinePool',
    path: 'machinepools',
    DetailComponent: MachinePoolDetail,
    icon: 'mdi:pool',
  },
  {
    name: 'Machine Sets',
    kind: 'MachineSet',
    path: 'machinesets',
    DetailComponent: MachineSetDetail,
    icon: 'mdi:set-split',
  },
  {
    name: 'Machines',
    kind: 'Machine',
    path: 'machines',
    DetailComponent: MachineDetail,
    icon: 'mdi:desktop-classic',
  },
] as const;

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

const resourceWeightByKind: Record<string, number> = {
  Cluster: 6000,
  ClusterClass: 5800,
  KubeadmControlPlane: 5600,
  KubeadmControlPlaneTemplate: 5400,
  MachineDeployment: 5200,
  MachineSet: 5000,
  MachinePool: 4800,
  Machine: 4600,
};

export const clusterApiSource = {
  id: 'cluster-api',
  label: 'Cluster API',
  icon: <Icon icon="mdi:kubernetes" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  sources: mapResources.map(r => ({
    id: `cluster-api-${r.path}`,
    label: r.name,
    icon: <Icon icon={r.icon} width="100%" height="100%" color="rgb(50, 108, 229)" />,
    useData() {
      const resourceClass = resourceClassMap[r.kind] as any;
      const [items] = resourceClass.useList();
      return useMemo(() => {
        const nodes = (items ?? []).map(it => ({
          id: it.metadata.uid,
          kubeObject: it,
          detailsComponent: r.DetailComponent,
          weight: resourceWeightByKind[r.kind] ?? 3000,
        }));

        const edges = [];
        for (const it of items ?? []) {
          const refs = it.metadata?.ownerReferences;
          if (!refs) continue;
          refs.forEach(ownerRef => {
            edges.push({
              id: `${ownerRef.uid}-${it.metadata.uid}`,
              source: ownerRef.uid,
              target: it.metadata.uid,
              label: `owned by ${ownerRef.kind}`,
            });
          });
        }

        return { nodes, edges };
      }, [items]);
    },
  })),
};
