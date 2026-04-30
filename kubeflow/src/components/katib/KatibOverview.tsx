import { Icon } from '@iconify/react';
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
        <Typography sx={{ ml: 2 }}>Loading Katib Dashboard...</Typography>
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
      title: 'Experiments',
      value: experimentList.length,
      subtitle: `${runningExperiments} running, ${failedExperiments} failed`,
      icon: 'mdi:tune',
    },
    {
      title: 'Trials',
      value: trialList.length,
      subtitle: `${succeededTrials} succeeded, ${failedTrials} failed`,
      icon: 'mdi:flask-outline',
    },
    {
      title: 'Suggestions',
      value: suggestionList.length,
      subtitle: `${suggestionList.reduce(
        (count, item) => count + (item.status.suggestionCount ?? 0),
        0
      )} assigned`,
      icon: 'mdi:lightbulb-outline',
    },
    {
      title: 'Early Stopping',
      value: experimentList.filter(item => item.earlyStoppingEnabled).length,
      subtitle: 'Experiments with early stopping',
      icon: 'mdi:timer-sand',
    },
  ];

  return (
    <SectionPage title="Katib Dashboard" apiPath="/apis/kubeflow.org/v1beta1/experiments">
      <Box sx={{ padding: '24px 16px', pt: '32px' }}>
        <Typography variant="h1" sx={{ fontSize: '1.87rem', fontWeight: 700, mb: 1 }}>
          Katib Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic', mb: 4 }}>
          Experiment health, trial progress, and optimization activity across namespaces
        </Typography>

        {hasListErrors && (
          <Alert severity="warning" sx={{ mb: 4, borderRadius: '4px' }}>
            Some Katib resources could not be listed. Metrics and counts may be incomplete due to
            authorization or availability issues.
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
          <SectionBox title="Experiment Health">
            <SimpleTable
              data={experimentList}
              columns={[
                {
                  label: 'Name',
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
                  label: 'Namespace',
                  getter: (experiment: KatibExperimentClass) => experiment.metadata.namespace,
                },
                {
                  label: 'Status',
                  getter: (experiment: KatibExperimentClass) => (
                    <KubeflowStatusBadge
                      statusInfo={getKatibConditionStatus(experiment.latestCondition)}
                    />
                  ),
                },
                {
                  label: 'Objective',
                  getter: (experiment: KatibExperimentClass) =>
                    experiment.objectiveMetricName || '-',
                },
                {
                  label: 'Algorithm',
                  getter: (experiment: KatibExperimentClass) => experiment.algorithmName || '-',
                },
                {
                  label: 'Search Space',
                  getter: (experiment: KatibExperimentClass) => experiment.searchSpaceSize,
                },
                {
                  label: 'Progress',
                  getter: (experiment: KatibExperimentClass) =>
                    experimentProgress(experiment, trialList),
                },
                {
                  label: 'Early Stopping',
                  getter: (experiment: KatibExperimentClass) =>
                    experiment.earlyStoppingEnabled
                      ? experiment.earlyStoppingAlgorithm
                      : 'Disabled',
                },
              ]}
              emptyMessage="No Katib experiments found."
            />
          </SectionBox>
        </Box>

        <Box sx={{ mt: 4 }}>
          <SectionBox title="Progress & Best Trials">
            <SimpleTable
              data={experimentList}
              columns={[
                {
                  label: 'Experiment',
                  getter: (experiment: KatibExperimentClass) => experiment.metadata.name,
                },
                {
                  label: 'Progress',
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
                          {currentTrials}/{maxTrials || '-'} trials
                        </Typography>
                      </Box>
                    );
                  },
                },
                {
                  label: 'Terminal',
                  getter: (experiment: KatibExperimentClass) =>
                    getKatibTerminalTrialCount(getKatibRelatedTrials(experiment, trialList)),
                },
                {
                  label: 'Best Trial',
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
                  label: 'Best Metric',
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
              emptyMessage="No progress data available."
            />
          </SectionBox>
        </Box>

        <Box sx={{ mt: 4 }}>
          <SectionBox title="Service Accounts & Worker Types">
            <SimpleTable
              data={experimentList}
              columns={[
                {
                  label: 'Experiment',
                  getter: (experiment: KatibExperimentClass) => experiment.metadata.name,
                },
                {
                  label: 'Worker Kind',
                  getter: (experiment: KatibExperimentClass) => experiment.trialWorkerKind || '-',
                },
                {
                  label: 'Trial Service Account',
                  getter: (experiment: KatibExperimentClass) =>
                    experiment.trialServiceAccountName || 'default',
                },
                {
                  label: 'Suggestion Service Account',
                  getter: (experiment: KatibExperimentClass) =>
                    experiment.suggestionServiceAccountName || 'default',
                },
                {
                  label: 'RBAC',
                  getter: () => 'See checks below',
                },
              ]}
              emptyMessage="No service account data available."
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
                    RBAC & Service Accounts: {experiment.metadata.name}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <KatibRbacSection
                    experiment={experiment}
                    title={`RBAC & Service Accounts: ${experiment.metadata.name}`}
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
