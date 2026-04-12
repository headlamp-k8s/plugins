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
import { PipelineClass } from '../../resources/pipeline';
import { PipelineVersionClass } from '../../resources/pipelineVersion';
import { PipelineStatusBadge } from '../common/PipelineStatusBadge';
import {
  countPipelineVersionsForPipeline,
  getLatestPipelineVersionForPipeline,
  getPipelineDetailsPath,
  getPipelineResourceStatus,
  getPipelineVersionDetailsPath,
} from '../common/pipelineUtils';
import { SectionPage } from '../common/SectionPage';

/**
 * Lists Kubeflow Pipeline resources available on the cluster.
 */
export function PipelinesList() {
  const [pipelineVersions] = PipelineVersionClass.useList();
  const versions = pipelineVersions ?? [];

  return (
    <SectionPage title="Pipelines" apiPath="/apis/pipelines.kubeflow.org/v2beta1/pipelines">
      <ResourceListView
        title="Pipelines"
        resourceClass={PipelineClass}
        columns={[
          {
            id: 'name',
            label: 'Name',
            getValue: (item: PipelineClass) => item.metadata.name,
            render: (item: PipelineClass) => (
              <HeadlampLink
                routeName={getPipelineDetailsPath()}
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
            getValue: (item: PipelineClass) => item.displayName || '-',
          },
          {
            id: 'description',
            label: 'Description',
            getValue: (item: PipelineClass) => item.description || '-',
          },
          {
            id: 'latest-version',
            label: 'Latest Version',
            getValue: (item: PipelineClass) => {
              const latestVersion = getLatestPipelineVersionForPipeline(
                versions,
                item.metadata.name,
                item.metadata.namespace
              );

              return latestVersion?.metadata?.name ?? '-';
            },
            render: (item: PipelineClass) => {
              const latestVersion = getLatestPipelineVersionForPipeline(
                versions,
                item.metadata.name,
                item.metadata.namespace
              );

              if (!latestVersion?.metadata?.name || !latestVersion.metadata.namespace) {
                return <>-</>;
              }

              return (
                <HeadlampLink
                  routeName={getPipelineVersionDetailsPath()}
                  params={{
                    namespace: latestVersion.metadata.namespace,
                    name: latestVersion.metadata.name,
                  }}
                >
                  {latestVersion.metadata.name}
                </HeadlampLink>
              );
            },
          },
          {
            id: 'version-count',
            label: 'Versions',
            getValue: (item: PipelineClass) =>
              countPipelineVersionsForPipeline(
                versions,
                item.metadata.name,
                item.metadata.namespace
              ),
          },
          {
            id: 'status',
            label: 'Status',
            getValue: (item: PipelineClass) => getPipelineResourceStatus(item).label,
            render: (item: PipelineClass) => <PipelineStatusBadge resource={item} />,
          },
          'age',
        ]}
      />
    </SectionPage>
  );
}
