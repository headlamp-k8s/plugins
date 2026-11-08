import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  ConditionsSection,
  DetailsGrid,
  NameValueTable,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { formatDuration, localeDate } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Box, Step, StepLabel, Stepper, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
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
  findWorkloadCondition,
  getWorkloadBlocker,
  getWorkloadTimeline,
  renderPodSetRequests,
  renderResourceList,
  renderStringMap,
  renderText,
  renderTopologyAssignment,
  WorkloadTimelineStep,
} from '../../resources/workloadFormatters';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';
import {
  renderAdmissionCheckLink,
  renderClusterQueueLink,
  renderLocalQueueLink,
} from '../common/KueueResourceLinks';

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
  /** Topology domains the pod set was actually placed in. */
  topologyAssignment: string;
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

/** Convert Workload podSets into table rows. */
function getPodSetRows(podSets: PodSet[], t: (key: string) => string): PodSetRow[] {
  return podSets.map(podSet => ({
    name: podSet.name || 'main',
    count: podSet.count ?? 1,
    minCount: podSet.minCount ?? '-',
    requests: renderPodSetRequests(podSet),
    labels: renderStringMap(podSet.template?.metadata?.labels),
    annotations: renderStringMap(podSet.template?.metadata?.annotations),
    topology: renderPodSetTopologyRequest(podSet, t),
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
    topologyAssignment: renderTopologyAssignment(assignment.topologyAssignment),
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
function renderPodSetTopologyRequest(podSet: PodSet, t: (key: string) => string) {
  const request = podSet.topologyRequest;

  if (!request) {
    return '-';
  }

  const values = [
    request.required ? `${t('Required')}: ${request.required}` : undefined,
    request.preferred ? `${t('Preferred')}: ${request.preferred}` : undefined,
    request.unconstrained !== undefined
      ? `${t('Unconstrained')}: ${request.unconstrained}`
      : undefined,
  ].filter(Boolean);

  return values.length > 0 ? values.join('; ') : '-';
}

/** Build the extra detail section for spec.podSets. */
function getPodSetsSection(workload: Workload, t: (key: string) => string) {
  const rows = getPodSetRows(workload.podSets, t);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'pod-sets',
    section: (
      <SectionBox title={t('Pod Sets')}>
        <SimpleTable
          data={rows}
          columns={[
            {
              label: t('Name'),
              getter: (row: PodSetRow) => row.name,
            },
            {
              label: t('Count'),
              getter: (row: PodSetRow) => row.count,
            },
            {
              label: t('Min Count'),
              getter: (row: PodSetRow) => row.minCount,
            },
            {
              label: t('Requests'),
              getter: (row: PodSetRow) => row.requests,
            },
            {
              label: t('Labels'),
              getter: (row: PodSetRow) => row.labels,
            },
            {
              label: t('Annotations'),
              getter: (row: PodSetRow) => row.annotations,
            },
            {
              label: t('Topology'),
              getter: (row: PodSetRow) => row.topology,
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Build the extra detail section for status.admission pod set assignments. */
function getAdmissionSection(workload: Workload, t: (key: string) => string) {
  const rows = getAdmissionAssignmentRows(workload.admission?.podSetAssignments);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'admission',
    section: (
      <SectionBox title={t('Admission')}>
        <SimpleTable
          data={rows}
          columns={[
            {
              label: t('Pod Set'),
              getter: (row: AdmissionAssignmentRow) => row.name,
            },
            {
              label: t('Count'),
              getter: (row: AdmissionAssignmentRow) => row.count,
            },
            {
              label: t('ResourceFlavors'),
              getter: (row: AdmissionAssignmentRow) => row.flavors,
            },
            {
              label: t('Resource Usage'),
              getter: (row: AdmissionAssignmentRow) => row.resourceUsage,
            },
            {
              label: t('Delayed Topology'),
              getter: (row: AdmissionAssignmentRow) => row.delayedTopologyRequest,
            },
            {
              label: t('Topology Assignment'),
              getter: (row: AdmissionAssignmentRow) => row.topologyAssignment,
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Build the extra detail section for status.admissionChecks. */
function getAdmissionChecksSection(workload: Workload, t: (key: string) => string) {
  const rows = getAdmissionCheckRows(workload.status.admissionChecks);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'admission-checks',
    section: (
      <SectionBox title={t('Admission Checks')}>
        <SimpleTable
          data={rows}
          columns={[
            {
              label: t('Name'),
              getter: (row: AdmissionCheckRow) => renderAdmissionCheckLink(row.name),
            },
            {
              label: t('State'),
              getter: (row: AdmissionCheckRow) => row.state,
            },
            {
              label: t('Last Transition'),
              getter: (row: AdmissionCheckRow) => row.lastTransitionTime,
            },
            {
              label: t('Message'),
              getter: (row: AdmissionCheckRow) => row.message,
            },
            {
              label: t('Requeue After Seconds'),
              getter: (row: AdmissionCheckRow) => row.requeueAfterSeconds,
            },
            {
              label: t('Retry Count'),
              getter: (row: AdmissionCheckRow) => row.retryCount,
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Build the extra detail section for status.reclaimablePods. */
function getReclaimablePodsSection(workload: Workload, t: (key: string) => string) {
  const rows = getReclaimablePodRows(workload.reclaimablePods);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'reclaimable-pods',
    section: (
      <SectionBox title={t('Reclaimable Pods')}>
        <SimpleTable
          data={rows}
          columns={[
            {
              label: t('Pod Set'),
              getter: (row: ReclaimablePodRow) => row.name,
            },
            {
              label: t('Count'),
              getter: (row: ReclaimablePodRow) => row.count,
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Build the extra detail section for status.resourceRequests. */
function getResourceRequestsSection(workload: Workload, t: (key: string) => string) {
  const rows = getResourceRequestRows(workload.status.resourceRequests);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'resource-requests',
    section: (
      <SectionBox title={t('Resource Requests')}>
        <SimpleTable
          data={rows}
          columns={[
            {
              label: t('Pod Set'),
              getter: (row: ResourceRequestRow) => row.name,
            },
            {
              label: t('Resources'),
              getter: (row: ResourceRequestRow) => row.resources,
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Build the extra detail section for status.schedulingStats.evictions. */
function getSchedulingStatsSection(workload: Workload, t: (key: string) => string) {
  const rows = getEvictionRows(workload.status.schedulingStats?.evictions);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'scheduling-stats',
    section: (
      <SectionBox title={t('Scheduling Stats')}>
        <SimpleTable
          data={rows}
          columns={[
            {
              label: t('Reason'),
              getter: (row: EvictionRow) => row.reason,
            },
            {
              label: t('Underlying Cause'),
              getter: (row: EvictionRow) => row.underlyingCause,
            },
            {
              label: t('Count'),
              getter: (row: EvictionRow) => row.count,
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Caption under a lifecycle step: when it was reached and how long after the step before. */
function renderTimelineCaption(step: WorkloadTimelineStep) {
  const duration = step.durationMs !== undefined ? formatDuration(step.durationMs) : undefined;

  switch (step.state) {
    case 'done':
    case 'failed':
      return [
        step.time && localeDate(step.time),
        step.durationMs === 0 && `Same time as ${step.durationFrom}`,
        !!step.durationMs && `${duration} after ${step.durationFrom}`,
        step.state === 'failed' && step.reason,
      ]
        .filter(Boolean)
        .join('\n');
    case 'current':
      return [
        duration ? `Waiting ${duration} since ${step.durationFrom}` : 'Waiting',
        step.reason && `Reason: ${step.reason}`,
      ]
        .filter(Boolean)
        .join('\n');
    case 'deactivated':
      return 'Paused: Workload is deactivated';
    case 'skipped':
      return 'Not reached';
    case 'untracked':
      return 'Not reported by Kueue';
    default:
      return '';
  }
}

/** Current time in milliseconds, advanced every second while `ticking` is set. */
function useNow(ticking: boolean) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!ticking) {
      return;
    }
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [ticking]);

  return now;
}

/** Draw the Workload's lifecycle from its conditions. */
function WorkloadLifecycle({ workload }: { workload: Workload }) {
  // A pending Workload can go a long time without watch updates, so the wait keeps counting.
  const ticking = findWorkloadCondition(workload.conditions, 'Finished')?.status !== 'True';
  const now = useNow(ticking);
  const { steps, eviction } = getWorkloadTimeline(
    workload.metadata.creationTimestamp,
    workload.conditions,
    workload.spec.active,
    now
  );
  const activeStep = steps.findIndex(step => step.state === 'current');

  return (
    <SectionBox title="Lifecycle">
      <Stepper activeStep={activeStep === -1 ? steps.length : activeStep} alternativeLabel>
        {steps.map(step => (
          <Step
            key={step.label}
            completed={step.state === 'done' || step.state === 'failed'}
            disabled={['skipped', 'untracked', 'pending'].includes(step.state)}
          >
            <Tooltip title={step.message || ''}>
              <StepLabel
                error={step.state === 'failed'}
                optional={
                  <Typography variant="caption" sx={{ whiteSpace: 'pre-line' }}>
                    {renderTimelineCaption(step)}
                  </Typography>
                }
              >
                {step.label}
              </StepLabel>
            </Tooltip>
          </Step>
        ))}
      </Stepper>
      {eviction && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'baseline' }}>
          <StatusLabel status="warning">Evicted</StatusLabel>
          <Typography variant="body2">
            {[
              eviction.lastTransitionTime && localeDate(eviction.lastTransitionTime),
              eviction.reason,
              eviction.message,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Typography>
        </Box>
      )}
    </SectionBox>
  );
}

/** Build the section that draws the Workload's lifecycle. */
function getTimelineSection(workload: Workload) {
  return { id: 'lifecycle', section: <WorkloadLifecycle workload={workload} /> };
}

/** Build the section explaining what is stopping the Workload from being admitted. */
export function getBlockerSection(workload: Workload) {
  const blocker = getWorkloadBlocker(
    workload.conditions,
    workload.status.admissionChecks,
    workload.status.requeueState,
    workload.spec.active,
    workload.status.admission
  );

  if (!blocker) {
    return null;
  }

  const rows = [
    {
      name: 'Stage',
      value: (
        <StatusLabel status={blocker.stage === 'Evicted' ? 'error' : 'warning'}>
          {blocker.stage}
        </StatusLabel>
      ),
    },
    { name: 'Reason', value: blocker.reason, hide: !blocker.reason },
    { name: 'What it means', value: blocker.explanation, hide: !blocker.explanation },
    { name: 'Kueue message', value: blocker.message, hide: !blocker.message },
    {
      name: 'Blocking admission checks',
      value: blocker.pendingAdmissionChecks.map(check => (
        <div key={check.name}>
          {renderAdmissionCheckLink(check.name)}: {check.state || 'Pending'}
          {check.message ? ` (${check.message})` : ''}
        </div>
      )),
      hide: blocker.pendingAdmissionChecks.length === 0,
    },
    {
      name: 'Next retry',
      // DateLabel is relative-only and renders future times as <invalid>.
      value: blocker.requeueAt && new Date(blocker.requeueAt).toLocaleString(),
      hide: !blocker.requeueAt,
    },
  ];

  return {
    id: 'blocker',
    section: (
      <SectionBox title="Why is this Workload not admitted?">
        <NameValueTable rows={rows} />
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
  const { t } = useTranslation();
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <KueueAdminResourceAccess
      resourceClass={Workload}
      resourceLabel={t('Workloads')}
      verb="get"
      accessDescription={t('Kueue Workloads are namespaced user workload resources.')}
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
                  name: t('Queue'),
                  value: renderLocalQueueLink(workload.queueName, workload.metadata.namespace),
                },
                {
                  name: t('Priority'),
                  value: workload.priorityDisplay,
                },
                {
                  name: t('Priority Class'),
                  value: workload.priorityClassDisplay,
                },
                {
                  name: t('Active'),
                  value: workload.activeDisplay,
                },
                {
                  name: t('Owner References'),
                  value: workload.ownerReferencesDisplay,
                },
                {
                  name: t('Pod Sets'),
                  value: workload.podSetsDisplay,
                },
                {
                  name: t('Admitted'),
                  value: workload.admittedDisplay,
                },
                {
                  name: t('Finished'),
                  value: workload.finishedDisplay,
                },
                {
                  name: t('Status'),
                  value: workload.statusDisplay,
                },
                {
                  name: t('Admission'),
                  value: workload.admissionDisplay,
                },
                {
                  name: t('Assigned ClusterQueue'),
                  value: renderClusterQueueLink(workload.admissionClusterQueue),
                },
                {
                  name: t('Assigned ResourceFlavors'),
                  value: workload.admissionFlavorsDisplay,
                },
                {
                  name: t('Reclaimable Pods'),
                  value: workload.reclaimablePodsDisplay,
                },
                {
                  name: t('Requeue State'),
                  value: workload.requeueStateDisplay,
                },
                {
                  name: t('Maximum Execution Time Seconds'),
                  value: workload.maximumExecutionTimeSecondsDisplay,
                },
                {
                  name: t('Accumulated Past Execution Time Seconds'),
                  value: workload.accumulatedPastExecutionTimeSecondsDisplay,
                },
                {
                  name: t('Assigned Cluster'),
                  value: workload.clusterNameDisplay,
                },
                {
                  name: t('Nominated Clusters'),
                  value: workload.nominatedClusterNamesDisplay,
                },
              ]
            : []
        }
        extraSections={workload =>
          workload
            ? [
                getTimelineSection(workload),
                getBlockerSection(workload),
                getConditionsSection(workload),
                getPodSetsSection(workload, t),
                getAdmissionSection(workload, t),
                getAdmissionChecksSection(workload, t),
                getReclaimablePodsSection(workload, t),
                getResourceRequestsSection(workload, t),
                getSchedulingStatsSection(workload, t),
              ].filter(Boolean)
            : []
        }
      />
    </KueueAdminResourceAccess>
  );
}
