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
import { Box, Button, Chip, CircularProgress, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { PolicyRule } from '../resources/kyvernoPolicy';
import {
  collectPolicyImpact,
  describeMatchReasons,
  DrillDownTarget,
  ImpactedResource,
} from '../resources/policyImpact';
import {
  ClusterPolicyReport,
  POLICY_REPORT_SOURCE,
  PolicyReport,
  PolicyReportSource,
} from '../resources/policyReport';
import { ResultStatusChip, SeverityChip, tableRemountKey } from './common';
import { ViolationDrillDown } from './ViolationDrillDown';

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
 * A namespaced Policy can only ever match resources in its own namespace (Kyverno enforces this),
 * so its results only ever land in a namespaced PolicyReport, never a ClusterPolicyReport,
 * confirmed against policyReport.ts: PolicyReport.isNamespaced = true, ClusterPolicyReport.
 * isNamespaced = false. A ClusterPolicy (policyNamespace undefined) needs the unscoped PolicyReport
 * read too, since it can match resources in any namespace, plus ClusterPolicyReport for
 * cluster-scoped ones. Split into two data-fetching wrappers below, selected here, instead of one
 * component calling both hooks unconditionally and discarding the cluster one's result for a
 * namespaced Policy: React's Rules of Hooks mean a single component can't conditionally skip
 * ClusterPolicyReport.useList(), but two separately-mounted components can each call only the hook
 * their own case needs, so a namespace-only RBAC identity never issues that forbidden cluster-wide
 * request in the first place.
 */
export function PolicyImpactPanel({ policyName, policyNamespace, rules }: PolicyImpactPanelProps) {
  return policyNamespace ? (
    <NamespacedPolicyImpact
      policyName={policyName}
      policyNamespace={policyNamespace}
      rules={rules}
    />
  ) : (
    <ClusterPolicyImpact policyName={policyName} rules={rules} />
  );
}

function NamespacedPolicyImpact({
  policyName,
  policyNamespace,
  rules,
}: {
  policyName: string;
  policyNamespace: string;
  rules: PolicyRule[];
}) {
  const policyReportQuery = PolicyReport.useList({ namespace: policyNamespace });
  return (
    <PolicyImpactPanelBody
      policyName={policyName}
      policyNamespace={policyNamespace}
      rules={rules}
      policyReports={policyReportQuery.items}
      // Never fetched for a namespaced Policy, not merely loading: a namespaced Policy can't
      // match any cluster-scoped resource, so an empty list is the real, complete answer here,
      // not a placeholder waiting on a request this scope has no business making.
      clusterPolicyReports={[]}
      loading={policyReportQuery.isLoading}
      queryError={policyReportQuery.errors?.[0]}
    />
  );
}

function ClusterPolicyImpact({ policyName, rules }: { policyName: string; rules: PolicyRule[] }) {
  const policyReportQuery = PolicyReport.useList();
  const clusterPolicyReportQuery = ClusterPolicyReport.useList();
  return (
    <PolicyImpactPanelBody
      policyName={policyName}
      policyNamespace={undefined}
      rules={rules}
      policyReports={policyReportQuery.items}
      clusterPolicyReports={clusterPolicyReportQuery.items}
      loading={policyReportQuery.isLoading || clusterPolicyReportQuery.isLoading}
      queryError={policyReportQuery.errors?.[0] || clusterPolicyReportQuery.errors?.[0]}
    />
  );
}

function PolicyImpactPanelBody({
  policyName,
  policyNamespace,
  rules,
  policyReports,
  clusterPolicyReports,
  loading,
  queryError,
}: {
  policyName: string;
  policyNamespace?: string;
  rules: PolicyRule[];
  policyReports: PolicyReport[] | null;
  clusterPolicyReports: ClusterPolicyReport[] | null;
  loading: boolean;
  queryError: unknown;
}) {
  const { i18n, ready, t } = useTranslation();
  const [drillDownTarget, setDrillDownTarget] = useState<DrillDownTarget | null>(null);

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
  const detailsHeader = t('Details');

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
      {
        header: detailsHeader,
        id: 'details',
        accessorFn: (r: ImpactedResource) => r.status,
        Cell: ({ row }: { row: { original: ImpactedResource } }) => (
          <Button
            size="small"
            variant="outlined"
            aria-label={t('Open violation details')}
            onClick={() =>
              setDrillDownTarget({
                policy: policyNamespace ? `${policyNamespace}/${policyName}` : policyName,
                source: POLICY_REPORT_SOURCE.legacy as PolicyReportSource,
                rule: row.original.rule,
                kind: row.original.kind,
                apiVersion: row.original.apiVersion,
                name: row.original.name,
                namespace: row.original.namespace,
                message: row.original.message,
                severity: row.original.severity,
                status: row.original.status,
              })
            }
          >
            {detailsHeader}
          </Button>
        ),
      },
    ],
    [
      namespaceHeader,
      nameHeader,
      apiVersionHeader,
      statusHeader,
      severityHeader,
      ruleHeader,
      detailsHeader,
      policyName,
      policyNamespace,
      setDrillDownTarget,
    ]
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
      <ViolationDrillDown
        target={drillDownTarget}
        onClose={() => setDrillDownTarget(null)}
        rules={rules}
      />
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
