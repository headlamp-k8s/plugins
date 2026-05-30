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
import { SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import {
  Box,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import {
  ClusterPolicyReport,
  PolicyReport,
  PolicyReportInterface,
  PolicyReportResult,
  PolicyResultStatus,
} from '../resources/policyReport';
import { ResultStatusChip, SeverityChip } from './common';

type GroupBy = 'none' | 'policy' | 'namespace' | 'kind';

export interface ViolationEntry extends PolicyReportResult {
  reportNamespace?: string;
  scope?: PolicyReportInterface['scope'];
}

const VIOLATION_STATUSES: PolicyResultStatus[] = ['fail', 'warn', 'error'];

function collectViolations(
  policyReports: PolicyReport[] | null,
  clusterPolicyReports: ClusterPolicyReport[] | null
): ViolationEntry[] {
  const violations: ViolationEntry[] = [];

  for (const report of policyReports || []) {
    for (const result of report.results) {
      if (VIOLATION_STATUSES.includes(result.result)) {
        violations.push({
          ...result,
          reportNamespace: report.jsonData.metadata.namespace,
          scope: report.jsonData.scope,
        });
      }
    }
  }

  for (const report of clusterPolicyReports || []) {
    for (const result of report.results) {
      if (VIOLATION_STATUSES.includes(result.result)) {
        violations.push({
          ...result,
          scope: report.jsonData.scope,
        });
      }
    }
  }

  return violations;
}

function getGroupKey(entry: ViolationEntry, groupBy: GroupBy): string {
  switch (groupBy) {
    case 'policy':
      return entry.policy || 'Unknown';
    case 'namespace':
      return entry.resources?.[0]?.namespace || entry.scope?.namespace || entry.reportNamespace || 'cluster-scoped';
    case 'kind':
      return entry.resources?.[0]?.kind || entry.scope?.kind || 'Unknown';
    default:
      return '';
  }
}

function groupViolations(
  violations: ViolationEntry[],
  groupBy: GroupBy
): Map<string, ViolationEntry[]> {
  const groups = new Map<string, ViolationEntry[]>();
  for (const v of violations) {
    const key = getGroupKey(v, groupBy);
    const list = groups.get(key) || [];
    list.push(v);
    groups.set(key, list);
  }
  return groups;
}

function StatusFilterChips({
  selected,
  onChange,
  counts,
}: {
  selected: PolicyResultStatus[];
  onChange: (statuses: PolicyResultStatus[]) => void;
  counts: Record<PolicyResultStatus, number>;
}) {
  function toggle(status: PolicyResultStatus) {
    if (selected.includes(status)) {
      if (selected.length > 1) {
        onChange(selected.filter(s => s !== status));
      }
    } else {
      onChange([...selected, status]);
    }
  }

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {VIOLATION_STATUSES.map(status => (
        <Chip
          key={status}
          label={`${status} (${counts[status] || 0})`}
          color={
            selected.includes(status)
              ? status === 'fail' || status === 'error'
                ? 'error'
                : 'warning'
              : 'default'
          }
          variant={selected.includes(status) ? 'filled' : 'outlined'}
          onClick={() => toggle(status)}
          sx={{ cursor: 'pointer' }}
        />
      ))}
    </Box>
  );
}

export interface PureViolationsViewProps {
  isLoading: boolean;
  violations: ViolationEntry[];
}

export function PureViolationsView({ isLoading, violations }: PureViolationsViewProps) {
  const { t } = useTranslation();
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [statusFilter, setStatusFilter] = useState<PolicyResultStatus[]>(VIOLATION_STATUSES);
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Column definitions depend on t() so they're built inside the component.
  const violationColumns = useMemo(
    () => [
      {
        header: t('Resource'),
        accessorFn: (v: ViolationEntry) => v.resources?.[0]?.name || v.scope?.name || '-',
      },
      {
        header: t('Kind'),
        accessorFn: (v: ViolationEntry) => v.resources?.[0]?.kind || v.scope?.kind || '-',
      },
      {
        header: t('Namespace'),
        accessorFn: (v: ViolationEntry) => v.resources?.[0]?.namespace || v.scope?.namespace || v.reportNamespace || '-',
      },
      {
        header: t('Policy'),
        accessorFn: (v: ViolationEntry) => v.policy,
      },
      {
        header: t('Rule'),
        accessorFn: (v: ViolationEntry) => v.rule || '-',
      },
      {
        header: t('Severity'),
        accessorFn: (v: ViolationEntry) => v.severity || '',
        Cell: ({ row }: { row: { original: ViolationEntry } }) => (
          <SeverityChip severity={row.original.severity} />
        ),
      },
      {
        header: t('Result'),
        accessorFn: (v: ViolationEntry) => v.result,
        Cell: ({ row }: { row: { original: ViolationEntry } }) => (
          <ResultStatusChip status={row.original.result} />
        ),
      },
      {
        header: t('Message'),
        accessorFn: (v: ViolationEntry) => v.message || '-',
      },
    ],
    [t]
  );

  const filteredViolations = useMemo(() => {
    return violations.filter(v => {
      if (!statusFilter.includes(v.result)) return false;
      if (severityFilter !== 'all' && v.severity !== severityFilter) return false;
      return true;
    });
  }, [violations, statusFilter, severityFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<PolicyResultStatus, number> = {
      fail: 0,
      warn: 0,
      error: 0,
      pass: 0,
      skip: 0,
    };
    for (const v of violations) {
      counts[v.result] = (counts[v.result] || 0) + 1;
    }
    return counts;
  }, [violations]);

  const severities = useMemo(() => {
    const set = new Set<string>();
    for (const v of violations) {
      if (v.severity) set.add(v.severity);
    }
    return Array.from(set).sort();
  }, [violations]);

  if (isLoading) {
    return (
      <SectionBox title={t('Violations')}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </SectionBox>
    );
  }

  const grouped = groupBy !== 'none' ? groupViolations(filteredViolations, groupBy) : null;

  return (
    <Box sx={{ p: 2 }}>
      <SectionBox title={`${t('Violations')} (${filteredViolations.length})`}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusFilterChips
            selected={statusFilter}
            onChange={setStatusFilter}
            counts={statusCounts}
          />

          {severities.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>{t('Severity')}</InputLabel>
              <Select
                value={severityFilter}
                label={t('Severity')}
                onChange={e => setSeverityFilter(e.target.value)}
              >
                <MenuItem value="all">{t('All')}</MenuItem>
                {severities.map(s => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <ToggleButtonGroup
            value={groupBy}
            exclusive
            onChange={(_, value) => {
              if (value !== null) setGroupBy(value);
            }}
            size="small"
          >
            <ToggleButton value="none">{t('Flat')}</ToggleButton>
            <ToggleButton value="policy">{t('By Policy')}</ToggleButton>
            <ToggleButton value="namespace">{t('By Namespace')}</ToggleButton>
            <ToggleButton value="kind">{t('By Kind')}</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {filteredViolations.length === 0 ? (
          <Typography variant="body2">{t('No violations found.')}</Typography>
        ) : grouped ? (
          Array.from(grouped.entries())
            .sort(([, a], [, b]) => b.length - a.length)
            .map(([group, entries]) => (
              <Box key={group} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  {group} ({entries.length})
                </Typography>
                <Table columns={violationColumns} data={entries} rowsPerPage={[25, 50, 100]} />
              </Box>
            ))
        ) : (
          <Table columns={violationColumns} data={filteredViolations} rowsPerPage={[25, 50, 100]} />
        )}
      </SectionBox>
    </Box>
  );
}

export function ViolationsView() {
  const { items: policyReports } = PolicyReport.useList();
  const { items: clusterPolicyReports } = ClusterPolicyReport.useList();

  const allViolations = useMemo(
    () => collectViolations(policyReports, clusterPolicyReports),
    [policyReports, clusterPolicyReports]
  );

  const isLoading = policyReports === null || clusterPolicyReports === null;

  return <PureViolationsView isLoading={isLoading} violations={allViolations} />;
}
