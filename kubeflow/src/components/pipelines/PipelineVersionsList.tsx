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
  Link as HeadlampLink,
  ResourceListView,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { PipelineVersionClass } from '../../resources/pipelineVersion';
import { PipelineStatusBadge } from '../common/PipelineStatusBadge';
import {
  getPipelineDetailsPath,
  getPipelineResourceStatus,
  getPipelineVersionDetailsPath,
} from '../common/pipelineUtils';
import { SectionPage } from '../common/SectionPage';

/**
 * Lists Kubeflow PipelineVersion resources available on the cluster.
 */
export function PipelineVersionsList() {
  const { t } = useTranslation();

  return (
    <SectionPage
      title={t('Pipeline Versions')}
      apiPath="/apis/pipelines.kubeflow.org/v2beta1/pipelineversions"
    >
      <ResourceListView
        title={t('Pipeline Versions')}
        resourceClass={PipelineVersionClass}
        columns={[
          {
            id: 'name',
            label: t('Name'),
            getValue: (item: PipelineVersionClass) => item.metadata.name,
            render: (item: PipelineVersionClass) => (
              <HeadlampLink
                routeName={getPipelineVersionDetailsPath()}
                params={{ namespace: item.metadata.namespace, name: item.metadata.name }}
              >
                {item.metadata.name}
              </HeadlampLink>
            ),
          },
          'namespace',
          {
            id: 'display-name',
            label: t('Display Name'),
            getValue: (item: PipelineVersionClass) => item.displayName || '-',
          },
          {
            id: 'description',
            label: t('Description'),
            getValue: (item: PipelineVersionClass) => item.description || '-',
          },
          {
            id: 'pipeline',
            label: t('Pipeline'),
            getValue: (item: PipelineVersionClass) => item.pipelineName || '-',
            render: (item: PipelineVersionClass) =>
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
            id: 'status',
            label: t('Status'),
            getValue: (item: PipelineVersionClass) => getPipelineResourceStatus(item).label,
            render: (item: PipelineVersionClass) => <PipelineStatusBadge resource={item} />,
          },
          'age',
        ]}
      />
    </SectionPage>
  );
}
