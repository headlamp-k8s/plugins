import { Icon } from '@iconify/react';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  HoverInfoLabel,
  Link as HeadlampLink,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import cronstrue from 'cronstrue/i18n';
import React from 'react';
import {
  ScheduledSparkApplicationClass,
  SparkApplicationClass,
} from '../../resources/sparkApplication';
import { describeResourceError } from '../common/notebookUtils';
import { ScheduledSparkApplicationStatusBadge } from '../common/ScheduledSparkApplicationStatusBadge';
import { SectionPage } from '../common/SectionPage';
import { SparkApplicationStatusBadge } from '../common/SparkApplicationStatusBadge';
import { SparkApplicationTypeBadge } from '../common/SparkApplicationTypeBadge';
import { aggregateSparkResources, getSparkApplicationStatus } from '../common/sparkUtils';

/**
 * Main content of the Spark Overview page.
 * Displays summary cards, recent applications, and scheduled jobs.
 */
function SparkOverviewPageContent() {
  const { i18n } = useTranslation();
  const [sparkApplications, sparkApplicationsError] = SparkApplicationClass.useList();
  const [scheduledSparkApplications, scheduledSparkApplicationsError] =
    ScheduledSparkApplicationClass.useList();

  const isLoading =
    (sparkApplications === null && !sparkApplicationsError) ||
    (scheduledSparkApplications === null && !scheduledSparkApplicationsError);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Spark Dashboard...</Typography>
      </Box>
    );
  }

  const applications = sparkApplications ?? [];
  const schedules = scheduledSparkApplications ?? [];
  const runningCount = applications.filter(
    application => getSparkApplicationStatus(application).label === 'Running'
  ).length;
  const failedCount = applications.filter(
    application => getSparkApplicationStatus(application).status === 'error'
  ).length;
  const completedCount = applications.filter(
    application => getSparkApplicationStatus(application).label === 'Completed'
  ).length;
  const suspendedScheduleCount = schedules.filter(schedule => schedule.suspend).length;

  // Aggregate resource requests across all spark apps
  const totalResources = aggregateSparkResources(applications);

  const listErrors = [
    describeResourceError(sparkApplicationsError),
    describeResourceError(scheduledSparkApplicationsError),
  ].filter(Boolean);

  // Get unique namespaces
  const namespaces = [...new Set(applications.map(app => app.metadata.namespace).filter(Boolean))];
  const namespaceRows = namespaces.map(namespace => ({ namespace }));

  const summaryCards = [
    {
      title: 'Spark Applications',
      value: sparkApplicationsError ? '-' : applications.length,
      icon: 'mdi:flash',
      subtitle: sparkApplicationsError
        ? describeResourceError(sparkApplicationsError)
        : `${runningCount} running, ${completedCount} completed${
            failedCount > 0 ? `, ${failedCount} failed` : ''
          }`,
    },
    {
      title: 'Scheduled Jobs',
      value: scheduledSparkApplicationsError ? '-' : schedules.length,
      icon: 'mdi:calendar-clock',
      subtitle: scheduledSparkApplicationsError
        ? describeResourceError(scheduledSparkApplicationsError)
        : `${suspendedScheduleCount} suspended`,
    },
    {
      title: 'Total CPU Requested',
      value: sparkApplicationsError ? '-' : `${totalResources.cpu.toFixed(1)}`,
      icon: 'mdi:cpu-64-bit',
      subtitle: sparkApplicationsError
        ? describeResourceError(sparkApplicationsError)
        : `${totalResources.memory.toFixed(1)} Gi memory, ${totalResources.gpu} GPUs`,
    },
  ];

  return (
    <Box sx={{ padding: '24px 16px', pt: '32px' }}>
      <Typography variant="h1" sx={{ fontSize: '1.87rem', fontWeight: 700, mb: 1 }}>
        Spark Dashboard
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic', mb: 4 }}>
        Health, schedules, and resource usage across namespaces
      </Typography>

      {listErrors.length > 0 && (
        <Alert severity="warning" sx={{ mb: 4, borderRadius: '4px' }}>
          Some Spark resources could not be listed. Cards and tables may be incomplete for the
          current cluster or access level.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 6 }}>
        {summaryCards.map(card => (
          <Grid item xs={12} sm={6} md={4} key={card.title}>
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

      {applications.length > 0 && !sparkApplicationsError && (
        <Box sx={{ mb: 4 }}>
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
                <Typography variant="h5">Recent Spark Applications</Typography>
                <HeadlampLink
                  routeName="kubeflow-spark-applications-list"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: '0.875rem',
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  View All <Icon icon="mdi:arrow-right" />
                </HeadlampLink>
              </Box>
            }
          >
            <SimpleTable
              data={applications.slice(0, 5)}
              columns={[
                { label: 'Name', getter: item => item.metadata.name },
                { label: 'Namespace', getter: item => item.metadata.namespace },
                {
                  label: 'Type',
                  getter: item => <SparkApplicationTypeBadge type={item.applicationType} />,
                },
                {
                  label: 'Status',
                  getter: item => <SparkApplicationStatusBadge sparkApplication={item} />,
                },
              ]}
              emptyMessage="No Spark applications found."
            />
          </SectionBox>
        </Box>
      )}

      <Grid container spacing={3}>
        {schedules.length > 0 && !scheduledSparkApplicationsError && (
          <Grid item xs={12} md={namespaceRows.length > 0 ? 8 : 12}>
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
                  <Typography variant="h5">Scheduled Spark Applications</Typography>
                  <HeadlampLink
                    routeName="kubeflow-spark-scheduled-list"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: '0.875rem',
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    View All <Icon icon="mdi:arrow-right" />
                  </HeadlampLink>
                </Box>
              }
            >
              <SimpleTable
                data={schedules.slice(0, 5)}
                columns={[
                  { label: 'Name', getter: item => item.metadata.name },
                  {
                    label: 'Schedule',
                    getter: item => {
                      const schedule = item.schedule;
                      if (!schedule) return '-';
                      let described = '';
                      try {
                        described = cronstrue.toString(schedule, { locale: i18n.language });
                      } catch (e) {
                        console.debug(`Could not describe cron "${schedule}":`, e);
                      }
                      return <HoverInfoLabel label={schedule} hoverInfo={described} />;
                    },
                  },
                  {
                    label: 'Status',
                    getter: item => (
                      <ScheduledSparkApplicationStatusBadge scheduledSparkApplication={item} />
                    ),
                  },
                ]}
                emptyMessage="No scheduled Spark applications found."
              />
            </SectionBox>
          </Grid>
        )}

        {namespaceRows.length > 0 && !sparkApplicationsError && (
          <Grid item xs={12} md={schedules.length > 0 ? 4 : 12}>
            <SectionBox title="Applications by Namespace">
              <SimpleTable
                columns={[
                  {
                    label: 'Namespace',
                    getter: (row: { namespace: string }) => row.namespace,
                  },
                  {
                    label: 'Count',
                    getter: (row: { namespace: string }) =>
                      applications.filter(app => app.metadata.namespace === row.namespace).length,
                  },
                ]}
                data={namespaceRows}
                emptyMessage="No namespaces found."
              />
            </SectionBox>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

/**
 * Root component for the Spark Overview page.
 * Wraps the dashboard content with capability checks via SectionPage.
 */
export function SparkOverview() {
  return (
    <SectionPage title="Spark Overview" apiPath="/apis/sparkoperator.k8s.io/v1beta2">
      <SparkOverviewPageContent />
    </SectionPage>
  );
}
