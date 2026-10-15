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
import { Box, Chip, CircularProgress, Typography } from '@mui/material';
import { useMemo } from 'react';
import { PolicyRule } from '../resources/kyvernoPolicy';
import {
  collectPolicyImpact,
  describeMatchReasons,
  ImpactedResource,
} from '../resources/policyImpact';
import { ClusterPolicyReport, POLICY_REPORT_SOURCE, PolicyReport } from '../resources/policyReport';
import { ResultStatusChip, SeverityChip, tableRemountKey } from './common';

interface PolicyImpactPanelProps {
  policyName: string;
  policyNamespace?: string;
  rules: PolicyRule[];
}

/**
 * Shows which live resources a policy actually evaluated, grouped by kind,
 * with a plain-language reason drawn from the policy's own match selectors.
 * Built from PolicyReport / ClusterPolicyReport data so it reflects what
 * Kyverno really did rather than a re-implementation of its match engine.
 *
 * Scoped to POLICY_REPORT_SOURCE.legacy: this panel is only wired into
 * PolicyViewer, which only ever renders the legacy kyverno.io/v1 Policy and
 * ClusterPolicy kinds, never the CEL policy kinds.
 *
 * No drill-down link yet, that opens a dialog PR-4 hasn't built yet.
 */
export function PolicyImpactPanel({ policyName, policyNamespace, rules }: PolicyImpactPanelProps) {
  const { i18n, ready, t } = useTranslation();
  const policyReportQuery = PolicyReport.useList();
  const clusterPolicyReportQuery = ClusterPolicyReport.useList();
  const policyReports = policyReportQuery.items;
  const clusterPolicyReports = clusterPolicyReportQuery.items;

  // `items` stays null when a list never resolves, including when the report
  // CRDs are absent or RBAC denies them, so deriving loading from
  // `items === null` would leave this panel spinning forever. Use the
  // query's own state instead (see usePolicyResultCounts.ts), which settles
  // on error too, an errored list then contributes no results and falls
  // through to the empty state below.
  const loading = policyReportQuery.isLoading || clusterPolicyReportQuery.isLoading;

  const impact = useMemo(
    () =>
      collectPolicyImpact(
        policyName,
        POLICY_REPORT_SOURCE.legacy,
        policyReports,
        clusterPolicyReports,
        policyNamespace
      ),
    [policyName, policyNamespace, policyReports, clusterPolicyReports]
  );

  // See ViolationsView/common.tsx for why headers are computed once and the
  // table is remounted via key once translations are ready.
  const namespaceHeader = t('Namespace');
  const nameHeader = t('Name');
  const statusHeader = t('Status');
  const severityHeader = t('Severity');
  const ruleHeader = t('Rule');

  const columns = useMemo(
    () => [
      {
        header: namespaceHeader,
        id: 'namespace',
        accessorFn: (r: ImpactedResource) => r.namespace || '-',
      },
      {
        header: nameHeader,
        id: 'name',
        accessorFn: (r: ImpactedResource) => r.name,
      },
      {
        header: statusHeader,
        id: 'status',
        accessorFn: (r: ImpactedResource) => r.status,
        Cell: ({ row }: { row: { original: ImpactedResource } }) => (
          <ResultStatusChip status={row.original.status} />
        ),
      },
      {
        header: severityHeader,
        id: 'severity',
        accessorFn: (r: ImpactedResource) => r.severity || '',
        Cell: ({ row }: { row: { original: ImpactedResource } }) => (
          <SeverityChip severity={row.original.severity} />
        ),
      },
      {
        header: ruleHeader,
        id: 'rule',
        accessorFn: (r: ImpactedResource) => r.rule || '-',
      },
    ],
    [namespaceHeader, nameHeader, statusHeader, severityHeader, ruleHeader]
  );

  if (loading) {
    return (
      <SectionBox title={t('Policy Impact Map')}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      </SectionBox>
    );
  }

  if (impact.resources.length === 0) {
    return (
      <SectionBox title={t('Policy Impact Map')}>
        <Typography variant="body2" color="text.secondary">
          {t(
            'No evaluated resources found for this policy yet. Once Kyverno scans a matching resource, it will appear here grouped by kind.'
          )}
        </Typography>
      </SectionBox>
    );
  }

  return (
    <SectionBox title={t('Policy Impact Map')}>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip label={t('{{count}} resources', { count: impact.resources.length })} size="small" />
        <Chip label={t('{{count}} namespaces', { count: impact.namespaces.size })} size="small" />
        <Chip
          label={t('{{count}} passing', { count: impact.counts.pass })}
          color="success"
          size="small"
          variant="outlined"
        />
        <Chip
          label={t('{{count}} failing', { count: impact.counts.fail + impact.counts.error })}
          color="error"
          size="small"
          variant="outlined"
        />
        {impact.counts.warn > 0 && (
          <Chip
            label={t('{{count}} warnings', { count: impact.counts.warn })}
            color="warning"
            size="small"
            variant="outlined"
          />
        )}
      </Box>

      {Array.from(impact.byKind.entries()).map(([kind, resources]) => (
        <Box key={kind} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {kind} ({resources.length})
          </Typography>
          {describeMatchReasons(rules, kind).map((reason, i) => (
            <Typography
              key={i}
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 0.5 }}
            >
              {reason}
            </Typography>
          ))}
          <Table key={tableRemountKey(ready, i18n?.language)} columns={columns} data={resources} />
        </Box>
      ))}
    </SectionBox>
  );
}
