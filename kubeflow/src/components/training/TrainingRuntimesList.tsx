import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { TrainingRuntimeClass } from '../../resources/trainingRuntime';
import { SectionPage } from '../common/SectionPage';
import { getRuntimeFamily, getSchedulingSummary } from './trainerUtils';

/**
 * Lists namespace-scoped TrainingRuntime resources.
 */
export function TrainingRuntimesList() {
  const { t } = useTranslation();

  return (
    <SectionPage
      title={t('TrainingRuntimes')}
      apiPath="/apis/trainer.kubeflow.org/v1alpha1/trainingruntimes"
    >
      <ResourceListView
        title={t('TrainingRuntimes')}
        resourceClass={TrainingRuntimeClass}
        columns={[
          'name',
          'namespace',
          {
            id: 'scope',
            label: t('Scope'),
            getValue: () => t('Namespace'),
            render: () => t('Namespace'),
          },
          {
            id: 'framework',
            label: t('Framework'),
            getValue: (item: TrainingRuntimeClass) => getRuntimeFamily(item),
            render: (item: TrainingRuntimeClass) => getRuntimeFamily(item),
          },
          {
            id: 'defaultNodes',
            label: t('Default Nodes'),
            getValue: (item: TrainingRuntimeClass) => `${item.defaultNumNodes ?? '-'}`,
            render: (item: TrainingRuntimeClass) => item.defaultNumNodes ?? '-',
          },
          {
            id: 'mlPolicy',
            label: t('ML Policy'),
            getValue: (item: TrainingRuntimeClass) => getRuntimeFamily(item),
            render: (item: TrainingRuntimeClass) => getRuntimeFamily(item),
          },
          {
            id: 'scheduling',
            label: t('Scheduling'),
            getValue: (item: TrainingRuntimeClass) => getSchedulingSummary(item, t),
            render: (item: TrainingRuntimeClass) => getSchedulingSummary(item, t),
          },
          'age',
        ]}
      />
    </SectionPage>
  );
}
