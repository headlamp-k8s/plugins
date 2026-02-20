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
import React from 'react';
import { UCPResourceType, useRadiusResourceTypes } from '../models/radius';

/**
 * ResourceTypes component displays all available Radius resource types
 * from the UCP API for all known resource providers
 */
export default function ResourceTypes() {
  const [resourceTypes, error, loading] = useRadiusResourceTypes();

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
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          Error loading Resource Types
        </Typography>
        <Typography color="error">{error.message}</Typography>
      </Box>
    );
  }

  return (
    <SectionBox title="Resource Types">
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Available Radius resource types from all providers
      </Typography>
      <Table
        data={resourceTypes || []}
        columns={[
          {
            header: 'Type',
            accessorKey: 'name',
            Cell: ({ row }: any) => {
              const rt: UCPResourceType = row.original;
              return (
                <Link
                  routeName="resource-type-detail"
                  params={{
                    resourceTypeName: encodeURIComponent(`${rt.resourceProvider}/${rt.name}`),
                  }}
                >
                  {rt.name}
                </Link>
              );
            },
          },
          {
            header: 'Resource Provider',
            accessorKey: 'resourceProvider',
          },
          {
            header: 'API Versions',
            accessorKey: 'apiVersions',
            Cell: ({ row }: any) => {
              const rt: UCPResourceType = row.original;
              const versions = Object.keys(rt.apiVersions || {});
              return versions.join(', ') || 'N/A';
            },
          },
        ]}
      />
    </SectionBox>
  );
}