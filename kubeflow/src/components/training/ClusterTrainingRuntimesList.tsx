import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { ClusterTrainingRuntimeClass } from '../../resources/trainingRuntime';
import { SectionPage } from '../common/SectionPage';
import { getRuntimeFamily, getSchedulingSummary } from './trainerUtils';

/**
 * Lists cluster-scoped ClusterTrainingRuntime resources.
 */
export function ClusterTrainingRuntimesList() {
  return (
    <SectionPage
      title="ClusterTrainingRuntimes"
      apiPath="/apis/trainer.kubeflow.org/v1alpha1/clustertrainingruntimes"
    >
      <ResourceListView
        title="ClusterTrainingRuntimes"
        resourceClass={ClusterTrainingRuntimeClass}
        columns={[
          'name',
          {
            id: 'scope',
            label: 'Scope',
            getValue: () => 'Cluster',
            render: () => 'Cluster',
          },
          {
            id: 'framework',
            label: 'Framework',
            getValue: (item: ClusterTrainingRuntimeClass) => getRuntimeFamily(item),
            render: (item: ClusterTrainingRuntimeClass) => getRuntimeFamily(item),
          },
          {
            id: 'defaultNodes',
            label: 'Default Nodes',
            getValue: (item: ClusterTrainingRuntimeClass) => `${item.defaultNumNodes ?? '-'}`,
            render: (item: ClusterTrainingRuntimeClass) => item.defaultNumNodes ?? '-',
          },
          {
            id: 'templateJobs',
            label: 'Template Jobs',
            getValue: (item: ClusterTrainingRuntimeClass) => `${item.templateJobCount}`,
            render: (item: ClusterTrainingRuntimeClass) => item.templateJobCount,
          },
          {
            id: 'scheduling',
            label: 'Scheduling',
            getValue: (item: ClusterTrainingRuntimeClass) => getSchedulingSummary(item),
            render: (item: ClusterTrainingRuntimeClass) => getSchedulingSummary(item),
          },
          'age',
        ]}
      />
    </SectionPage>
  );
}
