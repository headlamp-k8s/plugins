import {
  EmptyContent,
  Link,
  Loader,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import {
  findAdmissionCheckRule,
  findUnreadyAdmissionCheckState,
  renderAdmissionCheckFlavors,
} from '../../resources/admissionCheckFormatters';
import { ClusterQueue } from '../../resources/clusterQueue';
import { renderFlavorNominalQuota } from '../../resources/clusterQueueFormatters';
import { LocalQueue } from '../../resources/localQueue';
import { AdmissionCheckState, Workload } from '../../resources/workload';
import { getWorkloadBlocker, renderText } from '../../resources/workloadFormatters';
import { kueueRouteNames } from '../../utils/kueueRoutes';
import { renderCohortLink } from './KueueResourceLinks';

interface AdmissionCheckClusterQueueRow {
  clusterQueue: ClusterQueue;
  onFlavors?: string[];
}

interface AdmissionCheckWorkloadRow {
  workload: Workload;
  checkState: AdmissionCheckState;
}

interface RelatedLocalQueuesSectionProps {
  clusterQueueName: string;
  cluster?: string;
}

interface RelatedWorkloadsSectionProps {
  clusterQueueName?: string;
  localQueueName?: string;
  namespace?: string;
  cluster?: string;
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
export function RelatedLocalQueuesSection({
  clusterQueueName,
  cluster,
}: RelatedLocalQueuesSectionProps) {
  const [localQueues, error] = LocalQueue.useList({ cluster });

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

/** List the ClusterQueues that get quota from a ResourceFlavor. */
export function FlavorClusterQueuesSection({
  flavorName,
  cluster,
}: {
  flavorName: string;
  cluster?: string;
}) {
  const [clusterQueues, error] = ClusterQueue.useList({ cluster });

  const flavorClusterQueues = useMemo(
    () =>
      (clusterQueues || []).filter(clusterQueue =>
        clusterQueue.referencedFlavorNames.includes(flavorName)
      ),
    [clusterQueues, flavorName]
  );

  if (error) {
    return renderLoadError('ClusterQueues', 'ClusterQueues');
  }

  if (!clusterQueues) {
    return <Loader title="Loading ClusterQueues..." />;
  }

  return (
    <SectionBox title="ClusterQueues">
      <SimpleTable
        data={flavorClusterQueues}
        emptyMessage="No ClusterQueue uses this ResourceFlavor."
        columns={[
          {
            label: 'Name',
            getter: (clusterQueue: ClusterQueue) => (
              <Link kubeObject={clusterQueue}>{clusterQueue.metadata.name}</Link>
            ),
          },
          {
            label: 'Nominal Quota',
            getter: (clusterQueue: ClusterQueue) =>
              renderFlavorNominalQuota(clusterQueue.resourceGroups, flavorName),
          },
          {
            label: 'Cohort',
            getter: (clusterQueue: ClusterQueue) => renderCohortLink(clusterQueue.spec.cohortName),
          },
          {
            label: 'Status',
            getter: (clusterQueue: ClusterQueue) => clusterQueue.statusDisplay,
          },
        ]}
      />
    </SectionBox>
  );
}

/** List the ClusterQueues that run an AdmissionCheck. */
export function AdmissionCheckClusterQueuesSection({
  checkName,
  cluster,
}: {
  checkName: string;
  cluster?: string;
}) {
  const [clusterQueues, error] = ClusterQueue.useList({ cluster });

  const rows = useMemo(
    () =>
      (clusterQueues || []).flatMap(clusterQueue => {
        const rule = findAdmissionCheckRule(clusterQueue.spec.admissionChecksStrategy, checkName);
        return rule ? [{ clusterQueue, onFlavors: rule.onFlavors }] : [];
      }),
    [clusterQueues, checkName]
  );

  if (error) {
    return renderLoadError('ClusterQueues', 'ClusterQueues');
  }

  if (!clusterQueues) {
    return <Loader title="Loading ClusterQueues..." />;
  }

  return (
    <SectionBox title="ClusterQueues">
      <SimpleTable
        data={rows}
        emptyMessage="No ClusterQueue uses this AdmissionCheck."
        columns={[
          {
            label: 'Name',
            getter: (row: AdmissionCheckClusterQueueRow) => (
              <Link kubeObject={row.clusterQueue}>{row.clusterQueue.metadata.name}</Link>
            ),
          },
          {
            label: 'Flavors',
            getter: (row: AdmissionCheckClusterQueueRow) =>
              renderAdmissionCheckFlavors(row.onFlavors),
          },
          {
            label: 'Status',
            getter: (row: AdmissionCheckClusterQueueRow) => row.clusterQueue.statusDisplay,
          },
        ]}
      />
    </SectionBox>
  );
}

/** List the Workloads whose state for an AdmissionCheck is not Ready yet. */
export function AdmissionCheckWorkloadsSection({
  checkName,
  cluster,
}: {
  checkName: string;
  cluster?: string;
}) {
  const [workloads, error] = Workload.useList({ cluster });

  const rows = useMemo(
    () =>
      (workloads || []).flatMap(workload => {
        const checkState = findUnreadyAdmissionCheckState(
          workload.status.admissionChecks,
          checkName
        );
        return checkState ? [{ workload, checkState }] : [];
      }),
    [workloads, checkName]
  );

  if (error) {
    return renderLoadError('Workloads Waiting on This Check', 'Workloads');
  }

  if (!workloads) {
    return <Loader title="Loading Workloads..." />;
  }

  return (
    <SectionBox title="Workloads Waiting on This Check">
      <SimpleTable
        data={rows}
        emptyMessage="No Workload is waiting on this AdmissionCheck."
        columns={[
          {
            label: 'Name',
            getter: (row: AdmissionCheckWorkloadRow) => (
              <Link kubeObject={row.workload}>{row.workload.metadata.name}</Link>
            ),
          },
          {
            label: 'Namespace',
            getter: (row: AdmissionCheckWorkloadRow) => row.workload.metadata.namespace || '-',
          },
          {
            label: 'State',
            getter: (row: AdmissionCheckWorkloadRow) => renderText(row.checkState.state),
          },
          {
            label: 'Message',
            getter: (row: AdmissionCheckWorkloadRow) => renderText(row.checkState.message),
          },
          {
            label: 'Last Transition',
            getter: (row: AdmissionCheckWorkloadRow) =>
              renderText(row.checkState.lastTransitionTime),
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
  cluster,
}: RelatedWorkloadsSectionProps) {
  if (localQueueName) {
    return (
      <RelatedLocalQueueWorkloadsSection
        localQueueName={localQueueName}
        namespace={namespace}
        cluster={cluster}
      />
    );
  }

  return (
    <RelatedClusterQueueWorkloadsSection clusterQueueName={clusterQueueName} cluster={cluster} />
  );
}

function RelatedClusterQueueWorkloadsSection({
  clusterQueueName,
  cluster,
}: Pick<RelatedWorkloadsSectionProps, 'clusterQueueName' | 'cluster'>) {
  const [localQueues, localQueuesError] = LocalQueue.useList({ cluster });
  const [workloads, workloadsError] = Workload.useList({ cluster });

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
  cluster,
}: Pick<RelatedWorkloadsSectionProps, 'localQueueName' | 'namespace' | 'cluster'>) {
  const [workloads, workloadsError] = Workload.useList({ namespace, cluster });

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

function getBlocker(workload: Workload) {
  return getWorkloadBlocker(
    workload.conditions,
    workload.status.admissionChecks,
    workload.status.requeueState,
    workload.spec.active,
    workload.status.admission
  );
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
      {/* SimpleTable gives every column 1fr by default, which squeezes the Why message
          to the width of Priority. Size the other columns to their content instead. Its cells
          hide overflow, so a plain auto column can shrink below its longest word; the
          min-content minimum keeps names from breaking mid-word. */}
      <SimpleTable
        data={workloads}
        columns={[
          {
            label: 'Name',
            gridTemplate: 'minmax(min-content, auto)',
            getter: (workload: Workload) => (
              <Link kubeObject={workload}>{workload.metadata.name}</Link>
            ),
          },
          {
            label: 'Namespace',
            gridTemplate: 'minmax(min-content, auto)',
            getter: (workload: Workload) => workload.metadata.namespace || '-',
          },
          {
            label: 'LocalQueue',
            gridTemplate: 'minmax(min-content, auto)',
            getter: (workload: Workload) => {
              const workloadNamespace = workload.metadata.namespace;

              if (!workload.queueName || !workloadNamespace) {
                return '-';
              }

              return (
                <Link
                  routeName={kueueRouteNames.localQueueDetail}
                  params={{ namespace: workloadNamespace, name: workload.queueName }}
                  activeCluster={workload.cluster}
                >
                  {workload.queueName}
                </Link>
              );
            },
          },
          {
            label: 'Priority',
            gridTemplate: 'min-content',
            getter: (workload: Workload) => workload.priorityDisplay,
          },
          {
            label: 'Status',
            gridTemplate: 'minmax(min-content, auto)',
            getter: (workload: Workload) => workload.statusDisplay,
          },
          {
            label: 'Blocked On',
            gridTemplate: 'max-content',
            getter: (workload: Workload) => {
              const blocker = getBlocker(workload);

              if (!blocker) {
                return '-';
              }

              return (
                <StatusLabel status={blocker.stage === 'Evicted' ? 'error' : 'warning'}>
                  {blocker.stage}
                </StatusLabel>
              );
            },
          },
          {
            label: 'Why',
            gridTemplate: 'minmax(150px, 1fr)',
            getter: (workload: Workload) => {
              const blocker = getBlocker(workload);
              // Kueue's message names the exact cause, so prefer it over the generic explanation.
              return blocker?.message || blocker?.explanation || '-';
            },
          },
        ]}
      />
    </SectionBox>
  );
}
