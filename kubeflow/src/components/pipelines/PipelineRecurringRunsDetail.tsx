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
import { PipelineRecurringRunClass } from '../../resources/pipelineRecurringRun';
import { KubeflowJsonViewerAction } from '../common/KubeflowJsonViewerAction';
import { PipelineStatusBadge } from '../common/PipelineStatusBadge';
import {
  getPipelineDetailsPath,
  getPipelineExperimentDetailsPath,
  getPipelineRunRoot,
  getPipelineVersionDetailsPath,
  getRecurringRunSchedule,
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
 * Renders the detail page for a Kubeflow RecurringRun resource.
 */
export function PipelineRecurringRunsDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  return (
    <SectionPage
      title="Recurring Run Detail"
      apiPath="/apis/pipelines.kubeflow.org/v2beta1/recurringruns"
    >
      <DetailsGrid
        resourceType={PipelineRecurringRunClass}
        name={name as string}
        namespace={namespace}
        withEvents
        actions={item =>
          item && [
            {
              id: 'kubeflow.recurringrun-json',
              action: (
                <KubeflowJsonViewerAction
                  title="View Raw JSON"
                  value={item.jsonData}
                  activityId={`json-recurring-run-${item.metadata.namespace}-${item.metadata.name}`}
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
              name: 'Schedule',
              value: getRecurringRunSchedule(item),
            },
            {
              name: 'Enabled',
              value: item.isEnabled === undefined ? '-' : item.isEnabled ? 'Yes' : 'No',
            },
            {
              name: 'Max Concurrency',
              value: item.maxConcurrency ?? '-',
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
              name: 'Last Run',
              value: item.status.lastRunTime || '-',
            },
            {
              name: 'Next Run',
              value: item.status.nextRunTime || '-',
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
                        section: (
                          <SectionBox title="Conditions">
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
