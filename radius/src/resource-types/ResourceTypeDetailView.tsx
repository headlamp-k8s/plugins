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
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRadiusResourceTypeDetail } from '../models/radius';

interface RouteParams {
  resourceTypeName: string;
  [key: string]: string | undefined;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`resource-type-tabpanel-${index}`}
      aria-labelledby={`resource-type-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * Helper function to render schema properties in a table
 */
function renderPropertiesTable(properties: any, requiredFields: string[], title: string) {
  if (!properties || Object.keys(properties).length === 0) {
    return (
      <Typography color="textSecondary" sx={{ py: 2 }}>
        No {title.toLowerCase()} defined
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>
              <Typography variant="body2" fontWeight="bold">
                Property
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2" fontWeight="bold">
                Type
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2" fontWeight="bold">
                Description
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2" fontWeight="bold">
                Required
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(properties).map(([propName, propValue]: [string, any]) => {
            const isRequired = requiredFields.includes(propName);

            return (
              <TableRow key={propName}>
                <TableCell>
                  <Typography
                    component="code"
                    variant="body2"
                    sx={{
                      backgroundColor: theme =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.08)',
                      padding: '2px 6px',
                      borderRadius: 0.5,
                      fontFamily: 'monospace',
                    }}
                  >
                    {propName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={propValue.type || 'object'}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                  {propValue.enum && (
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="caption" color="textSecondary">
                        Enum: {propValue.enum.join(', ')}
                      </Typography>
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{propValue.description || '-'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{isRequired ? 'Yes' : 'No'}</Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/**
 * ResourceTypeDetailView displays detailed information about a specific resource type
 */
export default function ResourceTypeDetailView() {
  const { resourceTypeName } = useParams<RouteParams>();
  const decodedName = decodeURIComponent(resourceTypeName || '');

  // Split the full name into provider and type
  const [provider, typeName] = decodedName.split('/');

  const [resourceType, error, loading] = useRadiusResourceTypeDetail(provider, typeName);
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

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

  if (error) {
    return (
      <SectionBox sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          Error loading Resource Type Details
        </Typography>
        <Typography color="error">{error.message}</Typography>
      </SectionBox>
    );
  }

  if (!resourceType) {
    return (
      <SectionBox sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Resource Type Not Found
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          The resource type "{decodedName}" could not be found.
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

  // Get API versions
  const apiVersions = Object.keys(resourceType.apiVersions || {});

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h4">{resourceType.name}</Typography>
          <Chip label={provider} size="small" color="primary" variant="outlined" />
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {apiVersions.map((version, idx) => (
            <Chip key={idx} label={version} size="small" />
          ))}
        </Box>
      </SectionBox>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="resource type tabs">
          <Tab label="Overview" id="resource-type-tab-0" />
          <Tab label="Properties" id="resource-type-tab-1" />
          <Tab label="Output Properties" id="resource-type-tab-2" />
          <Tab label="Details" id="resource-type-tab-3" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      <TabPanel value={activeTab} index={0}>
        <SectionBox title="Description">
          {resourceType.description ? (
            <Box>
              {resourceType.description.split(/(```[\s\S]*?```|`[^`]+`)/).map((part, idx) => {
                // Triple backtick code block
                if (part.startsWith('```') && part.endsWith('```')) {
                  const code = part.slice(3, -3).trim();
                  return (
                    <Box
                      key={idx}
                      component="pre"
                      sx={{
                        backgroundColor: theme =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.05)',
                        color: theme => theme.palette.text.primary,
                        border: theme => `1px solid ${theme.palette.divider}`,
                        padding: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
                        my: 1,
                        lineHeight: 1.5,
                      }}
                    >
                      {code}
                    </Box>
                  );
                }
                // Inline code with single backticks
                if (part.startsWith('`') && part.endsWith('`')) {
                  const code = part.slice(1, -1);
                  return (
                    <Box
                      key={idx}
                      component="code"
                      sx={{
                        backgroundColor: theme =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.08)',
                        color: theme => theme.palette.text.primary,
                        padding: '2px 6px',
                        borderRadius: 0.5,
                        fontSize: '0.875em',
                        fontFamily: 'monospace',
                      }}
                    >
                      {code}
                    </Box>
                  );
                }
                // Regular text - render in Typography to maintain consistent styling
                return (
                  <Typography key={idx} variant="body1" component="span" sx={{ whiteSpace: 'pre-wrap' }}>
                    {part}
                  </Typography>
                );
              })}
            </Box>
          ) : (
            <Typography color="textSecondary">No description available</Typography>
          )}
        </SectionBox>

        {resourceType.capabilities && resourceType.capabilities.length > 0 && (
          <SectionBox title="Capabilities" sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {resourceType.capabilities.map((capability, idx) => (
                <Chip key={idx} label={capability} size="small" />
              ))}
            </Box>
          </SectionBox>
        )}
      </TabPanel>

      {/* Properties Tab */}
      <TabPanel value={activeTab} index={1}>
        {apiVersions.map(version => {
          const versionData = resourceType.apiVersions[version];
          const schema = versionData?.schema;
          const properties = schema?.properties || {};

          // Filter out readOnly properties for input properties
          const inputProperties = Object.fromEntries(
            Object.entries(properties).filter(([, propValue]: [string, any]) => !propValue.readOnly)
          );
          const requiredFields = schema?.required || [];

          return (
            <SectionBox key={version} title={`API Version: ${version}`} sx={{ mb: 3 }}>
              {renderPropertiesTable(inputProperties, requiredFields, 'Properties')}
            </SectionBox>
          );
        })}
        {apiVersions.length === 0 && (
          <Typography color="textSecondary">No API versions available</Typography>
        )}
      </TabPanel>

      {/* Output Properties Tab */}
      <TabPanel value={activeTab} index={2}>
        {apiVersions.map(version => {
          const versionData = resourceType.apiVersions[version];
          const schema = versionData?.schema;
          const properties = schema?.properties || {};

          // Filter only readOnly properties for output properties
          const outputProperties = Object.fromEntries(
            Object.entries(properties).filter(([, propValue]: [string, any]) => propValue.readOnly)
          );
          const requiredFields = schema?.required || [];

          return (
            <SectionBox key={version} title={`API Version: ${version}`} sx={{ mb: 3 }}>
              {renderPropertiesTable(outputProperties, requiredFields, 'Output Properties')}
            </SectionBox>
          );
        })}
        {apiVersions.length === 0 && (
          <Typography color="textSecondary">No API versions available</Typography>
        )}
      </TabPanel>

      {/* Details Tab */}
      <TabPanel value={activeTab} index={3}>
        <SectionBox title="Resource Type JSON">
          <Box
            component="pre"
            sx={{
              backgroundColor: theme =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.05)',
              color: theme => theme.palette.text.primary,
              border: theme => `1px solid ${theme.palette.divider}`,
              padding: 2,
              borderRadius: 1,
              overflow: 'auto',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              lineHeight: 1.5,
            }}
          >
            {JSON.stringify(resourceType, null, 2)}
          </Box>
        </SectionBox>
      </TabPanel>
    </SectionBox>
  );
}
