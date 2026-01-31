/*
 * Copyright 2025 The Headlamp Authors
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

import { Link, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { TileChart } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, CircularProgress, Grid, Typography, useTheme } from '@mui/material';
import React from 'react';
import { RadiusStatusLabel } from '../components/RadiusStatusLabel';
import {
  UCPResource,
  useRadiusApplications,
  useRadiusEnvironments,
  useRadiusResources,
} from '../models/radius';

/**
 * Calculate status distribution for resources
 * Maps Radius provisioningState to status categories
 */
function getResourceStatus(resources: UCPResource[]): {
  success: number;
  failed: number;
  processing: number;
  suspended: number;
} {
  const status = {
    success: 0,
    failed: 0,
    processing: 0,
    suspended: 0,
  };

  for (const resource of resources) {
    const state = resource.properties.provisioningState;
    if (state === 'Succeeded') {
      status.success++;
    } else if (state === 'Failed' || state === 'Deleting') {
      status.failed++;
    } else if (state === 'Provisioning' || state === 'Updating') {
      status.processing++;
    } else {
      // Unknown or other states
      status.suspended++;
    }
  }

  return status;
}

/**
 * ResourceStatusChart displays a TileChart with resource status distribution
 */
interface ResourceStatusChartProps {
  readonly resources: UCPResource[];
  readonly title: string;
}

/**  
 * Displays a tile chart summarizing the distribution of resource statuses.
 *
 * This component receives a list of resources and a title. It calculates the number of resources
 * in each status category (success, failed, processing, suspended) using the getResourceStatus function,
 * which maps the provisioningState of each resource to a status category. The component then displays
 * the distribution as a TileChart, showing the percentage of resources in each status.
 *
 * @param {ResourceStatusChartProps} props - The props for the component.
 * @param {UCPResource[]} props.resources - The list of resources to analyze.
 * @param {string} props.title - The title to display with the chart.
 */
function ResourceStatusChart({ resources, title }: ResourceStatusChartProps) {
  const theme = useTheme();
  const total = resources.length;

  if (total === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          0
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
    );
  }

  const status = getResourceStatus(resources);

  // Calculate percentages ensuring they sum to 100%
  let percentages = [  
    Math.round((status.success / total) * 100),  
    Math.round((status.failed / total) * 100),  
    Math.round((status.processing / total) * 100),  
    Math.round((status.suspended / total) * 100),  
  ];  

  // Adjust to ensure total is 100% by modifying the largest percentage  
  const sum = percentages.reduce((a, b) => a + b, 0);  
  if (sum !== 100 && sum > 0) {  
    const idx = percentages.indexOf(Math.max(...percentages));  
    percentages[idx] += 100 - sum;  
  }  

  const [successPercentage, failedPercentage, processingPercentage, suspendedPercentage] = percentages;

  const data = [
    {
      name: 'success',
      value: successPercentage,
      fill: theme.palette.success.main,
    },
    {
      name: 'failed',
      value: failedPercentage,
      fill: theme.palette.error.main,
    },
    {
      name: 'processing',
      value: processingPercentage,
      fill: theme.palette.info.main,
    },
    {
      name: 'suspended',
      value: suspendedPercentage,
      fill: theme.palette.warning.main,
    },
  ].filter(item => item.value > 0);

  const legend = (
    <Box sx={{ mt: 2 }}>
      <Typography variant="body2" fontWeight="medium" gutterBottom>
        {title}
      </Typography>
      {status.success > 0 && (
        <Typography variant="caption" display="block" color="text.secondary">
          {status.success} Succeeded
        </Typography>
      )}
      {status.failed > 0 && (
        <Typography variant="caption" display="block" color="error">
          {status.failed} Failed
        </Typography>
      )}
      {status.processing > 0 && (
        <Typography variant="caption" display="block" color="text.secondary">
          {status.processing} Processing
        </Typography>
      )}
      {status.suspended > 0 && (
        <Typography variant="caption" display="block" color="text.secondary">
          {status.suspended} Other
        </Typography>
      )}
    </Box>
  );

  return (
    <Box sx={{ position: 'relative', textAlign: 'center' }}>
      <TileChart data={data} total={100} label={`${successPercentage}%`} legend={legend} />
    </Box>
  );
}

interface ApplicationTableData {
  name: string;
  environment: string;
  provisioningState: string | null | undefined;
  created: string;
}

interface EnvironmentTableData {
  name: string;
  namespace: string;
  provider: string;
  applications: number;
  provisioningState: string | null | undefined;
  created: string;
}

/**
 * Overview component displays the main dashboard for Radius resources
 */
export default function Overview() {
  // Fetch Radius resources from UCP API through Kubernetes API Aggregation
  const [applications, appError, appLoading] = useRadiusApplications();
  const [environments, envError, envLoading] = useRadiusEnvironments();
  const [resources, resError, resLoading] = useRadiusResources();

  if (appLoading || envLoading || resLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (appError || envError || resError) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          Error loading Radius resources
        </Typography>
        {appError && <Typography color="error">{appError.message}</Typography>}
        {envError && <Typography color="error">{envError.message}</Typography>}
        {resError && <Typography color="error">{resError.message}</Typography>}
      </Box>
    );
  }

  // Calculate resource statistics
  const failedResources = (resources || []).filter(
    res =>
      res.properties.provisioningState === 'Failed' ||
      res.properties.provisioningState === 'Deleting'
  );

  // Count applications per environment
  const appsByEnvironment = new Map<string, number>();
  if (applications) {
    for (const app of applications) {
      const env = app.properties.environment;  
      const envName = env ? env.split('/').pop() : 'N/A';  
      appsByEnvironment.set(envName, (appsByEnvironment.get(envName) || 0) + 1)
    }
  }

  // Transform applications for table display
  const applicationTableData: ApplicationTableData[] = (applications || []).map(app => {
    return {
      name: app.name,
      environment: app.properties.environment?.split('/').pop() || 'N/A',
      provisioningState: app.properties.provisioningState,
      created: app.systemData?.createdAt || 'N/A',
    };
  });

  // Transform environments for table display
  const environmentTableData: EnvironmentTableData[] = (environments || []).map(env => {
    const envName = env.name;
     let provider = 'N/A';
    if (env.properties.providers && typeof env.properties.providers === 'object') {
      const providerNames = Object.keys(env.properties.providers).filter(
        key => !!env.properties.providers[key]
      );
      provider = providerNames.length > 0 ? providerNames.map(name => name.charAt(0).toUpperCase() + name.slice(1)).join(', ') : 'N/A';
    }
    return {
      name: envName,
      namespace: env.properties.compute?.namespace || 'N/A',
      provider,
      applications: appsByEnvironment.get(envName) || 0,
      provisioningState: env.properties.provisioningState,
      created: env.systemData?.createdAt || 'N/A',
    };
  });

  return (
    <>
      <SectionBox title="Radius Overview">
        {/* Resource Status Charts Section */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <ResourceStatusChart resources={environments || []} title="Environments" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ResourceStatusChart resources={applications || []} title="Applications" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ResourceStatusChart resources={resources || []} title="All Resources" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ResourceStatusChart resources={failedResources} title="Failed Resources" />
            </Grid>
          </Grid>
        </Box>
      </SectionBox>

      <SectionBox title="Applications">
        <Table
          data={applicationTableData}
          columns={[
            {
              header: 'Name',
              accessorKey: 'name',
              Cell: ({ row }: any) => {
                const appName = row.original.name;
                return (
                  <Link routeName="application-detail" params={{ applicationName: appName }}>
                    {appName}
                  </Link>
                );
              },
            },
            {
              header: 'Environment',
              accessorKey: 'environment',
              Cell: ({ row }: any) => {
                const envName = row.original.environment;
                if (envName === 'N/A') {
                  return <Typography variant="body2">{envName}</Typography>;
                }
                return (
                  <Link routeName="environment-detail" params={{ environmentName: envName }}>
                    {envName}
                  </Link>
                );
              },
            },
            {
              header: 'Provisioning State',
              accessorKey: 'provisioningState',
              Cell: ({ row }: any) => <RadiusStatusLabel status={row.original.provisioningState} />,
            },
            {
              header: 'Created',
              accessorKey: 'created',
            },
          ]}
        />
      </SectionBox>

      <SectionBox title="Environments">
        <Table
          data={environmentTableData}
          columns={[
            {
              header: 'Name',
              accessorKey: 'name',
              Cell: ({ row }: any) => {
                const envName = row.original.name;
                return (
                  <Link routeName="environment-detail" params={{ environmentName: envName }}>
                    {envName}
                  </Link>
                );
              },
            },
            {
              header: 'Namespace',
              accessorKey: 'namespace',
            },
            {
              header: 'Provider',
              accessorKey: 'provider',
            },
            {
              header: 'Applications',
              accessorKey: 'applications',
            },
            {
              header: 'Provisioning State',
              accessorKey: 'provisioningState',
              Cell: ({ row }: any) => <RadiusStatusLabel status={row.original.provisioningState} />,
            },
            {
              header: 'Created',
              accessorKey: 'created',
            },
          ]}
        />
      </SectionBox>
    </>
  );
}
