import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  Link as HeadlampLink,
  ResourceListView,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KatibExperimentClass } from '../../resources/katibExperiment';
import { getKatibConditionStatus } from '../common/katibUtils';
import { KubeflowStatusBadge } from '../common/KubeflowStatusBadge';
import { SectionPage } from '../common/SectionPage';

export function KatibExperimentsList() {
  const { t } = useTranslation();

  return (
    <SectionPage title={t('Katib Experiments')} apiPath="/apis/kubeflow.org/v1beta1/experiments">
      <ResourceListView
        title={t('Katib Experiments')}
        resourceClass={KatibExperimentClass}
        columns={[
          {
            id: 'name',
            label: t('Name'),
            getValue: (item: KatibExperimentClass) => item.metadata.name,
            render: (item: KatibExperimentClass) => (
              <HeadlampLink
                routeName="kubeflow-katib-experiments-detail"
                params={{ namespace: item.metadata.namespace, name: item.metadata.name }}
              >
                {item.metadata.name}
              </HeadlampLink>
            ),
          },
          'namespace',
          {
            id: 'algorithm',
            label: t('Algorithm'),
            getValue: (item: KatibExperimentClass) => item.algorithmName || '-',
          },
          {
            id: 'objective',
            label: t('Objective'),
            getValue: (item: KatibExperimentClass) =>
              item.objectiveMetricName
                ? `${t(item.objectiveType || 'maximize')}:${item.objectiveMetricName}`
                : '-',
          },
          {
            id: 'trials',
            label: t('Trials'),
            getValue: (item: KatibExperimentClass) =>
              `${item.status.currentTrialCount ?? 0}/${item.spec.maxTrialCount ?? '-'}`,
          },
          {
            id: 'parallel',
            label: t('Parallel'),
            getValue: (item: KatibExperimentClass) => item.spec.parallelTrialCount ?? '-',
          },
          {
            id: 'failed',
            label: t('Failed'),
            getValue: (item: KatibExperimentClass) => item.status.failedTrialCount ?? 0,
          },
          {
            id: 'early-stopping',
            label: t('Early Stopping'),
            getValue: (item: KatibExperimentClass) =>
              item.earlyStoppingEnabled
                ? t(item.earlyStoppingAlgorithm || 'Enabled')
                : t('Disabled'),
          },
          {
            id: 'status',
            label: t('Status'),
            getValue: (item: KatibExperimentClass) =>
              getKatibConditionStatus(item.latestCondition).label,
            render: (item: KatibExperimentClass) => (
              <KubeflowStatusBadge statusInfo={getKatibConditionStatus(item.latestCondition)} />
            ),
          },
          'age',
        ]}
      />
    </SectionPage>
  );
}
