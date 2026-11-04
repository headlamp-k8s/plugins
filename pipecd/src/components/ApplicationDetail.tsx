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

import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
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
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { getApplication, isConfigured, listDeployments, loadConfig } from '../api/pipecd';
import type { Application, Deployment, SyncStatus } from '../types/pipecd';
import { duration, formatTimestamp, relativeTime } from '../utils/time';
import { triggeredBy } from '../utils/trigger';
import { pluginURL } from '../utils/url';
import { lastSyncedAt } from './ApplicationList';
import { DeploymentStatusLabel } from './DeploymentStatusLabel';
import { KindBadge } from './KindBadge';
import { NotConfigured } from './NotConfigured';
import { SyncStatusLabel } from './SyncStatusLabel';

const DEPLOYMENT_PAGE_SIZE = 20;

const SYNC_SEVERITY: Record<SyncStatus, 'success' | 'info' | 'warning' | 'error'> = {
  UNKNOWN: 'info',
  SYNCED: 'success',
  DEPLOYING: 'info',
  OUT_OF_SYNC: 'error',
  INVALID_CONFIG: 'warning',
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

export function ApplicationDetail(): JSX.Element {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const config = loadConfig();

  const [app, setApp] = useState<Application | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConfigured(config) || !id) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getApplication(config, id),
      listDeployments(config, {
        applicationId: id,
        pageSize: DEPLOYMENT_PAGE_SIZE,
        signal: controller.signal,
      }),
    ])
      .then(([application, deploymentsResponse]) => {
        if (cancelled) return;
        setApp(application);
        setDeployments(deploymentsResponse.deployments ?? []);
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

  return (
    <Box sx={{ p: 3 }}>
      <Link component={RouterLink} to={pluginURL('/pipecd/applications')} variant="body2">
        ← {t('Back to applications')}
      </Link>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <strong>{t('Failed to load application')}</strong>
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

      {!loading && !error && !app && (
        <Typography color="text.secondary" sx={{ mt: 4 }}>
          {t('Application not found.')}
        </Typography>
      )}

      {!loading && app && (
        <>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={2}
            sx={{ mt: 2, mb: 2 }}
          >
            {/* minWidth: 0 lets the title ellipsize instead of pushing the
                badges and actions out of place on a long name. */}
            <Stack direction="row" alignItems="center" gap={1.5} sx={{ minWidth: 0, flexGrow: 1 }}>
              <Tooltip title={app.name} arrow>
                <Typography variant="h5" fontWeight={700} noWrap sx={{ minWidth: 0 }}>
                  {app.name}
                </Typography>
              </Tooltip>
              <Stack direction="row" alignItems="center" gap={1.5} sx={{ flexShrink: 0 }}>
                <SyncStatusLabel status={app.syncState?.status} />
                <KindBadge kind={app.kind} />
              </Stack>
            </Stack>

            <Stack direction="row" alignItems="center" gap={1} sx={{ flexShrink: 0 }}>
              <Button
                size="small"
                variant="outlined"
                href={`${config.baseURL}/applications/${app.id}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ whiteSpace: 'nowrap' }}
              >
                {t('Open in PipeCD')}
              </Button>
            </Stack>
          </Stack>

          {app.syncState?.shortReason && (
            <Alert
              severity={SYNC_SEVERITY[app.syncState.status ?? 'UNKNOWN'] ?? 'info'}
              sx={{
                mb: 2,
                // MUI dims alert text in dark mode; tint it by severity at full strength.
                '& .MuiAlert-message': {
                  color: `${SYNC_SEVERITY[app.syncState.status ?? 'UNKNOWN'] ?? 'info'}.light`,
                },
              }}
            >
              {app.syncState.shortReason}
            </Alert>
          )}

          <Paper variant="outlined" sx={{ mb: 3 }}>
            <Table size="small" aria-label="application-details">
              <TableBody>
                {app.description && (
                  <DetailRow label={t('Description')}>{app.description}</DetailRow>
                )}
                <DetailRow label={t('Repository')}>
                  <Typography variant="body2" fontFamily="monospace">
                    {app.gitPath?.repo?.id ?? '—'}
                  </Typography>
                </DetailRow>
                <DetailRow label={t('Path')}>
                  <Typography variant="body2" fontFamily="monospace">
                    {app.gitPath?.path || '—'}
                  </Typography>
                </DetailRow>
                <DetailRow label={t('Piped')}>
                  <Typography variant="body2" fontFamily="monospace">
                    {app.pipedId}
                  </Typography>
                </DetailRow>
                <DetailRow label={t('Platform provider')}>{app.cloudProvider || '—'}</DetailRow>
                {app.labels && Object.keys(app.labels).length > 0 && (
                  <DetailRow label={t('Labels')}>
                    <Typography variant="body2" fontFamily="monospace">
                      {Object.entries(app.labels)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ')}
                    </Typography>
                  </DetailRow>
                )}
                <DetailRow label={t('Last Synced')}>{formatTimestamp(lastSyncedAt(app))}</DetailRow>
              </TableBody>
            </Table>
          </Paper>

          <Typography variant="h6" fontWeight={700} gutterBottom>
            {t('Deployments')}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {deployments.length === 0 ? (
            <Typography color="text.secondary">
              {t('No deployments yet for this application.')}
            </Typography>
          ) : (
            <Table aria-label="deployment-history" size="small">
              <TableHead>
                <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: 700 } }}>
                  <TableCell>{t('Summary')}</TableCell>
                  <TableCell>{t('Status')}</TableCell>
                  <TableCell>{t('Triggered by')}</TableCell>
                  <TableCell>{t('Started')}</TableCell>
                  <TableCell>{t('Duration')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deployments.map(deployment => (
                  <TableRow key={deployment.id} hover>
                    <TableCell>
                      <Link
                        component={RouterLink}
                        to={pluginURL(`/pipecd/deployments/${deployment.id}`)}
                        variant="body2"
                        underline="hover"
                        sx={{ display: 'block', maxWidth: 620 }}
                      >
                        {deployment.summary || deployment.id}
                      </Link>
                      {deployment.trigger?.commit?.hash && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontFamily="monospace"
                          display="block"
                          sx={{ mt: 0.25 }}
                        >
                          {deployment.trigger.commit.hash.slice(0, 8)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <DeploymentStatusLabel status={deployment.status} />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={triggeredBy(deployment.trigger, t).detail ?? ''} arrow>
                        <Typography variant="body2">
                          {triggeredBy(deployment.trigger, t).label}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={formatTimestamp(deployment.createdAt)} arrow>
                        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                          {relativeTime(deployment.createdAt, t)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                        {duration(deployment.createdAt, deployment.completedAt)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </Box>
  );
}
