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

import { Chip, Tooltip } from '@mui/material';
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

export function ResultStatusChip({ status }: { status: PolicyResultStatus }) {
  return <Chip label={status} color={statusColors[status] || 'default'} size="small" />;
}

export function SeverityChip({ severity }: { severity?: string }) {
  if (!severity) return null;
  return <Chip label={severity} color={severityColors[severity] || 'default'} size="small" variant="outlined" />;
}

export function SummaryChips({ summary }: { summary: PolicyReportSummary }) {
  const items: { label: string; count: number; status: PolicyResultStatus }[] = [
    { label: 'Pass', count: summary.pass || 0, status: 'pass' },
    { label: 'Fail', count: summary.fail || 0, status: 'fail' },
    { label: 'Warn', count: summary.warn || 0, status: 'warn' },
    { label: 'Error', count: summary.error || 0, status: 'error' },
    { label: 'Skip', count: summary.skip || 0, status: 'skip' },
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
