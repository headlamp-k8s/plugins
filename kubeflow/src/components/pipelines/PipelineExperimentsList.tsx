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
import { PipelineExperimentClass } from '../../resources/pipelineExperiment';
import { PipelineRunClass } from '../../resources/pipelineRun';
import { PipelineStatusBadge } from '../common/PipelineStatusBadge';
import {
  getPipelineExperimentDetailsPath,
  getPipelineResourceStatus,
} from '../common/pipelineUtils';
import { SectionPage } from '../common/SectionPage';

/**
 * Lists Kubeflow Experiment resources available on the cluster.
 */
export function PipelineExperimentsList() {
  const [runs] = PipelineRunClass.useList();
  const runList = runs ?? [];

  function countRuns(experiment: PipelineExperimentClass): number {
    return runList.filter(run => {
      return (
        run.experimentName === experiment.metadata.name &&
        run.metadata.namespace === experiment.metadata.namespace
      );
    }).length;
  }

  return (
    <SectionPage
      title="Pipeline Experiments"
      apiPath="/apis/pipelines.kubeflow.org/v2beta1/experiments"
    >
      <ResourceListView
        title="Pipeline Experiments"
        resourceClass={PipelineExperimentClass}
        columns={[
          {
            id: 'name',
            label: 'Name',
            getValue: (item: PipelineExperimentClass) => item.metadata.name,
            render: (item: PipelineExperimentClass) => (
              <HeadlampLink
                routeName={getPipelineExperimentDetailsPath()}
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
            getValue: (item: PipelineExperimentClass) => item.displayName || '-',
          },
          {
            id: 'description',
            label: 'Description',
            getValue: (item: PipelineExperimentClass) => item.description || '-',
          },
          {
            id: 'runs',
            label: 'Runs',
            getValue: (item: PipelineExperimentClass) => countRuns(item),
          },
          {
            id: 'status',
            label: 'Status',
            getValue: (item: PipelineExperimentClass) => getPipelineResourceStatus(item).label,
            render: (item: PipelineExperimentClass) => <PipelineStatusBadge resource={item} />,
          },
          'age',
        ]}
      />
    </SectionPage>
  );
}
