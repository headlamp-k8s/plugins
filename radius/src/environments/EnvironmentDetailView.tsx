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
import {
  Link,
  SectionBox,
  Table as HeadlampTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import React from 'react';
import { useParams } from 'react-router-dom';
import { RadiusStatusLabel } from '../components/RadiusStatusLabel';
import { UCPEnvironment, useRadiusApplications, useRadiusEnvironments } from '../models/radius';

interface TabPanelProps {
  readonly children?: React.ReactNode;
  readonly index: number;
  readonly value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface RouteParams {
  environmentName: string;
  [key: string]: string | undefined;
}

/**
 * Environment Detail View Component
 * Shows detailed information about a specific Radius environment
 */
/**
 * A component that conditionally renders its children based on the current tab value.
 * Used to implement tab panels in a tabbed interface.
 * 
 * @param props - The component props
 * @param props.children - The content to render when this tab panel is active
 * @param props.value - The currently selected tab index
 * @param props.index - The index of this tab panel
 * @returns The tab panel content when active, or null when inactive
 * 
 * @example
 * ```tsx
 * <TabPanel value={currentTab} index={0}>
 *   <div>Content for first tab</div>
 * </TabPanel>
 * ```
 */
export default function EnvironmentDetailView() {
  const { environmentName } = useParams<RouteParams>();
  const [environments, error, loading] = useRadiusEnvironments();
  const [applications, appsError] = useRadiusApplications();
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Show loading state
  if (loading) {
    return (
      <SectionBox
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </SectionBox>
    );
  }

  // Show error state
  if (error) {
    return (
      <SectionBox sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          Error loading environment
        </Typography>
        <Typography color="error">{error.message}</Typography>
      </SectionBox>
    );
  }

  // Find the selected environment
  const environment: UCPEnvironment | undefined = environments?.find(
    env => env.name === environmentName
  );

  // Environment not found
  if (!environment) {
    return (
      <SectionBox sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Environment Not Found
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          The environment "{environmentName}" could not be found.
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

  // Filter applications for this environment
  const environmentApps =
    applications?.filter(app => {
      const envId = environment.id;
      return app.properties.environment === envId;
    }) || [];

  const recipes = environment.properties.recipes || {};
  const recipeCount = Object.keys(recipes).length;

  // Transform recipes into flat table data
  interface RecipeTableData {
    resourceType: string;
    recipeName: string;
    templateKind: string;
    templatePath: string;
  }

  interface RecipeTableRow {
    original: RecipeTableData;
  }

  const recipeTableData: RecipeTableData[] = [];
  for (const [resourceType, recipeConfigs] of Object.entries(recipes)) {
    for (const [recipeName, config] of Object.entries(recipeConfigs)) {
      recipeTableData.push({
        resourceType,
        recipeName,
        templateKind: config.templateKind,
        templatePath: config.templatePath,
      });
    }
  }

  return (
    <SectionBox>
      <Box>
        <Button
          onClick={() => window.history.back()}
          startIcon={<Icon icon="mdi:arrow-left" />}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" gutterBottom>
          {environment.name}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {environment.id}
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label={`Recipes (${recipeCount})`} />
          <Tab label={`Resources (${environmentApps.length})`} />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <SectionBox title="General Information">
              <Box display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Name
                  </Typography>
                  <Typography variant="body1">{environment.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Type
                  </Typography>
                  <Typography variant="body1">{environment.type}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Location
                  </Typography>
                  <Typography variant="body1">{environment.location}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Provisioning State
                  </Typography>
                  <RadiusStatusLabel
                    status={environment.properties.provisioningState || 'Unknown'}
                  />
                </Box>
              </Box>
            </SectionBox>
          </Grid>

          <Grid item xs={12} md={6}>
            <SectionBox title="Compute">
              <Box display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Kind
                  </Typography>
                  <Typography variant="body1">
                    {environment.properties.compute?.kind || 'N/A'}
                  </Typography>
                </Box>
                {environment.properties.compute?.namespace && (
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Namespace
                    </Typography>
                    <Typography variant="body1">
                      {environment.properties.compute.namespace}
                    </Typography>
                  </Box>
                )}
                {environment.properties.compute?.resourceId && (
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Resource ID
                    </Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                      {environment.properties.compute.resourceId}
                    </Typography>
                  </Box>
                )}
              </Box>
            </SectionBox>
          </Grid>

          {environment.properties.providers &&
            Object.keys(environment.properties.providers).length > 0 && (
              <Grid item xs={12}>
                <SectionBox title="Providers">
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {Object.keys(environment.properties.providers).map(providerName => (
                      <Chip
                        key={providerName}
                        label={providerName}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </SectionBox>
              </Grid>
            )}

          {environment.systemData && (
            <Grid item xs={12}>
              <SectionBox title="System Information">
                <Grid container spacing={2}>
                  {environment.systemData.createdAt && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Created At
                      </Typography>
                      <Typography variant="body2">
                        {new Date(environment.systemData.createdAt).toLocaleString()}
                      </Typography>
                    </Grid>
                  )}
                  {environment.systemData.createdBy && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Created By
                      </Typography>
                      <Typography variant="body2">{environment.systemData.createdBy}</Typography>
                    </Grid>
                  )}
                  {environment.systemData.lastModifiedAt && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Last Modified
                      </Typography>
                      <Typography variant="body2">
                        {new Date(environment.systemData.lastModifiedAt).toLocaleString()}
                      </Typography>
                    </Grid>
                  )}
                  {environment.systemData.lastModifiedBy && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Last Modified By
                      </Typography>
                      <Typography variant="body2">
                        {environment.systemData.lastModifiedBy}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </SectionBox>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Recipes Tab */}
      <TabPanel value={tabValue} index={1}>
        {recipeCount === 0 ? (
          <Typography>No recipes registered for this environment</Typography>
        ) : (
          <HeadlampTable
            data={recipeTableData}
            columns={[
              {
                header: 'Resource Type',
                accessorKey: 'resourceType',
              },
              {
                header: 'Recipe Kind',
                accessorKey: 'templateKind',
                Cell: ({ row }: { row: RecipeTableRow }) => <Chip label={row.original.templateKind} size="small" />,
              },
              {
                header: 'Recipe Location',
                accessorKey: 'templatePath',
              },
            ]}
          />
        )}
      </TabPanel>

      {/* Resources Tab */}
      <TabPanel value={tabValue} index={2}>
        {appsError ? (
          <Typography color="error">Error loading resources: {appsError.message}</Typography>
        ) : null}

        {!appsError && environmentApps.length === 0 ? (
          <Typography>No resources found for this environment</Typography>
        ) : null}

        {!appsError && environmentApps.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Namespace</TableCell>
                <TableCell>Provisioning State</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {environmentApps.map(app => {
                const namespace = app.properties.status?.compute?.namespace || 'N/A';
                const createdAt = app.systemData?.createdAt
                  ? new Date(app.systemData.createdAt).toLocaleDateString()
                  : 'N/A';

                return (
                  <TableRow key={app.id}>
                    <TableCell>
                      <Link routeName="application-detail" params={{ applicationName: app.name }}>
                        {app.name}
                      </Link>
                    </TableCell>
                    <TableCell>{app.type}</TableCell>
                    <TableCell>{namespace}</TableCell>
                    <TableCell>
                      <RadiusStatusLabel status={app.properties.provisioningState || 'Unknown'} />
                    </TableCell>
                    <TableCell>{createdAt}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : null}
      </TabPanel>
    </SectionBox>
  );
}
