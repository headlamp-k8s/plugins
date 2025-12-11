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
import { CircularProgress, Typography } from '@mui/material';
import { RadiusStatusLabel } from '../components/RadiusStatusLabel';
import { useRadiusApplications } from '../models/radius';

interface ApplicationTableData {
  name: string;
  namespace: string;
  environment: string;
  provisioningState: string;
  created: string;
}

/**
 * Applications component displays a list of all Radius applications
 */
export default function Applications() {
  const [applications, error, loading] = useRadiusApplications();

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
      <SectionBox>
        <Typography color="error" variant="h6">
          Error loading applications
        </Typography>
        <Typography color="error">{error.message}</Typography>
      </SectionBox>
    );
  }

  const tableData: ApplicationTableData[] = (applications || []).map(app => {
    const namespace = app.properties.status?.compute?.namespace || 'N/A';
    const environment = app.properties.environment?.split('/').pop() || 'N/A';
    const provisioningState = app.properties.provisioningState || 'Unknown';
    const created = app.systemData?.createdAt
      ? new Date(app.systemData.createdAt).toLocaleDateString()
      : 'N/A';

    return {
      name: app.name,
      namespace,
      environment,
      provisioningState,
      created,
    };
  });

  return (
    <SectionBox title={`Applications (${tableData.length})`}>
      <Table
        data={tableData}
        columns={[
          {
            header: 'Name',
            accessorKey: 'name',
            gridTemplate: 'auto',
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
            header: 'Namespace',
            accessorKey: 'namespace',
          },
          {
            header: 'Environment',
            accessorKey: 'environment',
            Cell: ({ row }: any) => {
              const environmentName = row.original.environment;
              return (
                <Link routeName="environment-detail" params={{ environmentName: environmentName }}>
                  {environmentName}
                </Link>
              );
            },
          },
          {
            header: 'Provisioning State',
            accessorKey: 'provisioningState',
            accessorFn: item => {
              return <RadiusStatusLabel status={item.provisioningState} />;
            },
          },
          {
            header: 'Created',
            accessorKey: 'created',
          },
        ]}
      />
    </SectionBox>
  );
}
