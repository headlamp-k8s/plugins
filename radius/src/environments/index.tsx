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
    const provisioningState = (env.properties as any).provisioningState || 'Unknown';

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
