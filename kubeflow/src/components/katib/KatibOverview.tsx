import { Icon } from '@iconify/react';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  Link as HeadlampLink,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import React from 'react';
import { KatibExperimentClass } from '../../resources/katibExperiment';
import { KatibSuggestionClass } from '../../resources/katibSuggestion';
import { KatibTrialClass } from '../../resources/katibTrial';
import {
  getKatibBestTrial,
  getKatibConditionStatus,
  getKatibRelatedTrials,
  getKatibTerminalTrialCount,
  getKatibTrialMetricValue,
} from '../common/katibUtils';
import { KubeflowStatusBadge } from '../common/KubeflowStatusBadge';
import { SectionPage } from '../common/SectionPage';
import { KatibRbacSection } from './KatibRbacSection';

function countByCondition(items: Array<{ latestCondition: any }>, conditionType: string): number {
  return items.filter(
    item => item.latestCondition?.type === conditionType && item.latestCondition?.status === 'True'
  ).length;
}

function experimentProgress(experiment: KatibExperimentClass, trials: KatibTrialClass[]): string {
  const relatedTrials = getKatibRelatedTrials(experiment, trials);
  const currentTrials = experiment.status.currentTrialCount ?? relatedTrials.length;
  const maxTrials = experiment.spec.maxTrialCount ?? 0;

  if (!maxTrials) {
    return '-';
  }

  return `${currentTrials}/${maxTrials}`;
}

export function KatibOverview() {
  const { t } = useTranslation();
  const [expandedRbacKey, setExpandedRbacKey] = React.useState<string | false>(false);
  const [experiments, experimentsError] = KatibExperimentClass.useList();
  const [trials, trialsError] = KatibTrialClass.useList();
  const [suggestions, suggestionsError] = KatibSuggestionClass.useList();

  const isLoading =
    (experiments === null && !experimentsError) ||
    (trials === null && !trialsError) ||
    (suggestions === null && !suggestionsError);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>{t('Loading Katib Dashboard...')}</Typography>
      </Box>
    );
  }

  const hasListErrors = Boolean(experimentsError || trialsError || suggestionsError);

  const experimentList = experiments ?? [];
  const trialList = trials ?? [];
  const suggestionList = suggestions ?? [];
  const runningExperiments = countByCondition(experimentList, 'Running');
  const failedExperiments = countByCondition(experimentList, 'Failed');
  const succeededTrials = countByCondition(trialList, 'Succeeded');
  const failedTrials = countByCondition(trialList, 'Failed');

  const cards = [
    {
      title: t('Experiments'),
      value: experimentList.length,
      subtitle: t('{{running}} running, {{failed}} failed', {
        running: runningExperiments,
        failed: failedExperiments,
      }),
      icon: 'mdi:tune',
    },
    {
      title: t('Trials'),
      value: trialList.length,
      subtitle: t('{{succeeded}} succeeded, {{failed}} failed', {
        succeeded: succeededTrials,
        failed: failedTrials,
      }),
      icon: 'mdi:flask-outline',
    },
    {
      title: t('Suggestions'),
      value: suggestionList.length,
      subtitle: t('{{count}} assigned', {
        count: suggestionList.reduce(
          (count, item) => count + (item.status.suggestionCount ?? 0),
          0
        ),
      }),
      icon: 'mdi:lightbulb-outline',
    },
    {
      title: t('Early Stopping'),
      value: experimentList.filter(item => item.earlyStoppingEnabled).length,
      subtitle: t('Experiments with early stopping'),
      icon: 'mdi:timer-sand',
    },
  ];

  return (
    <SectionPage title={t('Katib Dashboard')} apiPath="/apis/kubeflow.org/v1beta1/experiments">
      <Box sx={{ padding: '24px 16px', pt: '32px' }}>
        <Typography variant="h1" sx={{ fontSize: '1.87rem', fontWeight: 700, mb: 1 }}>
          {t('Katib Dashboard')}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic', mb: 4 }}>
          {t('Experiment health, trial progress, and optimization activity across namespaces')}
        </Typography>

        {hasListErrors && (
          <Alert severity="warning" sx={{ mb: 4, borderRadius: '4px' }}>
            {t(
              'Some Katib resources could not be listed. Metrics and counts may be incomplete due to authorization or availability issues.'
            )}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {cards.map(card => (
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

        <Box sx={{ mt: 4 }}>
          <SectionBox title={t('Experiment Health')}>
            <SimpleTable
              data={experimentList}
              columns={[
                {
                  label: t('Name'),
                  getter: (experiment: KatibExperimentClass) => (
                    <HeadlampLink
                      routeName="kubeflow-katib-experiments-detail"
                      params={{
                        namespace: experiment.metadata.namespace,
                        name: experiment.metadata.name,
                      }}
                    >
                      {experiment.metadata.name}
                    </HeadlampLink>
                  ),
                },
                {
                  label: t('Namespace'),
                  getter: (experiment: KatibExperimentClass) => experiment.metadata.namespace,
                },
                {
                  label: t('Status'),
                  getter: (experiment: KatibExperimentClass) => (
                    <KubeflowStatusBadge
                      statusInfo={getKatibConditionStatus(experiment.latestCondition)}
                    />
                  ),
                },
                {
                  label: t('Objective'),
                  getter: (experiment: KatibExperimentClass) =>
                    experiment.objectiveMetricName || '-',
                },
                {
                  label: t('Algorithm'),
                  getter: (experiment: KatibExperimentClass) => experiment.algorithmName || '-',
                },
                {
                  label: t('Search Space'),
                  getter: (experiment: KatibExperimentClass) => experiment.searchSpaceSize,
                },
                {
                  label: t('Progress'),
                  getter: (experiment: KatibExperimentClass) =>
                    experimentProgress(experiment, trialList),
                },
                {
                  label: t('Early Stopping'),
                  getter: (experiment: KatibExperimentClass) =>
                    experiment.earlyStoppingEnabled
                      ? experiment.earlyStoppingAlgorithm
                      : t('Disabled'),
                },
              ]}
              emptyMessage={t('No Katib experiments found.')}
            />
          </SectionBox>
        </Box>

        <Box sx={{ mt: 4 }}>
          <SectionBox title={t('Progress & Best Trials')}>
            <SimpleTable
              data={experimentList}
              columns={[
                {
                  label: t('Experiment'),
                  getter: (experiment: KatibExperimentClass) => experiment.metadata.name,
                },
                {
                  label: t('Progress'),
                  getter: (experiment: KatibExperimentClass) => {
                    const relatedTrials = getKatibRelatedTrials(experiment, trialList);
                    const maxTrials = experiment.spec.maxTrialCount ?? 0;
                    const currentTrials =
                      experiment.status.currentTrialCount ?? relatedTrials.length;
                    const progress =
                      maxTrials > 0 ? Math.min((currentTrials / maxTrials) * 100, 100) : 0;
                    return (
                      <Box sx={{ display: 'grid', gap: 0.5, minWidth: 120 }}>
                        <LinearProgress variant="determinate" value={progress} />
                        <Typography variant="caption">
                          {t('{{current}}/{{max}} trials', {
                            current: currentTrials,
                            max: maxTrials || '-',
                          })}
                        </Typography>
                      </Box>
                    );
                  },
                },
                {
                  label: t('Terminal'),
                  getter: (experiment: KatibExperimentClass) =>
                    getKatibTerminalTrialCount(getKatibRelatedTrials(experiment, trialList)),
                },
                {
                  label: t('Best Trial'),
                  getter: (experiment: KatibExperimentClass) => {
                    const bestTrial = getKatibBestTrial(
                      getKatibRelatedTrials(experiment, trialList),
                      experiment.objectiveMetricName,
                      experiment.objectiveType || 'maximize'
                    );
                    return bestTrial ? (
                      <HeadlampLink
                        routeName="kubeflow-katib-trials-detail"
                        params={{
                          namespace: bestTrial.trial.metadata.namespace,
                          name: bestTrial.trial.metadata.name,
                        }}
                      >
                        {bestTrial.trial.metadata.name}
                      </HeadlampLink>
                    ) : (
                      '-'
                    );
                  },
                },
                {
                  label: t('Best Metric'),
                  getter: (experiment: KatibExperimentClass) => {
                    const bestTrial = getKatibBestTrial(
                      getKatibRelatedTrials(experiment, trialList),
                      experiment.objectiveMetricName,
                      experiment.objectiveType || 'maximize'
                    );
                    return bestTrial
                      ? getKatibTrialMetricValue(bestTrial.trial, experiment.objectiveMetricName)
                      : '-';
                  },
                },
              ]}
              emptyMessage={t('No progress data available.')}
            />
          </SectionBox>
        </Box>

        <Box sx={{ mt: 4 }}>
          <SectionBox title={t('Service Accounts & Worker Types')}>
            <SimpleTable
              data={experimentList}
              columns={[
                {
                  label: t('Experiment'),
                  getter: (experiment: KatibExperimentClass) => experiment.metadata.name,
                },
                {
                  label: t('Worker Kind'),
                  getter: (experiment: KatibExperimentClass) => experiment.trialWorkerKind || '-',
                },
                {
                  label: t('Trial Service Account'),
                  getter: (experiment: KatibExperimentClass) =>
                    experiment.trialServiceAccountName || t('default'),
                },
                {
                  label: t('Suggestion Service Account'),
                  getter: (experiment: KatibExperimentClass) =>
                    experiment.suggestionServiceAccountName || t('default'),
                },
                {
                  label: t('RBAC'),
                  getter: () => t('See checks below'),
                },
              ]}
              emptyMessage={t('No service account data available.')}
            />
          </SectionBox>
        </Box>

        {experimentList.length > 0 ? (
          <Box sx={{ mt: 4 }}>
            {experimentList.map(experiment => (
              <Accordion
                key={`${experiment.metadata.namespace}/${experiment.metadata.name}`}
                disableGutters
                expanded={
                  expandedRbacKey === `${experiment.metadata.namespace}/${experiment.metadata.name}`
                }
                onChange={(_, isExpanded) => {
                  setExpandedRbacKey(
                    isExpanded
                      ? `${experiment.metadata.namespace}/${experiment.metadata.name}`
                      : false
                  );
                }}
                sx={{ mb: 2 }}
              >
                <AccordionSummary expandIcon={<Icon icon="mdi:chevron-down" width="18" />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {t('RBAC & Service Accounts: {{name}}', { name: experiment.metadata.name })}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <KatibRbacSection
                    experiment={experiment}
                    title={t('RBAC & Service Accounts: {{name}}', {
                      name: experiment.metadata.name,
                    })}
                  />
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ) : null}
      </Box>
    </SectionPage>
  );
}
