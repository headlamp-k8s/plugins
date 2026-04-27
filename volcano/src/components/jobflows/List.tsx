import { ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { VolcanoJobFlow } from '../../resources/jobflow';
import { getJobFlowStatusColor } from '../../utils/status';
import { VolcanoFlowInstallCheck } from '../common/CommonComponents';
import { getJobFlowGeneratedJobCount, getJobFlowPhaseCount } from './jobFlow';

/**
 * Renders the Volcano JobFlows list page.
 *
 * @returns JobFlows resource list view.
 */
export default function JobFlowList() {
  return (
    <VolcanoFlowInstallCheck>
      <ResourceListView
        title="Volcano JobFlows"
        resourceClass={VolcanoJobFlow}
        columns={[
          'name',
          'namespace',
          {
            id: 'status',
            label: 'Status',
            getValue: (jobFlow: VolcanoJobFlow) => jobFlow.phase,
            render: (jobFlow: VolcanoJobFlow) => (
              <StatusLabel status={getJobFlowStatusColor(jobFlow.phase)}>
                {jobFlow.phase}
              </StatusLabel>
            ),
          },
          {
            id: 'retain-policy',
            label: 'Retain Policy',
            getValue: (jobFlow: VolcanoJobFlow) => jobFlow.jobRetainPolicy,
          },
          {
            id: 'flows',
            label: 'Flows',
            getValue: (jobFlow: VolcanoJobFlow) => jobFlow.flowCount,
          },
          {
            id: 'generated',
            label: 'Generated',
            getValue: (jobFlow: VolcanoJobFlow) => getJobFlowGeneratedJobCount(jobFlow),
          },
          {
            id: 'running',
            label: 'Running',
            getValue: (jobFlow: VolcanoJobFlow) => getJobFlowPhaseCount(jobFlow, ['Running']),
          },
          {
            id: 'failed',
            label: 'Failed',
            getValue: (jobFlow: VolcanoJobFlow) => getJobFlowPhaseCount(jobFlow, ['Failed']),
          },
          {
            id: 'completed',
            label: 'Completed',
            getValue: (jobFlow: VolcanoJobFlow) =>
              getJobFlowPhaseCount(jobFlow, ['Completed', 'Completing']),
          },
          'age',
        ]}
      />
    </VolcanoFlowInstallCheck>
  );
}
