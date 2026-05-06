import {
  Link as HeadlampLink,
  ResourceListView,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KatibExperimentClass } from '../../resources/katibExperiment';
import { getKatibConditionStatus } from '../common/katibUtils';
import { KubeflowStatusBadge } from '../common/KubeflowStatusBadge';
import { SectionPage } from '../common/SectionPage';

export function KatibExperimentsList() {
  return (
    <SectionPage title="Katib Experiments" apiPath="/apis/kubeflow.org/v1beta1/experiments">
      <ResourceListView
        title="Katib Experiments"
        resourceClass={KatibExperimentClass}
        columns={[
          {
            id: 'name',
            label: 'Name',
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
            label: 'Algorithm',
            getValue: (item: KatibExperimentClass) => item.algorithmName || '-',
          },
          {
            id: 'objective',
            label: 'Objective',
            getValue: (item: KatibExperimentClass) =>
              item.objectiveMetricName
                ? `${item.objectiveType || 'maximize'}:${item.objectiveMetricName}`
                : '-',
          },
          {
            id: 'trials',
            label: 'Trials',
            getValue: (item: KatibExperimentClass) =>
              `${item.status.currentTrialCount ?? 0}/${item.spec.maxTrialCount ?? '-'}`,
          },
          {
            id: 'parallel',
            label: 'Parallel',
            getValue: (item: KatibExperimentClass) => item.spec.parallelTrialCount ?? '-',
          },
          {
            id: 'failed',
            label: 'Failed',
            getValue: (item: KatibExperimentClass) => item.status.failedTrialCount ?? 0,
          },
          {
            id: 'early-stopping',
            label: 'Early Stopping',
            getValue: (item: KatibExperimentClass) =>
              item.earlyStoppingEnabled ? item.earlyStoppingAlgorithm || 'Enabled' : 'Disabled',
          },
          {
            id: 'status',
            label: 'Status',
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
