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

import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Chip } from '@mui/material';
import { CleanupPolicy, ClusterCleanupPolicy } from '../resources/cleanupPolicy';

export function CleanupPolicyList() {
  return (
    <ResourceListView
      title="Cleanup Policies"
      resourceClass={CleanupPolicy}
      columns={[
        {
          id: 'name',
          label: 'Name',
          getValue: item => item.jsonData.metadata.name,
        },
        'namespace',
        {
          id: 'ready',
          label: 'Ready',
          getValue: item => ((item as unknown as CleanupPolicy).ready ? 'True' : 'False'),
          render: item => {
            const ready = (item as unknown as CleanupPolicy).ready;
            return <Chip label={ready ? 'True' : 'False'} color={ready ? 'success' : 'error'} size="small" />;
          },
          gridTemplate: '0.5fr',
        },
        {
          id: 'schedule',
          label: 'Schedule',
          getValue: item => (item as unknown as CleanupPolicy).schedule,
        },
        {
          id: 'lastExecution',
          label: 'Last Execution',
          getValue: item => (item as unknown as CleanupPolicy).lastExecutionTime || '-',
        },
        'age',
      ]}
    />
  );
}

export function ClusterCleanupPolicyList() {
  return (
    <ResourceListView
      title="Cluster Cleanup Policies"
      resourceClass={ClusterCleanupPolicy}
      columns={[
        {
          id: 'name',
          label: 'Name',
          getValue: item => item.jsonData.metadata.name,
        },
        {
          id: 'ready',
          label: 'Ready',
          getValue: item => ((item as unknown as ClusterCleanupPolicy).ready ? 'True' : 'False'),
          render: item => {
            const ready = (item as unknown as ClusterCleanupPolicy).ready;
            return <Chip label={ready ? 'True' : 'False'} color={ready ? 'success' : 'error'} size="small" />;
          },
          gridTemplate: '0.5fr',
        },
        {
          id: 'schedule',
          label: 'Schedule',
          getValue: item => (item as unknown as ClusterCleanupPolicy).schedule,
        },
        {
          id: 'lastExecution',
          label: 'Last Execution',
          getValue: item => (item as unknown as ClusterCleanupPolicy).lastExecutionTime || '-',
        },
        'age',
      ]}
    />
  );
}
