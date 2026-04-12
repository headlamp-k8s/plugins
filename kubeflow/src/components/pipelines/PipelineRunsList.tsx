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
import { PipelineRunClass } from '../../resources/pipelineRun';
import { PipelineStatusBadge } from '../common/PipelineStatusBadge';
import {
  getPipelineDetailsPath,
  getPipelineExperimentDetailsPath,
  getPipelineResourceStatus,
  getPipelineRunDetailsPath,
  getPipelineRunDurationLabel,
  getPipelineRunRoot,
  getPipelineVersionDetailsPath,
} from '../common/pipelineUtils';
import { SectionPage } from '../common/SectionPage';

/**
 * Lists Kubeflow Run resources available on the cluster.
 */
export function PipelineRunsList() {
  return (
    <SectionPage title="Pipeline Runs" apiPath="/apis/pipelines.kubeflow.org/v2beta1/runs">
      <ResourceListView
        title="Pipeline Runs"
        resourceClass={PipelineRunClass}
        columns={[
          {
            id: 'name',
            label: 'Name',
            getValue: (item: PipelineRunClass) => item.metadata.name,
            render: (item: PipelineRunClass) => (
              <HeadlampLink
                routeName={getPipelineRunDetailsPath()}
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
            getValue: (item: PipelineRunClass) => item.displayName || '-',
          },
          {
            id: 'pipeline',
            label: 'Pipeline',
            getValue: (item: PipelineRunClass) => item.pipelineName || '-',
            render: (item: PipelineRunClass) =>
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
            getValue: (item: PipelineRunClass) => item.pipelineVersionName || '-',
            render: (item: PipelineRunClass) =>
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
            id: 'experiment',
            label: 'Experiment',
            getValue: (item: PipelineRunClass) => item.experimentName || '-',
            render: (item: PipelineRunClass) =>
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
            id: 'duration',
            label: 'Duration',
            getValue: (item: PipelineRunClass) => getPipelineRunDurationLabel(item),
          },
          {
            id: 'pipeline-root',
            label: 'Pipeline Root',
            getValue: (item: PipelineRunClass) => getPipelineRunRoot(item) || '-',
          },
          {
            id: 'status',
            label: 'Status',
            getValue: (item: PipelineRunClass) => getPipelineResourceStatus(item).label,
            render: (item: PipelineRunClass) => <PipelineStatusBadge resource={item} />,
          },
          'age',
        ]}
      />
    </SectionPage>
  );
}
