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
  DetailsGrid,
  Link as HeadlampLink,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useParams } from 'react-router-dom';
import { PipelineClass } from '../../resources/pipeline';
import { PipelineVersionClass } from '../../resources/pipelineVersion';
import { KubeflowConditionsSection } from '../common/KubeflowConditionsSection';
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
          const sortedVersions = [...relatedVersions].sort((left, right) => {
            const leftTimestamp = Date.parse(left.metadata.creationTimestamp ?? '');
            const rightTimestamp = Date.parse(right.metadata.creationTimestamp ?? '');
            return rightTimestamp - leftTimestamp;
          });
          const latestVersion = sortedVersions[0];
          const previousVersion = sortedVersions[1];

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
            ...(latestVersion && previousVersion
              ? [
                  {
                    id: 'version-comparison',
                    section: (
                      <SectionBox title="Latest vs Previous Version">
                        <Grid container spacing={2}>
                          {[latestVersion, previousVersion].map(version => (
                            <Grid item xs={12} md={6} key={version.metadata.name}>
                              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                {version.metadata.name}
                              </Typography>
                              <Box
                                component="pre"
                                sx={{
                                  margin: 0,
                                  overflowX: 'auto',
                                  whiteSpace: 'pre-wrap',
                                  fontFamily: 'monospace',
                                  fontSize: '0.8rem',
                                  backgroundColor: 'action.hover',
                                  padding: 1.5,
                                  borderRadius: '4px',
                                }}
                              >
                                {JSON.stringify(version.spec, null, 2)}
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
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
          ];
        }}
      />
    </SectionPage>
  );
}
