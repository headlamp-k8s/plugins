import {
  EmptyContent,
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

function getRelatedClusterQueueWorkloads(
  clusterQueueName: string | undefined,
  workloads: Workload[],
  localQueues?: LocalQueue[] | null
) {
  if (!clusterQueueName) {
    return [];
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
}

function renderLoadError(title: string, resourceLabel: string) {
  return (
    <SectionBox title={title}>
      <EmptyContent color="text.secondary">
        Unable to load related {resourceLabel}. Check that you have access to list them.
      </EmptyContent>
    </SectionBox>
  );
}

/** List the LocalQueues backed by a ClusterQueue. */
export function RelatedLocalQueuesSection({ clusterQueueName }: RelatedLocalQueuesSectionProps) {
  const [localQueues, error] = LocalQueue.useList();

  const relatedLocalQueues = useMemo(
    () =>
      (localQueues || []).filter(localQueue => localQueue.clusterQueueName === clusterQueueName),
    [clusterQueueName, localQueues]
  );

  if (error) {
    return renderLoadError('Related LocalQueues', 'LocalQueues');
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
  if (localQueueName) {
    return (
      <RelatedLocalQueueWorkloadsSection localQueueName={localQueueName} namespace={namespace} />
    );
  }

  return <RelatedClusterQueueWorkloadsSection clusterQueueName={clusterQueueName} />;
}

function RelatedClusterQueueWorkloadsSection({
  clusterQueueName,
}: Pick<RelatedWorkloadsSectionProps, 'clusterQueueName'>) {
  const [localQueues, localQueuesError] = LocalQueue.useList();
  const [workloads, workloadsError] = Workload.useList();

  const relatedWorkloads = useMemo(() => {
    if (!workloads) {
      return [];
    }

    return getRelatedClusterQueueWorkloads(
      clusterQueueName,
      workloads,
      localQueuesError ? null : localQueues
    );
  }, [clusterQueueName, localQueues, localQueuesError, workloads]);

  if (workloadsError) {
    return renderLoadError('Related Workloads', 'Workloads');
  }

  if ((!localQueues && !localQueuesError) || !workloads) {
    return <Loader title="Loading related Workloads..." />;
  }

  return (
    <RelatedWorkloadsTable
      workloads={relatedWorkloads}
      loadWarning={
        localQueuesError
          ? 'Unable to load related LocalQueues. Workloads found through LocalQueues may be incomplete.'
          : undefined
      }
    />
  );
}

function RelatedLocalQueueWorkloadsSection({
  localQueueName,
  namespace,
}: Pick<RelatedWorkloadsSectionProps, 'localQueueName' | 'namespace'>) {
  const [workloads, workloadsError] = Workload.useList(namespace ? { namespace } : undefined);

  const relatedWorkloads = useMemo(() => {
    if (!workloads) {
      return [];
    }

    if (localQueueName) {
      return workloads.filter(workload => workload.queueName === localQueueName);
    }

    return [];
  }, [localQueueName, workloads]);

  if (workloadsError) {
    return renderLoadError('Related Workloads', 'Workloads');
  }

  if (!workloads) {
    return <Loader title="Loading related Workloads..." />;
  }

  return <RelatedWorkloadsTable workloads={relatedWorkloads} />;
}

function RelatedWorkloadsTable({
  workloads,
  loadWarning,
}: {
  workloads: Workload[];
  loadWarning?: string;
}) {
  return (
    <SectionBox title="Related Workloads">
      {loadWarning && <EmptyContent color="text.secondary">{loadWarning}</EmptyContent>}
      <SimpleTable
        data={workloads}
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
