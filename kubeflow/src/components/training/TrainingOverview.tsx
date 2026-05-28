import { Icon } from '@iconify/react';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  ActionButton,
  DateLabel,
  Link as HeadlampLink,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useCluster } from '@kinvolk/headlamp-plugin/lib/k8s';
import { Alert, Box, Card, CardContent, CircularProgress, Grid, Typography } from '@mui/material';
import { useHistory } from 'react-router-dom';
import { ClusterTrainingRuntimeClass, TrainingRuntimeClass } from '../../resources/trainingRuntime';
import { TrainJobClass } from '../../resources/trainJob';
import { describeResourceError } from '../common/notebookUtils';
import { SectionPage } from '../common/SectionPage';
import {
  formatRuntimeRef,
  getRuntimeFamily,
  getSchedulingSummary,
  summarizeJobsStatus,
} from './trainerUtils';
import { TrainJobStatusBadge } from './TrainJobStatusBadge';

/**
 * Renders the Training overview dashboard for TrainJobs and runtime coverage.
 */
export function TrainingOverview() {
  const { t } = useTranslation();
  const history = useHistory();
  const cluster = useCluster();
  const [trainJobs, trainJobsError] = TrainJobClass.useList();
  const [trainingRuntimes, trainingRuntimesError] = TrainingRuntimeClass.useList();
  const [clusterTrainingRuntimes, clusterTrainingRuntimesError] =
    ClusterTrainingRuntimeClass.useList();

  const isLoading =
    (trainJobs === null && !trainJobsError) ||
    (trainingRuntimes === null && !trainingRuntimesError) ||
    (clusterTrainingRuntimes === null && !clusterTrainingRuntimesError);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>{t('Loading Training Dashboard...')}</Typography>
      </Box>
    );
  }

  const jobs = trainJobs ?? [];
  const runtimes = trainingRuntimes ?? [];
  const clusterRuntimes = clusterTrainingRuntimes ?? [];

  const runningJobs = jobs.filter(
    job => !job.suspended && job.phase !== 'Succeeded' && job.phase !== 'Failed'
  );
  const suspendedJobs = jobs.filter(job => job.suspended);
  const failedJobs = jobs.filter(job => job.phase === 'Failed');

  const recentJobs = [...jobs]
    .sort(
      (a, b) =>
        Date.parse(b.metadata.creationTimestamp || '0') -
        Date.parse(a.metadata.creationTimestamp || '0')
    )
    .slice(0, 8);

  const allRuntimes = [...runtimes, ...clusterRuntimes];

  const trainJobsAvailability = describeResourceError(trainJobsError);
  const runtimesAvailability = describeResourceError(trainingRuntimesError);
  const clusterRuntimesAvailability = describeResourceError(clusterTrainingRuntimesError);
  const hasListErrors = Boolean(
    trainJobsAvailability || runtimesAvailability || clusterRuntimesAvailability
  );

  const summaryCards = [
    {
      title: t('TrainJobs'),
      value: trainJobsAvailability ?? jobs.length,
      icon: 'mdi:school',
      subtitle: trainJobsAvailability
        ? t('TrainJob data unavailable')
        : t('{{running}} running, {{failed}} failed', {
            running: runningJobs.length,
            failed: failedJobs.length,
          }),
    },
    {
      title: t('Suspended'),
      value: trainJobsAvailability ?? suspendedJobs.length,
      icon: 'mdi:pause-circle-outline',
      subtitle: trainJobsAvailability
        ? t('TrainJob data unavailable')
        : t('Paused jobs awaiting resume'),
    },
    {
      title: t('Namespace Runtimes'),
      value: runtimesAvailability ?? runtimes.length,
      icon: 'mdi:application-brackets',
      subtitle: runtimesAvailability
        ? t('Runtime data unavailable')
        : t('Namespace-scoped configurations'),
    },
    {
      title: t('Cluster Runtimes'),
      value: clusterRuntimesAvailability ?? clusterRuntimes.length,
      icon: 'mdi:application-braces',
      subtitle: clusterRuntimesAvailability
        ? t('Runtime data unavailable')
        : t('Cluster-wide configurations'),
    },
  ];

  return (
    <SectionPage
      title={t('Training Dashboard')}
      apiPath="/apis/trainer.kubeflow.org/v1alpha1/trainjobs"
    >
      <Box sx={{ padding: '24px 16px', pt: '32px' }}>
        <Typography variant="h1" sx={{ fontSize: '1.87rem', fontWeight: 700, mb: 1 }}>
          {t('Training Dashboard')}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic', mb: 4 }}>
          {t('TrainJobs and runtime coverage overview')}
        </Typography>

        {hasListErrors && (
          <Alert severity="warning" sx={{ mb: 4, borderRadius: '4px' }}>
            {t(
              'Some Training resources could not be listed. Cards marked as Not installed, Not authorized, or Unavailable reflect the current access state.'
            )}
          </Alert>
        )}

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

        <Grid container spacing={3}>
          {!trainJobsAvailability && jobs.length > 0 && (
            <Grid item xs={12} lg={7}>
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
                    <Typography variant="h5">{t('Recent TrainJobs')}</Typography>
                    <ActionButton
                      description={t('View All TrainJobs')}
                      icon="mdi:arrow-right"
                      onClick={() => {
                        history.push(
                          cluster
                            ? `/c/${cluster}/kubeflow/training/trainjobs`
                            : '/kubeflow/training/trainjobs'
                        );
                      }}
                    />
                  </Box>
                }
              >
                <SimpleTable
                  data={recentJobs}
                  columns={[
                    {
                      label: t('Name'),
                      getter: (job: TrainJobClass) => (
                        <HeadlampLink
                          routeName="kubeflow-training-trainjobs-detail"
                          params={{ namespace: job.metadata.namespace, name: job.metadata.name }}
                        >
                          {job.metadata.name}
                        </HeadlampLink>
                      ),
                    },
                    {
                      label: t('Namespace'),
                      getter: (job: TrainJobClass) => job.metadata.namespace || '-',
                    },
                    {
                      label: t('Runtime'),
                      getter: (job: TrainJobClass) => formatRuntimeRef(job, t),
                    },
                    {
                      label: t('Status'),
                      getter: (job: TrainJobClass) => <TrainJobStatusBadge job={job} />,
                    },
                    {
                      label: t('Jobs'),
                      getter: (job: TrainJobClass) => summarizeJobsStatus(job, t),
                    },
                    {
                      label: t('Created'),
                      getter: (job: TrainJobClass) => <DateLabel date={job.getCreationTs()} />,
                    },
                  ]}
                  emptyMessage={t('No TrainJobs found.')}
                />
              </SectionBox>
            </Grid>
          )}

          {!runtimesAvailability && !clusterRuntimesAvailability && allRuntimes.length > 0 && (
            <Grid item xs={12} lg={5}>
              <SectionBox title={t('Runtime Coverage')}>
                <SimpleTable
                  data={allRuntimes}
                  columns={[
                    {
                      label: t('Name'),
                      getter: runtime => (
                        <HeadlampLink
                          routeName={
                            runtime instanceof TrainingRuntimeClass
                              ? 'kubeflow-training-runtimes-detail'
                              : 'kubeflow-training-clusterruntimes-detail'
                          }
                          params={
                            runtime instanceof TrainingRuntimeClass
                              ? {
                                  namespace: runtime.metadata.namespace,
                                  name: runtime.metadata.name,
                                }
                              : { name: runtime.metadata.name }
                          }
                        >
                          {runtime.metadata.name}
                        </HeadlampLink>
                      ),
                    },
                    {
                      label: t('Scope'),
                      getter: runtime =>
                        runtime instanceof TrainingRuntimeClass ? t('Namespace') : t('Cluster'),
                    },
                    {
                      label: t('Framework'),
                      getter: runtime => getRuntimeFamily(runtime),
                    },
                    {
                      label: t('Scheduling'),
                      getter: runtime => getSchedulingSummary(runtime, t),
                    },
                  ]}
                  emptyMessage={t('No Trainer runtimes found.')}
                />
              </SectionBox>
            </Grid>
          )}
        </Grid>

        {!trainJobsAvailability && failedJobs.length > 0 && (
          <Grid container spacing={3} sx={{ mt: 3 }}>
            <Grid item xs={12}>
              <SectionBox title={t('Failed TrainJobs')}>
                <SimpleTable
                  data={failedJobs.slice(0, 8)}
                  columns={[
                    {
                      label: t('Name'),
                      getter: (job: TrainJobClass) => (
                        <HeadlampLink
                          routeName="kubeflow-training-trainjobs-detail"
                          params={{ namespace: job.metadata.namespace, name: job.metadata.name }}
                        >
                          {job.metadata.name}
                        </HeadlampLink>
                      ),
                    },
                    {
                      label: t('Namespace'),
                      getter: (job: TrainJobClass) => job.metadata.namespace || '-',
                    },
                    {
                      label: t('Runtime'),
                      getter: (job: TrainJobClass) => formatRuntimeRef(job, t),
                    },
                    {
                      label: t('Reason'),
                      getter: (job: TrainJobClass) =>
                        job.latestCondition?.reason || job.latestCondition?.message || '-',
                    },
                  ]}
                  emptyMessage={t('No failed TrainJobs.')}
                />
              </SectionBox>
            </Grid>
          </Grid>
        )}
      </Box>
    </SectionPage>
  );
}
