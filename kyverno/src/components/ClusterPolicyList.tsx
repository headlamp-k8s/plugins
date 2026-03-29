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

import { Icon } from '@iconify/react';
import { Activity } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Chip, Link as MuiLink } from '@mui/material';
import { KyvernoClusterPolicy } from '../resources/kyvernoPolicy';
import { PolicyViewer } from './PolicyViewer';

function openClusterPolicyActivity(item: KyvernoClusterPolicy) {
  Activity.launch({
    id: `kyverno-cpol-${item.jsonData.metadata.name}`,
    location: 'split-right',
    icon: <Icon icon="mdi:shield-edit" />,
    title: item.jsonData.metadata.name,
    content: <PolicyViewer name={item.jsonData.metadata.name} isClusterScoped />,
  });
}

export function ClusterPolicyList() {
  return (
    <ResourceListView
      title="Cluster Policies"
      resourceClass={KyvernoClusterPolicy}
      columns={[
        {
          id: 'name',
          label: 'Name',
          getValue: item => item.jsonData.metadata.name,
          render: item => (
            <MuiLink
              component="button"
              onClick={() => openClusterPolicyActivity(item)}
              sx={{ textAlign: 'left' }}
            >
              {item.jsonData.metadata.name}
            </MuiLink>
          ),
        },
        {
          id: 'ready',
          label: 'Ready',
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
          id: 'action',
          label: 'Action',
          getValue: item => item.validationFailureAction,
          gridTemplate: '0.7fr',
        },
        {
          id: 'background',
          label: 'Background',
          getValue: item => (item.background ? 'True' : 'False'),
          gridTemplate: '0.7fr',
        },
        {
          id: 'ruleTypes',
          label: 'Rule Types',
          getValue: item => item.ruleTypes.join(', '),
          render: item => (
            <span style={{ display: 'inline-flex', gap: 4 }}>
              {item.ruleTypes.map(t => (
                <Chip key={t} label={t} size="small" variant="outlined" />
              ))}
            </span>
          ),
        },
        {
          id: 'rules',
          label: 'Rules',
          getValue: item => item.rules.length,
          gridTemplate: '0.4fr',
        },
        'age',
      ]}
    />
  );
}
