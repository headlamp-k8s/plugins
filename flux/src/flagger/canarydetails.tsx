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
            name: 'Suspend',
            value: cr?.jsonData?.spec?.suspend ? 'True' : 'False',
          },
          {
            name: 'Status',
            value: <CanaryStatus status={cr?.jsonData?.status?.phase || 'Unknown'} />,
          },
          {
            name: 'Service',
            value: service.name || '-',
          },
          {
            name: 'Target',
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
            name: 'Analysis',
            value: analysis ? <AnalysisSection analysis={analysis} /> : '-',
          },
          {
            name: 'Metrics',
            value: analysis?.metrics ? <MetricsSection metrics={analysis.metrics} /> : '-',
          },
          {
            name: 'Webhooks',
            value: analysis?.webhooks ? <WebhooksSection webhooks={analysis.webhooks} /> : '-',
          },
        ]}
        actions={[<SuspendAction resource={cr} />, <ResumeAction resource={cr} />]}
      />

      <SectionBox title="Conditions">
        <ConditionsTable resource={cr?.jsonData} />
      </SectionBox>

      <ObjectEventsRenderer events={events?.map(event => new Event(event)) || []} />
    </>
  );
}

function MetricsSection({ metrics }) {
  if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
    return <Typography color="text.secondary">No metrics configured</Typography>;
  }

  return (
    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
      <Grid container spacing={2}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  {metric?.name || `Metric ${index + 1}`}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Interval: {metric?.interval || 'Not specified'}
                </Typography>

                {metric?.thresholdRange && (
                  <Box mt={1}>
                    <Typography variant="body2" color="text.secondary">
                      Threshold Range
                    </Typography>
                    <Box display="flex" alignItems="center" mt={0.5}>
                      <Tooltip title="Minimum">
                        <Chip
                          size="small"
                          label={`Min: ${
                            metric.thresholdRange.min !== undefined
                              ? metric.thresholdRange.min
                              : 'N/A'
                          }`}
                          color="primary"
                          variant="outlined"
                        />
                      </Tooltip>
                      <Box mx={1}>-</Box>
                      <Tooltip title="Maximum">
                        <Chip
                          size="small"
                          label={`Max: ${
                            metric.thresholdRange.max !== undefined
                              ? metric.thresholdRange.max
                              : 'N/A'
                          }`}
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
  if (!analysis) {
    return <Typography color="text.secondary">No analysis configuration found</Typography>;
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box mb={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Interval
            </Typography>
            <Typography variant="body1">{analysis.interval || 'Not specified'}</Typography>
          </Box>

          <Box mb={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Threshold
            </Typography>
            <Typography variant="body1">
              {analysis.threshold !== undefined ? analysis.threshold : 'Not specified'}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box mb={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Max Weight
            </Typography>
            {analysis.maxWeight !== undefined ? (
              <Tooltip title="Maximum traffic percentage for canary">
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
              <Typography variant="body1">Not specified</Typography>
            )}
          </Box>

          {analysis.stepWeight !== undefined && (
            <Box mb={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Step Weight
              </Typography>
              <Tooltip title="Percentage increment per iteration">
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
                Step Weights
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
            {analysis.mirror && <Chip label="Mirror Traffic" color="info" size="small" />}

            {analysis.iterations !== undefined && (
              <Chip label={`${analysis.iterations} Iterations`} color="secondary" size="small" />
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

function WebhooksSection({ webhooks }) {
  if (!webhooks || !Array.isArray(webhooks) || webhooks.length === 0) {
    return <Typography color="text.secondary">No webhooks configured</Typography>;
  }

  return (
    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
      <Stack spacing={2}>
        {webhooks.map((webhook, index) => (
          <Paper key={index} variant="outlined" sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6" color="primary">
                {webhook?.name || `Webhook ${index + 1}`}
              </Typography>
              <Chip
                label={webhook?.type || 'Unknown'}
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
              URL
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              {webhook?.url || 'Not specified'}
            </Typography>

            {webhook?.timeout && (
              <Box mt={1}>
                <Typography variant="body2" color="text.secondary">
                  Timeout: {webhook.timeout}
                </Typography>
              </Box>
            )}

            {webhook?.metadata && Object.keys(webhook.metadata).length > 0 && (
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Metadata
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
