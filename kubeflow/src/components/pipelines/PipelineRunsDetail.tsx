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
  ActionButton,
  ConditionsTable,
  DetailsGrid,
  Link as HeadlampLink,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { PipelineRunClass } from '../../resources/pipelineRun';
import { KubeflowJsonViewerAction } from '../common/KubeflowJsonViewerAction';
import { launchPipelineRunLogs } from '../common/KubeflowLogsViewer';
import { PipelineStatusBadge } from '../common/PipelineStatusBadge';
import {
  getPipelineDetailsPath,
  getPipelineExperimentDetailsPath,
  getPipelineRunDurationLabel,
  getPipelineRunRoot,
  getPipelineVersionDetailsPath,
} from '../common/pipelineUtils';
import { SectionPage } from '../common/SectionPage';

function formatRuntimeValue(value: unknown): string {
  if (value === undefined || value === null) {
    return '-';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}

/**
 * Renders the detail page for a Kubeflow Run resource.
 */
export function PipelineRunsDetail(props: { namespace?: string; name?: string }) {
  const { t } = useTranslation();
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  return (
    <SectionPage
      title={t('Pipeline Run Detail')}
      apiPath="/apis/pipelines.kubeflow.org/v2beta1/runs"
    >
      <DetailsGrid
        resourceType={PipelineRunClass}
        name={name as string}
        namespace={namespace}
        withEvents
        actions={item => {
          if (!item) return [];

          // Note: In a real cluster we would use a hook, but actions prop doesn't allow it.
          // However, we can use the Activity system to launch a generic viewer that handles its own state.
          return [
            {
              id: 'kubeflow.run-logs',
              action: (
                <RunLogsButton
                  runName={item.metadata.name}
                  namespace={item.metadata.namespace}
                  cluster={item.cluster}
                />
              ),
            },
            {
              id: 'kubeflow.run-json',
              action: (
                <KubeflowJsonViewerAction
                  title={t('View Raw JSON')}
                  value={item.jsonData}
                  activityId={`json-pipeline-run-${item.metadata.namespace}-${item.metadata.name}`}
                />
              ),
            },
          ];
        }}
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
              name: t('Phase'),
              value: item.phase || '-',
            },
            {
              name: t('Pipeline'),
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
              name: t('Pipeline Version'),
              value: item.pipelineVersionName ? (
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
              name: t('Experiment'),
              value: item.experimentName ? (
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
              name: t('Pipeline Root'),
              value: getPipelineRunRoot(item) || '-',
            },
            {
              name: t('Service Account'),
              value: item.serviceAccountName || '-',
            },
            {
              name: t('Start Time'),
              value: item.status.startTime || '-',
            },
            {
              name: t('Completion Time'),
              value: item.status.completionTime || '-',
            },
            {
              name: t('Duration'),
              value: getPipelineRunDurationLabel(item),
            },
            {
              name: t('Message'),
              value: item.status.message || '-',
            },
          ]
        }
        extraSections={item =>
          item
            ? [
                ...(item.spec.runtimeConfig
                  ? [
                      {
                        id: 'runtime-config',
                        section: (
                          <SectionBox title={t('Runtime Configuration')}>
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
                              data={Object.entries(item.spec.runtimeConfig).map(([key, value]) => ({
                                label: key,
                                value: formatRuntimeValue(value),
                              }))}
                              emptyMessage={t('No runtime configuration provided.')}
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

/**
 * Inline ActionButton used in the Run detail header to launch log viewer for this run.
 * Delegates to launchPipelineRunLogs to ensure consistent pod-discovery logic with the list view.
 */
function RunLogsButton({
  runName,
  namespace,
  cluster,
}: {
  runName: string;
  namespace: string;
  cluster?: string;
}) {
  const { t } = useTranslation();
  return (
    <ActionButton
      description={t('View Latest Pod Logs')}
      icon="mdi:text-box-outline"
      onClick={() =>
        launchPipelineRunLogs({
          runName,
          namespace,
          cluster,
        })
      }
    />
  );
}
