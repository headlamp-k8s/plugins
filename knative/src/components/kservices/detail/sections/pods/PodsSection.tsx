/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  LightTooltip,
  ResourceTable,
  type ResourceTableColumn,
  SectionBox,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import Pod from '@kinvolk/headlamp-plugin/lib/k8s/pod';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { KService } from '../../../../../resources/knative';

type KServiceSectionProps = {
  kservice: KService;
};

type PodContainerStatus = {
  name: string;
  restartCount?: number;
  state?: {
    waiting?: { reason?: string; message?: string };
    running?: { startedAt?: string };
    terminated?: {
      reason?: string;
      exitCode?: number;
      startedAt?: string;
      finishedAt?: string;
    };
  };
};

function getRevisionSuffix(serviceName: string, revisionLabelValue: string) {
  const prefix = `${serviceName}-`;
  return revisionLabelValue.startsWith(prefix)
    ? revisionLabelValue.slice(prefix.length)
    : revisionLabelValue;
}

function getPodStatus(pod: Pod): '' | 'success' | 'warning' | 'error' {
  const phase = pod.status?.phase ?? 'Unknown';
  if (phase === 'Failed') return 'error';
  if (phase === 'Pending') return 'warning';

  // For Running/Succeeded, also check readiness to avoid showing green for unready pods.
  if (phase === 'Running' || phase === 'Succeeded') {
    const readyCondition = pod.status?.conditions?.find(c => c.type === 'Ready');
    return readyCondition?.status === 'True' || phase === 'Succeeded' ? 'success' : 'warning';
  }

  return '';
}

function getContainerDisplayStatus(container: PodContainerStatus) {
  const state = container.state || {};
  let color = 'grey';
  let label = 'Unknown';
  const tooltipLines: string[] = [`Name: ${container.name}`];

  if (state.waiting) {
    color = 'orange';
    label = 'Waiting';
    if (state.waiting.reason) {
      tooltipLines.push(`Reason: ${state.waiting.reason}`);
    }
    if (state.waiting.message) {
      tooltipLines.push(`Message: ${state.waiting.message}`);
    }
  } else if (state.terminated) {
    color = state.terminated.reason === 'Error' ? 'red' : 'green';
    label = 'Terminated';
    if (state.terminated.reason) {
      tooltipLines.push(`Reason: ${state.terminated.reason}`);
    }
    if (state.terminated.exitCode !== undefined) {
      tooltipLines.push(`Exit Code: ${state.terminated.exitCode}`);
    }
    if (state.terminated.startedAt) {
      tooltipLines.push(`Started: ${new Date(state.terminated.startedAt).toLocaleString()}`);
    }
    if (state.terminated.finishedAt) {
      tooltipLines.push(`Finished: ${new Date(state.terminated.finishedAt).toLocaleString()}`);
    }
  } else if (state.running) {
    color = 'green';
    label = 'Running';
    if (state.running.startedAt) {
      tooltipLines.push(`Started: ${new Date(state.running.startedAt).toLocaleString()}`);
    }
  }

  if ((container.restartCount ?? 0) > 0) {
    tooltipLines.push(`Restarts: ${container.restartCount}`);
  }

  tooltipLines.splice(1, 0, `Status: ${label}`);

  return {
    color,
    tooltip: <span style={{ whiteSpace: 'pre-line' }}>{tooltipLines.join('\n')}</span>,
  };
}

function makePodStatusLabel(pod: Pod) {
  const { reason, message } = pod.getDetailedStatus();
  const status = getPodStatus(pod);

  const containerStatuses = (pod.status?.containerStatuses ?? []) as PodContainerStatus[];
  const containerIndicators =
    containerStatuses.length > 0 ? (
      <Box display="flex" gap={0.5}>
        {containerStatuses.map((cs, index) => {
          const { color, tooltip } = getContainerDisplayStatus(cs);
          return (
            <LightTooltip title={tooltip} key={`${cs.name}-${index}`}>
              <Box
                component="span"
                sx={{
                  width: '0.9rem',
                  height: '0.9rem',
                  borderRadius: '50%',
                  display: 'inline-block',
                  backgroundColor: color,
                }}
              />
            </LightTooltip>
          );
        })}
      </Box>
    ) : null;

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <LightTooltip title={message || ''} interactive>
        <Box display="inline">
          <StatusLabel status={status}>{reason || pod.status?.phase || 'Unknown'}</StatusLabel>
        </Box>
      </LightTooltip>
      {containerIndicators}
    </Box>
  );
}

export function PodsSection({ kservice }: KServiceSectionProps) {
  const namespace = kservice.metadata.namespace;
  const cluster = kservice.cluster;
  const serviceName = kservice.metadata.name;
  const { pathname } = useLocation();

  // Knative sets this label on pods for all revisions of the KService.
  // This intentionally includes older revisions to show "related" pods broadly.
  const labelSelector = serviceName ? `serving.knative.dev/service=${serviceName}` : undefined;

  const {
    items: pods,
    error,
    errors,
  } = Pod.useList({
    namespace,
    cluster,
    labelSelector,
  });

  const podStatusCounts = (pods ?? []).reduce<Record<string, number>>((counts, pod) => {
    const phase = pod.status?.phase ?? 'Unknown';

    counts[phase] = (counts[phase] ?? 0) + 1;
    return counts;
  }, {});

  const podStatusOrder = ['Running', 'Pending', 'Succeeded', 'Failed', 'Unknown'];
  const podStatusEntries = Object.entries(podStatusCounts).sort(([a], [b]) => {
    const ai = podStatusOrder.indexOf(a);
    const bi = podStatusOrder.indexOf(b);
    const aOrder = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
    const bOrder = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
    return aOrder - bOrder || a.localeCompare(b);
  });

  const columns: (ResourceTableColumn<KubeObject> | 'name' | 'age')[] = [
    'name',
    {
      id: 'revision',
      label: 'Revision',
      gridTemplate: 'min-content',
      disableFiltering: true,
      getValue: item => {
        const pod = item as unknown as Pod;
        const revisionLabel = pod.metadata.labels?.['serving.knative.dev/revision'];
        if (!revisionLabel || !serviceName) return '';
        return getRevisionSuffix(serviceName, revisionLabel).toLowerCase();
      },
      render: item => {
        const pod = item as unknown as Pod;
        const revisionLabel = pod.metadata.labels?.['serving.knative.dev/revision'];
        const revisionSuffix =
          revisionLabel && serviceName ? getRevisionSuffix(serviceName, revisionLabel) : null;

        if (!revisionLabel) {
          return (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          );
        }

        return (
          <Chip
            size="small"
            variant="outlined"
            label={revisionSuffix ?? revisionLabel}
            title={revisionLabel}
            sx={{ maxWidth: '100%' }}
          />
        );
      },
    },
    {
      id: 'ready',
      label: 'Ready',
      gridTemplate: 'min-content',
      disableFiltering: true,
      getValue: item => {
        const pod = item as unknown as Pod;
        const { readyContainers, totalContainers } = pod.getDetailedStatus();
        if (!totalContainers) return 0;
        return readyContainers / totalContainers;
      },
      render: item => {
        const pod = item as unknown as Pod;
        const { readyContainers, totalContainers } = pod.getDetailedStatus();
        return (
          <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
            {readyContainers}/{totalContainers}
          </Box>
        );
      },
      sort: (a, b) => {
        const aPod = a as unknown as Pod;
        const bPod = b as unknown as Pod;

        const aStatus = aPod.getDetailedStatus();
        const bStatus = bPod.getDetailedStatus();

        const aTotal = aStatus.totalContainers || 0;
        const bTotal = bStatus.totalContainers || 0;
        const aRatio = aTotal ? aStatus.readyContainers / aTotal : 0;
        const bRatio = bTotal ? bStatus.readyContainers / bTotal : 0;

        if (aRatio !== bRatio) return aRatio - bRatio;
        if (aStatus.readyContainers !== bStatus.readyContainers) {
          return aStatus.readyContainers - bStatus.readyContainers;
        }
        return aTotal - bTotal;
      },
    },
    {
      id: 'restarts',
      label: 'Restarts',
      gridTemplate: 'min-content',
      disableFiltering: true,
      getValue: item => (item as unknown as Pod).getDetailedStatus().restarts ?? 0,
      render: item => (item as unknown as Pod).getDetailedStatus().restarts ?? 0,
    },
    {
      id: 'status',
      label: 'Status',
      gridTemplate: 'min-content',
      filterVariant: 'multi-select',
      getValue: item => {
        const pod = item as unknown as Pod;
        return pod.getDetailedStatus().reason || pod.status?.phase || 'Unknown';
      },
      render: item => makePodStatusLabel(item as unknown as Pod),
    },
    'age',
  ];

  const errorMessage =
    (error && 'message' in error && typeof error.message === 'string' ? error.message : null) ??
    errors?.[0]?.message ??
    null;

  // Headlamp's default row action uses DeleteButton, which for Pods uses "evict" and
  // dispatches a clusterAction with startUrl/errorUrl set to item.getListLink().
  // For Pods, getListLink() points to the Pods list, which navigates away from the Knative UI.
  // Override getListLink() per item so Evict keeps the user on this KService page.
  const podsForTable = pods?.map(pod => {
    (pod as unknown as { getListLink?: () => string }).getListLink = () => pathname;
    return pod;
  });

  return (
    <Stack spacing={2}>
      <SectionBox
        title="Pods"
        headerProps={{
          titleSideActions: [
            pods === null ? (
              <Chip key="pods-loading" size="small" label="Loading…" variant="outlined" />
            ) : pods.length === 0 ? (
              <Chip key="pods-empty" size="small" label="No pods" variant="outlined" />
            ) : (
              <Stack
                key="pods-status-badges"
                direction="row"
                spacing={1}
                useFlexGap
                sx={{ flexWrap: 'wrap' }}
              >
                {podStatusEntries.map(([phase, count]) => (
                  <Chip key={phase} label={`${phase}: ${count}`} size="small" variant="outlined" />
                ))}
              </Stack>
            ),
          ],
        }}
      >
        {!namespace || !serviceName ? (
          <Typography variant="body2" color="text.secondary">
            Namespace or KService name is missing.
          </Typography>
        ) : (
          <ResourceTable.default
            id="knative-kservice-pods"
            columns={columns}
            data={podsForTable ?? null}
            errors={errors ?? null}
            errorMessage={errorMessage}
            enableRowActions
            enableRowSelection
            reflectInURL={false}
          />
        )}
      </SectionBox>
    </Stack>
  );
}
