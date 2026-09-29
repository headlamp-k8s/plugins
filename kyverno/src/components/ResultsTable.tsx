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
import { Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import { PolicyReportResult } from '../resources/policyReport';
import { columnId, ResultStatusChip, SeverityChip } from './common';

export function ResultsTable({ results }: { results: PolicyReportResult[] }) {
  const { t } = useTranslation();

  // See ViolationsView for why headers are computed once and id is derived from
  // the live header text: Table memoizes header cells by id alone, so an id that
  // doesn't change with the header text would keep a stale pre-translation label.
  const policyHeader = t('Policy');
  const ruleHeader = t('Rule');
  const resultHeader = t('Result');
  const severityHeader = t('Severity');
  const categoryHeader = t('Category');
  const messageHeader = t('Message');
  const resourceHeader = t('Resource');

  const columns = useMemo(
    () => [
      {
        header: policyHeader,
        id: columnId('policy', policyHeader),
        accessorFn: (r: PolicyReportResult) => r.policy,
      },
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
        header: categoryHeader,
        id: columnId('category', categoryHeader),
        accessorFn: (r: PolicyReportResult) => r.category || '-',
      },
      {
        header: messageHeader,
        id: columnId('message', messageHeader),
        accessorFn: (r: PolicyReportResult) => r.message || '-',
      },
      {
        header: resourceHeader,
        id: columnId('resource', resourceHeader),
        accessorFn: (r: PolicyReportResult) =>
          r.resources?.map(res => `${res.kind}/${res.name}`).join(', ') || '-',
      },
    ],
    [
      policyHeader,
      ruleHeader,
      resultHeader,
      severityHeader,
      categoryHeader,
      messageHeader,
      resourceHeader,
    ]
  );

  return <Table columns={columns} data={results} emptyMessage={t('No results found.')} />;
}
