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
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ClusterPolicyReport } from '../resources/policyReport';
import { SummaryChips } from './common';

export function ClusterPolicyReportList() {
  const { t } = useTranslation();
  return (
    <ResourceListView
      title={t('Cluster Policy Reports')}
      resourceClass={ClusterPolicyReport}
      columns={[
        'name',
        {
          id: 'scope',
          label: t('Scope'),
          getValue: item => {
            const scope = item.scope;
            if (!scope) return '';
            return `${scope.kind}/${scope.name}`;
          },
        },
        {
          id: 'pass',
          label: t('Pass'),
          getValue: item => item.summary.pass || 0,
          gridTemplate: '0.5fr',
        },
        {
          id: 'fail',
          label: t('Fail'),
          getValue: item => item.summary.fail || 0,
          gridTemplate: '0.5fr',
        },
        {
          id: 'warn',
          label: t('Warn'),
          getValue: item => item.summary.warn || 0,
          gridTemplate: '0.5fr',
        },
        {
          id: 'error',
          label: t('Error'),
          getValue: item => item.summary.error || 0,
          gridTemplate: '0.5fr',
        },
        {
          id: 'skip',
          label: t('Skip'),
          getValue: item => item.summary.skip || 0,
          gridTemplate: '0.5fr',
        },
        {
          id: 'summary',
          label: t('Summary'),
          render: item => <SummaryChips summary={item.summary} />,
          getValue: item => item.totalResults,
        },
        'age',
      ]}
    />
  );
}
