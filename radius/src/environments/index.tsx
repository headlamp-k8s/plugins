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
import { useRadiusEnvironments } from '../models/radius';

interface EnvironmentTableData {
  name: string;
  namespace: string;
  provisioningState: string;
  compute: string;
  recipesCount: number;
}

interface TableRowProps {
  row: {
    original: EnvironmentTableData;
  };
}

/**
 * Environments component displays a list of all Radius environments
 */
export default function Environments() {
  const [environments, error, loading] = useRadiusEnvironments();

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
          Error loading environments
        </Typography>
        <Typography color="error">{error.message}</Typography>
      </SectionBox>
    );
  }

  // Transform environments for table display
  const tableData: EnvironmentTableData[] = (environments || []).map(env => {
    const compute = env.properties.compute?.kind || 'N/A';
    const namespace = env.properties.compute?.namespace || 'N/A';
    const recipesCount = Object.keys(env.properties.recipes || {}).length;
    const provisioningState = 'provisioningState' in env.properties 
      ? (env.properties as { provisioningState?: string }).provisioningState || 'Unknown'
      : 'Unknown';

    return {
      name: env.name,
      namespace,
      provisioningState,
      compute,
      recipesCount,
    };
  });

  return (
    <SectionBox title={`Environments (${tableData.length})`}>
      <Table
        data={tableData}
        columns={[
          {
            header: 'Name',
            accessorKey: 'name',
            gridTemplate: 'auto',
            Cell: ({ row }: TableRowProps) => {
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
            header: 'Kind',
            accessorKey: 'compute',
          },
          {
            header: 'Provisioning State',
            accessorKey: 'provisioningState',
            accessorFn: item => {
              return <RadiusStatusLabel status={item.provisioningState} />;
            },
          },
          {
            header: 'Recipes',
            accessorKey: 'recipesCount',
          },
        ]}
      />
    </SectionBox>
  );
}
