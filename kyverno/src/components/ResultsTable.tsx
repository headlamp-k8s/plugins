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
import { PolicyReportResult } from '../resources/policyReport';
import { ResultStatusChip, SeverityChip } from './common';

export function ResultsTable({ results }: { results: PolicyReportResult[] }) {
  const { t } = useTranslation();
  return (
    <Table
      columns={[
        { header: t('Policy'), accessorFn: (r: PolicyReportResult) => r.policy },
        { header: t('Rule'), accessorFn: (r: PolicyReportResult) => r.rule || '-' },
        {
          header: t('Result'),
          accessorFn: (r: PolicyReportResult) => r.result,
          Cell: ({ row }: { row: { original: PolicyReportResult } }) => (
            <ResultStatusChip status={row.original.result} />
          ),
        },
        {
          header: t('Severity'),
          accessorFn: (r: PolicyReportResult) => r.severity || '',
          Cell: ({ row }: { row: { original: PolicyReportResult } }) => (
            <SeverityChip severity={row.original.severity} />
          ),
        },
        { header: t('Category'), accessorFn: (r: PolicyReportResult) => r.category || '-' },
        { header: t('Message'), accessorFn: (r: PolicyReportResult) => r.message || '-' },
        {
          header: t('Resource'),
          accessorFn: (r: PolicyReportResult) =>
            r.resources?.map(res => `${res.kind}/${res.name}`).join(', ') || '-',
        },
      ]}
      data={results}
      emptyMessage={t('No results found.')}
    />
  );
}
