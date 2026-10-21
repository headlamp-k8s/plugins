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
  // A namespaced Policy can only ever match resources in its own namespace (Kyverno enforces
  // this), so its results only ever land in a namespaced PolicyReport, never a
  // ClusterPolicyReport, confirmed against policyReport.ts: PolicyReport.isNamespaced = true,
  // ClusterPolicyReport.isNamespaced = false. Scoping this read to policyNamespace instead of
  // reading cluster-wide means a user who can only read PolicyReports in their own namespace
  // still sees this panel; a ClusterPolicy (policyNamespace undefined) still needs the
  // unscoped read, since it can match resources in any namespace.
  const policyReportQuery = PolicyReport.useList({ namespace: policyNamespace });
  // Called unconditionally either way (Rules of Hooks), but its loading state, errors, and
  // items are deliberately excluded below for a namespaced Policy: requiring cluster-wide
  // ClusterPolicyReport read access to view a namespaced Policy's impact would deny a user
  // real, usable data they already have every permission to see.
  const clusterPolicyReportQuery = ClusterPolicyReport.useList();
  const policyReports = policyReportQuery.items;
  const clusterPolicyReports = policyNamespace ? null : clusterPolicyReportQuery.items;

  // `items` stays null when a list never resolves, including when the report
  // CRDs are absent or RBAC denies them, so deriving loading from
  // `items === null` would leave this panel spinning forever. Use the
  // query's own state instead (see usePolicyResultCounts.ts). Loading
  // settles on error too, but an errored query's `items` is still null, so
  // it has to be checked for explicitly below, otherwise it would silently
  // read as "no evaluated resources" or get counted as zero instead of
  // surfacing that this data could not actually be fetched.
  const loading =
    policyReportQuery.isLoading || (!policyNamespace && clusterPolicyReportQuery.isLoading);
  const queryError =
    policyReportQuery.errors?.[0] ||
    (policyNamespace ? undefined : clusterPolicyReportQuery.errors?.[0]);

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
  // Rows are already grouped by kind (see impact.byKind below), but different API groups can
  // share the same kind, namespace, and name, e.g. a core v1 "Widget" and an acme.io/v1
  // "Widget" (confirmed distinct in collectPolicyImpact's own cross-group regression test,
  // which keys resources by group/kind/namespace/name specifically so this isn't collapsed).
  // Without apiVersion in the table itself a user has no way to tell which object a given row
  // actually names.
  const apiVersionHeader = t('API Version');
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
        header: apiVersionHeader,
        id: 'apiVersion',
        accessorFn: (r: ImpactedResource) => r.apiVersion || '-',
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
    [namespaceHeader, nameHeader, apiVersionHeader, statusHeader, severityHeader, ruleHeader]
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

  if (queryError) {
    return (
      <SectionBox title={t('Policy Impact Map')}>
        <Typography variant="body2" color="error">
          {t('Could not load report data for this policy: {{error}}', {
            error: String(queryError),
          })}
        </Typography>
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
          {describeMatchReasons(rules, kind, t).map((reason, i) => (
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
