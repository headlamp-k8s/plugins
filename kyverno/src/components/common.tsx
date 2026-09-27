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
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Link,
  Tooltip,
  Typography,
} from '@mui/material';
import { ReactNode } from 'react';
import { Trans } from 'react-i18next';
import { PolicyReportSummary, PolicyResultStatus } from '../resources/policyReport';

export function MetricCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color?: string;
}) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4" sx={{ color: color || 'text.primary', fontWeight: 'bold' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

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
          <Tooltip key={item.label} title={item.label}>
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

export function NotInstalledBanner({
  loading,
  message,
  learnMore,
}: {
  loading?: boolean;
  message?: string;
  /** Overrides the default "learn about installing Kyverno" link, for banners about something else. */
  learnMore?: ReactNode;
}) {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2} minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" p={2} minHeight="200px">
      <Box textAlign="center">
        <Typography variant="h5" gutterBottom>
          {message}
        </Typography>
        <Typography>
          {learnMore ?? (
            // Keep the sentence in one i18n unit so translators can place the link
            // anywhere in the translated string. <1> matches the Link child.
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
          )}
        </Typography>
      </Box>
    </Box>
  );
}
