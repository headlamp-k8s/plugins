import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  ConditionsTable,
  Link,
  MainInfoSection,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Event from '@kinvolk/headlamp-plugin/lib/K8s/event';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';
import { useParams } from 'react-router-dom';
import { ResumeAction, SuspendAction } from '../actions';
import { ObjectEventsRenderer } from '../helpers';
import FlaggerAvailabilityCheck, { useCanary } from './availabilitycheck';
import CanaryStatus from './canarystatus';

export default function CanaryDetails() {
  const [canary] = useCanary();

  return (
    <FlaggerAvailabilityCheck>
      {canary && <CanaryDetailsRenderer resource={canary} />}
    </FlaggerAvailabilityCheck>
  );
}

function CanaryDetailsRenderer({ resource }) {
  const { namespace, name } = useParams<{ name: string; namespace: string }>();
  const [cr, setCr] = React.useState(null);
  const { t } = useTranslation();

  const resourceClass = React.useMemo(() => {
    return resource.makeCRClass();
  }, [resource]);

  resourceClass.useApiGet(setCr, name, namespace);

  const [events] = Event.useList({
    namespace,
    fieldSelector: `involvedObject.name=${name},involvedObject.kind=Canary`,
  });

  if (!cr) return null;

  const targetRef = cr?.jsonData?.spec?.targetRef || {};
  const analysis = cr?.jsonData?.spec?.analysis || {};
  const service = cr?.jsonData?.spec?.service || {};

  return (
    <>
      <MainInfoSection
        resource={cr}
        extraInfo={[
          {
            name: t('Suspend'),
            value: cr?.jsonData?.spec?.suspend ? t('True') : t('False'),
          },
          {
            name: t('Status'),
            value: <CanaryStatus status={cr?.jsonData?.status?.phase || t('Unknown')} />,
          },
          {
            name: t('Service'),
            value: service.name || '-',
          },
          {
            name: t('Target'),
            value: (
              <Stack direction="row" spacing={1}>
                {targetRef.kind && (
                  <Chip size="small" label={targetRef.kind} color="primary" variant="outlined" />
                )}
                {targetRef.kind && (
                  <Link
                    routeName={`${targetRef.kind.toLowerCase()}`}
                    params={{
                      name: targetRef.name,
                      namespace: targetRef.namespace || cr?.jsonData?.metadata?.namespace,
                    }}
                  >
                    {targetRef.name}
                  </Link>
                )}
                {targetRef.apiVersion && (
                  <Chip
                    size="small"
                    label={targetRef.apiVersion}
                    color="default"
                    variant="outlined"
                  />
                )}
                {!targetRef.kind && !targetRef.name && !targetRef.apiVersion && '-'}
              </Stack>
            ),
          },
          {
            name: t('Analysis'),
            value: analysis ? <AnalysisSection analysis={analysis} /> : '-',
          },
          {
            name: t('Metrics'),
            value: analysis?.metrics ? <MetricsSection metrics={analysis.metrics} /> : '-',
          },
          {
            name: t('Webhooks'),
            value: analysis?.webhooks ? <WebhooksSection webhooks={analysis.webhooks} /> : '-',
          },
        ]}
        actions={[<SuspendAction resource={cr} />, <ResumeAction resource={cr} />]}
      />

      <SectionBox title={t('Conditions')}>
        <ConditionsTable resource={cr?.jsonData} />
      </SectionBox>

      <ObjectEventsRenderer events={events?.map(event => new Event(event)) || []} />
    </>
  );
}

function MetricsSection({ metrics }) {
  const { t } = useTranslation();
  if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
    return <Typography color="text.secondary">{t('No metrics configured')}</Typography>;
  }

  return (
    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
      <Grid container spacing={2}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  {metric?.name || t('Metric {{number}}', { number: index + 1 })}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {t('Interval')}: {metric?.interval || t('Not specified')}
                </Typography>

                {metric?.thresholdRange && (
                  <Box mt={1}>
                    <Typography variant="body2" color="text.secondary">
                      {t('Threshold Range')}
                    </Typography>
                    <Box display="flex" alignItems="center" mt={0.5}>
                      <Tooltip title={t('Minimum')}>
                        <Chip
                          size="small"
                          label={t('Min: {{value}}', {
                            value:
                              metric.thresholdRange.min !== undefined
                                ? metric.thresholdRange.min
                                : 'N/A',
                          })}
                          color="primary"
                          variant="outlined"
                        />
                      </Tooltip>
                      <Box mx={1}>-</Box>
                      <Tooltip title={t('Maximum')}>
                        <Chip
                          size="small"
                          label={t('Max: {{value}}', {
                            value:
                              metric.thresholdRange.max !== undefined
                                ? metric.thresholdRange.max
                                : 'N/A',
                          })}
                          color="secondary"
                          variant="outlined"
                        />
                      </Tooltip>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function AnalysisSection({ analysis }) {
  const { t } = useTranslation();
  if (!analysis) {
    return <Typography color="text.secondary">{t('No analysis configuration found')}</Typography>;
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box mb={1}>
            <Typography variant="subtitle2" color="text.secondary">
              {t('Interval')}
            </Typography>
            <Typography variant="body1">{analysis.interval || t('Not specified')}</Typography>
          </Box>

          <Box mb={1}>
            <Typography variant="subtitle2" color="text.secondary">
              {t('Threshold')}
            </Typography>
            <Typography variant="body1">
              {analysis.threshold !== undefined ? analysis.threshold : t('Not specified')}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box mb={1}>
            <Typography variant="subtitle2" color="text.secondary">
              {t('Max Weight')}
            </Typography>
            {analysis.maxWeight !== undefined ? (
              <Tooltip title={t('Maximum traffic percentage for canary')}>
                <Box display="flex" alignItems="center">
                  <Typography variant="body1">{analysis.maxWeight}%</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={analysis.maxWeight}
                    sx={{ ml: 1, width: 100, height: 8, borderRadius: 1 }}
                    color="primary"
                  />
                </Box>
              </Tooltip>
            ) : (
              <Typography variant="body1">{t('Not specified')}</Typography>
            )}
          </Box>

          {analysis.stepWeight !== undefined && (
            <Box mb={1}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('Step Weight')}
              </Typography>
              <Tooltip title={t('Percentage increment per iteration')}>
                <Typography variant="body1">{analysis.stepWeight}%</Typography>
              </Tooltip>
            </Box>
          )}
        </Grid>

        {analysis.stepWeights &&
          Array.isArray(analysis.stepWeights) &&
          analysis.stepWeights.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('Step Weights')}
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {analysis.stepWeights.map((weight, index) => (
                  <Chip
                    key={index}
                    label={`${weight}%`}
                    variant="outlined"
                    size="small"
                    color={index === 0 ? 'primary' : 'default'}
                  />
                ))}
              </Box>
            </Grid>
          )}

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            {analysis.mirror && <Chip label={t('Mirror Traffic')} color="info" size="small" />}

            {analysis.iterations !== undefined && (
              <Chip
                label={t('{{count}} Iterations', { count: analysis.iterations })}
                color="secondary"
                size="small"
              />
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

function WebhooksSection({ webhooks }) {
  const { t } = useTranslation();
  if (!webhooks || !Array.isArray(webhooks) || webhooks.length === 0) {
    return <Typography color="text.secondary">{t('No webhooks configured')}</Typography>;
  }

  return (
    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
      <Stack spacing={2}>
        {webhooks.map((webhook, index) => (
          <Paper key={index} variant="outlined" sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6" color="primary">
                {webhook?.name || t('Webhook {{number}}', { number: index + 1 })}
              </Typography>
              <Chip
                label={webhook?.type || t('Unknown')}
                color={
                  webhook?.type === 'pre-rollout'
                    ? 'warning'
                    : webhook?.type === 'post-rollout'
                    ? 'success'
                    : 'default'
                }
                size="small"
              />
            </Box>

            <Divider sx={{ my: 1 }} />

            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('URL')}
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              {webhook?.url || t('Not specified')}
            </Typography>

            {webhook?.timeout && (
              <Box mt={1}>
                <Typography variant="body2" color="text.secondary">
                  {t('Timeout')}: {webhook.timeout}
                </Typography>
              </Box>
            )}

            {webhook?.metadata && Object.keys(webhook.metadata).length > 0 && (
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('Metadata')}
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.03)',
                    maxHeight: 200,
                    overflowY: 'auto',
                  }}
                >
                  <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                    {JSON.stringify(webhook.metadata, null, 2)}
                  </pre>
                </Paper>
              </Box>
            )}
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
