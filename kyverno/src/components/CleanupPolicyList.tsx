/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Chip } from '@mui/material';
import { CleanupPolicy, ClusterCleanupPolicy } from '../resources/cleanupPolicy';
import { columnId } from './common';

export function CleanupPolicyList() {
  const { t } = useTranslation();
  return (
    <ResourceListView
      title={t('Cleanup Policies')}
      resourceClass={CleanupPolicy}
      columns={[
        {
          id: columnId('name', t('Name')),
          label: t('Name'),
          getValue: item => item.jsonData.metadata.name,
        },
        'namespace',
        {
          id: columnId('ready', t('Ready')),
          label: t('Ready'),
          getValue: item => (item.ready ? 'True' : 'False'),
          render: item => (
            <Chip
              label={item.ready ? 'True' : 'False'}
              color={item.ready ? 'success' : 'error'}
              size="small"
            />
          ),
          gridTemplate: '0.5fr',
        },
        {
          id: columnId('schedule', t('Schedule')),
          label: t('Schedule'),
          getValue: item => item.schedule,
        },
        {
          id: columnId('lastExecution', t('Last Execution')),
          label: t('Last Execution'),
          getValue: item => item.lastExecutionTime || '-',
        },
        'age',
      ]}
    />
  );
}

export function ClusterCleanupPolicyList() {
  const { t } = useTranslation();
  return (
    <ResourceListView
      title={t('Cluster Cleanup Policies')}
      resourceClass={ClusterCleanupPolicy}
      columns={[
        {
          id: columnId('name', t('Name')),
          label: t('Name'),
          getValue: item => item.jsonData.metadata.name,
        },
        {
          id: columnId('ready', t('Ready')),
          label: t('Ready'),
          getValue: item => (item.ready ? 'True' : 'False'),
          render: item => (
            <Chip
              label={item.ready ? 'True' : 'False'}
              color={item.ready ? 'success' : 'error'}
              size="small"
            />
          ),
          gridTemplate: '0.5fr',
        },
        {
          id: columnId('schedule', t('Schedule')),
          label: t('Schedule'),
          getValue: item => item.schedule,
        },
        {
          id: columnId('lastExecution', t('Last Execution')),
          label: t('Last Execution'),
          getValue: item => item.lastExecutionTime || '-',
        },
        'age',
      ]}
    />
  );
}
