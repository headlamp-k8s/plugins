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
import { Loader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Chip, Link, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Trans } from 'react-i18next';
import { PolicyReportSummary, PolicyResultStatus } from '../resources/policyReport';

const statusColors: Record<PolicyResultStatus, 'success' | 'error' | 'warning' | 'default'> = {
  pass: 'success',
  fail: 'error',
  error: 'error',
  warn: 'warning',
  skip: 'default',
};

const severityColors: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  critical: 'error',
  high: 'error',
  medium: 'warning',
  low: 'info',
  info: 'default',
};

/**
 * Headlamp's shared Table/ResourceListView memoizes header cells by column id alone, ignoring the
 * translated header text, so a column whose first render catches t() before its resources are
 * loaded can get stuck showing a blank or default-locale label even once the real translation
 * arrives. The id itself has to stay a stable, semantic string though, never derived from the
 * live header text as an earlier version of this fix did: Table/ResourceListView treats id as
 * public state (Headlamp persists column sort/visibility by id, and
 * registerResourceTableColumnsProcessor integrations can target a specific id), so a
 * translation-dependent id invalidates existing user settings the moment the real translation
 * lands, and again on every later locale change.
 *
 * Keying the table itself with this value is the actual fix: `ready` (from useTranslation())
 * flips false -> true exactly once translations finish loading, so including it forces React to
 * fully remount the table at that point, discarding Headlamp's stale memoized header cells along
 * with the rest of the old component instance, without the column ids ever changing. `ready`
 * alone only covers that first transition though: confirmed directly in
 * @kinvolk/headlamp-plugin's pluginI18n.js, the plugin's own i18next instance gets synced to a
 * new language in a separate effect whenever Headlamp's main app locale changes, but `ready`
 * itself is a one-shot flag that never resets for that, so a later locale switch would leave the
 * key unchanged and the memoized headers stuck on whichever locale was active the first time.
 * Folding in the plugin's current language (`i18n?.language` from useTranslation(), undefined
 * before the instance exists) covers that case too, forcing a fresh remount on every genuine
 * language change, not just the initial load.
 */
export function tableRemountKey(ready: boolean, language?: string): string {
  return ready ? `translations-ready:${language ?? ''}` : 'translations-loading';
}

export function ResultStatusChip({ status }: { status: PolicyResultStatus }) {
  return <Chip label={status} color={statusColors[status] || 'default'} size="small" />;
}

export function SeverityChip({ severity }: { severity?: string }) {
  if (!severity) return null;
  return (
    <Chip
      label={severity}
      color={severityColors[severity] || 'default'}
      size="small"
      variant="outlined"
    />
  );
}

export function SummaryChips({ summary }: { summary: PolicyReportSummary }) {
  const { t } = useTranslation();
  const items: { label: string; count: number; status: PolicyResultStatus }[] = [
    { label: t('Pass'), count: summary.pass || 0, status: 'pass' },
    { label: t('Fail'), count: summary.fail || 0, status: 'fail' },
    { label: t('Warn'), count: summary.warn || 0, status: 'warn' },
    { label: t('Error'), count: summary.error || 0, status: 'error' },
    { label: t('Skip'), count: summary.skip || 0, status: 'skip' },
  ];

  return (
    <span style={{ display: 'inline-flex', gap: '4px' }}>
      {items
        .filter(item => item.count > 0)
        .map(item => (
          // Keyed on the untranslated status enum, not the translated label: unlike a Table
          // column id, a list key has no reason to be derived from translated text at all here,
          // and status is already stable and unique per item regardless of i18n load state.
          <Tooltip key={item.status} title={item.label}>
            <Chip
              label={`${item.label}: ${item.count}`}
              color={statusColors[item.status]}
              size="small"
              variant="outlined"
            />
          </Tooltip>
        ))}
    </span>
  );
}

export function NotInstalledBanner({ loading, message }: { loading?: boolean; message?: string }) {
  const { t } = useTranslation();
  // Screen readers reliably announce changes to an existing live region, but not
  // content that is present in the render that creates it. Cached CRD results make
  // CRDGuard render the not-installed state on first mount, so the region always
  // mounts empty and the message is inserted right after.
  const [announce, setAnnounce] = useState(false);
  useEffect(() => setAnnounce(true), []);

  return (
    <Box
      role="status"
      aria-live="polite"
      aria-atomic="true"
      display="flex"
      justifyContent="center"
      alignItems="center"
      p={2}
      minHeight="200px"
    >
      {loading ? (
        <Loader title={t('Detecting Kyverno resources')} />
      ) : (
        announce && (
          <Box textAlign="center">
            <Typography variant="h5" gutterBottom>
              {message}
            </Typography>
            <Typography>
              {/* Keep the sentence in one i18n unit so translators can place the link
                  anywhere in the translated string. <1> matches the Link child. */}
              <Trans i18nKey="kyverno.learnAboutInstalling">
                Learn more about{' '}
                <Link
                  href="https://kyverno.io/docs/installation/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  installing Kyverno
                </Link>
              </Trans>
            </Typography>
          </Box>
        )
      )}
    </Box>
  );
}
