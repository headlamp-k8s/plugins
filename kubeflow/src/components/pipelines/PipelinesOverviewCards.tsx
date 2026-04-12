/**
 * Copyright 2025 The Headlamp Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Icon } from '@iconify/react';
import {
  Link as HeadlampLink,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import React from 'react';
import { PipelineClass } from '../../resources/pipeline';
import { PipelineRunClass } from '../../resources/pipelineRun';
import { PipelineVersionClass } from '../../resources/pipelineVersion';
import { PipelineStatusBadge } from '../common/PipelineStatusBadge';
import {
  countPipelineVersionsForPipeline,
  getLatestPipelineVersionForPipeline,
  getPipelineDetailsPath,
  getPipelineRunDetailsPath,
  getPipelineRunDurationLabel,
  getPipelineRunRoot,
  getPipelineVersionDetailsPath,
} from '../common/pipelineUtils';

interface PipelinesOverviewContentProps {
  summaryCards: any[];
  controlPlaneRows: any[];
  accessRows: any[];
  kfpDeployments: any[];
  failureRows: any[];
  recentPipelines: any[];
  recentVersions: any[];
  recentRuns: any[];
  versionList: any[];
  hasListErrors?: boolean;
  pipelineAvailability?: string | null;
  versionAvailability?: string | null;
  runAvailability?: string | null;
  deploymentAvailability?: string | null;
}

export function PipelinesOverviewContent(props: PipelinesOverviewContentProps) {
  const {
    summaryCards,
    controlPlaneRows,
    accessRows,
    kfpDeployments,
    failureRows,
    recentPipelines,
    recentVersions,
    recentRuns,
    versionList,
    hasListErrors,
    pipelineAvailability,
    versionAvailability,
    runAvailability,
    deploymentAvailability,
  } = props;

  return (
    <Box sx={{ padding: '24px 16px', pt: '32px' }}>
      <Typography variant="h1" sx={{ fontSize: '1.87rem', fontWeight: 700, mb: 1 }}>
        Pipelines Dashboard
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic', mb: 4 }}>
        Pipelines and PipelineVersions across Kubeflow namespaces
      </Typography>

      {hasListErrors ? (
        <Alert severity="warning" sx={{ mb: 4, borderRadius: '4px' }}>
          Some Pipelines resources could not be listed. Cards marked as Not installed, Not
          authorized, or Unavailable reflect the current access state.
        </Alert>
      ) : null}

      <Grid container spacing={3} sx={{ mb: 6 }}>
        {summaryCards.map(card => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card variant="outlined" sx={{ borderRadius: '4px' }}>
              <CardContent
                sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'text.primary' }}>
                  <Icon icon={card.icon} width="28" height="28" style={{ marginRight: '8px' }} />
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}
                  >
                    {card.title}
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, fontSize: '2.5rem' }}>
                  {card.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <SectionBox title="KFP Control Plane">
          <SimpleTable
            columns={[
              { label: 'Field', getter: (row: { label: string }) => row.label },
              { label: 'Value', getter: (row: { value: string }) => row.value },
            ]}
            data={controlPlaneRows}
            emptyMessage="Control plane information unavailable."
          />
        </SectionBox>
      </Box>

      <Box sx={{ mt: 4 }}>
        <SectionBox title="RBAC & Access">
          <SimpleTable
            columns={[
              { label: 'Resource', getter: (row: { resource: string }) => row.resource },
              { label: 'List Access', getter: (row: { access: string }) => row.access },
            ]}
            data={accessRows}
            emptyMessage="No authorization data available."
          />
        </SectionBox>
      </Box>

      {deploymentAvailability ? (
        <Alert severity="info" variant="outlined" sx={{ mt: 4 }}>
          Deployment data is {deploymentAvailability.toLowerCase()} so the KFP deployment table is
          hidden.
        </Alert>
      ) : kfpDeployments.length > 0 ? (
        <Box sx={{ mt: 4 }}>
          <SectionBox title="KFP Deployments">
            <SimpleTable
              columns={[
                {
                  label: 'Name',
                  getter: (item: any) => item.metadata.name,
                },
                {
                  label: 'Namespace',
                  getter: (item: any) => item.metadata.namespace,
                },
                {
                  label: 'Ready',
                  getter: (item: any) =>
                    `${item.jsonData?.status?.readyReplicas ?? item.status?.readyReplicas ?? 0}/${
                      item.jsonData?.spec?.replicas ?? item.spec?.replicas ?? 0
                    }`,
                },
                {
                  label: 'Available',
                  getter: (item: any) =>
                    item.jsonData?.status?.availableReplicas ?? item.status?.availableReplicas ?? 0,
                },
                {
                  label: 'Age',
                  getter: (item: any) => (typeof item.getAge === 'function' ? item.getAge() : '-'),
                },
              ]}
              data={kfpDeployments}
              emptyMessage="No Kubeflow Pipelines deployments detected."
            />
          </SectionBox>
        </Box>
      ) : null}

      {failureRows.length > 0 ? (
        <Box sx={{ mt: 4 }}>
          <SectionBox title="Recent Failures">
            <SimpleTable
              columns={[
                { label: 'Type', getter: row => row.kind },
                { label: 'Name', getter: row => row.link },
                { label: 'Namespace', getter: row => row.namespace ?? '-' },
                { label: 'Status', getter: row => row.status },
              ]}
              data={failureRows.slice(0, 10)}
              emptyMessage="No failed resources detected."
            />
          </SectionBox>
        </Box>
      ) : null}

      {!pipelineAvailability ? (
        <Box sx={{ mt: 4 }}>
          <SectionBox title="Recent Pipelines">
            <SimpleTable
              columns={[
                {
                  label: 'Name',
                  getter: (item: PipelineClass) => {
                    const data = (item as any).jsonData || item;
                    return (
                      <HeadlampLink
                        routeName={getPipelineDetailsPath()}
                        params={{ namespace: data.metadata.namespace, name: data.metadata.name }}
                      >
                        {data.metadata.name}
                      </HeadlampLink>
                    );
                  },
                },
                {
                  label: 'Namespace',
                  getter: (item: any) => (item.jsonData || item).metadata.namespace,
                },
                {
                  label: 'Latest Version',
                  getter: (item: PipelineClass) => {
                    const data = (item as any).jsonData || item;
                    const latestVersion = getLatestPipelineVersionForPipeline(
                      versionList,
                      data.metadata.name,
                      data.metadata.namespace
                    );

                    if (!latestVersion?.metadata?.name || !latestVersion.metadata.namespace) {
                      return '-';
                    }

                    return (
                      <HeadlampLink
                        routeName={getPipelineVersionDetailsPath()}
                        params={{
                          namespace: latestVersion.metadata.namespace,
                          name: latestVersion.metadata.name,
                        }}
                      >
                        {latestVersion.metadata.name}
                      </HeadlampLink>
                    );
                  },
                },
                {
                  label: 'Versions',
                  getter: (item: PipelineClass) => {
                    const data = (item as any).jsonData || item;
                    return countPipelineVersionsForPipeline(
                      versionList,
                      data.metadata.name,
                      data.metadata.namespace
                    );
                  },
                },
                {
                  label: 'Status',
                  getter: (item: PipelineClass) => <PipelineStatusBadge resource={item} />,
                },
              ]}
              data={recentPipelines}
              emptyMessage="No pipelines found."
            />
          </SectionBox>
        </Box>
      ) : null}

      {!versionAvailability ? (
        <Box sx={{ mt: 4 }}>
          <SectionBox title="Recent Pipeline Versions">
            <SimpleTable
              columns={[
                {
                  label: 'Name',
                  getter: (item: PipelineVersionClass) => {
                    const data = (item as any).jsonData || item;
                    return (
                      <HeadlampLink
                        routeName={getPipelineVersionDetailsPath()}
                        params={{ namespace: data.metadata.namespace, name: data.metadata.name }}
                      >
                        {data.metadata.name}
                      </HeadlampLink>
                    );
                  },
                },
                {
                  label: 'Namespace',
                  getter: (item: any) => (item.jsonData || item).metadata.namespace,
                },
                {
                  label: 'Pipeline',
                  getter: (item: PipelineVersionClass) => {
                    const data = (item as any).jsonData || item;
                    const pipelineName = data.pipelineName || data.spec?.pipelineName;
                    return pipelineName ? (
                      <HeadlampLink
                        routeName={getPipelineDetailsPath()}
                        params={{ namespace: data.metadata.namespace, name: pipelineName }}
                      >
                        {pipelineName}
                      </HeadlampLink>
                    ) : (
                      '-'
                    );
                  },
                },
                {
                  label: 'Description',
                  getter: (item: PipelineVersionClass) =>
                    (item as any).description || (item as any).spec?.description || '-',
                },
                {
                  label: 'Status',
                  getter: (item: PipelineVersionClass) => <PipelineStatusBadge resource={item} />,
                },
              ]}
              data={recentVersions}
              emptyMessage="No pipeline versions found."
            />
          </SectionBox>
        </Box>
      ) : null}

      {!runAvailability ? (
        <Box sx={{ mt: 4 }}>
          <SectionBox title="Recent Pipeline Runs">
            <SimpleTable
              columns={[
                {
                  label: 'Name',
                  getter: (item: PipelineRunClass) => {
                    const data = (item as any).jsonData || item;
                    return (
                      <HeadlampLink
                        routeName={getPipelineRunDetailsPath()}
                        params={{ namespace: data.metadata.namespace, name: data.metadata.name }}
                      >
                        {data.metadata.name}
                      </HeadlampLink>
                    );
                  },
                },
                {
                  label: 'Namespace',
                  getter: (item: any) => (item.jsonData || item).metadata.namespace,
                },
                {
                  label: 'Pipeline',
                  getter: (item: PipelineRunClass) => {
                    const data = (item as any).jsonData || item;
                    const pipelineName = data.pipelineName || data.spec?.pipelineName;
                    return pipelineName ? (
                      <HeadlampLink
                        routeName={getPipelineDetailsPath()}
                        params={{ namespace: data.metadata.namespace, name: pipelineName }}
                      >
                        {pipelineName}
                      </HeadlampLink>
                    ) : (
                      '-'
                    );
                  },
                },
                {
                  label: 'Duration',
                  getter: (item: PipelineRunClass) => getPipelineRunDurationLabel(item),
                },
                {
                  label: 'Pipeline Root',
                  getter: (item: PipelineRunClass) => getPipelineRunRoot(item) || '-',
                },
                {
                  label: 'Status',
                  getter: (item: PipelineRunClass) => <PipelineStatusBadge resource={item} />,
                },
              ]}
              data={recentRuns}
              emptyMessage="No pipeline runs found."
            />
          </SectionBox>
        </Box>
      ) : null}
    </Box>
  );
}
