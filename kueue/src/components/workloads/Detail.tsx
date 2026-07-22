import {
  ConditionsSection,
  DetailsGrid,
  Link,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import {
  AdmissionCheckState,
  PodSet,
  PodSetAssignment,
  PodSetRequest,
  ReclaimablePod,
  Workload,
  WorkloadSchedulingStatsEviction,
} from '../../resources/workload';
import {
  renderPodSetRequests,
  renderResourceList,
  renderStringMap,
  renderText,
} from '../../resources/workloadFormatters';
import { kueueRouteNames } from '../../utils/kueueRoutes';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

/** Row rendered for Workload spec.podSets. */
interface PodSetRow {
  /** PodSet name. */
  name: string;
  /** Requested pod count. */
  count: number | string;
  /** Minimum count for partial admission. */
  minCount: number | string;
  /** Container resource requests. */
  requests: string;
  /** Pod template labels. */
  labels: string;
  /** Pod template annotations. */
  annotations: string;
  /** Topology request summary. */
  topology: string;
}

/** Row rendered for Workload status.admission.podSetAssignments. */
interface AdmissionAssignmentRow {
  /** PodSet name. */
  name: string;
  /** Admitted pod count. */
  count: number | string;
  /** Assigned ResourceFlavors keyed by resource. */
  flavors: string;
  /** Admitted resource usage. */
  resourceUsage: string;
  /** Delayed topology request state. */
  delayedTopologyRequest: string;
}

/** Row rendered for Workload status.admissionChecks. */
interface AdmissionCheckRow {
  /** AdmissionCheck name. */
  name: string;
  /** AdmissionCheck state. */
  state: string;
  /** Last state transition time. */
  lastTransitionTime: string;
  /** AdmissionCheck message. */
  message: string;
  /** Retry delay in seconds. */
  requeueAfterSeconds: number | string;
  /** Retry count. */
  retryCount: number | string;
}

/** Row rendered for status.reclaimablePods. */
interface ReclaimablePodRow {
  /** PodSet name. */
  name: string;
  /** Reclaimable pod count. */
  count: number;
}

/** Row rendered for status.resourceRequests. */
interface ResourceRequestRow {
  /** PodSet name. */
  name: string;
  /** Requested resources. */
  resources: string;
}

/** Row rendered for status.schedulingStats.evictions. */
interface EvictionRow {
  /** Eviction reason. */
  reason: string;
  /** Underlying eviction cause. */
  underlyingCause: string;
  /** Eviction count. */
  count: number;
}

/** Render the LocalQueue reference as a detail-page link when possible. */
function renderLocalQueueLink(workload: Workload) {
  const queueName = workload.queueName;
  const namespace = workload.metadata.namespace;

  if (!queueName || !namespace) {
    return '-';
  }

  return (
    <Link routeName={kueueRouteNames.localQueueDetail} params={{ namespace, name: queueName }}>
      {queueName}
    </Link>
  );
}

/** Render the admitted ClusterQueue as a detail-page link when possible. */
function renderClusterQueueLink(workload: Workload) {
  const clusterQueue = workload.admissionClusterQueue;

  if (!clusterQueue) {
    return '-';
  }

  return (
    <Link routeName={kueueRouteNames.clusterQueueDetail} params={{ name: clusterQueue }}>
      {clusterQueue}
    </Link>
  );
}

/** Convert Workload podSets into table rows. */
function getPodSetRows(podSets: PodSet[]): PodSetRow[] {
  return podSets.map(podSet => ({
    name: podSet.name || 'main',
    count: podSet.count ?? 1,
    minCount: podSet.minCount ?? '-',
    requests: renderPodSetRequests(podSet),
    labels: renderStringMap(podSet.template?.metadata?.labels),
    annotations: renderStringMap(podSet.template?.metadata?.annotations),
    topology: renderPodSetTopologyRequest(podSet),
  }));
}

/** Convert admission assignments into table rows. */
function getAdmissionAssignmentRows(
  assignments: PodSetAssignment[] = []
): AdmissionAssignmentRow[] {
  return assignments.map(assignment => ({
    name: assignment.name || 'main',
    count: assignment.count ?? '-',
    flavors: renderResourceList(assignment.flavors),
    resourceUsage: renderResourceList(assignment.resourceUsage),
    delayedTopologyRequest: renderText(assignment.delayedTopologyRequest),
  }));
}

/** Convert admission checks into table rows. */
function getAdmissionCheckRows(admissionChecks: AdmissionCheckState[] = []): AdmissionCheckRow[] {
  return admissionChecks.map(admissionCheck => ({
    name: admissionCheck.name,
    state: renderText(admissionCheck.state),
    lastTransitionTime: renderText(admissionCheck.lastTransitionTime),
    message: renderText(admissionCheck.message),
    requeueAfterSeconds: admissionCheck.requeueAfterSeconds ?? '-',
    retryCount: admissionCheck.retryCount ?? '-',
  }));
}

/** Convert reclaimable pods into table rows. */
function getReclaimablePodRows(reclaimablePods: ReclaimablePod[] = []): ReclaimablePodRow[] {
  return reclaimablePods.map(reclaimablePod => ({
    name: reclaimablePod.name,
    count: reclaimablePod.count,
  }));
}

/** Convert resource request status entries into table rows. */
function getResourceRequestRows(resourceRequests: PodSetRequest[] = []): ResourceRequestRow[] {
  return resourceRequests.map(request => ({
    name: request.name,
    resources: renderResourceList(request.resources),
  }));
}

/** Convert scheduling eviction stats into table rows. */
function getEvictionRows(evictions: WorkloadSchedulingStatsEviction[] = []): EvictionRow[] {
  return evictions.map(eviction => ({
    reason: eviction.reason,
    underlyingCause: renderText(eviction.underlyingCause),
    count: eviction.count,
  }));
}

/** Render a pod set topology request without dumping raw nested objects. */
function renderPodSetTopologyRequest(podSet: PodSet) {
  const request = podSet.topologyRequest;

  if (!request) {
    return '-';
  }

  const values = [
    request.required ? `Required: ${request.required}` : undefined,
    request.preferred ? `Preferred: ${request.preferred}` : undefined,
    request.unconstrained !== undefined ? `Unconstrained: ${request.unconstrained}` : undefined,
  ].filter(Boolean);

  return values.length > 0 ? values.join('; ') : '-';
}

/** Build the extra detail section for spec.podSets. */
function getPodSetsSection(workload: Workload) {
  const rows = getPodSetRows(workload.podSets);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'pod-sets',
    section: (
      <SectionBox title="Pod Sets">
        <SimpleTable
          data={rows}
          columns={[
            {
              label: 'Name',
              getter: (row: PodSetRow) => row.name,
            },
            {
              label: 'Count',
              getter: (row: PodSetRow) => row.count,
            },
            {
              label: 'Min Count',
              getter: (row: PodSetRow) => row.minCount,
            },
            {
              label: 'Requests',
              getter: (row: PodSetRow) => row.requests,
            },
            {
              label: 'Labels',
              getter: (row: PodSetRow) => row.labels,
            },
            {
              label: 'Annotations',
              getter: (row: PodSetRow) => row.annotations,
            },
            {
              label: 'Topology',
              getter: (row: PodSetRow) => row.topology,
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Build the extra detail section for status.admission pod set assignments. */
function getAdmissionSection(workload: Workload) {
  const rows = getAdmissionAssignmentRows(workload.admission?.podSetAssignments);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'admission',
    section: (
      <SectionBox title="Admission">
        <SimpleTable
          data={rows}
          columns={[
            {
              label: 'Pod Set',
              getter: (row: AdmissionAssignmentRow) => row.name,
            },
            {
              label: 'Count',
              getter: (row: AdmissionAssignmentRow) => row.count,
            },
            {
              label: 'ResourceFlavors',
              getter: (row: AdmissionAssignmentRow) => row.flavors,
            },
            {
              label: 'Resource Usage',
              getter: (row: AdmissionAssignmentRow) => row.resourceUsage,
            },
            {
              label: 'Delayed Topology',
              getter: (row: AdmissionAssignmentRow) => row.delayedTopologyRequest,
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Build the extra detail section for status.admissionChecks. */
function getAdmissionChecksSection(workload: Workload) {
  const rows = getAdmissionCheckRows(workload.status.admissionChecks);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'admission-checks',
    section: (
      <SectionBox title="Admission Checks">
        <SimpleTable
          data={rows}
          columns={[
            {
              label: 'Name',
              getter: (row: AdmissionCheckRow) => row.name,
            },
            {
              label: 'State',
              getter: (row: AdmissionCheckRow) => row.state,
            },
            {
              label: 'Last Transition',
              getter: (row: AdmissionCheckRow) => row.lastTransitionTime,
            },
            {
              label: 'Message',
              getter: (row: AdmissionCheckRow) => row.message,
            },
            {
              label: 'Requeue After Seconds',
              getter: (row: AdmissionCheckRow) => row.requeueAfterSeconds,
            },
            {
              label: 'Retry Count',
              getter: (row: AdmissionCheckRow) => row.retryCount,
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Build the extra detail section for status.reclaimablePods. */
function getReclaimablePodsSection(workload: Workload) {
  const rows = getReclaimablePodRows(workload.reclaimablePods);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'reclaimable-pods',
    section: (
      <SectionBox title="Reclaimable Pods">
        <SimpleTable
          data={rows}
          columns={[
            {
              label: 'Pod Set',
              getter: (row: ReclaimablePodRow) => row.name,
            },
            {
              label: 'Count',
              getter: (row: ReclaimablePodRow) => row.count,
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Build the extra detail section for status.resourceRequests. */
function getResourceRequestsSection(workload: Workload) {
  const rows = getResourceRequestRows(workload.status.resourceRequests);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'resource-requests',
    section: (
      <SectionBox title="Resource Requests">
        <SimpleTable
          data={rows}
          columns={[
            {
              label: 'Pod Set',
              getter: (row: ResourceRequestRow) => row.name,
            },
            {
              label: 'Resources',
              getter: (row: ResourceRequestRow) => row.resources,
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Build the extra detail section for status.schedulingStats.evictions. */
function getSchedulingStatsSection(workload: Workload) {
  const rows = getEvictionRows(workload.status.schedulingStats?.evictions);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'scheduling-stats',
    section: (
      <SectionBox title="Scheduling Stats">
        <SimpleTable
          data={rows}
          columns={[
            {
              label: 'Reason',
              getter: (row: EvictionRow) => row.reason,
            },
            {
              label: 'Underlying Cause',
              getter: (row: EvictionRow) => row.underlyingCause,
            },
            {
              label: 'Count',
              getter: (row: EvictionRow) => row.count,
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Build the standard Headlamp conditions section for Workload status. */
function getConditionsSection(workload: Workload) {
  if (!workload.conditions.length) {
    return null;
  }

  return {
    id: 'conditions',
    section: <ConditionsSection resource={workload.jsonData} />,
  };
}

export default function WorkloadDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <KueueAdminResourceAccess
      resourceClass={Workload}
      resourceLabel="Workloads"
      verb="get"
      accessDescription="Kueue Workloads are namespaced user workload resources."
    >
      <DetailsGrid
        resourceType={Workload}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={workload =>
          workload
            ? [
                {
                  name: 'Queue',
                  value: renderLocalQueueLink(workload),
                },
                {
                  name: 'Priority',
                  value: workload.priorityDisplay,
                },
                {
                  name: 'Priority Class',
                  value: workload.priorityClassDisplay,
                },
                {
                  name: 'Active',
                  value: workload.activeDisplay,
                },
                {
                  name: 'Owner References',
                  value: workload.ownerReferencesDisplay,
                },
                {
                  name: 'Pod Sets',
                  value: workload.podSetsDisplay,
                },
                {
                  name: 'Admitted',
                  value: workload.admittedDisplay,
                },
                {
                  name: 'Finished',
                  value: workload.finishedDisplay,
                },
                {
                  name: 'Status',
                  value: workload.statusDisplay,
                },
                {
                  name: 'Admission',
                  value: workload.admissionDisplay,
                },
                {
                  name: 'Assigned ClusterQueue',
                  value: renderClusterQueueLink(workload),
                },
                {
                  name: 'Assigned ResourceFlavors',
                  value: workload.admissionFlavorsDisplay,
                },
                {
                  name: 'Reclaimable Pods',
                  value: workload.reclaimablePodsDisplay,
                },
                {
                  name: 'Requeue State',
                  value: workload.requeueStateDisplay,
                },
                {
                  name: 'Maximum Execution Time Seconds',
                  value: workload.maximumExecutionTimeSecondsDisplay,
                },
                {
                  name: 'Accumulated Past Execution Time Seconds',
                  value: workload.accumulatedPastExecutionTimeSecondsDisplay,
                },
                {
                  name: 'Assigned Cluster',
                  value: workload.clusterNameDisplay,
                },
                {
                  name: 'Nominated Clusters',
                  value: workload.nominatedClusterNamesDisplay,
                },
              ]
            : []
        }
        extraSections={workload =>
          workload
            ? [
                getConditionsSection(workload),
                getPodSetsSection(workload),
                getAdmissionSection(workload),
                getAdmissionChecksSection(workload),
                getReclaimablePodsSection(workload),
                getResourceRequestsSection(workload),
                getSchedulingStatsSection(workload),
              ].filter(Boolean)
            : []
        }
      />
    </KueueAdminResourceAccess>
  );
}
