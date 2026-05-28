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
  ConditionsTable,
  DetailsGrid,
  Link as HeadlampLink,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { PipelineVersionClass } from '../../resources/pipelineVersion';
import { KubeflowJsonViewerAction } from '../common/KubeflowJsonViewerAction';
import { PipelineStatusBadge } from '../common/PipelineStatusBadge';
import {
  getPipelineDetailsPath,
  getPipelineVersionDetailsPath,
  getPipelineVersionsForPipeline,
  hasPipelineVersionSource,
} from '../common/pipelineUtils';
import { SectionPage } from '../common/SectionPage';

/**
 * Renders the detail page for a Kubeflow PipelineVersion resource.
 */
export function PipelineVersionsDetail(props: { namespace?: string; name?: string }) {
  const { t } = useTranslation();
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;
  const [pipelineVersions] = PipelineVersionClass.useList();
  const versions = pipelineVersions ?? [];

  return (
    <SectionPage
      title={t('Pipeline Version Detail')}
      apiPath="/apis/pipelines.kubeflow.org/v2beta1/pipelineversions"
    >
      <DetailsGrid
        resourceType={PipelineVersionClass}
        name={name as string}
        namespace={namespace}
        withEvents
        actions={item =>
          item && [
            {
              id: 'kubeflow.pipeline-version-json',
              action: (
                <KubeflowJsonViewerAction
                  title={t('View Raw JSON')}
                  value={item.jsonData}
                  activityId={`json-pipeline-version-${item.metadata.namespace}-${item.metadata.name}`}
                />
              ),
            },
          ]
        }
        extraInfo={item =>
          item && [
            {
              name: t('Status'),
              value: <PipelineStatusBadge resource={item} />,
            },
            {
              name: t('Display Name'),
              value: item.displayName || '-',
            },
            {
              name: t('Description'),
              value: item.description || '-',
            },
            {
              name: t('Spec Name'),
              value: item.pipelineSpecName || '-',
            },
            {
              name: t('SDK Version'),
              value: item.pipelineSdkVersion || '-',
            },
            {
              name: t('Phase'),
              value: item.phase || '-',
            },
            {
              name: t('Parent Pipeline'),
              value: item.pipelineName ? (
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
              name: t('Source'),
              value: hasPipelineVersionSource(item) ? item.sourceValue || item.sourceLabel : '-',
            },
          ]
        }
        extraSections={item =>
          item
            ? [
                ...(hasPipelineVersionSource(item)
                  ? [
                      {
                        id: 'source-details',
                        section: (
                          <SectionBox title={t('Source Details')}>
                            <SimpleTable
                              columns={[
                                {
                                  label: t('Field'),
                                  getter: (row: { label: string }) => row.label,
                                },
                                {
                                  label: t('Value'),
                                  getter: (row: { value: string }) => row.value,
                                },
                              ]}
                              data={[
                                {
                                  label: t('Source Type'),
                                  value: item.sourceLabel,
                                },
                                {
                                  label: t('Pipeline Spec URI'),
                                  value: item.spec.pipelineSpecURI || '-',
                                },
                                {
                                  label: t('Code Source URL'),
                                  value: item.spec.codeSourceURL || '-',
                                },
                                {
                                  label: t('Embedded Pipeline Name'),
                                  value: item.pipelineSpecName || '-',
                                },
                              ]}
                            />
                          </SectionBox>
                        ),
                      },
                    ]
                  : []),
                ...(item.pipelineSpec
                  ? [
                      {
                        id: 'spec-summary',
                        section: (
                          <SectionBox title={t('Pipeline Spec Summary')}>
                            <SimpleTable
                              columns={[
                                {
                                  label: t('Field'),
                                  getter: (row: { label: string }) => row.label,
                                },
                                {
                                  label: t('Value'),
                                  getter: (row: { value: string }) => row.value,
                                },
                              ]}
                              data={[
                                {
                                  label: t('Spec Name'),
                                  value: item.pipelineSpecName || '-',
                                },
                                {
                                  label: t('Spec Description'),
                                  value: item.pipelineSpecDescription || '-',
                                },
                                {
                                  label: t('SDK Version'),
                                  value: item.pipelineSdkVersion || '-',
                                },
                                {
                                  label: t('Tasks'),
                                  value:
                                    item.taskNames.length > 0 ? item.taskNames.join(', ') : '-',
                                },
                                {
                                  label: t('Executors'),
                                  value:
                                    item.executorNames.length > 0
                                      ? item.executorNames.join(', ')
                                      : '-',
                                },
                              ]}
                            />
                          </SectionBox>
                        ),
                      },
                    ]
                  : []),
                ...(() => {
                  const siblingVersions = getPipelineVersionsForPipeline(
                    versions,
                    item.pipelineName,
                    item.metadata.namespace
                  ).filter(version => version.metadata.name !== item.metadata.name);

                  if (siblingVersions.length === 0) {
                    return [];
                  }

                  return [
                    {
                      id: 'other-versions',
                      section: (
                        <SectionBox title={t('Other Versions in This Pipeline')}>
                          <SimpleTable
                            columns={[
                              {
                                label: t('Name'),
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
                                label: t('Display Name'),
                                getter: (version: PipelineVersionClass) =>
                                  version.displayName || '-',
                              },
                              {
                                label: t('Description'),
                                getter: (version: PipelineVersionClass) =>
                                  version.description || '-',
                              },
                              {
                                label: t('Status'),
                                getter: (version: PipelineVersionClass) => (
                                  <PipelineStatusBadge resource={version} />
                                ),
                              },
                            ]}
                            data={siblingVersions}
                            emptyMessage={t('No other versions found.')}
                          />
                        </SectionBox>
                      ),
                    },
                  ];
                })(),
                ...(item.conditions.length > 0
                  ? [
                      {
                        id: 'conditions',
                        section: (
                          <SectionBox title={t('Conditions')}>
                            <ConditionsTable resource={item.jsonData} />
                          </SectionBox>
                        ),
                      },
                    ]
                  : []),
              ]
            : []
        }
      />
    </SectionPage>
  );
}
