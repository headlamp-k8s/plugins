import {
  DateLabel,
  Link,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Button, CircularProgress, Grid, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { VolcanoJob } from '../../resources/job';
import { VolcanoPodGroup } from '../../resources/podgroup';
import { VolcanoQueue } from '../../resources/queue';
import { getJobStatusColor, getPodGroupStatusColor } from '../../utils/status';
import { volcanoRouteNames } from '../../utils/volcanoRoutes';
import { VolcanoCoreInstallCheck } from '../common/CommonComponents';
import { SummaryCard } from './OverviewCards';
import {
  AttentionRow,
  countBy,
  getAttentionReason,
  getAttentionRows,
  getAttentionStatus,
  getErrorText,
  visibleSchedulingIssuesLimit,
} from './overviewStats';

function getAttentionLink(row: AttentionRow) {
  if (row.type === 'Job') {
    return (
      <Link
        routeName={volcanoRouteNames.jobDetail}
        params={{ namespace: row.namespace, name: row.name }}
      >
        {row.name}
      </Link>
    );
  }

  if (row.type === 'PodGroup') {
    return (
      <Link
        routeName={volcanoRouteNames.podGroupDetail}
        params={{ namespace: row.namespace, name: row.name }}
      >
        {row.name}
      </Link>
    );
  }

  return (
    <Link routeName={volcanoRouteNames.queueDetail} params={{ name: row.name }}>
      {row.name}
    </Link>
  );
}

function getAttentionQueue(row: AttentionRow) {
  if (row.type === 'Job' || row.type === 'PodGroup') {
    return (
      <Link routeName={volcanoRouteNames.queueDetail} params={{ name: row.resource.queue }}>
        {row.resource.queue}
      </Link>
    );
  }

  return '-';
}

function getCreationTimestampMs(resource: { metadata: { creationTimestamp?: string } }) {
  return Date.parse(resource.metadata.creationTimestamp || '') || 0;
}

export default function Overview() {
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [jobs, jobsError] = VolcanoJob.useList();
  const [queues, queuesError] = VolcanoQueue.useList();
  const [podGroups, podGroupsError] = VolcanoPodGroup.useList();

  const isLoading =
    (jobs === null && !jobsError) ||
    (queues === null && !queuesError) ||
    (podGroups === null && !podGroupsError);

  const jobCounts = useMemo(() => countBy((jobs || []).map(job => job.phase)), [jobs]);
  const queueCounts = useMemo(() => countBy((queues || []).map(queue => queue.state)), [queues]);
  const podGroupCounts = useMemo(
    () => countBy((podGroups || []).map(podGroup => podGroup.phase)),
    [podGroups]
  );
  const recentJobs = useMemo(
    () =>
      [...(jobs || [])]
        .sort((first, second) => getCreationTimestampMs(second) - getCreationTimestampMs(first))
        .slice(0, 5),
    [jobs]
  );
  const recentPodGroups = useMemo(
    () =>
      [...(podGroups || [])]
        .sort((first, second) => getCreationTimestampMs(second) - getCreationTimestampMs(first))
        .slice(0, 5),
    [podGroups]
  );
  const attentionRows = useMemo(
    () => getAttentionRows(jobs, queues, podGroups),
    [jobs, queues, podGroups]
  );
  const visibleAttentionRows = showAllIssues
    ? attentionRows
    : attentionRows.slice(0, visibleSchedulingIssuesLimit);

  if (isLoading) {
    return (
      <VolcanoCoreInstallCheck>
        <Box display="flex" alignItems="center" justifyContent="center" minHeight="240px">
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading Volcano overview...</Typography>
        </Box>
      </VolcanoCoreInstallCheck>
    );
  }

  const jobsErrorText = getErrorText(jobsError);
  const queuesErrorText = getErrorText(queuesError);
  const podGroupsErrorText = getErrorText(podGroupsError);
  const schedulingPressure =
    (jobCounts.Pending || 0) + (podGroupCounts.Pending || 0) + (podGroupCounts.Inqueue || 0);

  return (
    <VolcanoCoreInstallCheck>
      <Box sx={{ p: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Volcano Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Cluster scheduling snapshot for Volcano workloads, queues, and PodGroups.
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Jobs"
              value={jobsErrorText || jobs?.length || 0}
              icon="mdi:briefcase-outline"
              subtitle={`Running ${jobCounts.Running || 0}, pending ${
                jobCounts.Pending || 0
              }, completed ${jobCounts.Completed || 0}, failed ${jobCounts.Failed || 0}`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Queues"
              value={queuesErrorText || queues?.length || 0}
              icon="mdi:format-list-group"
              subtitle={`Open ${queueCounts.Open || 0}, closing ${
                queueCounts.Closing || 0
              }, closed ${queueCounts.Closed || 0}`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="PodGroups"
              value={podGroupsErrorText || podGroups?.length || 0}
              icon="mdi:cube-outline"
              subtitle={`Running ${podGroupCounts.Running || 0}, pending ${
                podGroupCounts.Pending || 0
              }, inqueue ${podGroupCounts.Inqueue || 0}`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Pending Pressure"
              value={schedulingPressure}
              icon="mdi:gauge"
              subtitle="Pending Jobs plus pending or inqueue PodGroups"
            />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <SectionBox title="Scheduling Issues">
              <SimpleTable
                data={visibleAttentionRows}
                columns={[
                  { label: 'Type', getter: (row: AttentionRow) => row.type, sort: true },
                  {
                    label: 'Name',
                    getter: (row: AttentionRow) => getAttentionLink(row),
                    sort: (row: AttentionRow) => row.name,
                  },
                  {
                    label: 'Queue',
                    getter: (row: AttentionRow) => getAttentionQueue(row),
                    sort: (row: AttentionRow) =>
                      row.type === 'Job' || row.type === 'PodGroup' ? row.resource.queue : '',
                  },
                  {
                    getter: (row: AttentionRow) => ('namespace' in row ? row.namespace : '-'),
                    sort: (row: AttentionRow) => ('namespace' in row ? row.namespace : ''),
                    label: 'Namespace',
                  },
                  {
                    label: 'Status',
                    getter: (row: AttentionRow) => (
                      <StatusLabel status={getAttentionStatus(row)}>{row.status}</StatusLabel>
                    ),
                    sort: (row: AttentionRow) => row.status,
                  },
                  {
                    label: 'Details',
                    getter: (row: AttentionRow) => getAttentionReason(row),
                    sort: (row: AttentionRow) => getAttentionReason(row),
                  },
                ]}
                emptyMessage="No failed, blocked, or closed Volcano resources found."
              />
              {attentionRows.length > visibleSchedulingIssuesLimit && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {showAllIssues
                      ? `Showing all ${attentionRows.length} scheduling issues.`
                      : `Showing ${visibleAttentionRows.length} of ${attentionRows.length} scheduling issues.`}
                  </Typography>
                  <Button size="small" onClick={() => setShowAllIssues(value => !value)}>
                    {showAllIssues ? 'Show less' : 'Show all'}
                  </Button>
                </Box>
              )}
            </SectionBox>
          </Grid>

          <Grid item xs={12} lg={7}>
            <SectionBox title="Recent Jobs">
              <SimpleTable
                data={recentJobs}
                columns={[
                  {
                    label: 'Name',
                    getter: (job: VolcanoJob) => (
                      <Link
                        routeName={volcanoRouteNames.jobDetail}
                        params={{ namespace: job.getNamespace(), name: job.getName() }}
                      >
                        {job.getName()}
                      </Link>
                    ),
                    sort: (job: VolcanoJob) => job.getName(),
                  },
                  {
                    label: 'Namespace',
                    getter: (job: VolcanoJob) => job.getNamespace(),
                    sort: true,
                  },
                  {
                    label: 'Queue',
                    getter: (job: VolcanoJob) => (
                      <Link routeName={volcanoRouteNames.queueDetail} params={{ name: job.queue }}>
                        {job.queue}
                      </Link>
                    ),
                    sort: (job: VolcanoJob) => job.queue,
                  },
                  {
                    label: 'Status',
                    getter: (job: VolcanoJob) => (
                      <StatusLabel status={getJobStatusColor(job.phase)}>{job.phase}</StatusLabel>
                    ),
                    sort: (job: VolcanoJob) => job.phase,
                  },
                  {
                    label: 'Replicas',
                    getter: (job: VolcanoJob) => job.replicaCount,
                    sort: (job: VolcanoJob) => job.replicaCount,
                  },
                  {
                    label: 'Min Available',
                    getter: (job: VolcanoJob) => job.minAvailable,
                    sort: (job: VolcanoJob) => job.minAvailable,
                  },
                  {
                    label: 'Created',
                    getter: (job: VolcanoJob) => <DateLabel date={job.getCreationTs()} />,
                    sort: (job: VolcanoJob) => job.metadata.creationTimestamp || '',
                  },
                ]}
                emptyMessage="No Volcano Jobs found."
              />
            </SectionBox>
          </Grid>

          <Grid item xs={12} lg={5}>
            <SectionBox title="Recent PodGroups">
              <SimpleTable
                data={recentPodGroups}
                columns={[
                  {
                    label: 'Name',
                    getter: (podGroup: VolcanoPodGroup) => (
                      <Link
                        routeName={volcanoRouteNames.podGroupDetail}
                        params={{ namespace: podGroup.getNamespace(), name: podGroup.getName() }}
                      >
                        {podGroup.getName()}
                      </Link>
                    ),
                    sort: (podGroup: VolcanoPodGroup) => podGroup.getName(),
                  },
                  {
                    label: 'Queue',
                    getter: (podGroup: VolcanoPodGroup) => (
                      <Link
                        routeName={volcanoRouteNames.queueDetail}
                        params={{ name: podGroup.queue }}
                      >
                        {podGroup.queue}
                      </Link>
                    ),
                    sort: (podGroup: VolcanoPodGroup) => podGroup.queue,
                  },
                  {
                    label: 'Status',
                    getter: (podGroup: VolcanoPodGroup) => (
                      <StatusLabel status={getPodGroupStatusColor(podGroup.phase)}>
                        {podGroup.phase}
                      </StatusLabel>
                    ),
                    sort: (podGroup: VolcanoPodGroup) => podGroup.phase,
                  },
                  {
                    label: 'Min Member',
                    getter: (podGroup: VolcanoPodGroup) => podGroup.minMember,
                    sort: (podGroup: VolcanoPodGroup) => podGroup.minMember,
                  },
                  {
                    label: 'Created',
                    getter: (podGroup: VolcanoPodGroup) => (
                      <DateLabel date={podGroup.getCreationTs()} />
                    ),
                    sort: (podGroup: VolcanoPodGroup) => podGroup.metadata.creationTimestamp || '',
                  },
                ]}
                emptyMessage="No Volcano PodGroups found."
              />
            </SectionBox>
          </Grid>
        </Grid>
      </Box>
    </VolcanoCoreInstallCheck>
  );
}
