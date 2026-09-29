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
  AuthVisible,
  DeleteButton,
  EditButton,
  EditorDialog,
  NameValueTable,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Chip, CircularProgress, Typography } from '@mui/material';
import { useMemo } from 'react';
import {
  KyvernoClusterPolicy,
  KyvernoPolicy,
  KyvernoPolicyInterface,
  PolicyCondition,
  PolicyRule,
} from '../resources/kyvernoPolicy';
import { ClusterPolicyReport, PolicyReport, PolicyReportResult } from '../resources/policyReport';
import { columnId, ResultStatusChip, SeverityChip } from './common';

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
    if (selector.resources?.kinds) {
      kinds.push(...selector.resources.kinds);
    }
  }
  return kinds.length > 0 ? kinds.join(', ') : '-';
}

function LabelsSection({ labels }: { labels?: Record<string, string> }) {
  const { t } = useTranslation();
  if (!labels || Object.keys(labels).length === 0) return null;

  return (
    <SectionBox title={t('Labels')}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {Object.entries(labels).map(([key, value]) => (
          <Chip key={key} label={`${key}: ${value}`} size="small" variant="outlined" />
        ))}
      </Box>
    </SectionBox>
  );
}

function KyvernoMetadataSection({ annotations }: { annotations?: Record<string, string> }) {
  const { t } = useTranslation();
  if (!annotations) return null;

  const rows = KYVERNO_ANNOTATIONS.filter(({ key }) => annotations[key]).map(({ key, label }) => ({
    name: t(label),
    value: annotations[key],
  }));

  if (rows.length === 0) return null;

  return (
    <SectionBox title={t('Policy Metadata')}>
      <NameValueTable rows={rows} />
    </SectionBox>
  );
}

function YamlSection({ jsonData }: { jsonData: KyvernoPolicyInterface }) {
  const { t } = useTranslation();
  return (
    <SectionBox title={t('YAML')}>
      <EditorDialog
        noDialog
        open
        item={jsonData}
        onSave={null}
        onClose={() => {}}
        allowToHideManagedFields
      />
    </SectionBox>
  );
}

function ConditionsSection({ conditions }: { conditions?: PolicyCondition[] }) {
  const { t } = useTranslation();

  // See ViolationsView for why headers are computed once and id is derived from
  // the live header text.
  const typeHeader = t('Type');
  const statusHeader = t('Status');
  const reasonHeader = t('Reason');
  const messageHeader = t('Message');
  const lastTransitionHeader = t('Last Transition');

  const columns = useMemo(
    () => [
      {
        header: typeHeader,
        id: columnId('type', typeHeader),
        accessorFn: (c: PolicyCondition) => c.type,
      },
      {
        header: statusHeader,
        id: columnId('status', statusHeader),
        accessorFn: (c: PolicyCondition) => c.status,
        Cell: ({ row }: { row: { original: PolicyCondition } }) => (
          <Chip
            label={row.original.status}
            color={
              row.original.status === 'True'
                ? 'success'
                : row.original.status === 'False'
                ? 'error'
                : 'default'
            }
            size="small"
          />
        ),
      },
      {
        header: reasonHeader,
        id: columnId('reason', reasonHeader),
        accessorFn: (c: PolicyCondition) => c.reason || '-',
      },
      {
        header: messageHeader,
        id: columnId('message', messageHeader),
        accessorFn: (c: PolicyCondition) => c.message || '-',
      },
      {
        header: lastTransitionHeader,
        id: columnId('lastTransition', lastTransitionHeader),
        accessorFn: (c: PolicyCondition) => c.lastTransitionTime || '-',
      },
    ],
    [typeHeader, statusHeader, reasonHeader, messageHeader, lastTransitionHeader]
  );

  if (!conditions || conditions.length === 0) return null;

  return (
    <SectionBox title={t('Conditions')}>
      <Table columns={columns} data={conditions} />
    </SectionBox>
  );
}

function RulesTable({ rules }: { rules: PolicyRule[] }) {
  const { t } = useTranslation();

  // See ViolationsView for why headers are computed once and id is derived from
  // the live header text.
  const nameHeader = t('Name');
  const typeHeader = t('Type');
  const matchKindsHeader = t('Match Kinds');
  const messageHeader = t('Message');

  const columns = useMemo(
    () => [
      {
        header: nameHeader,
        id: columnId('name', nameHeader),
        accessorFn: (r: PolicyRule) => r.name,
      },
      {
        header: typeHeader,
        id: columnId('type', typeHeader),
        accessorFn: (r: PolicyRule) => ruleType(r),
        Cell: ({ row }: { row: { original: PolicyRule } }) => (
          <Chip label={ruleType(row.original)} size="small" variant="outlined" />
        ),
      },
      {
        header: matchKindsHeader,
        id: columnId('matchKinds', matchKindsHeader),
        accessorFn: (r: PolicyRule) => matchKinds(r),
      },
      {
        header: messageHeader,
        id: columnId('message', messageHeader),
        accessorFn: (r: PolicyRule) => r.validate?.message || '-',
      },
    ],
    [nameHeader, typeHeader, matchKindsHeader, messageHeader]
  );

  return <Table columns={columns} data={rules} emptyMessage={t('No rules defined.')} />;
}

function AssociatedReportsSection({ policyName }: { policyName: string }) {
  const { t } = useTranslation();
  const { items: policyReports } = PolicyReport.useList();
  const { items: clusterPolicyReports } = ClusterPolicyReport.useList();

  // Wait for BOTH streams before rendering — otherwise we'd briefly show a
  // partial result set as soon as the first list resolves.
  if (policyReports === null || clusterPolicyReports === null) {
    return (
      <SectionBox title={t('Associated Report Results')}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      </SectionBox>
    );
  }

  const matchingResults: (PolicyReportResult & { reportName: string; reportNamespace?: string })[] =
    [];

  for (const report of policyReports) {
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

  for (const report of clusterPolicyReports) {
    for (const result of report.results) {
      if (result.policy === policyName) {
        matchingResults.push({
          ...result,
          reportName: report.jsonData.metadata.name,
        });
      }
    }
  }

  return (
    <SectionBox
      title={t('Associated Report Results ({{count}})', { count: matchingResults.length })}
    >
      <AssociatedReportsTable results={matchingResults} />
    </SectionBox>
  );
}

function AssociatedReportsTable({
  results,
}: {
  results: (PolicyReportResult & { reportName: string; reportNamespace?: string })[];
}) {
  const { t } = useTranslation();

  // See ViolationsView for why headers are computed once and id is derived from
  // the live header text.
  const ruleHeader = t('Rule');
  const resultHeader = t('Result');
  const severityHeader = t('Severity');
  const resourceHeader = t('Resource');
  const messageHeader = t('Message');

  const columns = useMemo(
    () => [
      {
        header: ruleHeader,
        id: columnId('rule', ruleHeader),
        accessorFn: (r: PolicyReportResult) => r.rule || '-',
      },
      {
        header: resultHeader,
        id: columnId('result', resultHeader),
        accessorFn: (r: PolicyReportResult) => r.result,
        Cell: ({ row }: { row: { original: PolicyReportResult } }) => (
          <ResultStatusChip status={row.original.result} />
        ),
      },
      {
        header: severityHeader,
        id: columnId('severity', severityHeader),
        accessorFn: (r: PolicyReportResult) => r.severity || '',
        Cell: ({ row }: { row: { original: PolicyReportResult } }) => (
          <SeverityChip severity={row.original.severity} />
        ),
      },
      {
        header: resourceHeader,
        id: columnId('resource', resourceHeader),
        accessorFn: (r: PolicyReportResult) =>
          r.resources
            ?.map(res => `${res.namespace ? res.namespace + '/' : ''}${res.kind}/${res.name}`)
            .join(', ') || '-',
      },
      {
        header: messageHeader,
        id: columnId('message', messageHeader),
        accessorFn: (r: PolicyReportResult) => r.message || '-',
      },
    ],
    [ruleHeader, resultHeader, severityHeader, resourceHeader, messageHeader]
  );

  return (
    <Table
      columns={columns}
      data={results}
      emptyMessage={t('No report results found for this policy.')}
    />
  );
}

function PolicyContent({ policy }: { policy: KyvernoPolicy | KyvernoClusterPolicy }) {
  const { t } = useTranslation();
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
      <SectionBox title={t('Details')}>
        <NameValueTable
          rows={[
            { name: t('Name'), value: policy.jsonData.metadata.name },
            ...(policy.jsonData.metadata.namespace
              ? [{ name: t('Namespace'), value: policy.jsonData.metadata.namespace }]
              : []),
            {
              name: t('Ready'),
              value: (
                <Chip
                  label={policy.ready ? 'True' : 'False'}
                  color={policy.ready ? 'success' : 'error'}
                  size="small"
                />
              ),
            },
            {
              name: t('Failure Action'),
              value: policy.validationFailureAction,
            },
            {
              name: t('Background'),
              value: String(policy.background),
            },
            {
              name: t('Rule Types'),
              value: policy.ruleTypes.join(', ') || '-',
            },
            {
              name: t('Created'),
              value: policy.jsonData.metadata.creationTimestamp,
            },
          ]}
        />
      </SectionBox>
      <KyvernoMetadataSection annotations={annotations} />
      <LabelsSection labels={labels} />
      <ConditionsSection conditions={policy.jsonData.status?.conditions} />
      <SectionBox title={t('Rules ({{count}})', { count: policy.rules.length })}>
        <RulesTable rules={policy.rules} />
      </SectionBox>
      <AssociatedReportsSection policyName={policy.jsonData.metadata.name} />
      <YamlSection jsonData={policy.jsonData} />
    </Box>
  );
}

export function PolicyViewer({ name, namespace, isClusterScoped }: PolicyViewerProps) {
  const { t } = useTranslation();
  const ResourceClass = isClusterScoped ? KyvernoClusterPolicy : KyvernoPolicy;
  const [policy, error] = ResourceClass.useGet(name, namespace);

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">
          {t('Failed to load policy: {{error}}', { error: String(error) })}
        </Typography>
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
