import { Icon } from '@iconify/react';
import { SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useApiGroupInstalled } from '../../hooks/useKubeflowCheck';
import { NotebookClass } from '../../resources/notebook';
import { PodDefaultClass } from '../../resources/podDefault';
import { ProfileClass } from '../../resources/profile';
import { NotebookStatusBadge } from '../common/NotebookStatusBadge';
import { NotebookTypeBadge } from '../common/NotebookTypeBadge';
import {
  aggregateNotebookResources,
  describeResourceError,
  getNotebookStatus,
} from '../common/notebookUtils';

function NotebooksOverviewPageContent() {
  const [notebooks, notebooksError] = NotebookClass.useList();
  const [profiles, profilesError] = ProfileClass.useList();
  const [podDefaults, podDefaultsError] = PodDefaultClass.useList();

  const isLoading =
    (notebooks === null && !notebooksError) ||
    (profiles === null && !profilesError) ||
    (podDefaults === null && !podDefaultsError);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Notebooks Dashboard...</Typography>
      </Box>
    );
  }

  const notebooksList = notebooks || [];
  const profilesList = profiles || [];
  const podDefaultsList = podDefaults || [];

  const runningCount = notebooksList.filter(nb => {
    const { label } = getNotebookStatus(nb?.jsonData);
    return label === 'Running';
  }).length;

  const pendingCount = notebooksList.filter(nb => {
    const { label, status } = getNotebookStatus(nb?.jsonData);
    return label === 'Pending' || label === 'Waiting' || (!status && label !== 'Running');
  }).length;

  const failedCount = notebooksList.filter(nb => {
    const { status } = getNotebookStatus(nb?.jsonData);
    return status === 'error';
  }).length;

  // Aggregate resource requests across all notebooks
  const totalResources = aggregateNotebookResources(notebooksList);

  const notebookAvailability = describeResourceError(notebooksError);
  const profileAvailability = describeResourceError(profilesError);
  const podDefaultsAvailability = describeResourceError(podDefaultsError);
  const hasListErrors = Boolean(
    notebookAvailability || profileAvailability || podDefaultsAvailability
  );

  // Get unique namespaces
  const namespaces = [
    ...new Set(
      notebooksList
        .map((nb: any) => nb?.jsonData?.metadata?.namespace)
        .filter((ns): ns is string => !!ns)
    ),
  ];
  const namespaceRows = namespaces.map(namespace => ({ namespace }));

  // Get unique images
  const images = [
    ...new Set(
      notebooksList
        .map((nb: any) => {
          const containers = nb?.jsonData?.spec?.template?.spec?.containers || [];
          return containers[0]?.image;
        })
        .filter((image): image is string => !!image)
    ),
  ];
  const imageRows = images.map(image => ({ image }));

  const summaryCards = [
    {
      title: 'Notebook Servers',
      value: notebookAvailability ?? notebooksList.length,
      icon: 'mdi:notebook-outline',
      subtitle: notebookAvailability
        ? 'Notebook data unavailable'
        : `${runningCount} running, ${pendingCount} pending${
            failedCount > 0 ? `, ${failedCount} failed` : ''
          }`,
      color: '', // Default Headlamp color is derived from theme by leaving empty or using specific palette
    },
    {
      title: 'Profiles',
      value: profileAvailability ?? profilesList.length,
      icon: 'mdi:account-group',
      subtitle: profileAvailability
        ? 'Profiles data unavailable'
        : `${profilesList.length} tenant${profilesList.length !== 1 ? 's' : ''} configured`,
      color: '',
    },
    {
      title: 'PodDefaults',
      value: podDefaultsAvailability ?? podDefaultsList.length,
      icon: 'mdi:puzzle',
      subtitle: podDefaultsAvailability
        ? 'PodDefaults data unavailable'
        : `${podDefaultsList.length} injection rule${podDefaultsList.length !== 1 ? 's' : ''}`,
      color: '',
    },
    {
      title: 'Total CPU Requested',
      value: notebookAvailability ?? `${totalResources.cpu.toFixed(1)}`,
      icon: 'mdi:cpu-64-bit',
      subtitle: notebookAvailability
        ? 'Notebook resource totals unavailable'
        : `${totalResources.memory.toFixed(1)} Gi memory, ${totalResources.gpu} GPUs`,
      color: '',
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

      {hasListErrors && (
        <Alert severity="warning" sx={{ mb: 4, borderRadius: '4px' }}>
          Some Kubeflow resources could not be listed. Cards marked as Not installed, Not
          authorized, or Unavailable reflect the current access state.
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {summaryCards.map(card => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card variant="outlined" sx={{ borderRadius: '4px' }}>
              <CardContent
                sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 1,
                    color: card.color,
                  }}
                >
                  <Icon
                    icon={card.icon}
                    width="28"
                    height="28"
                    style={{ marginRight: '8px' }}
                    aria-hidden="true"
                  />
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

      {notebookAvailability ? (
        <Alert severity="info" variant="outlined" sx={{ mb: 4 }}>
          Notebook data is {notebookAvailability.toLowerCase()} so the notebook table, namespace
          distribution, and image breakdown are hidden.
        </Alert>
      ) : (
        <>
          {/* Recent Notebooks Table */}
          {notebooksList.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <SectionBox title="All Notebook Servers">
                <SimpleTable
                  columns={[
                    {
                      label: 'Name',
                      getter: (item: any) => item?.jsonData?.metadata?.name || '-',
                    },
                    {
                      label: 'Namespace',
                      getter: (item: any) => item?.jsonData?.metadata?.namespace || '-',
                    },
                    {
                      label: 'Type',
                      getter: (item: any) => {
                        const containers = item?.jsonData?.spec?.template?.spec?.containers || [];
                        const image = containers[0]?.image || '-';
                        return <NotebookTypeBadge image={image} />;
                      },
                    },
                    {
                      label: 'Image',
                      getter: (item: any) => {
                        const containers = item?.jsonData?.spec?.template?.spec?.containers || [];
                        const image = containers[0]?.image || '-';
                        const parts = image.split('/');
                        const shortImage = parts[parts.length - 1];
                        return (
                          <Box display="inline">
                            <Typography
                              component="span"
                              sx={{ fontFamily: 'monospace', fontSize: '0.85em' }}
                            >
                              {shortImage}
                            </Typography>
                          </Box>
                        );
                      },
                    },
                    {
                      label: 'Status',
                      getter: (item: any) => <NotebookStatusBadge jsonData={item?.jsonData} />,
                    },
                  ]}
                  data={notebooksList}
                  emptyMessage="No notebook servers found."
                />
              </SectionBox>
            </Box>
          )}

          {/* Namespace Distribution */}
          {namespaceRows.length > 0 &&
            (() => {
              const { countsByNamespace, countsByImage } = notebooksList.reduce(
                (
                  acc: {
                    countsByNamespace: Record<string, number>;
                    countsByImage: Record<string, number>;
                  },
                  nb: any
                ) => {
                  const namespace = nb?.jsonData?.metadata?.namespace;
                  if (namespace) {
                    acc.countsByNamespace[namespace] = (acc.countsByNamespace[namespace] || 0) + 1;
                  }
                  const containers = nb?.jsonData?.spec?.template?.spec?.containers || [];
                  const image = containers[0]?.image;
                  if (image) {
                    acc.countsByImage[image] = (acc.countsByImage[image] || 0) + 1;
                  }
                  return acc;
                },
                {
                  countsByNamespace: {},
                  countsByImage: {},
                }
              );
              return (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <SectionBox title="Notebooks by Namespace">
                      <SimpleTable
                        columns={[
                          {
                            label: 'Namespace',
                            getter: (row: { namespace: string }) => row.namespace,
                          },
                          {
                            label: 'Count',
                            getter: (row: { namespace: string }) =>
                              countsByNamespace[row.namespace] ?? 0,
                          },
                        ]}
                        data={namespaceRows}
                        emptyMessage="No namespaces found."
                      />
                    </SectionBox>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <SectionBox title="Images in Use">
                      <SimpleTable
                        columns={[
                          {
                            label: 'Image',
                            getter: (row: { image: string }) => {
                              const parts = row.image.split('/');
                              return parts[parts.length - 1];
                            },
                          },
                          {
                            label: 'Used By',
                            getter: (row: { image: string }) => countsByImage[row.image] ?? 0,
                          },
                        ]}
                        data={imageRows}
                        emptyMessage="No images found."
                      />
                    </SectionBox>
                  </Grid>
                </Grid>
              );
            })()}
        </>
      )}
    </Box>
  );
}

export function NotebooksOverview() {
  const { isInstalled: notebooksApiInstalledHook, isCheckLoading: notebooksApiLoadingHook } =
    useApiGroupInstalled('/apis/kubeflow.org/v1');

  const isStorybook =
    typeof window !== 'undefined' && (window as any).HEADLAMP_KUBEFLOW_STORYBOOK_MOCK;
  const notebooksApiInstalled = isStorybook ? true : notebooksApiInstalledHook;
  const notebooksApiLoading = isStorybook ? false : notebooksApiLoadingHook;

  const isLoading = notebooksApiLoading;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Checking cluster capabilities for Notebooks...</Typography>
      </Box>
    );
  }

  if (!notebooksApiInstalled) {
    return (
      <Box sx={{ padding: '24px 16px', pt: '32px' }}>
        <Typography variant="h1" sx={{ fontSize: '1.87rem', fontWeight: 700, mb: 1 }}>
          Notebooks Dashboard
        </Typography>
        <Alert severity="warning" sx={{ mt: 2, borderRadius: '4px' }}>
          Required Kubeflow Notebooks API group is not detected on this cluster.
        </Alert>
      </Box>
    );
  }

  return <NotebooksOverviewPageContent />;
}
