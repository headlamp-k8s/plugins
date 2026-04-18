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

import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  ActionButton,
  DetailsGrid,
  Link as HeadlampLink,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';
import { useParams } from 'react-router-dom';
import { PipelineRunClass } from '../../resources/pipelineRun';
import { KubeflowConditionsSection } from '../common/KubeflowConditionsSection';
import { launchPodLogs } from '../common/KubeflowLogsViewer';
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
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  return (
    <SectionPage title="Pipeline Run Detail" apiPath="/apis/pipelines.kubeflow.org/v2beta1/runs">
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
              name: 'Phase',
              value: item.phase || '-',
            },
            {
              name: 'Pipeline',
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
              name: 'Pipeline Version',
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
              name: 'Experiment',
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
              name: 'Pipeline Root',
              value: getPipelineRunRoot(item) || '-',
            },
            {
              name: 'Service Account',
              value: item.serviceAccountName || '-',
            },
            {
              name: 'Start Time',
              value: item.status.startTime || '-',
            },
            {
              name: 'Completion Time',
              value: item.status.completionTime || '-',
            },
            {
              name: 'Duration',
              value: getPipelineRunDurationLabel(item),
            },
            {
              name: 'Message',
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
                          <SectionBox title="Runtime Configuration">
                            <SimpleTable
                              columns={[
                                { label: 'Field', getter: (row: { label: string }) => row.label },
                                { label: 'Value', getter: (row: { value: string }) => row.value },
                              ]}
                              data={Object.entries(item.spec.runtimeConfig).map(([key, value]) => ({
                                label: key,
                                value: formatRuntimeValue(value),
                              }))}
                              emptyMessage="No runtime configuration provided."
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
                        section: <KubeflowConditionsSection conditions={item.conditions} />,
                      },
                    ]
                  : []),
                {
                  id: 'spec-preview',
                  section: (
                    <SectionBox title="Raw Spec Preview">
                      <Box
                        component="pre"
                        sx={{
                          margin: 0,
                          overflowX: 'auto',
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                        }}
                      >
                        {JSON.stringify(item.spec, null, 2)}
                      </Box>
                    </SectionBox>
                  ),
                },
              ]
            : []
        }
      />
    </SectionPage>
  );
}

/**
 * Helper component to find pods and launch logs for a Pipeline Run.
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
  const [pods] = K8s.ResourceClasses.Pod.useList({
    namespace,
    labelSelector: `pipelines.kubeflow.org/run-id=${runName}`,
  });

  const pod = pods?.[0];

  if (!pod) return null;

  return (
    <ActionButton
      description="View Latest Pod Logs"
      icon="mdi:text-box-outline"
      onClick={() =>
        pod &&
        launchPodLogs({
          podName: pod.metadata.name,
          namespace: pod.metadata.namespace,
          cluster,
          title: `Logs: Run — ${runName}`,
        })
      }
    />
  );
}
