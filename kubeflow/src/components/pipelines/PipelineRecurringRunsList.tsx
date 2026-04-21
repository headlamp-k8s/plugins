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
  return (
    <SectionPage
      title="Recurring Runs"
      apiPath="/apis/pipelines.kubeflow.org/v2beta1/recurringruns"
    >
      <ResourceListView
        title="Recurring Runs"
        resourceClass={PipelineRecurringRunClass}
        columns={[
          {
            id: 'name',
            label: 'Name',
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
            label: 'Display Name',
            getValue: (item: PipelineRecurringRunClass) => item.displayName || '-',
          },
          {
            id: 'pipeline',
            label: 'Pipeline',
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
            label: 'Pipeline Version',
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
            label: 'Schedule',
            getValue: (item: PipelineRecurringRunClass) => getRecurringRunSchedule(item),
          },
          {
            id: 'experiment',
            label: 'Experiment',
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
            label: 'Enabled',
            getValue: (item: PipelineRecurringRunClass) =>
              item.isEnabled === undefined ? '-' : item.isEnabled ? 'Yes' : 'No',
          },
          {
            id: 'next-run',
            label: 'Next Run',
            getValue: (item: PipelineRecurringRunClass) => item.status.nextRunTime || '-',
          },
          {
            id: 'status',
            label: 'Status',
            getValue: (item: PipelineRecurringRunClass) => getPipelineResourceStatus(item).label,
            render: (item: PipelineRecurringRunClass) => <PipelineStatusBadge resource={item} />,
          },
          'age',
        ]}
      />
    </SectionPage>
  );
}
