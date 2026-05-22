import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { TrainingRuntimeClass } from '../../resources/trainingRuntime';
import { SectionPage } from '../common/SectionPage';
import { getRuntimeFamily, getSchedulingSummary } from './trainerUtils';

/**
 * Lists namespace-scoped TrainingRuntime resources.
 */
export function TrainingRuntimesList() {
  return (
    <SectionPage
      title="TrainingRuntimes"
      apiPath="/apis/trainer.kubeflow.org/v1alpha1/trainingruntimes"
    >
      <ResourceListView
        title="TrainingRuntimes"
        resourceClass={TrainingRuntimeClass}
        columns={[
          'name',
          'namespace',
          {
            id: 'scope',
            label: 'Scope',
            getValue: () => 'Namespace',
            render: () => 'Namespace',
          },
          {
            id: 'framework',
            label: 'Framework',
            getValue: (item: TrainingRuntimeClass) => getRuntimeFamily(item),
            render: (item: TrainingRuntimeClass) => getRuntimeFamily(item),
          },
          {
            id: 'defaultNodes',
            label: 'Default Nodes',
            getValue: (item: TrainingRuntimeClass) => `${item.defaultNumNodes ?? '-'}`,
            render: (item: TrainingRuntimeClass) => item.defaultNumNodes ?? '-',
          },
          {
            id: 'mlPolicy',
            label: 'ML Policy',
            getValue: (item: TrainingRuntimeClass) => getRuntimeFamily(item),
            render: (item: TrainingRuntimeClass) => getRuntimeFamily(item),
          },
          {
            id: 'scheduling',
            label: 'Scheduling',
            getValue: (item: TrainingRuntimeClass) => getSchedulingSummary(item),
            render: (item: TrainingRuntimeClass) => getSchedulingSummary(item),
          },
          'age',
        ]}
      />
    </SectionPage>
  );
}
