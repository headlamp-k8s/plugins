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
import { SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import React from 'react';
import {
  KatibExperimentClass,
  NotebookClass,
  PipelineClass,
  SparkApplicationClass,
  TrainJobClass,
} from '../../crdClasses';

export function Overview() {
  // Fetch lists directly from cluster
  const [notebooks, notebooksError] = NotebookClass.useList();
  const [pipelines, pipelinesError] = PipelineClass.useList();
  const [katibExps, katibError] = KatibExperimentClass.useList();
  const [trainJobs, trainError] = TrainJobClass.useList();
  const [sparkApps, sparkError] = SparkApplicationClass.useList();

  const isLoading =
    (notebooks === null && !notebooksError) ||
    (pipelines === null && !pipelinesError) ||
    (katibExps === null && !katibError) ||
    (trainJobs === null && !trainError) ||
    (sparkApps === null && !sparkError);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Kubeflow Operator Dashboard...</Typography>
      </Box>
    );
  }

  const modules = [
    {
      title: 'Notebooks',
      key: 'Notebook',
      icon: 'mdi:notebook',
      items: notebooks,
      isInstalled: !notebooksError,
    },
    {
      title: 'Pipelines',
      key: 'Pipeline',
      icon: 'mdi:sitemap',
      items: pipelines,
      isInstalled: !pipelinesError,
    },
    {
      title: 'Katib Experiments',
      key: 'Katib',
      icon: 'mdi:tune',
      items: katibExps,
      isInstalled: !katibError,
    },
    {
      title: 'Training Jobs',
      key: 'Training',
      icon: 'mdi:school',
      items: trainJobs,
      isInstalled: !trainError,
    },
    {
      title: 'Spark Applications',
      key: 'Spark',
      icon: 'mdi:flash',
      items: sparkApps,
      isInstalled: !sparkError,
    },
  ];

  const anyInstalled = modules.some(m => m.isInstalled);

  const allWorkloads = modules.flatMap(m =>
    (m.items || []).map((res: any) => ({ moduleKey: m.key, resource: res }))
  );

  const getStatus = (res: any) => {
    const conditions = res.status?.conditions || [];
    if (!conditions.length && !res.status?.phase) {
      return 'Unknown';
    }
    const failedCond = conditions.find((c: any) => c.type === 'Failed' && c.status === 'True');
    if (failedCond) return 'Failed';

    const runningCond = conditions.find(
      (c: any) => (c.type === 'Running' || c.type === 'Ready') && c.status === 'True'
    );
    if (runningCond) return 'Running';

    if (res.status?.phase) return res.status.phase;

    return conditions[conditions.length - 1]?.type || 'Pending';
  };

  const activeWorkloads = allWorkloads.filter(w => {
    const s = getStatus(w.resource);
    return s === 'Running' || s === 'Created' || s === 'Ready';
  });

  const failedWorkloads = allWorkloads.filter(w => {
    const s = getStatus(w.resource);
    return s === 'Failed' || s === 'Error';
  });

  return (
    <Box sx={{ padding: '24px 16px', pt: '32px' }}>
      <Typography variant="h1" sx={{ fontSize: '1.87rem', fontWeight: 700, mb: 1 }}>
        Kubeflow Control Center
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic', mb: 4 }}>
        Platform workload detection and unified observability
      </Typography>

      {!anyInstalled && (
        <Alert severity="warning" sx={{ mb: 4, borderRadius: '4px' }}>
          No Kubeflow components (CRDs) were detected on this cluster. Please ensure you have
          installed your preferred ML components using the official manifests.
        </Alert>
      )}

      {/* Snapshot Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {modules.map(module => {
          if (!module.isInstalled) return null;

          return (
            <Grid item xs={12} sm={6} md={3} key={module.key}>
              <Card variant="outlined" sx={{ borderRadius: '4px' }}>
                <CardContent
                  sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'primary.main' }}>
                    <Icon
                      icon={module.icon}
                      width="28"
                      height="28"
                      style={{ marginRight: '8px' }}
                    />
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}
                    >
                      {module.title}
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, fontSize: '2.5rem' }}>
                    {module.items?.length || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Instances
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Unified Table for Workloads */}
      <Box sx={{ mb: 6 }}>
        {allWorkloads.length === 0 ? (
          anyInstalled ? (
            <Alert severity="info" variant="outlined">
              The platform is installed but no ML workloads are currently running. Head over to the
              sidebar to launch Notebooks or Pipelines!
            </Alert>
          ) : null
        ) : (
          <Grid container spacing={3}>
            {/* Active Instances Box */}
            <Grid item xs={12} lg={failedWorkloads.length > 0 ? 6 : 12}>
              <SectionBox title="Actively Running Workloads">
                <SimpleTable
                  columns={[
                    { label: 'Type', getter: (item: any) => item.moduleKey },
                    { label: 'Name', getter: (item: any) => item.resource.metadata.name },
                    { label: 'Namespace', getter: (item: any) => item.resource.metadata.namespace },
                  ]}
                  data={activeWorkloads}
                  emptyMessage="No active workloads running right now."
                />
              </SectionBox>
            </Grid>

            {/* Failed Instances Box (Only rendered if failures exist) */}
            {failedWorkloads.length > 0 && (
              <Grid item xs={12} lg={6}>
                <SectionBox title="Failed Workloads (Requires Attention)">
                  <SimpleTable
                    columns={[
                      { label: 'Type', getter: (item: any) => item.moduleKey },
                      {
                        label: 'Name',
                        getter: (item: any) => (
                          <Typography
                            component="span"
                            sx={{ color: 'error.main', fontWeight: 'bold' }}
                          >
                            {item.resource.metadata.name}
                          </Typography>
                        ),
                      },
                      {
                        label: 'Namespace',
                        getter: (item: any) => item.resource.metadata.namespace,
                      },
                    ]}
                    data={failedWorkloads}
                    emptyMessage="No failed workloads found."
                  />
                </SectionBox>
              </Grid>
            )}
          </Grid>
        )}
      </Box>
    </Box>
  );
}
