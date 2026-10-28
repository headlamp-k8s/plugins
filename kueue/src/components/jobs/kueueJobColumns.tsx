import { Link } from '@kinvolk/headlamp-plugin/lib/components/common';
import type { TableColumnsProcessor } from '@kinvolk/headlamp-plugin/lib/components/common/Resource/resourceTableSlice';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Workload } from '../../resources/workload';
import { renderLocalQueueLink } from '../common/KueueResourceLinks';
import { QUEUE_NAME_LABEL } from './KueueJobSection';

const QUEUE_COLUMN_ID = 'kueue-queue';
const STATUS_COLUMN_ID = 'kueue-status';

function getQueueName(job: KubeObject) {
  return job.metadata?.labels?.[QUEUE_NAME_LABEL];
}

/** Show the status of the Workload Kueue created for a Job, linked to it. */
function KueueJobStatus({ job }: { job: KubeObject }) {
  // Every row in a namespace asks for the same list, so it is fetched once and shared.
  const [workloads] = Workload.useList({ namespace: job.metadata.namespace, cluster: job.cluster });
  const workload = workloads?.find(
    item => item.metadata.labels?.['kueue.x-k8s.io/job-uid'] === job.metadata.uid
  );

  if (!workload) {
    return <>-</>;
  }

  return <Link kubeObject={workload}>{workload.statusDisplay}</Link>;
}

/** Add Queue and Kueue Status columns to Headlamp's Jobs table. */
export const processJobsTableColumns: TableColumnsProcessor['processor'] = ({ id, columns }) => {
  if (id !== 'headlamp-jobs') {
    return columns;
  }

  const kueueColumns = [
    {
      id: QUEUE_COLUMN_ID,
      label: 'Queue',
      gridTemplate: 'min-content',
      getValue: (job: KubeObject) => getQueueName(job) ?? '',
      render: (job: KubeObject) =>
        renderLocalQueueLink(getQueueName(job), job.metadata.namespace, job.cluster),
    },
    {
      id: STATUS_COLUMN_ID,
      label: 'Kueue Status',
      gridTemplate: 'min-content',
      // The status comes from a Workload fetched in the cell, so it cannot be sorted or filtered.
      sort: false,
      disableFiltering: true,
      getValue: () => '',
      render: (job: KubeObject) => (getQueueName(job) ? <KueueJobStatus job={job} /> : '-'),
    },
  ] as unknown as typeof columns;

  const result = columns.filter(
    column =>
      typeof column === 'string' ||
      (column.id !== QUEUE_COLUMN_ID && column.id !== STATUS_COLUMN_ID)
  );
  const labelsIndex = result.indexOf('labels');
  result.splice(labelsIndex === -1 ? result.length : labelsIndex, 0, ...kueueColumns);

  return result;
};
