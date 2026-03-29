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

import {
  AuthVisible,
  DeleteButton,
  EditButton,
  NameValueTable,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import {
  Box,
  Chip,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  KyvernoClusterPolicy,
  KyvernoPolicy,
  KyvernoPolicyInterface,
  PolicyCondition,
  PolicyRule,
} from '../resources/kyvernoPolicy';
import {
  ClusterPolicyReport,
  PolicyReport,
  PolicyReportResult,
} from '../resources/policyReport';
import { ResultStatusChip, SeverityChip } from './common';

interface PolicyViewerProps {
  name: string;
  namespace?: string;
  isClusterScoped?: boolean;
}

// Well-known Kyverno annotation keys
const KYVERNO_ANNOTATIONS: { key: string; label: string }[] = [
  { key: 'policies.kyverno.io/title', label: 'Title' },
  { key: 'policies.kyverno.io/description', label: 'Description' },
  { key: 'policies.kyverno.io/category', label: 'Category' },
  { key: 'policies.kyverno.io/severity', label: 'Severity' },
  { key: 'policies.kyverno.io/subject', label: 'Subjects' },
  { key: 'policies.kyverno.io/minversion', label: 'Min Kyverno Version' },
  { key: 'kyverno.io/kubernetes-version', label: 'Kubernetes Version' },
];

function ruleType(rule: PolicyRule): string {
  if (rule.validate) return 'Validate';
  if (rule.mutate) return 'Mutate';
  if (rule.generate) return 'Generate';
  if (rule.verifyImages) return 'VerifyImages';
  return 'Unknown';
}

function matchKinds(rule: PolicyRule): string {
  const selectors = rule.match?.any || rule.match?.all || [];
  const kinds: string[] = [];
  for (const selector of selectors) {
    const resources = selector.resources as { kinds?: string[] } | undefined;
    if (resources?.kinds) {
      kinds.push(...resources.kinds);
    }
  }
  return kinds.length > 0 ? kinds.join(', ') : '-';
}

function LabelsSection({ labels }: { labels?: Record<string, string> }) {
  if (!labels || Object.keys(labels).length === 0) return null;

  return (
    <SectionBox title="Labels">
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {Object.entries(labels).map(([key, value]) => (
          <Chip key={key} label={`${key}: ${value}`} size="small" variant="outlined" />
        ))}
      </Box>
    </SectionBox>
  );
}

function KyvernoMetadataSection({ annotations }: { annotations?: Record<string, string> }) {
  if (!annotations) return null;

  const rows = KYVERNO_ANNOTATIONS
    .filter(({ key }) => annotations[key])
    .map(({ key, label }) => ({ name: label, value: annotations[key] }));

  if (rows.length === 0) return null;

  return (
    <SectionBox title="Policy Metadata">
      <NameValueTable rows={rows} />
    </SectionBox>
  );
}

function ConditionsSection({ conditions }: { conditions?: PolicyCondition[] }) {
  if (!conditions || conditions.length === 0) return null;

  return (
    <SectionBox title="Conditions">
      <Table
        columns={[
          { header: 'Type', accessorFn: (c: PolicyCondition) => c.type },
          {
            header: 'Status',
            accessorFn: (c: PolicyCondition) => c.status,
            Cell: ({ row }: { row: { original: PolicyCondition } }) => (
              <Chip
                label={row.original.status}
                color={row.original.status === 'True' ? 'success' : row.original.status === 'False' ? 'error' : 'default'}
                size="small"
              />
            ),
          },
          { header: 'Reason', accessorFn: (c: PolicyCondition) => c.reason || '-' },
          { header: 'Message', accessorFn: (c: PolicyCondition) => c.message || '-' },
          { header: 'Last Transition', accessorFn: (c: PolicyCondition) => c.lastTransitionTime || '-' },
        ]}
        data={conditions}
      />
    </SectionBox>
  );
}

function RulesTable({ rules }: { rules: PolicyRule[] }) {
  return (
    <Table
      columns={[
        { header: 'Name', accessorFn: (r: PolicyRule) => r.name },
        {
          header: 'Type',
          accessorFn: (r: PolicyRule) => ruleType(r),
          Cell: ({ row }: { row: { original: PolicyRule } }) => (
            <Chip label={ruleType(row.original)} size="small" variant="outlined" />
          ),
        },
        { header: 'Match Kinds', accessorFn: (r: PolicyRule) => matchKinds(r) },
        { header: 'Message', accessorFn: (r: PolicyRule) => r.validate?.message || '-' },
      ]}
      data={rules}
      emptyMessage="No rules defined."
    />
  );
}

function AssociatedReportsSection({ policyName }: { policyName: string }) {
  const { items: policyReports } = PolicyReport.useList();
  const { items: clusterPolicyReports } = ClusterPolicyReport.useList();

  const matchingResults: (PolicyReportResult & { reportName: string; reportNamespace?: string })[] = [];

  for (const report of policyReports || []) {
    for (const result of report.results) {
      if (result.policy === policyName) {
        matchingResults.push({
          ...result,
          reportName: report.jsonData.metadata.name,
          reportNamespace: report.jsonData.metadata.namespace,
        });
      }
    }
  }

  for (const report of clusterPolicyReports || []) {
    for (const result of report.results) {
      if (result.policy === policyName) {
        matchingResults.push({
          ...result,
          reportName: report.jsonData.metadata.name,
        });
      }
    }
  }

  if (policyReports === null && clusterPolicyReports === null) {
    return (
      <SectionBox title="Associated Report Results">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      </SectionBox>
    );
  }

  return (
    <SectionBox title={`Associated Report Results (${matchingResults.length})`}>
      <Table
        columns={[
          { header: 'Rule', accessorFn: (r: PolicyReportResult) => r.rule || '-' },
          {
            header: 'Result',
            accessorFn: (r: PolicyReportResult) => r.result,
            Cell: ({ row }: { row: { original: PolicyReportResult } }) => (
              <ResultStatusChip status={row.original.result} />
            ),
          },
          {
            header: 'Severity',
            accessorFn: (r: PolicyReportResult) => r.severity || '',
            Cell: ({ row }: { row: { original: PolicyReportResult } }) => (
              <SeverityChip severity={row.original.severity} />
            ),
          },
          {
            header: 'Resource',
            accessorFn: (r: PolicyReportResult) =>
              r.resources?.map(res => `${res.namespace ? res.namespace + '/' : ''}${res.kind}/${res.name}`).join(', ') || '-',
          },
          { header: 'Message', accessorFn: (r: PolicyReportResult) => r.message || '-' },
        ]}
        data={matchingResults}
        emptyMessage="No report results found for this policy."
      />
    </SectionBox>
  );
}

function PolicyContent({
  policy,
}: {
  policy: (KyvernoPolicy | KyvernoClusterPolicy) & {
    jsonData: KyvernoPolicyInterface;
    ready: boolean;
    rules: PolicyRule[];
    ruleTypes: string[];
    validationFailureAction: string;
    background: boolean;
  };
}) {
  const annotations = policy.jsonData.metadata.annotations;
  const labels = policy.jsonData.metadata.labels;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'flex-end' }}>
        <AuthVisible item={policy} authVerb="update">
          <EditButton item={policy} />
        </AuthVisible>
        <AuthVisible item={policy} authVerb="delete">
          <DeleteButton item={policy} />
        </AuthVisible>
      </Box>
      <SectionBox title="Details">
        <NameValueTable
          rows={[
            { name: 'Name', value: policy.jsonData.metadata.name },
            ...(policy.jsonData.metadata.namespace
              ? [{ name: 'Namespace', value: policy.jsonData.metadata.namespace }]
              : []),
            {
              name: 'Ready',
              value: (
                <Chip
                  label={policy.ready ? 'True' : 'False'}
                  color={policy.ready ? 'success' : 'error'}
                  size="small"
                />
              ),
            },
            {
              name: 'Failure Action',
              value: policy.validationFailureAction,
            },
            {
              name: 'Background',
              value: String(policy.background),
            },
            {
              name: 'Rule Types',
              value: policy.ruleTypes.join(', ') || '-',
            },
            {
              name: 'Created',
              value: policy.jsonData.metadata.creationTimestamp,
            },
          ]}
        />
      </SectionBox>
      <KyvernoMetadataSection annotations={annotations} />
      <LabelsSection labels={labels} />
      <ConditionsSection conditions={policy.jsonData.status?.conditions} />
      <SectionBox title={`Rules (${policy.rules.length})`}>
        <RulesTable rules={policy.rules} />
      </SectionBox>
      <AssociatedReportsSection policyName={policy.jsonData.metadata.name} />
    </Box>
  );
}

export function PolicyViewer({ name, namespace, isClusterScoped }: PolicyViewerProps) {
  const ResourceClass = isClusterScoped ? KyvernoClusterPolicy : KyvernoPolicy;
  const [policy, error] = ResourceClass.useGet(name, namespace);

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Failed to load policy: {String(error)}</Typography>
      </Box>
    );
  }

  if (!policy) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <PolicyContent policy={policy} />;
}
