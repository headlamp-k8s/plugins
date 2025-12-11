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
import { Box, CircularProgress, Typography } from '@mui/material';
import { RadiusStatusLabel } from '../components/RadiusStatusLabel';
import { useRadiusApplications, useRadiusEnvironments, useRadiusResources } from '../models/radius';

interface ResourceTableData {
  name: string;
  resourceGroup: string;
  type: string;
  application: string;
  environment: string;
  provisioningState: string;
}

/**
 * Resources component displays a list of all Radius resources
 */
export default function Resources() {
  const [resources, resError, resLoading] = useRadiusResources();
  const [applications, appError, appLoading] = useRadiusApplications();
  const [environments, envError, envLoading] = useRadiusEnvironments();

  const loading = resLoading || appLoading || envLoading;
  const error = resError || appError || envError;

  // Show loading state
  if (loading) {
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

  // Show error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          Error loading resources
        </Typography>
        <Typography color="error">{error.message}</Typography>
      </Box>
    );
  }

  // Combine all resources (environments, applications, and other resources)
  const allResources: Array<{ id: string; name: string; type: string; properties: any }> = [
    ...(environments || []),
    ...(applications || []),
    ...(resources || []),
  ];

  // Create a map of application name to environment for lookup
  const appToEnvMap = new Map<string, string>();
  (applications || []).forEach(app => {
    const envName = app.properties.environment?.split('/').pop();
    if (envName) {
      appToEnvMap.set(app.name, envName);
    }
  });

  // Transform resources for table display
  const tableData: ResourceTableData[] = allResources.map(resource => {
    // Extract resource group from the resource ID
    // ID format: /planes/radius/local/resourceGroups/{resourceGroup}/providers/...
    const idParts = resource.id.split('/');
    const rgIndex = idParts.indexOf('resourceGroups');
    const resourceGroup =
      rgIndex >= 0 && rgIndex + 1 < idParts.length ? idParts[rgIndex + 1] : 'N/A';

    // Extract application and environment - environments don't have these properties
    const isEnvironment = resource.type === 'Applications.Core/environments';
    const isApplication = resource.type === 'Applications.Core/applications';

    let application: string;
    let environment: string;

    if (isEnvironment) {
      // Environments don't belong to an application or environment
      application = '-';
      environment = '-';
    } else if (isApplication) {
      // Applications belong to an environment but not to another application
      application = '-';
      environment = resource.properties.environment?.split('/').pop() || 'N/A';
    } else {
      // Regular resources (containers, gateways, etc.) belong to both
      application = resource.properties.application?.split('/').pop() || 'N/A';

      // Try to get environment directly from the resource first
      environment = resource.properties.environment?.split('/').pop() || '';

      // If no direct environment, try to get it from the parent application
      if (!environment && application !== 'N/A') {
        environment = appToEnvMap.get(application) || 'N/A';
      } else if (!environment) {
        environment = 'N/A';
      }
    }

    const provisioningState = resource.properties.provisioningState || 'Unknown';

    return {
      name: resource.name,
      resourceGroup,
      type: resource.type,
      application,
      environment,
      provisioningState,
    };
  });

  return (
    <SectionBox title={`Resources (${tableData.length})`}>
      <Table
        data={tableData}
        columns={[
          {
            header: 'Resource Name',
            accessorKey: 'name',
            gridTemplate: 'auto',
            Cell: ({ row }: any) => {
              const resourceName = row.original.name;
              return (
                <Link routeName="resource-detail" params={{ resourceName }}>
                  {resourceName}
                </Link>
              );
            },
          },
          {
            header: 'Resource Group',
            accessorKey: 'resourceGroup',
          },
          {
            header: 'Type',
            accessorKey: 'type',
          },
          {
            header: 'Application',
            accessorKey: 'application',
            Cell: ({ row }: any) => {
              const appName = row.original.application;
              if (appName === 'N/A' || appName === '-') {
                return <Typography variant="body2">{appName}</Typography>;
              }
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
              if (envName === 'N/A' || envName === '-') {
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
            header: 'Status',
            accessorKey: 'provisioningState',
            accessorFn: item => {
              return <RadiusStatusLabel status={item.provisioningState} />;
            },
          },
        ]}
      />
    </SectionBox>
  );
}
