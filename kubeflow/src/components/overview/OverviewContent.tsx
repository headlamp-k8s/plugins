import { Icon } from '@iconify/react';
import { SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { getStatus } from './overviewStatus';

/**
 * Module snapshot data rendered by the Kubeflow overview cards and workload tables.
 */
export type OverviewModule = {
  /** User-facing module name shown in the summary card header. */
  title: string;
  /** Stable workload type label used in the overview tables. */
  key: string;
  /** Iconify icon name rendered in the module summary card. */
  icon: string;
  /** Resources discovered for the module, or `null` while the list is unresolved. */
  items?: any[] | null;
  /** Whether the module's API was detected on the connected cluster. */
  isInstalled: boolean;
  /** Optional error text (e.g. 'Not authorized') to display when data cannot be fetched. */
  errorText?: string | null;
};

/**
 * Props for the presentational Kubeflow overview content.
 */
export interface OverviewContentProps {
  /** Per-module snapshots used to render the cards and workload tables. */
  modules: OverviewModule[];
  /** Optional extra cards for cross-module metrics such as notebook CPU requests. */
  extraCards?: Array<{
    title: string;
    value: string | number;
    icon: string;
    subtitle: string;
  }>;
}

export function OverviewContent({ modules, extraCards = [] }: OverviewContentProps) {
  const anyInstalled = modules.some(m => m.isInstalled);

  const allWorkloads = modules.flatMap(m =>
    (m.items || []).map((res: any) => ({ moduleKey: m.key, resource: res.jsonData ?? res }))
  );

  const activeWorkloads = allWorkloads.filter(w => {
    const s = getStatus(w.resource);
    return (
      s === 'Running' ||
      s === 'Created' ||
      s === 'Succeeded' ||
      s === 'Ready' ||
      s === 'Available' ||
      s === 'Completed'
    );
  });

  const failedWorkloads = allWorkloads.filter(w => {
    const s = getStatus(w.resource);
    return s === 'Failed' || s === 'Error';
  });

  return (
    <Box sx={{ padding: '24px 16px', pt: '32px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h1" sx={{ fontSize: '1.87rem', fontWeight: 700, mb: 1 }}>
            Kubeflow Control Center
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            Platform workload detection and unified observability
          </Typography>
        </Box>
      </Box>

      {!anyInstalled && (
        <Alert severity="warning" sx={{ mb: 4, borderRadius: '4px' }}>
          No Kubeflow components (CRDs) were detected on this cluster. Please ensure you have
          installed your preferred ML components using the official manifests.
        </Alert>
      )}

      {/* Snapshot Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {modules.map(module => {
          if (!module.isInstalled) return null;

          return (
            <Grid item xs={12} sm={6} md={3} key={module.key}>
              <Card variant="outlined" sx={{ borderRadius: '4px' }}>
                <CardContent
                  sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'primary.main' }}>
                    <Icon
                      icon={module.icon}
                      width="28"
                      height="28"
                      style={{ marginRight: '8px' }}
                      aria-hidden
                    />
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}
                    >
                      {module.title}
                    </Typography>
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      fontSize: module.errorText ? '2rem' : '2.5rem',
                      textAlign: 'center',
                      lineHeight: 1.2,
                    }}
                  >
                    {module.errorText ?? module.items?.length ?? 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {module.errorText ? `${module.title} data unavailable` : 'Total Instances'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
        {extraCards.map(card => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card variant="outlined" sx={{ borderRadius: '4px' }}>
              <CardContent
                sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'primary.main' }}>
                  <Icon
                    icon={card.icon}
                    width="28"
                    height="28"
                    style={{ marginRight: '8px' }}
                    aria-hidden
                  />
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}
                  >
                    {card.title}
                  </Typography>
                </Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    fontSize: '2rem',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  {card.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Unified Table for Workloads */}
      <Box sx={{ mb: 6 }}>
        {allWorkloads.length === 0 ? (
          anyInstalled ? (
            <Alert severity="info" variant="outlined">
              The platform is installed but no ML workloads are currently running. Head over to the
              sidebar to launch Notebooks or Pipelines!
            </Alert>
          ) : null
        ) : (
          <Grid container spacing={3}>
            {/* Active Instances Box */}
            <Grid item xs={12} lg={failedWorkloads.length > 0 ? 6 : 12}>
              <SectionBox title="Healthy / Active Workloads">
                <SimpleTable
                  columns={[
                    { label: 'Type', getter: (item: any) => item.moduleKey },
                    { label: 'Name', getter: (item: any) => item.resource.metadata?.name || '-' },
                    {
                      label: 'Namespace',
                      getter: (item: any) => item.resource.metadata?.namespace || '-',
                    },
                    {
                      label: 'Status',
                      getter: (item: any) => getStatus(item.resource),
                    },
                  ]}
                  data={activeWorkloads}
                  emptyMessage="No healthy or active workloads running right now."
                />
              </SectionBox>
            </Grid>

            {/* Failed Instances Box (Only rendered if failures exist) */}
            {failedWorkloads.length > 0 && (
              <Grid item xs={12} lg={6}>
                <SectionBox title="Failed Workloads (Requires Attention)">
                  <SimpleTable
                    columns={[
                      { label: 'Type', getter: (item: any) => item.moduleKey },
                      {
                        label: 'Name',
                        getter: (item: any) => (
                          <Typography
                            component="span"
                            sx={{ color: 'error.main', fontWeight: 'bold' }}
                          >
                            {item.resource.metadata?.name || '-'}
                          </Typography>
                        ),
                      },
                      {
                        label: 'Namespace',
                        getter: (item: any) => item.resource.metadata?.namespace || '-',
                      },
                      {
                        label: 'Status',
                        getter: (item: any) => getStatus(item.resource),
                      },
                    ]}
                    data={failedWorkloads}
                    emptyMessage="No failed workloads found."
                  />
                </SectionBox>
              </Grid>
            )}
          </Grid>
        )}
      </Box>
    </Box>
  );
}
