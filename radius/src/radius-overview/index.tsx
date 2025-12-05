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
  const successPercentage = Math.round((status.success / total) * 100);
  const failedPercentage = Math.round((status.failed / total) * 100);
  const processingPercentage = Math.round((status.processing / total) * 100);
  let suspendedPercentage = Math.round((status.suspended / total) * 100);

  // Adjust to ensure total is 100%
  const sum = successPercentage + failedPercentage + processingPercentage + suspendedPercentage;
  if (sum !== 100) {
    suspendedPercentage += 100 - sum;
  }

  const data = [
    {
      name: 'success',
      value: successPercentage,
      fill: theme.palette.success.main,
    },
    {
      name: 'failed',
      value: failedPercentage,
      fill: '#DC7501',
    },
    {
      name: 'processing',
      value: processingPercentage,
      fill: '#2196F3',
    },
    {
      name: 'suspended',
      value: suspendedPercentage,
      fill: '#FDE100',
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
      const env = app.properties.environment || 'N/A';
      appsByEnvironment.set(env, (appsByEnvironment.get(env) || 0) + 1);
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
    return {
      name: envName,
      namespace: env.properties.compute?.namespace || 'N/A',
      provider: env.properties.providers?.azure?.scope ? 'Azure' : 'Kubernetes',
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
