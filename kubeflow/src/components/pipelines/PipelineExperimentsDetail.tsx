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
  ConditionsTable,
  DetailsGrid,
  Link as HeadlampLink,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { PipelineExperimentClass } from '../../resources/pipelineExperiment';
import { PipelineRunClass } from '../../resources/pipelineRun';
import { KubeflowJsonViewerAction } from '../common/KubeflowJsonViewerAction';
import { PipelineStatusBadge } from '../common/PipelineStatusBadge';
import { getPipelineRunDetailsPath, getPipelineRunDurationLabel } from '../common/pipelineUtils';
import { SectionPage } from '../common/SectionPage';

/**
 * Renders the detail page for a Kubeflow Experiment resource.
 */
export function PipelineExperimentsDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;
  const [runs] = PipelineRunClass.useList();
  const runList = runs ?? [];

  return (
    <SectionPage
      title="Pipeline Experiment Detail"
      apiPath="/apis/pipelines.kubeflow.org/v2beta1/experiments"
    >
      <DetailsGrid
        resourceType={PipelineExperimentClass}
        name={name as string}
        namespace={namespace}
        withEvents
        actions={item =>
          item && [
            {
              id: 'kubeflow.pipeline-experiment-json',
              action: (
                <KubeflowJsonViewerAction
                  title="View Raw JSON"
                  value={item.jsonData}
                  activityId={`json-pipeline-experiment-${item.metadata.namespace}-${item.metadata.name}`}
                />
              ),
            },
          ]
        }
        extraInfo={item =>
          item && [
            {
              name: 'Status',
              value: <PipelineStatusBadge resource={item} />,
            },
            {
              name: 'Display Name',
              value: item.displayName || '-',
            },
            {
              name: 'Description',
              value: item.description || '-',
            },
            {
              name: 'Phase',
              value: item.phase || '-',
            },
          ]
        }
        extraSections={item => {
          if (!item) {
            return [];
          }

          const relatedRuns = runList.filter(run => {
            return (
              run.experimentName === item.metadata.name &&
              run.metadata.namespace === item.metadata.namespace
            );
          });

          return [
            ...(relatedRuns.length > 0
              ? [
                  {
                    id: 'related-runs',
                    section: (
                      <SectionBox title="Related Runs">
                        <SimpleTable
                          columns={[
                            {
                              label: 'Name',
                              getter: (run: PipelineRunClass) => (
                                <HeadlampLink
                                  routeName={getPipelineRunDetailsPath()}
                                  params={{
                                    namespace: run.metadata.namespace,
                                    name: run.metadata.name,
                                  }}
                                >
                                  {run.metadata.name}
                                </HeadlampLink>
                              ),
                            },
                            {
                              label: 'Pipeline',
                              getter: (run: PipelineRunClass) => run.pipelineName || '-',
                            },
                            {
                              label: 'Status',
                              getter: (run: PipelineRunClass) => (
                                <PipelineStatusBadge resource={run} />
                              ),
                            },
                            {
                              label: 'Duration',
                              getter: (run: PipelineRunClass) => getPipelineRunDurationLabel(run),
                            },
                            {
                              label: 'Start Time',
                              getter: (run: PipelineRunClass) => run.status.startTime || '-',
                            },
                          ]}
                          data={relatedRuns}
                          emptyMessage="No runs found for this experiment."
                        />
                      </SectionBox>
                    ),
                  },
                ]
              : []),
            ...(item.conditions.length > 0
              ? [
                  {
                    id: 'conditions',
                    section: (
                      <SectionBox title="Conditions">
                        <ConditionsTable resource={item.jsonData} />
                      </SectionBox>
                    ),
                  },
                ]
              : []),
          ];
        }}
      />
    </SectionPage>
  );
}
