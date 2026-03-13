
import {
  DetailsGrid,
  Link,
  NameValueTable,
  SectionBox,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { VolcanoJob } from '../../resources/job';
import { VolcanoPodGroup } from '../../resources/podgroup';
import { getJobStatusColor } from '../../utils/status';

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

function getPodStatusSection(job: VolcanoJob) {
  const terminalPhases = ['Completed', 'Failed', 'Terminated', 'Aborted'];
  const isTerminal = terminalPhases.includes(job.phase);
  const hasPodCounts =
    job.status?.pending || job.status?.running || job.status?.succeeded || job.status?.failed;

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

function getTasksSection(job: VolcanoJob) {
  if (!job.spec.tasks?.length) return null;

  return {
    id: 'tasks',
    section: (
      <SectionBox title="Tasks">
        {job.spec.tasks.map((task, index) => (
          <NameValueTable
            key={task.name || index}
            rows={[
              { name: 'Name', value: task.name || `Task ${index + 1}` },
              { name: 'Replicas', value: task.replicas },
              { name: 'Min Available', value: task.minAvailable ?? task.replicas },
              { name: 'Image', value: task.template?.spec?.containers?.[0]?.image || '-' },
            ]}
          />
        ))}
      </SectionBox>
    ),
  };
}

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
            value: job.spec.maxRetry || 3,
          },
        ];
      }}
      extraSections={(job: VolcanoJob) =>
        job && [getPodStatusSection(job), getTasksSection(job)].filter(Boolean)
      }
    />
  );
}
