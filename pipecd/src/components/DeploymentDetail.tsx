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
import React, { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { getDeployment, isConfigured, listStageLogs, loadConfig } from '../api/pipecd';
import type { Deployment, DeploymentStatus, PipelineStage, StageLog } from '../types/pipecd';
import type { AlertSeverity } from '../utils/alert';
import { alertTextSx } from '../utils/alert';
import { duration, formatTimestamp } from '../utils/time';
import { triggeredBy } from '../utils/trigger';
import { consoleURL, pluginURL } from '../utils/url';
import { DeploymentStatusLabel } from './DeploymentStatusLabel';
import { KindBadge } from './KindBadge';
import { NotConfigured } from './NotConfigured';
import { StageLogs } from './StageLogs';
import { StageStatusLabel } from './StageStatusLabel';

const EMPTY = '—';

const STATUS_SEVERITY: Record<DeploymentStatus, AlertSeverity> = {
  DEPLOYMENT_PENDING: 'info',
  DEPLOYMENT_PLANNED: 'info',
  DEPLOYMENT_RUNNING: 'info',
  DEPLOYMENT_ROLLING_BACK: 'warning',
  DEPLOYMENT_SUCCESS: 'success',
  DEPLOYMENT_FAILURE: 'error',
  DEPLOYMENT_CANCELLED: 'warning',
};

const FINISHED: ReadonlySet<DeploymentStatus> = new Set([
  'DEPLOYMENT_SUCCESS',
  'DEPLOYMENT_FAILURE',
  'DEPLOYMENT_CANCELLED',
]);

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

  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  // Only the newest request may update the page. The id changing, or the page
  // closing, bumps it too, so replies for an old deployment are dropped.
  const latestRequest = useRef(0);

  /**
   * Fetches the stage logs, and with `refresh` the deployment again too, so a
   * stage's status matches its logs. Logs are best-effort: the deployment still
   * renders when the piped has not reported them yet, or has pruned them.
   */
  function fetchDetails(deploymentId: string, refresh: boolean): void {
    const request = ++latestRequest.current;
    const isLatest = () => request === latestRequest.current;
    setLogsLoading(true);

    if (refresh) {
      getDeployment(config, deploymentId)
        .then(result => {
          if (isLatest()) setDeployment(result);
        })
        // The deployment already on screen stays; only its logs are reported.
        .catch(() => undefined);
    }

    listStageLogs(config, deploymentId)
      .then(logs => {
        if (!isLatest()) return;
        setStageLogs(logs.stageLogs);
        setLogsError(null);
      })
      .catch(err => {
        // Keep any logs already shown, and say why newer ones are missing.
        if (isLatest()) setLogsError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (isLatest()) setLogsLoading(false);
      });
  }

  useEffect(() => {
    if (!isConfigured(config) || !id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    // Drop the previous deployment, so a failed fetch for a new id cannot show
    // it again under the new URL.
    setDeployment(null);
    setStageLogs({});
    setLogsLoading(false);
    setLogsError(null);
    setExpandedStage(false);

    getDeployment(config, id)
      .then(result => {
        if (cancelled) return;
        setDeployment(result);
        // Show the deployment now; the logs only matter once a stage is opened.
        setLoading(false);
        fetchDetails(id, false);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });

    return () => {
      cancelled = true;
      // Drop replies still on their way for this id.
      latestRequest.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, config.baseURL, config.apiKey]);

  function handleStageChange(stageId: string, isExpanded: boolean): void {
    setExpandedStage(isExpanded ? stageId : false);
    if (!isExpanded || !id || !deployment || logsLoading) return;
    // The first fetch is a snapshot. While the deployment runs, a stage may
    // have more logs than that, so opening it fetches the deployment and logs
    // again. Once the deployment has finished, no more logs will come, unless
    // the last fetch failed or caught a log the piped was still writing.
    const log = stageLogs[stageId];
    if (!FINISHED.has(deployment.status) || logsError || (log && !log.completed)) {
      fetchDetails(id, true);
    }
  }

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
              href={consoleURL(
                config.baseURL,
                `/deployments/${deployment.id}`,
                deployment.projectId
              )}
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
              sx={[{ mb: 2 }, alertTextSx(STATUS_SEVERITY[deployment.status] ?? 'info')]}
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
                onChange={(_event, isExpanded) => handleStageChange(stage.id, isExpanded)}
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
                    <Alert severity="warning" sx={[{ mb: 1.5 }, alertTextSx('warning')]}>
                      {stage.statusReason}
                    </Alert>
                  )}
                  {logsError && !logsLoading && (
                    <Alert severity="error" sx={[{ mb: 1.5 }, alertTextSx('error')]}>
                      {t('Failed to load logs: {{error}}', { error: logsError })}
                    </Alert>
                  )}
                  {logsLoading && !stageLogs[stage.id] ? (
                    <Typography variant="body2" color="text.secondary">
                      {t('Loading logs…')}
                    </Typography>
                  ) : (
                    <StageLogs log={stageLogs[stage.id]} />
                  )}
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </>
      )}
    </Box>
  );
}
