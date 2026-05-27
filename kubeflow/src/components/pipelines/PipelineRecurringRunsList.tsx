/**
 * Copyright 2025 The Headlamp Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  Link as HeadlampLink,
  ResourceListView,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { PipelineRecurringRunClass } from '../../resources/pipelineRecurringRun';
import { PipelineStatusBadge } from '../common/PipelineStatusBadge';
import {
  getPipelineDetailsPath,
  getPipelineExperimentDetailsPath,
  getPipelineRecurringRunDetailsPath,
  getPipelineResourceStatus,
  getPipelineVersionDetailsPath,
  getRecurringRunSchedule,
} from '../common/pipelineUtils';
import { SectionPage } from '../common/SectionPage';

/**
 * Lists Kubeflow RecurringRun resources available on the cluster.
 */
export function PipelineRecurringRunsList() {
  const { t } = useTranslation();

  return (
    <SectionPage
      title={t('Recurring Runs')}
      apiPath="/apis/pipelines.kubeflow.org/v2beta1/recurringruns"
    >
      <ResourceListView
        title={t('Recurring Runs')}
        resourceClass={PipelineRecurringRunClass}
        columns={[
          {
            id: 'name',
            label: t('Name'),
            getValue: (item: PipelineRecurringRunClass) => item.metadata.name,
            render: (item: PipelineRecurringRunClass) => (
              <HeadlampLink
                routeName={getPipelineRecurringRunDetailsPath()}
                params={{ namespace: item.metadata.namespace, name: item.metadata.name }}
              >
                {item.metadata.name}
              </HeadlampLink>
            ),
          },
          'namespace',
          {
            id: 'display-name',
            label: t('Display Name'),
            getValue: (item: PipelineRecurringRunClass) => item.displayName || '-',
          },
          {
            id: 'pipeline',
            label: t('Pipeline'),
            getValue: (item: PipelineRecurringRunClass) => item.pipelineName || '-',
            render: (item: PipelineRecurringRunClass) =>
              item.pipelineName ? (
                <HeadlampLink
                  routeName={getPipelineDetailsPath()}
                  params={{ namespace: item.metadata.namespace, name: item.pipelineName }}
                >
                  {item.pipelineName}
                </HeadlampLink>
              ) : (
                '-'
              ),
          },
          {
            id: 'pipeline-version',
            label: t('Pipeline Version'),
            getValue: (item: PipelineRecurringRunClass) => item.pipelineVersionName || '-',
            render: (item: PipelineRecurringRunClass) =>
              item.pipelineVersionName ? (
                <HeadlampLink
                  routeName={getPipelineVersionDetailsPath()}
                  params={{ namespace: item.metadata.namespace, name: item.pipelineVersionName }}
                >
                  {item.pipelineVersionName}
                </HeadlampLink>
              ) : (
                '-'
              ),
          },
          {
            id: 'schedule',
            label: t('Schedule'),
            getValue: (item: PipelineRecurringRunClass) => getRecurringRunSchedule(item),
          },
          {
            id: 'experiment',
            label: t('Experiment'),
            getValue: (item: PipelineRecurringRunClass) => item.experimentName || '-',
            render: (item: PipelineRecurringRunClass) =>
              item.experimentName ? (
                <HeadlampLink
                  routeName={getPipelineExperimentDetailsPath()}
                  params={{ namespace: item.metadata.namespace, name: item.experimentName }}
                >
                  {item.experimentName}
                </HeadlampLink>
              ) : (
                '-'
              ),
          },
          {
            id: 'enabled',
            label: t('Enabled'),
            getValue: (item: PipelineRecurringRunClass) =>
              item.isEnabled === undefined ? '-' : item.isEnabled ? t('Yes') : t('No'),
          },
          {
            id: 'next-run',
            label: t('Next Run'),
            getValue: (item: PipelineRecurringRunClass) => item.status.nextRunTime || '-',
          },
          {
            id: 'status',
            label: t('Status'),
            getValue: (item: PipelineRecurringRunClass) => getPipelineResourceStatus(item).label,
            render: (item: PipelineRecurringRunClass) => <PipelineStatusBadge resource={item} />,
          },
          'age',
        ]}
      />
    </SectionPage>
  );
}
