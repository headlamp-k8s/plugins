import { DetailsViewSectionProps } from '@kinvolk/headlamp-plugin/lib';
import {
  EmptyContent,
  Link,
  Loader,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Fragment } from 'react';
import { Workload } from '../../resources/workload';
import KueuePanelLinks from '../common/KueuePanelLinks';
import { renderLocalQueueLink } from '../common/KueueResourceLinks';
import { getBlockerSection } from '../workloads/Detail';
import { findOwnedWorkloads, hasPodWorkloads } from './kueueJobWorkload';

/** Label Kueue reads to decide which LocalQueue a Job is submitted to. */
export const QUEUE_NAME_LABEL = 'kueue.x-k8s.io/queue-name';

/**
 * Show the Kueue queue, Workload and admission state on any resource managed by Kueue,
 * which is any resource with the queue-name label.
 */
export default function KueueJobSection({ resource }: DetailsViewSectionProps) {
  const queueName = resource?.metadata?.labels?.[QUEUE_NAME_LABEL];

  if (!queueName || !resource.metadata.namespace) {
    return null;
  }

  if (hasPodWorkloads(resource.kind)) {
    return (
      <KueuePanelLinks>
        <SectionBox title="Kueue">
          <NameValueTable
            rows={[
              {
                name: 'Queue',
                value: renderLocalQueueLink(
                  queueName,
                  resource.metadata.namespace,
                  resource.cluster
                ),
              },
              { name: 'Workload', value: 'Each Pod has its own Workload' },
            ]}
          />
        </SectionBox>
      </KueuePanelLinks>
    );
  }

  return <KueueJobDetails job={resource} queueName={queueName} />;
}

function KueueJobDetails({ job, queueName }: { job: KubeObject; queueName: string }) {
  const namespace = job.metadata.namespace;
  const [workloads, error] = Workload.useList({ namespace, cluster: job.cluster });

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

  const owned = findOwnedWorkloads(workloads, job.metadata.uid);

  return (
    <KueuePanelLinks>
      <SectionBox title="Kueue">
        <NameValueTable
          rows={[
            { name: 'Queue', value: renderLocalQueueLink(queueName, namespace, job.cluster) },
            { name: 'Workload', value: 'Not created yet', hide: owned.length > 0 },
            ...owned.flatMap(workload => [
              {
                name: 'Workload',
                value: <Link kubeObject={workload}>{workload.metadata.name}</Link>,
              },
              { name: 'Status', value: workload.statusDisplay },
            ]),
          ]}
        />
      </SectionBox>
      {owned.map(workload => (
        <Fragment key={workload.metadata.uid}>
          {
            getBlockerSection(
              workload,
              // A LeaderWorkerSet has one Workload per group, so name each one.
              owned.length > 1 ? `Why is ${workload.metadata.name} not admitted?` : undefined
            )?.section
          }
        </Fragment>
      ))}
    </KueuePanelLinks>
  );
}
