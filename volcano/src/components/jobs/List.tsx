import { Link, ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { VolcanoJob } from '../../resources/job';
import { getJobStatusColor } from '../../utils/status';
import { VolcanoCoreInstallCheck } from '../common/CommonComponents';

/**
 * Renders the Volcano Jobs list page.
 *
 * @returns Jobs resource list view.
 */
export default function JobList() {
  return (
    <VolcanoCoreInstallCheck>
      <ResourceListView
        title="Volcano Jobs"
        resourceClass={VolcanoJob}
        columns={[
          'name',
          'namespace',
          {
            id: 'status',
            label: 'Status',
            getValue: (job: VolcanoJob) => job.phase,
            render: (job: VolcanoJob) => (
              <StatusLabel status={getJobStatusColor(job.phase)}>{job.phase}</StatusLabel>
            ),
          },
          {
            id: 'queue',
            label: 'Queue',
            getValue: (job: VolcanoJob) => job.queue,
            render: (job: VolcanoJob) => (
              <Link routeName="volcano-queue-detail" params={{ name: job.queue }}>
                {job.queue}
              </Link>
            ),
          },
          {
            id: 'running',
            label: 'Running',
            getValue: (job: VolcanoJob) => job.runningCount,
          },
          {
            id: 'min-available',
            label: 'Min Available',
            getValue: (job: VolcanoJob) => job.minAvailable,
          },
          {
            id: 'pending',
            label: 'Pending',
            getValue: (job: VolcanoJob) => job.pendingCount,
          },
          {
            id: 'succeeded',
            label: 'Succeeded',
            getValue: (job: VolcanoJob) => job.succeededCount,
          },
          {
            id: 'failed',
            label: 'Failed',
            getValue: (job: VolcanoJob) => job.failedCount,
          },
          {
            id: 'unknown',
            label: 'Unknown',
            getValue: (job: VolcanoJob) => job.unknownCount,
          },
          {
            id: 'retries',
            label: 'Retries',
            getValue: (job: VolcanoJob) => job.retryCount,
          },
          {
            id: 'replicas',
            label: 'Replicas',
            getValue: (job: VolcanoJob) => job.replicaCount,
          },
          {
            id: 'job-type',
            label: 'Job Type',
            getValue: (job: VolcanoJob) => job.jobType,
          },
          {
            id: 'tasks',
            label: 'Tasks',
            getValue: (job: VolcanoJob) => job.taskCount,
          },
          'age',
        ]}
      />
    </VolcanoCoreInstallCheck>
  );
}
