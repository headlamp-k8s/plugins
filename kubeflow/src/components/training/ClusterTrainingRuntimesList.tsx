import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { ClusterTrainingRuntimeClass } from '../../resources/trainingRuntime';
import { SectionPage } from '../common/SectionPage';
import { getRuntimeFamily, getSchedulingSummary } from './trainerUtils';

/**
 * Lists cluster-scoped ClusterTrainingRuntime resources.
 */
export function ClusterTrainingRuntimesList() {
  const { t } = useTranslation();

  return (
    <SectionPage
      title={t('ClusterTrainingRuntimes')}
      apiPath="/apis/trainer.kubeflow.org/v1alpha1/clustertrainingruntimes"
    >
      <ResourceListView
        title={t('ClusterTrainingRuntimes')}
        resourceClass={ClusterTrainingRuntimeClass}
        columns={[
          'name',
          {
            id: 'scope',
            label: t('Scope'),
            getValue: () => t('Cluster'),
            render: () => t('Cluster'),
          },
          {
            id: 'framework',
            label: t('Framework'),
            getValue: (item: ClusterTrainingRuntimeClass) => getRuntimeFamily(item),
            render: (item: ClusterTrainingRuntimeClass) => getRuntimeFamily(item),
          },
          {
            id: 'defaultNodes',
            label: t('Default Nodes'),
            getValue: (item: ClusterTrainingRuntimeClass) => `${item.defaultNumNodes ?? '-'}`,
            render: (item: ClusterTrainingRuntimeClass) => item.defaultNumNodes ?? '-',
          },
          {
            id: 'templateJobs',
            label: t('Template Jobs'),
            getValue: (item: ClusterTrainingRuntimeClass) => `${item.templateJobCount}`,
            render: (item: ClusterTrainingRuntimeClass) => item.templateJobCount,
          },
          {
            id: 'scheduling',
            label: t('Scheduling'),
            getValue: (item: ClusterTrainingRuntimeClass) => getSchedulingSummary(item, t),
            render: (item: ClusterTrainingRuntimeClass) => getSchedulingSummary(item, t),
          },
          'age',
        ]}
      />
    </SectionPage>
  );
}
