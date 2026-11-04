/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Icon } from '@iconify/react';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Divider,
  Link,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { getDeployment, isConfigured, listStageLogs, loadConfig } from '../api/pipecd';
import type { Deployment, DeploymentStatus, PipelineStage, StageLog } from '../types/pipecd';
import { duration, formatTimestamp } from '../utils/time';
import { triggeredBy } from '../utils/trigger';
import { pluginURL } from '../utils/url';
import { DeploymentStatusLabel } from './DeploymentStatusLabel';
import { KindBadge } from './KindBadge';
import { NotConfigured } from './NotConfigured';
import { StageLogs } from './StageLogs';
import { StageStatusLabel } from './StageStatusLabel';

const EMPTY = '—';

const STATUS_SEVERITY: Record<DeploymentStatus, 'success' | 'info' | 'warning' | 'error'> = {
  DEPLOYMENT_PENDING: 'info',
  DEPLOYMENT_PLANNED: 'info',
  DEPLOYMENT_RUNNING: 'info',
  DEPLOYMENT_ROLLING_BACK: 'warning',
  DEPLOYMENT_SUCCESS: 'success',
  DEPLOYMENT_FAILURE: 'error',
  DEPLOYMENT_CANCELLED: 'warning',
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <TableRow>
      <TableCell sx={{ fontWeight: 600, width: 180, verticalAlign: 'top', border: 0 }}>
        {label}
      </TableCell>
      <TableCell sx={{ border: 0 }}>{children}</TableCell>
    </TableRow>
  );
}

/**
 * Picks the stages worth showing, in pipeline order.
 *
 * PipelineStage.visible is deprecated in PipeCD's proto and left unset by the
 * server, so it cannot be used here. Instead this mirrors the PipeCD console:
 * piped appends a rollback stage to every pipeline up front, so one that never
 * ran is noise and stays hidden until it actually does something.
 */
function isRollback(stage: PipelineStage): boolean {
  // Not every provider sets the rollback flag, so fall back to the stage name.
  return stage.rollback || stage.name.toUpperCase().endsWith('ROLLBACK');
}

function pipelineStages(deployment: Deployment): PipelineStage[] {
  return deployment.stages
    .filter(stage => !(isRollback(stage) && stage.status === 'STAGE_NOT_STARTED_YET'))
    .sort((a, b) => a.index - b.index);
}

export function DeploymentDetail(): JSX.Element {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const config = loadConfig();

  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [stageLogs, setStageLogs] = useState<Record<string, StageLog>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStage, setExpandedStage] = useState<string | false>(false);

  useEffect(() => {
    if (!isConfigured(config) || !id) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(null);

    getDeployment(config, id)
      .then(async result => {
        if (cancelled) return;
        setDeployment(result);

        // Logs are best-effort: the deployment still renders when the piped has
        // not reported them yet, or has already pruned them.
        try {
          const logs = await listStageLogs(config, id);
          if (!cancelled) setStageLogs(logs.stageLogs);
        } catch {
          if (!cancelled) setStageLogs({});
        }
      })
      .catch(err => {
        if (cancelled || (err instanceof Error && err.name === 'AbortError')) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, config.baseURL, config.apiKey]);

  if (!isConfigured(config)) {
    return <NotConfigured />;
  }

  const stages = deployment ? pipelineStages(deployment) : [];
  const backTo = deployment
    ? pluginURL(`/pipecd/applications/${deployment.applicationId}`)
    : pluginURL('/pipecd/applications');

  return (
    <Box sx={{ p: 3 }}>
      <Link component={RouterLink} to={backTo} variant="body2">
        ← {t('Back to application')}
      </Link>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <strong>{t('Failed to load deployment')}</strong>
          <br />
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="text" width={280} height={40} />
          <Skeleton variant="rectangular" height={180} sx={{ mt: 2 }} />
        </Box>
      )}

      {!loading && !error && !deployment && (
        <Typography color="text.secondary" sx={{ mt: 4 }}>
          {t('Deployment not found.')}
        </Typography>
      )}

      {!loading && deployment && (
        <>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={2}
            sx={{ mt: 2, mb: 2 }}
          >
            {/* Deployment summaries run long, so the title ellipsizes and the
                badges and action keep a fixed position. */}
            <Stack direction="row" alignItems="center" gap={1.5} sx={{ minWidth: 0, flexGrow: 1 }}>
              <Tooltip title={deployment.summary || deployment.id} arrow>
                <Typography variant="h5" fontWeight={700} noWrap sx={{ minWidth: 0 }}>
                  {deployment.summary || deployment.id}
                </Typography>
              </Tooltip>
              <Stack direction="row" alignItems="center" gap={1.5} sx={{ flexShrink: 0 }}>
                <DeploymentStatusLabel status={deployment.status} />
                <KindBadge kind={deployment.kind} />
              </Stack>
            </Stack>

            <Button
              size="small"
              variant="outlined"
              href={`${config.baseURL}/deployments/${deployment.id}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {t('Open in PipeCD')}
            </Button>
          </Stack>

          {deployment.statusReason && (
            <Alert
              severity={STATUS_SEVERITY[deployment.status] ?? 'info'}
              sx={{
                mb: 2,
                // MUI dims alert text in dark mode; tint it by severity at full strength.
                '& .MuiAlert-message': {
                  color: `${STATUS_SEVERITY[deployment.status] ?? 'info'}.light`,
                },
              }}
            >
              {deployment.statusReason}
            </Alert>
          )}

          <Paper variant="outlined" sx={{ mb: 3 }}>
            <Table size="small" aria-label="deployment-details">
              <TableBody>
                <DetailRow label={t('Application')}>
                  <Link
                    component={RouterLink}
                    to={pluginURL(`/pipecd/applications/${deployment.applicationId}`)}
                    variant="body2"
                  >
                    {deployment.applicationName || deployment.applicationId}
                  </Link>
                </DetailRow>
                <DetailRow label={t('Repository')}>
                  <Typography variant="body2" fontFamily="monospace">
                    {deployment.gitPath?.repo?.id || EMPTY}
                  </Typography>
                </DetailRow>
                <DetailRow label={t('Commit')}>
                  {deployment.trigger?.commit ? (
                    <Stack spacing={0.25}>
                      <Typography variant="body2" fontFamily="monospace">
                        {deployment.trigger.commit.hash.slice(0, 8)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {deployment.trigger.commit.message}
                      </Typography>
                    </Stack>
                  ) : (
                    EMPTY
                  )}
                </DetailRow>
                <DetailRow label={t('Triggered by')}>
                  <Tooltip title={triggeredBy(deployment.trigger, t).detail ?? ''} arrow>
                    <span>{triggeredBy(deployment.trigger, t).label}</span>
                  </Tooltip>
                </DetailRow>
                <DetailRow label={t('Started')}>{formatTimestamp(deployment.createdAt)}</DetailRow>
                <DetailRow label={t('Duration')}>
                  {duration(deployment.createdAt, deployment.completedAt)}
                </DetailRow>
              </TableBody>
            </Table>
          </Paper>

          <Typography variant="h6" fontWeight={700} gutterBottom>
            {t('Pipeline')}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {stages.length === 0 ? (
            <Typography color="text.secondary">
              {t('This deployment has no pipeline stages.')}
            </Typography>
          ) : (
            stages.map(stage => (
              <Accordion
                key={stage.id}
                expanded={expandedStage === stage.id}
                onChange={(_event, isExpanded) => setExpandedStage(isExpanded ? stage.id : false)}
                disableGutters
                // Stage logs can run to thousands of lines, so only mount the
                // stage that is actually open.
                TransitionProps={{ unmountOnExit: true }}
              >
                <AccordionSummary expandIcon={<Icon icon="mdi:chevron-down" />}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={1.5}
                    flexWrap="wrap"
                    sx={{ width: '100%', pr: 1 }}
                  >
                    <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
                      <Typography variant="body2" fontWeight={600}>
                        {stage.name}
                      </Typography>
                      <StageStatusLabel status={stage.status} />
                      {isRollback(stage) && (
                        <Typography variant="caption" color="warning.main" fontWeight={600}>
                          {t('rollback')}
                        </Typography>
                      )}
                      {stage.retriedCount > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {t('retried {{times}}×', { times: stage.retriedCount })}
                        </Typography>
                      )}
                      {stage.desc && (
                        <Typography variant="caption" color="text.secondary">
                          {stage.desc}
                        </Typography>
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {duration(stage.createdAt, stage.completedAt)}
                    </Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  {stage.statusReason && (
                    <Alert severity="warning" sx={{ mb: 1.5 }}>
                      {stage.statusReason}
                    </Alert>
                  )}
                  <StageLogs log={stageLogs[stage.id]} />
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </>
      )}
    </Box>
  );
}
