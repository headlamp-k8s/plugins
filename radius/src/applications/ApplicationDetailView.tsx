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
import { Icon } from '@iconify/react';
import { Link, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Button, Chip, CircularProgress, Grid, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { UCPApplication, useApplicationResources, useRadiusApplications } from '../models/radius';

interface RouteParams {
  applicationName: string;
  [key: string]: string | undefined;
}

/**
 * Application Detail View Component
 * Shows detailed information about a specific Radius application
 */
export default function ApplicationDetailView() {
  const { applicationName } = useParams<RouteParams>();
  const [applications, error, loading] = useRadiusApplications();

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
      <SectionBox sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          Error loading application
        </Typography>
        <Typography color="error">{error.message}</Typography>
      </SectionBox>
    );
  }

  // Find the selected application
  const application: UCPApplication | undefined = applications?.find(
    app => app.name === applicationName
  );

  // Application not found
  if (!application) {
    return (
      <SectionBox sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Application Not Found
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          The application "{applicationName}" could not be found.
        </Typography>
        <Button
          onClick={() => window.history.back()}
          startIcon={<Icon icon="mdi:arrow-left" />}
          sx={{ mt: 2 }}
        >
          Back
        </Button>
      </SectionBox>
    );
  }

  const environmentName = application.properties.environment?.split('/').pop() || 'N/A';

  return <ApplicationContent application={application} environmentName={environmentName} />;
}

/**
 * Separate component for application content
 * This allows us to use the hook conditionally only when we have a valid application
 */
/**
 * Displays the detailed content view for a Radius application.
 * 
 * This component is separated from ApplicationDetailView to provide a focused,
 * self-contained view of application details including general information,
 * environment configuration, associated resources, and system metadata.
 * 
 * The component fetches and displays:
 * - General application information (name, type, location, provisioning state)
 * - Environment and compute configuration (environment reference, compute kind, namespace)
 * - Associated resources in a table format with links to individual resource details
 * - System metadata (creation and modification timestamps and actors)
 * 
 * @param props - Component properties
 * @param props.application - The UCP application object containing all application details
 * @param props.environmentName - The name of the environment this application belongs to
 * 
 * @returns A React component rendering the complete application detail view
 * 
 * @example
 * ```tsx
 * <ApplicationContent 
 *   application={ucpApplicationData} 
 *   environmentName="production"
 * />
 * ```
 */
function ApplicationContent({
  application,
  environmentName,
}: Readonly<{
  application: UCPApplication;
  environmentName: string;
}>) {
  // Fetch resources for this application
  const [resources, resourcesError, resourcesLoading] = useApplicationResources(application.id);

  return (
    <SectionBox>
      {/* Header with Back Button */}
      <Button
        onClick={() => window.history.back()}
        startIcon={<Icon icon="mdi:arrow-left" />}
        sx={{ mb: 2 }}
      >
        Back
      </Button>
      <SectionBox sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {application.name}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {application.id}
        </Typography>
      </SectionBox>

      {/* Content */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SectionBox title="General Information">
            <Box display="flex" flexDirection="column" gap={2}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Name
                </Typography>
                <Typography variant="body1">{application.name}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Type
                </Typography>
                <Typography variant="body1">{application.type}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Location
                </Typography>
                <Typography variant="body1">{application.location}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Provisioning State
                </Typography>
                <Chip
                  label={application.properties.provisioningState || 'Unknown'}
                  color={
                    application.properties.provisioningState === 'Succeeded' ? 'success' : 'default'
                  }
                  size="small"
                />
              </Box>
            </Box>
          </SectionBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionBox title="Environment & Compute">
            <Box display="flex" flexDirection="column" gap={2}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Environment
                </Typography>
                {environmentName === "N/A" ? (
                  <Typography variant="body1">{environmentName}</Typography>
                ) : (
                  <Link routeName="environment-detail" params={{ environmentName }}>
                    {environmentName}
                  </Link>
                )}
              </Box>
              {application.properties.status?.compute?.kind && (
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Compute Kind
                  </Typography>
                  <Typography variant="body1">
                    {application.properties.status.compute.kind}
                  </Typography>
                </Box>
              )}
              {application.properties.status?.compute?.namespace && (
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Namespace
                  </Typography>
                  <Typography variant="body1">
                    {application.properties.status.compute.namespace}
                  </Typography>
                </Box>
              )}
            </Box>
          </SectionBox>
        </Grid>
      </Grid>

      <SectionBox title={`Resources (${resources?.length || 0})`}>
        {resourcesLoading && (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        )}
        {resourcesError && (
          <Typography color="error">Error loading resources: {resourcesError.message}</Typography>
        )}
        {!resourcesLoading && !resourcesError && resources && resources.length > 0 ? (
          <Table
            data={resources}
            columns={[
              {
                header: 'Name',
                accessorKey: 'name',
                gridTemplate: 'auto',
                Cell: ({ row }: any) => (
                  <Link routeName="resource-detail" params={{ resourceName: row.original.name }}>
                    {row.original.name}
                  </Link>
                ),
              },
              {
                header: 'Type',
                accessorKey: 'type',
                Cell: ({ row }: any) => {
                  const resourceType = row.original.type.split('/').pop() || row.original.type;
                  return <Chip label={resourceType} size="small" />;
                },
              },
              {
                header: 'Namespace',
                accessorKey: 'namespace',
                Cell: ({ row }: any) => row.original.properties.status?.compute?.namespace || 'N/A',
              },
              {
                header: 'Provisioning State',
                accessorKey: 'provisioningState',
                Cell: ({ row }: any) => (
                  <Chip
                    label={row.original.properties.provisioningState || 'Unknown'}
                    color={
                      row.original.properties.provisioningState === 'Succeeded'
                        ? 'success'
                        : 'default'
                    }
                    size="small"
                  />
                ),
              },
            ]}
          />
        ) : (
          !resourcesLoading &&
          !resourcesError && (
            <Typography color="textSecondary">No resources found for this application</Typography>
          )
        )}
      </SectionBox>

      {application.systemData && (
        <SectionBox title="System Information">
          <Grid container spacing={2}>
            {application.systemData.createdAt && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Created At
                </Typography>
                <Typography variant="body2">
                  {new Date(application.systemData.createdAt).toLocaleString()}
                </Typography>
              </Grid>
            )}
            {application.systemData.createdBy && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Created By
                </Typography>
                <Typography variant="body2">{application.systemData.createdBy}</Typography>
              </Grid>
            )}
            {application.systemData.lastModifiedAt && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Last Modified
                </Typography>
                <Typography variant="body2">
                  {new Date(application.systemData.lastModifiedAt).toLocaleString()}
                </Typography>
              </Grid>
            )}
            {application.systemData.lastModifiedBy && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Last Modified By
                </Typography>
                <Typography variant="body2">{application.systemData.lastModifiedBy}</Typography>
              </Grid>
            )}
          </Grid>
        </SectionBox>
      )}
    </SectionBox>
  );
}
