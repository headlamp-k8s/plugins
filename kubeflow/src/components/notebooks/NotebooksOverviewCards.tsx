import { Icon } from '@iconify/react';
import { Link as HeadlampLink } from '@kinvolk/headlamp-plugin/lib/components/common';
import {
  ActionButton,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import React from 'react';
import { NotebookClass } from '../../resources/notebook';
import { NotebookStatusBadge } from '../common/NotebookStatusBadge';
import { NotebookTypeBadge } from '../common/NotebookTypeBadge';
import { aggregateNotebookResources, getNotebookStatus } from '../common/notebookUtils';

interface NotebooksOverviewContentProps {
  notebooks: any[];
  profiles: any[];
  podDefaults: any[];
}

export function NotebooksOverviewContent({
  notebooks,
  profiles,
  podDefaults,
}: NotebooksOverviewContentProps) {
  // Normalize items natively (whether raw CRs from storybook or NotebookClasses from live api)
  const normalizedNotebooks = notebooks.map(nb => (nb.jsonData ? nb.jsonData : nb));

  const runningCount = normalizedNotebooks.filter(
    nb => getNotebookStatus(nb).label === 'Running'
  ).length;
  const pendingCount = normalizedNotebooks.filter(nb => {
    const { label, status } = getNotebookStatus(nb);
    return label === 'Pending' || label === 'Waiting' || (!status && label !== 'Running');
  }).length;
  const failedCount = normalizedNotebooks.filter(
    nb => getNotebookStatus(nb).status === 'error'
  ).length;

  const totalResources = aggregateNotebookResources(notebooks);

  const summaryCards = [
    {
      title: 'Notebook Servers',
      value: notebooks.length,
      icon: 'mdi:notebook-outline',
      subtitle: `${runningCount} running, ${pendingCount} pending${
        failedCount > 0 ? `, ${failedCount} failed` : ''
      }`,
    },
    {
      title: 'Profiles',
      value: profiles.length,
      icon: 'mdi:account-group',
      subtitle: `${profiles.length} tenant${profiles.length !== 1 ? 's' : ''} configured`,
    },
    {
      title: 'PodDefaults',
      value: podDefaults.length,
      icon: 'mdi:puzzle',
      subtitle: `${podDefaults.length} injection rule${podDefaults.length !== 1 ? 's' : ''}`,
    },
    {
      title: 'Total CPU Requested',
      value: `${totalResources.cpu.toFixed(1)}`,
      icon: 'mdi:cpu-64-bit',
      subtitle: `${totalResources.memory.toFixed(1)} Gi memory, ${totalResources.gpu} GPUs`,
    },
  ];

  return (
    <Box sx={{ padding: '24px 16px', pt: '32px' }}>
      <Typography variant="h1" sx={{ fontSize: '1.87rem', fontWeight: 700, mb: 1 }}>
        Notebooks Dashboard
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic', mb: 4 }}>
        Notebook servers, profiles, and PodDefaults overview
      </Typography>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        {summaryCards.map(card => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card variant="outlined" sx={{ borderRadius: '4px' }}>
              <CardContent
                sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'text.primary' }}>
                  <Icon icon={card.icon} width="28" height="28" style={{ marginRight: '8px' }} />
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}
                  >
                    {card.title}
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, fontSize: '2.5rem' }}>
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

      {notebooks.length > 0 && (
        <SectionBox
          title={
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Typography variant="h5">Recent Notebook Servers</Typography>
              <ActionButton
                description="View All Notebooks"
                icon="mdi:arrow-right"
                onClick={() => {
                  window.location.href = '/kubeflow/notebooks/servers';
                }}
              />
            </Box>
          }
        >
          <SimpleTable
            columns={[
              {
                label: 'Name',
                getter: (item: any) => {
                  const data = item.jsonData || item;
                  return (
                    <HeadlampLink
                      route={NotebookClass.detailsRoute}
                      params={{
                        namespace: data.metadata?.namespace || '',
                        name: data.metadata?.name || '',
                      }}
                    >
                      {data.metadata?.name || '-'}
                    </HeadlampLink>
                  );
                },
              },
              {
                label: 'Namespace',
                getter: (item: any) => {
                  const data = item.jsonData || item;
                  return data.metadata?.namespace || '-';
                },
              },
              {
                label: 'Type',
                getter: (item: any) => {
                  const data = item.jsonData || item;
                  const containers = data.spec?.template?.spec?.containers || [];
                  return <NotebookTypeBadge image={containers[0]?.image} />;
                },
              },
              {
                label: 'Status',
                getter: (item: any) => {
                  const data = item.jsonData || item;
                  return <NotebookStatusBadge jsonData={data} />;
                },
              },
            ]}
            data={notebooks.slice(0, 5)}
            emptyMessage="No notebook servers found."
          />
        </SectionBox>
      )}
    </Box>
  );
}
