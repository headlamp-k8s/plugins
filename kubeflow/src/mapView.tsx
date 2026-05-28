import { Icon } from '@iconify/react';
import { useMemo } from 'react';
import { KatibExperimentsDetail } from './components/katib/KatibExperimentsDetail';
import { NotebooksDetail } from './components/notebooks/NotebooksDetail';
import { PodDefaultsDetail } from './components/notebooks/PodDefaultsDetail';
import { ProfilesDetail } from './components/notebooks/ProfilesDetail';
import { PipelinesDetail } from './components/pipelines/PipelinesDetail';
import { SparkApplicationsDetail } from './components/spark/SparkApplicationsDetail';
import { TrainJobsDetail } from './components/training/TrainJobsDetail';
import { KatibExperimentClass } from './resources/katibExperiment';
import { NotebookClass } from './resources/notebook';
import { PipelineClass } from './resources/pipeline';
import { PodDefaultClass } from './resources/podDefault';
import { ProfileClass } from './resources/profile';
import { SparkApplicationClass } from './resources/sparkApplication';
import { TrainJobClass } from './resources/trainJob';

interface MapResourceConfig {
  name: string;
  kind: string;
  path: string;
  DetailComponent: React.ComponentType<{ node?: any }>;
  icon: string;
  resourceClass: any;
}

const mapResources: MapResourceConfig[] = [
  {
    name: 'Notebooks',
    kind: 'Notebook',
    path: 'notebooks',
    DetailComponent: NotebooksDetail,
    icon: 'mdi:notebook',
    resourceClass: NotebookClass,
  },
  {
    name: 'Profiles',
    kind: 'Profile',
    path: 'profiles',
    DetailComponent: ProfilesDetail,
    icon: 'mdi:account',
    resourceClass: ProfileClass,
  },
  {
    name: 'PodDefaults',
    kind: 'PodDefault',
    path: 'poddefaults',
    DetailComponent: PodDefaultsDetail,
    icon: 'mdi:cube-outline',
    resourceClass: PodDefaultClass,
  },
  {
    name: 'Katib Experiments',
    kind: 'Experiment',
    path: 'katibexperiments',
    DetailComponent: KatibExperimentsDetail,
    icon: 'mdi:tune',
    resourceClass: KatibExperimentClass,
  },
  {
    name: 'Pipelines',
    kind: 'Pipeline',
    path: 'pipelines',
    DetailComponent: PipelinesDetail,
    icon: 'mdi:sitemap',
    resourceClass: PipelineClass,
  },
  {
    name: 'Spark Applications',
    kind: 'SparkApplication',
    path: 'sparkapplications',
    DetailComponent: SparkApplicationsDetail,
    icon: 'mdi:flash',
    resourceClass: SparkApplicationClass,
  },
  {
    name: 'TrainJobs',
    kind: 'TrainJob',
    path: 'trainjobs',
    DetailComponent: TrainJobsDetail,
    icon: 'mdi:school',
    resourceClass: TrainJobClass,
  },
];

function createKubeflowMapSource(r: MapResourceConfig) {
  const knownKinds = new Set(mapResources.map(res => res.kind));

  return {
    id: `kubeflow-${r.path}`,
    label: r.name,
    icon: <Icon icon={r.icon} width="100%" height="100%" color="#4279f4" />,
    useData() {
      const [items] = r.resourceClass.useList();

      return useMemo(() => {
        const nodes = (items ?? []).map((it: any) => ({
          id: it.metadata.uid,
          kubeObject: it,
          detailsComponent: r.DetailComponent,
          status: undefined, // Add logic to derive status if needed
          weight: r.kind === 'Profile' ? 100 : 0, // Profile as top level
        }));

        const edges: Array<{
          id: string;
          source: string;
          target: string;
          label: string;
        }> = [];

        for (const it of items ?? []) {
          const refs = it.metadata?.ownerReferences;
          if (!refs) continue;

          refs.forEach((ownerRef: any) => {
            if (!knownKinds.has(ownerRef.kind)) return;

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
  };
}

export const kubeflowApiSource = {
  id: 'kubeflow',
  label: 'Kubeflow',
  icon: <Icon icon="custom:kubeflow" width="100%" height="100%" />,
  sources: mapResources.map(r => createKubeflowMapSource(r)),
};
