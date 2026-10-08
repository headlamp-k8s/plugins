import { DetailsViewSectionProps } from '@kinvolk/headlamp-plugin/lib';
import {
  EmptyContent,
  Link,
  Loader,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Workload } from '../../resources/workload';
import { renderLocalQueueLink } from '../common/KueueResourceLinks';
import { getBlockerSection } from '../workloads/Detail';

/** Label Kueue reads to decide which LocalQueue a Job is submitted to. */
const QUEUE_NAME_LABEL = 'kueue.x-k8s.io/queue-name';

/** Show the Kueue queue, Workload and admission state on a batch Job managed by Kueue. */
export default function KueueJobSection({ resource }: DetailsViewSectionProps) {
  const queueName = resource?.metadata?.labels?.[QUEUE_NAME_LABEL];

  if (resource?.kind !== 'Job' || !queueName) {
    return null;
  }

  return <KueueJobDetails job={resource} queueName={queueName} />;
}

function KueueJobDetails({ job, queueName }: { job: KubeObject; queueName: string }) {
  const namespace = job.metadata.namespace;
  const [workloads, error] = Workload.useList({ namespace });

  if (error) {
    return (
      <SectionBox title="Kueue">
        <EmptyContent color="text.secondary">
          Unable to load Kueue Workloads. Check that you have access to list them.
        </EmptyContent>
      </SectionBox>
    );
  }

  if (!workloads) {
    return <Loader title="Loading Kueue Workload..." />;
  }

  // Kueue creates one Workload per Job and sets the Job as its owner.
  const workload = workloads.find(item =>
    item.metadata.ownerReferences?.some(owner => owner.uid === job.metadata.uid)
  );

  return (
    <>
      <SectionBox title="Kueue">
        <NameValueTable
          rows={[
            { name: 'Queue', value: renderLocalQueueLink(queueName, namespace) },
            {
              name: 'Workload',
              value: workload ? (
                <Link kubeObject={workload}>{workload.metadata.name}</Link>
              ) : (
                'Not created yet'
              ),
            },
            { name: 'Status', value: workload?.statusDisplay, hide: !workload },
          ]}
        />
      </SectionBox>
      {workload && getBlockerSection(workload)?.section}
    </>
  );
}
