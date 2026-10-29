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
  Button,
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
import { DrillDownTarget } from '../resources/policyImpact';
import {
  ClusterPolicyReport,
  PolicyReport,
  PolicyReportInterface,
  PolicyReportResult,
  PolicyReportSource,
  PolicyResultStatus,
} from '../resources/policyReport';
import { ResultStatusChip, SeverityChip, tableRemountKey } from './common';
import { ViolationDrillDown } from './ViolationDrillDown';

type GroupBy = 'none' | 'policy' | 'namespace' | 'kind';

interface ViolationEntry extends PolicyReportResult {
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
      return (
        entry.resources?.[0]?.namespace ||
        entry.scope?.namespace ||
        entry.reportNamespace ||
        'cluster-scoped'
      );
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

function entryToTarget(v: ViolationEntry): DrillDownTarget {
  const resource = v.resources?.[0] ?? v.scope;
  return {
    policy: v.policy,
    source: v.source as PolicyReportSource | undefined,
    rule: v.rule,
    kind: resource?.kind,
    apiVersion: resource?.apiVersion,
    name: resource?.name,
    namespace: resource?.namespace ?? v.reportNamespace,
    message: v.message,
    severity: v.severity,
    status: v.result,
  };
}

export function ViolationsView() {
  const { i18n, ready, t } = useTranslation();
  const { items: policyReports } = PolicyReport.useList();
  const { items: clusterPolicyReports } = ClusterPolicyReport.useList();
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [statusFilter, setStatusFilter] = useState<PolicyResultStatus[]>(VIOLATION_STATUSES);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [drillDownTarget, setDrillDownTarget] = useState<DrillDownTarget | null>(null);

  // Each header string is computed once and reused for both `header` and the
  // column id, rather than calling t() twice per column. The column array is
  // memoized on those header strings specifically, not on `t` itself (whose
  // reference doesn't change when the translation backend finishes loading,
  // so depending on it directly would never actually refresh anything). The
  // id itself stays a stable, semantic string though, see tableRemountKey in
  // common.tsx for why: Headlamp memoizes header cells by id alone, so a
  // blank pre-translation label would otherwise stick around even once the
  // real translation arrives, fixed by remounting the table via key once
  // translations are ready instead of changing the id. Body cells here
  // render resource data, not translated labels, so they aren't affected.
  const resourceHeader = t('Resource');
  const kindHeader = t('Kind');
  const namespaceHeader = t('Namespace');
  const policyHeader = t('Policy');
  const ruleHeader = t('Rule');
  const severityHeader = t('Severity');
  const resultHeader = t('Result');
  const messageHeader = t('Message');
  const detailsHeader = t('Details');

  const violationColumns = useMemo(
    () => [
      {
        header: resourceHeader,
        id: 'resource',
        accessorFn: (v: ViolationEntry) => v.resources?.[0]?.name || v.scope?.name || '-',
      },
      {
        header: kindHeader,
        id: 'kind',
        accessorFn: (v: ViolationEntry) => v.resources?.[0]?.kind || v.scope?.kind || '-',
      },
      {
        header: namespaceHeader,
        id: 'namespace',
        accessorFn: (v: ViolationEntry) =>
          v.resources?.[0]?.namespace || v.scope?.namespace || v.reportNamespace || '-',
      },
      {
        header: policyHeader,
        id: 'policy',
        accessorFn: (v: ViolationEntry) => v.policy,
      },
      {
        header: ruleHeader,
        id: 'rule',
        accessorFn: (v: ViolationEntry) => v.rule || '-',
      },
      {
        header: severityHeader,
        id: 'severity',
        accessorFn: (v: ViolationEntry) => v.severity || '',
        Cell: ({ row }: { row: { original: ViolationEntry } }) => (
          <SeverityChip severity={row.original.severity} />
        ),
      },
      {
        header: resultHeader,
        id: 'result',
        accessorFn: (v: ViolationEntry) => v.result,
        Cell: ({ row }: { row: { original: ViolationEntry } }) => (
          <ResultStatusChip status={row.original.result} />
        ),
      },
      {
        header: messageHeader,
        id: 'message',
        accessorFn: (v: ViolationEntry) => v.message || '-',
      },
      {
        header: detailsHeader,
        id: 'details',
        // accessorFn returns the rule name so the column is sortable; the Cell renders the button.
        accessorFn: (v: ViolationEntry) => v.rule ?? '',
        Cell: ({ row }: { row: { original: ViolationEntry } }) => (
          <Button
            size="small"
            variant="outlined"
            aria-label={t('Open violation details')}
            onClick={() => setDrillDownTarget(entryToTarget(row.original))}
          >
            {detailsHeader}
          </Button>
        ),
      },
    ],
    [
      resourceHeader,
      kindHeader,
      namespaceHeader,
      policyHeader,
      ruleHeader,
      severityHeader,
      resultHeader,
      messageHeader,
      detailsHeader,
      setDrillDownTarget,
    ]
  );

  const allViolations = useMemo(
    () => collectViolations(policyReports, clusterPolicyReports),
    [policyReports, clusterPolicyReports]
  );

  const filteredViolations = useMemo(() => {
    return allViolations.filter(v => {
      if (!statusFilter.includes(v.result)) return false;
      if (severityFilter !== 'all' && v.severity !== severityFilter) return false;
      return true;
    });
  }, [allViolations, statusFilter, severityFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<PolicyResultStatus, number> = {
      fail: 0,
      warn: 0,
      error: 0,
      pass: 0,
      skip: 0,
    };
    for (const v of allViolations) {
      counts[v.result] = (counts[v.result] || 0) + 1;
    }
    return counts;
  }, [allViolations]);

  const severities = useMemo(() => {
    const set = new Set<string>();
    for (const v of allViolations) {
      if (v.severity) set.add(v.severity);
    }
    return Array.from(set).sort();
  }, [allViolations]);

  // Wait for BOTH streams — partial data here would silently undercount violations.
  const isLoading = policyReports === null || clusterPolicyReports === null;

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
      <ViolationDrillDown target={drillDownTarget} onClose={() => setDrillDownTarget(null)} />
      <SectionBox title={t('Violations ({{count}})', { count: filteredViolations.length })}>
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
                <Table
                  key={tableRemountKey(ready, i18n?.language)}
                  columns={violationColumns}
                  data={entries}
                  rowsPerPage={[25, 50, 100]}
                />
              </Box>
            ))
        ) : (
          <Table
            key={tableRemountKey(ready, i18n?.language)}
            columns={violationColumns}
            data={filteredViolations}
            rowsPerPage={[25, 50, 100]}
          />
        )}
      </SectionBox>
    </Box>
  );
}
