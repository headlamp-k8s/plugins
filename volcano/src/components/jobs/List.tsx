import { Link, ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { VolcanoJob } from '../../resources/job';
import { getJobStatusColor } from '../../utils/status';

export default function JobList() {
  return (
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
          getValue: (job: VolcanoJob) => `${job.runningCount}/${job.minAvailable}`,
        },
        {
          id: 'tasks',
          label: 'Tasks',
          getValue: (job: VolcanoJob) => job.taskCount,
        },
        'age',
      ]}
    />
  );
}
