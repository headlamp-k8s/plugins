import {
  AuthVisible,
  DateLabel,
  DetailsGrid,
  Link,
  NameValueTable,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { VolcanoCommand } from '../../resources/command';
import { VolcanoJob } from '../../resources/job';
import { VolcanoPodGroup } from '../../resources/podgroup';
import { getJobStatusColor } from '../../utils/status';
import { formatStringList, getPolicyRows, getTaskContainerRows, getTaskRows } from './detailRows';
import JobCommandActionButton from './JobCommandActionButton';

/**
 * Resolves the PodGroup related to a Volcano Job.
 *
 * Matching order:
 * 1) ownerReference UID match
 * 2) canonical PodGroup name `<job-name>-<job-uid>`
 * 3) legacy PodGroup name `<job-name>`
 *
 * @param job Volcano Job shown in the details page.
 * @param podGroups PodGroups listed in the same namespace.
 * @returns Related PodGroup when found; otherwise `null`.
 */
function getRelatedPodGroup(
  job: VolcanoJob,
  podGroups: VolcanoPodGroup[] | null
): VolcanoPodGroup | null {
  if (!podGroups?.length) {
    return null;
  }

  const byOwnerReference = podGroups.find(podGroup =>
    podGroup.metadata.ownerReferences?.some(
      ownerReference => ownerReference.kind === 'Job' && ownerReference.uid === job.metadata.uid
    )
  );

  if (byOwnerReference) {
    return byOwnerReference;
  }

  const jobName = job.metadata.name;
  const jobUid = job.metadata.uid;

  if (jobName && jobUid) {
    const canonicalName = `${jobName}-${jobUid}`;
    const byCanonicalName = podGroups.find(podGroup => podGroup.metadata.name === canonicalName);

    if (byCanonicalName) {
      return byCanonicalName;
    }
  }

  if (jobName) {
    return podGroups.find(podGroup => podGroup.metadata.name === jobName) || null;
  }

  return null;
}

/**
 * Builds the Pod Status section for the Job details page.
 *
 * @param job Volcano Job shown in the details page.
 * @returns Section descriptor used by `DetailsGrid`.
 */
function getPodStatusSection(job: VolcanoJob) {
  const terminalPhases = ['Completed', 'Failed', 'Terminated', 'Aborted'];
  const isTerminal = terminalPhases.includes(job.phase);
  const hasPodCounts =
    job.status?.pending !== undefined ||
    job.status?.running !== undefined ||
    job.status?.succeeded !== undefined ||
    job.status?.failed !== undefined ||
    job.status?.terminating !== undefined;

  if (isTerminal && !hasPodCounts) {
    return {
      id: 'pod-status',
      section: (
        <SectionBox title="Pod Status">
          <NameValueTable
            rows={[
              { name: 'State', value: job.phase },
              { name: 'Running Duration', value: job.status?.runningDuration || '-' },
              { name: 'Retries', value: job.status?.retryCount || 0 },
            ]}
          />
        </SectionBox>
      ),
    };
  }

  return {
    id: 'pod-status',
    section: (
      <SectionBox title="Pod Status">
        <NameValueTable
          rows={[
            { name: 'Pending', value: job.status?.pending || 0 },
            { name: 'Running', value: job.status?.running || 0 },
            { name: 'Succeeded', value: job.status?.succeeded || 0 },
            { name: 'Failed', value: job.status?.failed || 0 },
            { name: 'Terminating', value: job.status?.terminating || 0 },
          ]}
        />
      </SectionBox>
    ),
  };
}

/**
 * Builds the Tasks section for the Job details page.
 *
 * @param job Volcano Job shown in the details page.
 * @returns Section descriptor for tasks or `null` if no tasks exist.
 */
function getTasksSection(job: VolcanoJob) {
  if (!job.spec.tasks?.length) return null;

  return {
    id: 'tasks',
    section: (
      <SectionBox title="Tasks">
        {job.spec.tasks.map((task, index) => (
          <SectionBox title={task.name || `Task ${index + 1}`} key={task.name || index}>
            <NameValueTable rows={getTaskRows(task, index)} />
            {(task.template?.spec?.containers || []).length > 0 ? (
              task.template?.spec?.containers?.map((container, containerIndex) => (
                <NameValueTable
                  key={`${task.name || index}-${container.name || containerIndex}`}
                  rows={getTaskContainerRows(container)}
                />
              ))
            ) : (
              <NameValueTable rows={[{ name: 'Containers', value: 'No containers defined' }]} />
            )}
          </SectionBox>
        ))}
      </SectionBox>
    ),
  };
}

/**
 * Builds the Plugins section for the Job details page.
 *
 * @param job Volcano Job shown in the details page.
 * @returns Section descriptor for configured plugins or `null` if none exist.
 */
function getPluginsSection(job: VolcanoJob) {
  const plugins = job.spec.plugins || {};
  const pluginNames = Object.keys(plugins);

  if (pluginNames.length === 0) {
    return null;
  }

  return {
    id: 'plugins',
    section: (
      <SectionBox title="Plugins">
        <NameValueTable
          rows={pluginNames.map(pluginName => ({
            name:
              pluginName.toLowerCase() === 'ssh'
                ? 'SSH'
                : pluginName[0].toUpperCase() + pluginName.slice(1),
            value: formatStringList(plugins[pluginName]),
          }))}
        />
      </SectionBox>
    ),
  };
}

/**
 * Builds the Policies section for the Job details page.
 *
 * @param job Volcano Job shown in the details page.
 * @returns Section descriptor for lifecycle policies or `null` if none exist.
 */
function getPoliciesSection(job: VolcanoJob) {
  if (!job.spec.policies?.length) {
    return null;
  }

  return {
    id: 'policies',
    section: (
      <SectionBox title="Policies">
        {job.spec.policies.map((policy, index) => (
          <NameValueTable key={`policy-${index}`} rows={getPolicyRows(policy)} />
        ))}
      </SectionBox>
    ),
  };
}

/**
 * Builds the Conditions section for the Job details page.
 *
 * @param job Volcano Job shown in the details page.
 * @returns Section descriptor for job conditions or `null` if none exist.
 */
function getConditionsSection(job: VolcanoJob) {
  if (!job.status?.conditions?.length) {
    return null;
  }

  return {
    id: 'conditions',
    section: (
      <SectionBox title="Conditions">
        <SimpleTable
          data={job.status.conditions}
          columns={[
            {
              label: 'Status',
              getter: condition => condition.status || '-',
            },
            {
              label: 'Last Transition',
              getter: condition =>
                condition.lastTransitionTime ? (
                  <DateLabel date={condition.lastTransitionTime} />
                ) : (
                  '-'
                ),
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/**
 * Returns only the Job lifecycle actions that map to valid existing-job CLI operations.
 * @see https://github.com/volcano-sh/volcano/blob/master/pkg/cli/vsuspend/suspend.go
 * @see https://github.com/volcano-sh/volcano/blob/master/pkg/cli/vresume/resume.go
 */
function getJobActionButtons(job: VolcanoJob) {
  const canSuspend = ![
    'Aborting',
    'Aborted',
    'Terminating',
    'Terminated',
    'Completing',
    'Completed',
    'Failed',
  ].includes(job.phase);
  const canResume = job.phase === 'Aborted';

  return [
    ...(canSuspend
      ? [
          {
            id: 'volcano-job-suspend',
            action: (
              <AuthVisible item={VolcanoCommand} authVerb="create" namespace={job.getNamespace()}>
                <JobCommandActionButton
                  job={job}
                  label="Suspend"
                  longDescription="Suspend this job (vcctl job suspend)."
                  icon="mdi:pause"
                  action="AbortJob"
                  successMessage={`Suspend command created for ${job.metadata.name}`}
                />
              </AuthVisible>
            ),
          },
        ]
      : []),
    ...(canResume
      ? [
          {
            id: 'volcano-job-resume',
            action: (
              <AuthVisible item={VolcanoCommand} authVerb="create" namespace={job.getNamespace()}>
                <JobCommandActionButton
                  job={job}
                  label="Resume"
                  longDescription="Resume this job (vcctl job resume)."
                  icon="mdi:play-circle"
                  action="ResumeJob"
                  successMessage={`Resume command created for ${job.metadata.name}`}
                />
              </AuthVisible>
            ),
          },
        ]
      : []),
  ];
}

/**
 * Renders the Volcano Job details page.
 *
 * @returns Job details view with extra sections and events.
 */
export default function JobDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const [podGroups] = VolcanoPodGroup.useList({ namespace });

  return (
    <DetailsGrid
      resourceType={VolcanoJob}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={(job: VolcanoJob) => {
        if (!job) {
          return [];
        }

        const relatedPodGroup = getRelatedPodGroup(job, podGroups);
        const podGroupNamespace = relatedPodGroup?.metadata.namespace || namespace;

        return [
          {
            name: 'Status',
            value: <StatusLabel status={getJobStatusColor(job.phase)}>{job.phase}</StatusLabel>,
          },
          {
            name: 'API Version',
            value: job.jsonData.apiVersion || VolcanoJob.apiVersion,
          },
          {
            name: 'Kind',
            value: job.jsonData.kind || 'Job',
          },
          {
            name: 'Queue',
            value: (
              <Link routeName="volcano-queue-detail" params={{ name: job.queue }}>
                {job.queue}
              </Link>
            ),
          },
          {
            name: 'PodGroup',
            value:
              relatedPodGroup && podGroupNamespace ? (
                <Link
                  routeName="volcano-podgroup-detail"
                  params={{ namespace: podGroupNamespace, name: relatedPodGroup.metadata.name }}
                >
                  {relatedPodGroup.metadata.name}
                </Link>
              ) : (
                '-'
              ),
          },
          {
            name: 'Min Available',
            value: job.minAvailable,
          },
          {
            name: 'Scheduler',
            value: job.spec.schedulerName || 'volcano',
          },
          {
            name: 'Max Retry',
            value: job.spec.maxRetry ?? 3,
          },
          {
            name: 'Generate Name',
            value: job.metadata.generateName || '-',
          },
          {
            name: 'Generation',
            value: job.metadata.generation ?? '-',
          },
          {
            name: 'Resource Version',
            value: job.metadata.resourceVersion || '-',
          },
          {
            name: 'UID',
            value: job.metadata.uid || '-',
          },
          {
            name: 'Retry Count',
            value: job.status?.retryCount ?? 0,
          },
          {
            name: 'Running Duration',
            value: job.status?.runningDuration || '-',
          },
          {
            name: 'State Last Transition Time',
            value: job.status?.state?.lastTransitionTime || '-',
          },
          {
            name: 'Version',
            value: job.status?.version ?? '-',
          },
        ];
      }}
      actions={(job: VolcanoJob) => (job ? getJobActionButtons(job) : [])}
      extraSections={(job: VolcanoJob) =>
        job &&
        [
          getPodStatusSection(job),
          getPluginsSection(job),
          getPoliciesSection(job),
          getTasksSection(job),
          getConditionsSection(job),
        ].filter(Boolean)
      }
    />
  );
}
