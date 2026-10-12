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
import { ResultStatusChip, SeverityChip, tableRemountKey } from './common';

export function ResultsTable({ results }: { results: PolicyReportResult[] }) {
  const { ready, t } = useTranslation();

  // See ViolationsView/common.tsx for why headers are computed once and the
  // table is remounted via key once translations are ready: Table memoizes
  // header cells by id alone, so a stale pre-translation label would otherwise
  // stick around even once the real translation arrives.
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
        id: 'policy',
        accessorFn: (r: PolicyReportResult) => r.policy,
      },
      {
        header: ruleHeader,
        id: 'rule',
        accessorFn: (r: PolicyReportResult) => r.rule || '-',
      },
      {
        header: resultHeader,
        id: 'result',
        accessorFn: (r: PolicyReportResult) => r.result,
        Cell: ({ row }: { row: { original: PolicyReportResult } }) => (
          <ResultStatusChip status={row.original.result} />
        ),
      },
      {
        header: severityHeader,
        id: 'severity',
        accessorFn: (r: PolicyReportResult) => r.severity || '',
        Cell: ({ row }: { row: { original: PolicyReportResult } }) => (
          <SeverityChip severity={row.original.severity} />
        ),
      },
      {
        header: categoryHeader,
        id: 'category',
        accessorFn: (r: PolicyReportResult) => r.category || '-',
      },
      {
        header: messageHeader,
        id: 'message',
        accessorFn: (r: PolicyReportResult) => r.message || '-',
      },
      {
        header: resourceHeader,
        id: 'resource',
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

  return (
    <Table
      key={tableRemountKey(ready)}
      columns={columns}
      data={results}
      emptyMessage={t('No results found.')}
    />
  );
}
