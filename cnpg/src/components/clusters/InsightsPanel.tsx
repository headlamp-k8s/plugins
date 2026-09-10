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

import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox, StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import React from 'react';
import { collectFindings } from '../../insights/registry';
import { Finding, Severity } from '../../insights/types';
import { ClusterClass, CNPG_GROUP } from '../../resources/cluster';
import { describeMissingPermissions, isForbidden, MaybeApiError } from '../../utils/permissions';
import { ClusterBackupData } from './useClusterBackupData';

/** Maps a finding severity onto the status colours Headlamp already uses. */
const SEVERITY_STATUS: Record<Severity, 'error' | 'warning' | 'success' | ''> = {
  critical: 'error',
  warning: 'warning',
  unknown: '',
  info: '',
};

function severityLabel(severity: Severity, t: (key: string) => string): string {
  switch (severity) {
    case 'critical':
      return t('Critical');
    case 'warning':
      return t('Warning');
    case 'unknown':
      return t('Unknown');
    default:
      return t('Info');
  }
}

/**
 * One finding, rendered without any knowledge of which provider produced it.
 *
 * The provider name is shown as attribution so that, once a second provider
 * exists, a reader can tell a deterministic CRD-derived finding from one that
 * came from somewhere else.
 */
function FindingCard({ finding }: { finding: Finding }) {
  const { t } = useTranslation();

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        <StatusLabel status={SEVERITY_STATUS[finding.severity]}>
          {severityLabel(finding.severity, t)}
        </StatusLabel>
        <Box sx={{ fontWeight: 500 }}>{finding.message}</Box>
      </Box>
      <Box component="ul" sx={{ m: 0, pl: 3, color: 'text.secondary', fontSize: '0.85rem' }}>
        {finding.evidence.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </Box>
      <Box sx={{ mt: 1, color: 'text.disabled', fontSize: '0.75rem' }}>
        {t('Source: {{ source }}', { source: finding.source })}
      </Box>
    </Paper>
  );
}

/**
 * The insights panel.
 *
 * It asks the registry for findings and renders them. It does not know which
 * providers are registered, how many there are, or how any of them reached a
 * conclusion — that is the seam the spec calls load-bearing, and keeping the
 * panel ignorant is what makes a second provider a registration rather than a
 * rewrite.
 */
export function InsightsPanel({
  cluster,
  backupData,
}: {
  cluster: ClusterClass;
  backupData: ClusterBackupData;
}) {
  const { t } = useTranslation();
  const [findings, setFindings] = React.useState<Finding[] | null>(null);
  const [failed, setFailed] = React.useState(false);

  const { backups, schedules, backupsReadable, schedulesReadable, backupsError, schedulesError } =
    backupData;
  const namespace = cluster.metadata.namespace ?? '';

  // Findings are recomputed whenever the cluster or its backups change. The
  // resource version is enough of a key for the cluster; the record arrays are
  // rebuilt on every render, so their contents are what the effect compares.
  const backupsKey = JSON.stringify(backups);
  const schedulesKey = JSON.stringify(schedules);
  const clusterVersion = cluster.metadata.resourceVersion;

  React.useEffect(() => {
    let cancelled = false;

    collectFindings({
      cluster: cluster.jsonData,
      backups,
      scheduledBackups: schedules,
      backupsReadable,
      scheduledBackupsReadable: schedulesReadable,
      now: Date.now(),
    })
      .then(result => {
        if (!cancelled) {
          setFindings(result);
        }
      })
      // The registry already isolates a failing provider, so reaching here means
      // the collection itself broke. Without this the panel sits on "Evaluating
      // checks…" for ever, which reads as "still working" rather than "failed".
      .catch(() => {
        if (!cancelled) {
          setFindings([]);
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusterVersion, backupsKey, schedulesKey, backupsReadable, schedulesReadable]);

  const denied = [
    backupsError && isForbidden(backupsError) ? 'backups' : null,
    schedulesError && isForbidden(schedulesError) ? 'scheduledbackups' : null,
  ].filter(Boolean) as string[];

  // An error that is not a denial would otherwise produce no visible signal at
  // all here, while the rules quietly downgrade to "unknown" — leaving the
  // reader to wonder why a check they expected an answer from went quiet.
  const unreadable = [
    backupsError && !isForbidden(backupsError) ? backupsError : null,
    schedulesError && !isForbidden(schedulesError) ? schedulesError : null,
  ].filter(Boolean) as MaybeApiError[];

  return (
    <SectionBox title={t('Insights')}>
      {denied.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('Backup-related checks were skipped: your account is not allowed to perform:')}
          {describeMissingPermissions({
            verb: 'list',
            resources: denied,
            apiGroup: CNPG_GROUP,
            namespace,
          }).map(permission => (
            <Box
              key={permission}
              component="code"
              sx={{ display: 'block', fontFamily: 'monospace' }}
            >
              {permission}
            </Box>
          ))}
        </Alert>
      )}

      {unreadable.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t(
            'Some checks could not be evaluated because the backup objects could not be read. They are reported as unknown rather than assumed.'
          )}
          {unreadable.map((error, index) => (
            <Box key={index} sx={{ fontSize: '0.85rem' }}>
              {error.message}
            </Box>
          ))}
        </Alert>
      )}

      {failed ? (
        <Alert severity="error">
          {t('The checks could not be evaluated. No conclusion should be drawn from this panel.')}
        </Alert>
      ) : findings === null ? (
        <Box sx={{ color: 'text.secondary' }}>{t('Evaluating checks…')}</Box>
      ) : findings.length === 0 ? (
        <Alert severity="success">
          {t('No issues found. Every check this plugin can make from CRD data passed.')}
        </Alert>
      ) : (
        findings.map(finding => (
          <FindingCard key={`${finding.source}:${finding.id}`} finding={finding} />
        ))
      )}

      <Box sx={{ mt: 1, color: 'text.secondary', fontSize: '0.8rem' }}>
        {t(
          'Findings are derived from Cluster, Backup and ScheduledBackup objects only. This plugin is read-only and takes no action on them.'
        )}
      </Box>
    </SectionBox>
  );
}
