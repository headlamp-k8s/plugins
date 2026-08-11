import {
  Link,
  Loader,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import { LocalQueue } from '../../resources/localQueue';
import { Workload } from '../../resources/workload';
import { kueueRouteNames } from '../../utils/kueueRoutes';

interface RelatedLocalQueuesSectionProps {
  clusterQueueName: string;
}

interface RelatedWorkloadsSectionProps {
  clusterQueueName?: string;
  localQueueName?: string;
  namespace?: string;
}

/** List the LocalQueues backed by a ClusterQueue. */
export function RelatedLocalQueuesSection({
  clusterQueueName,
}: RelatedLocalQueuesSectionProps) {
  const [localQueues, error] = LocalQueue.useList();

  const relatedLocalQueues = useMemo(
    () =>
      (localQueues || []).filter(localQueue => localQueue.clusterQueueName === clusterQueueName),
    [clusterQueueName, localQueues]
  );

  if (error) {
    return null;
  }

  if (!localQueues) {
    return <Loader title="Loading related LocalQueues..." />;
  }

  return (
    <SectionBox title="Related LocalQueues">
      <SimpleTable
        data={relatedLocalQueues}
        columns={[
          {
            label: 'Name',
            getter: (localQueue: LocalQueue) => (
              <Link kubeObject={localQueue}>{localQueue.metadata.name}</Link>
            ),
          },
          {
            label: 'Namespace',
            getter: (localQueue: LocalQueue) => localQueue.metadata.namespace || '-',
          },
          {
            label: 'Pending Workloads',
            getter: (localQueue: LocalQueue) => localQueue.pendingWorkloads,
          },
          {
            label: 'Admitted Workloads',
            getter: (localQueue: LocalQueue) => localQueue.admittedWorkloads,
          },
          {
            label: 'Status',
            getter: (localQueue: LocalQueue) => localQueue.statusDisplay,
          },
        ]}
      />
    </SectionBox>
  );
}

/** List Workloads related to either a ClusterQueue or a LocalQueue. */
export function RelatedWorkloadsSection({
  clusterQueueName,
  localQueueName,
  namespace,
}: RelatedWorkloadsSectionProps) {
  const [localQueues, localQueuesError] = LocalQueue.useList(
    clusterQueueName ? undefined : { namespace }
  );
  const [workloads, workloadsError] = Workload.useList(namespace ? { namespace } : undefined);

  const relatedWorkloads = useMemo(() => {
    if (!workloads) {
      return [];
    }

    if (localQueueName) {
      return workloads.filter(workload => workload.queueName === localQueueName);
    }

    const relatedLocalQueueKeys = new Set(
      (localQueues || [])
        .filter(localQueue => localQueue.clusterQueueName === clusterQueueName)
        .map(localQueue => `${localQueue.metadata.namespace}/${localQueue.metadata.name}`)
    );

    return workloads.filter(
      workload =>
        workload.admissionClusterQueue === clusterQueueName ||
        relatedLocalQueueKeys.has(`${workload.metadata.namespace}/${workload.queueName}`)
    );
  }, [clusterQueueName, localQueueName, localQueues, workloads]);

  if ((clusterQueueName && localQueuesError) || workloadsError) {
    return null;
  }

  if ((clusterQueueName && !localQueues) || !workloads) {
    return <Loader title="Loading related Workloads..." />;
  }

  return (
    <SectionBox title="Related Workloads">
      <SimpleTable
        data={relatedWorkloads}
        columns={[
          {
            label: 'Name',
            getter: (workload: Workload) => (
              <Link kubeObject={workload}>{workload.metadata.name}</Link>
            ),
          },
          {
            label: 'Namespace',
            getter: (workload: Workload) => workload.metadata.namespace || '-',
          },
          {
            label: 'LocalQueue',
            getter: (workload: Workload) => {
              const workloadNamespace = workload.metadata.namespace;

              if (!workload.queueName || !workloadNamespace) {
                return '-';
              }

              return (
                <Link
                  routeName={kueueRouteNames.localQueueDetail}
                  params={{ namespace: workloadNamespace, name: workload.queueName }}
                >
                  {workload.queueName}
                </Link>
              );
            },
          },
          {
            label: 'Priority',
            getter: (workload: Workload) => workload.priorityDisplay,
          },
          {
            label: 'Status',
            getter: (workload: Workload) => workload.statusDisplay,
          },
        ]}
      />
    </SectionBox>
  );
}
