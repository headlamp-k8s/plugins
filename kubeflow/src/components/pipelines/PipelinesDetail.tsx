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
import yaml from 'js-yaml';
import { useParams } from 'react-router-dom';
import { PipelineClass } from '../../resources/pipeline';
import { PipelineVersionClass } from '../../resources/pipelineVersion';
import { KubeflowDiffViewerAction } from '../common/KubeflowDiffViewerAction';
import { KubeflowJsonViewerAction } from '../common/KubeflowJsonViewerAction';
import { PipelineStatusBadge } from '../common/PipelineStatusBadge';
import {
  countPipelineVersionsForPipeline,
  getPipelineVersionDetailsPath,
  getPipelineVersionsForPipeline,
} from '../common/pipelineUtils';
import { SectionPage } from '../common/SectionPage';

/**
 * Renders the detail page for a Kubeflow Pipeline resource.
 */
export function PipelinesDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;
  const [pipelineVersions] = PipelineVersionClass.useList();
  const versions = pipelineVersions ?? [];

  return (
    <SectionPage title="Pipeline Detail" apiPath="/apis/pipelines.kubeflow.org/v2beta1/pipelines">
      <DetailsGrid
        resourceType={PipelineClass}
        name={name as string}
        namespace={namespace}
        withEvents
        actions={item => {
          if (!item) {
            return [];
          }

          const relatedVersions = getPipelineVersionsForPipeline(
            versions,
            item.metadata.name,
            item.metadata.namespace
          );
          const sortedVersions = [...relatedVersions].sort((left, right) => {
            const leftTimestamp = Date.parse(left.metadata.creationTimestamp ?? '');
            const rightTimestamp = Date.parse(right.metadata.creationTimestamp ?? '');
            return rightTimestamp - leftTimestamp;
          });
          const latestVersion = sortedVersions[0];
          const previousVersion = sortedVersions[1];

          return [
            {
              id: 'kubeflow.pipeline-json',
              action: (
                <KubeflowJsonViewerAction
                  title="View Raw JSON"
                  value={item.jsonData}
                  activityId={`json-pipeline-${item.metadata.namespace}-${item.metadata.name}`}
                />
              ),
            },
            ...(latestVersion && previousVersion
              ? [
                  {
                    id: 'kubeflow.pipeline-version-comparison',
                    action: (
                      <KubeflowDiffViewerAction
                        title="Compare Latest vs Previous Version"
                        original={yaml.dump(previousVersion.spec)}
                        modified={yaml.dump(latestVersion.spec)}
                        originalLabel={`Previous: ${previousVersion.metadata.name}`}
                        modifiedLabel={`Latest: ${latestVersion.metadata.name}`}
                        activityId={`diff-pipeline-${item.metadata.namespace}-${item.metadata.name}-${previousVersion.metadata.name}-${latestVersion.metadata.name}`}
                      />
                    ),
                  },
                ]
              : []),
          ];
        }}
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
              name: 'Package URL',
              value: item.packageUrl || '-',
            },
            {
              name: 'SDK Version',
              value: item.pipelineSdkVersion || '-',
            },
            {
              name: 'Spec Name',
              value: item.pipelineSpecName || '-',
            },
            {
              name: 'Phase',
              value: item.phase || '-',
            },
            {
              name: 'Related Versions',
              value: countPipelineVersionsForPipeline(
                versions,
                item.metadata.name,
                item.metadata.namespace
              ),
            },
            {
              name: 'Tasks',
              value: item.taskNames.length > 0 ? item.taskNames.length : '-',
            },
            {
              name: 'Executors',
              value: item.executorNames.length > 0 ? item.executorNames.length : '-',
            },
          ]
        }
        extraSections={item => {
          if (!item) {
            return [];
          }

          const relatedVersions = getPipelineVersionsForPipeline(
            versions,
            item.metadata.name,
            item.metadata.namespace
          );

          return [
            {
              id: 'pipeline-definition',
              section: (
                <SectionBox title="Pipeline Definition">
                  <SimpleTable
                    columns={[
                      {
                        label: 'Field',
                        getter: (row: { label: string }) => row.label,
                      },
                      {
                        label: 'Value',
                        getter: (row: { value: string }) => row.value,
                      },
                    ]}
                    data={[
                      {
                        label: 'Package URL',
                        value: item.packageUrl || '-',
                      },
                      {
                        label: 'SDK Version',
                        value: item.pipelineSdkVersion || '-',
                      },
                      {
                        label: 'Spec Name',
                        value: item.pipelineSpecName || '-',
                      },
                      {
                        label: 'Spec Description',
                        value: item.pipelineSpecDescription || '-',
                      },
                      {
                        label: 'Tasks',
                        value: item.taskNames.length > 0 ? item.taskNames.join(', ') : '-',
                      },
                      {
                        label: 'Executors',
                        value: item.executorNames.length > 0 ? item.executorNames.join(', ') : '-',
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
            ...(relatedVersions.length > 0
              ? [
                  {
                    id: 'related-versions',
                    section: (
                      <SectionBox title="Related Pipeline Versions">
                        <SimpleTable
                          columns={[
                            {
                              label: 'Name',
                              getter: (version: PipelineVersionClass) => (
                                <HeadlampLink
                                  routeName={getPipelineVersionDetailsPath()}
                                  params={{
                                    namespace: version.metadata.namespace,
                                    name: version.metadata.name,
                                  }}
                                >
                                  {version.metadata.name}
                                </HeadlampLink>
                              ),
                            },
                            {
                              label: 'Display Name',
                              getter: (version: PipelineVersionClass) => version.displayName || '-',
                            },
                            {
                              label: 'Description',
                              getter: (version: PipelineVersionClass) => version.description || '-',
                            },
                            {
                              label: 'Status',
                              getter: (version: PipelineVersionClass) => (
                                <PipelineStatusBadge resource={version} />
                              ),
                            },
                          ]}
                          data={relatedVersions}
                          emptyMessage="No related pipeline versions found."
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
