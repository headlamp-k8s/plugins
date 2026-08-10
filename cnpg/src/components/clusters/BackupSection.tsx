/*
 * Copyright 2026 The Kubernetes Authors
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

import { useTranslation, Utils } from '@kinvolk/headlamp-plugin/lib';
import {
  LightTooltip,
  NameValueTable,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import React from 'react';
import { ClusterClass, CNPG_GROUP } from '../../resources/cluster';
import {
  BackupRecord,
  describeBackupConfiguration,
  getContinuousArchivingStatus,
  getFirstRecoverabilityPoint,
  ScheduledBackupRecord,
  summarizeBackups,
} from '../../utils/backupFacts';
import { describeMissingPermission, isForbidden } from '../../utils/permissions';
import { ClusterBackupData } from './useClusterBackupData';

/** Renders a timestamp as "x ago", with the exact value on hover. */
function TimeAgo({ timestamp }: { timestamp: string }) {
  return (
    <LightTooltip title={timestamp}>
      <span>{Utils.timeAgo(timestamp)}</span>
    </LightTooltip>
  );
}

/** Renders a value the cluster does not report, with the reason on hover. */
function UnknownValue({ reason }: { reason: string }) {
  const { t } = useTranslation();

  return (
    <LightTooltip title={reason}>
      <Box component="span" sx={{ color: 'text.secondary' }}>
        {t('Unknown')}
      </Box>
    </LightTooltip>
  );
}

function InlinePermissionDenied({
  verb,
  resource,
  namespace,
}: {
  verb: string;
  resource: string;
  namespace: string;
}) {
  const { t } = useTranslation();

  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      {t('Backup facts are incomplete: your account is not allowed to perform this action:')}{' '}
      <Box component="code" sx={{ fontFamily: 'monospace' }}>
        {describeMissingPermission({ verb, resource, apiGroup: CNPG_GROUP, namespace })}
      </Box>
    </Alert>
  );
}

/**
 * What is actually known about this cluster's backups and how far back it could
 * be restored.
 *
 * The facts come from Backup and ScheduledBackup objects, not from the backup
 * timestamps on Cluster.status: those are annotated "Deprecated: the field is
 * not set for backup plugins" upstream, so on a plugin-based cluster they are
 * empty however healthy its backups are. The single fact with no Backup-object
 * equivalent is the first recoverability point, which is shown as unknown
 * rather than guessed at.
 *
 * This section reports facts only. It draws no conclusion about whether the
 * cluster is adequately protected; that judgement belongs to the rules engine.
 */
export function BackupSection({
  cluster,
  backupData,
}: {
  cluster: ClusterClass;
  backupData: ClusterBackupData;
}) {
  const { t } = useTranslation();
  const namespace = cluster.metadata.namespace ?? '';

  const { backups: records, schedules, backupsError, schedulesError: scheduledError } = backupData;
  const summary = summarizeBackups(records);

  const configuration = describeBackupConfiguration(cluster.jsonData);
  const archiving = getContinuousArchivingStatus(cluster.jsonData);
  const firstRecoverabilityPoint = getFirstRecoverabilityPoint(cluster.jsonData);

  const backupsUnreadable = Boolean(backupsError);
  const configurationText =
    configuration.kind === 'barmanObjectStore'
      ? t('Barman object store, configured on the cluster')
      : configuration.kind === 'plugin'
      ? t('WAL archiver plugin: {{ plugins }}', {
          plugins: configuration.walArchiverPlugins.join(', '),
        })
      : t('None configured on this cluster');

  const rows = [
    {
      name: t('Backup configuration'),
      value: (
        <Box>
          {configurationText}
          {configuration.retentionPolicy && (
            <Box sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
              {t('Retention policy: {{ policy }}', { policy: configuration.retentionPolicy })}
            </Box>
          )}
        </Box>
      ),
    },
    {
      name: t('WAL archiving'),
      value:
        archiving.state === 'unknown' ? (
          <UnknownValue
            reason={t('The operator has not reported a ContinuousArchiving condition yet.')}
          />
        ) : (
          <Box>
            <StatusLabel status={archiving.state === 'ok' ? 'success' : 'error'}>
              {archiving.reason ?? (archiving.state === 'ok' ? t('Working') : t('Failing'))}
            </StatusLabel>
            {archiving.message && (
              <Box sx={{ mt: 0.5, fontSize: '0.85rem' }}>{archiving.message}</Box>
            )}
            {configuration.kind === 'none' && archiving.state === 'ok' && (
              <Box sx={{ mt: 0.5, color: 'text.secondary', fontSize: '0.85rem' }}>
                {t(
                  'The operator reports archiving as healthy even when no backup destination is configured, so this alone does not mean WAL is being stored anywhere.'
                )}
              </Box>
            )}
          </Box>
        ),
    },
    {
      name: t('Last successful backup'),
      value: backupsUnreadable ? (
        <UnknownValue reason={t('Backup objects could not be read.')} />
      ) : summary.lastSuccessful ? (
        <Box>
          {summary.lastSuccessful.completedAt ? (
            <TimeAgo timestamp={summary.lastSuccessful.completedAt} />
          ) : (
            <UnknownValue reason={t('The Backup object reports no completion time.')} />
          )}
          <Box sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
            {summary.lastSuccessful.name}
            {summary.lastSuccessful.method ? ` · ${summary.lastSuccessful.method}` : ''}
          </Box>
        </Box>
      ) : (
        t('No completed Backup object exists for this cluster')
      ),
    },
    {
      name: t('Last failed backup'),
      // Hidden rather than shown as "none": absence of a failure is not a fact
      // worth a row, but a failure always is.
      hide: !summary.lastFailed,
      value: summary.lastFailed && (
        <Box>
          {summary.lastFailed.completedAt && <TimeAgo timestamp={summary.lastFailed.completedAt} />}
          <Box sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
            {summary.lastFailed.name} · {summary.lastFailed.phase}
          </Box>
          {summary.lastFailed.error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {summary.lastFailed.error}
            </Alert>
          )}
        </Box>
      ),
    },
    {
      name: t('Backups in progress'),
      hide: summary.inProgress.length === 0,
      value: summary.inProgress.map(backup => `${backup.name} (${backup.phase})`).join(', '),
    },
    {
      name: t('Oldest restorable point'),
      value: firstRecoverabilityPoint ? (
        <TimeAgo timestamp={firstRecoverabilityPoint} />
      ) : (
        <UnknownValue
          reason={t(
            'CloudNativePG only reports firstRecoverabilityPoint for non-plugin backup methods, and no Backup object carries the equivalent, so this cannot be determined from CRD data alone.'
          )}
        />
      ),
    },
    {
      name: t('Backup objects'),
      value: backupsUnreadable ? (
        <UnknownValue reason={t('Backup objects could not be read.')} />
      ) : (
        String(summary.total)
      ),
    },
  ];

  return (
    <SectionBox title={t('Backup and restore confidence')}>
      {backupsError && isForbidden(backupsError) && (
        <InlinePermissionDenied verb="list" resource="backups" namespace={namespace} />
      )}
      {backupsError && !isForbidden(backupsError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('Could not read Backup objects: {{ message }}', { message: backupsError.message })}
        </Alert>
      )}
      {scheduledError && isForbidden(scheduledError) && (
        <InlinePermissionDenied verb="list" resource="scheduledbackups" namespace={namespace} />
      )}

      <NameValueTable rows={rows} />

      <Box sx={{ mt: 2 }}>
        <SectionBox title={t('Scheduled backups')}>
          <SimpleTable
            columns={[
              {
                label: t('Name'),
                getter: (schedule: ScheduledBackupRecord) => schedule.name,
              },
              {
                label: t('Schedule'),
                getter: (schedule: ScheduledBackupRecord) => schedule.schedule ?? '—',
              },
              {
                label: t('Suspended'),
                getter: (schedule: ScheduledBackupRecord) =>
                  schedule.suspended ? (
                    <StatusLabel status="warning">{t('Suspended')}</StatusLabel>
                  ) : (
                    t('No')
                  ),
              },
              {
                label: t('Next run'),
                getter: (schedule: ScheduledBackupRecord) =>
                  schedule.nextScheduleTime ? (
                    <TimeAgo timestamp={schedule.nextScheduleTime} />
                  ) : (
                    '—'
                  ),
              },
              {
                label: t('Error'),
                getter: (schedule: ScheduledBackupRecord) => schedule.error ?? '—',
              },
            ]}
            data={schedules}
            emptyMessage={
              scheduledError
                ? t('Scheduled backups could not be read')
                : t('No ScheduledBackup targets this cluster')
            }
          />
        </SectionBox>
      </Box>

      <RecentBackups records={records} unreadable={backupsUnreadable} />
    </SectionBox>
  );
}

/** The cluster's most recent Backup objects, newest first. */
function RecentBackups({ records, unreadable }: { records: BackupRecord[]; unreadable: boolean }) {
  const { t } = useTranslation();

  const recent = [...records]
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
    .slice(0, 10);

  return (
    <Box sx={{ mt: 2 }}>
      <SectionBox title={t('Recent backups')}>
        <SimpleTable
          columns={[
            { label: t('Name'), getter: (backup: BackupRecord) => backup.name },
            {
              label: t('Phase'),
              getter: (backup: BackupRecord) => backup.phase ?? t('Unknown'),
            },
            {
              label: t('Method'),
              getter: (backup: BackupRecord) => backup.method ?? '—',
            },
            {
              label: t('Finished'),
              getter: (backup: BackupRecord) =>
                backup.completedAt ? <TimeAgo timestamp={backup.completedAt} /> : '—',
            },
          ]}
          data={recent}
          emptyMessage={
            unreadable
              ? t('Backup objects could not be read')
              : t('No Backup object targets this cluster')
          }
        />
      </SectionBox>
    </Box>
  );
}
