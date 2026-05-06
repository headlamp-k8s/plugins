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
import { PolicyException } from '../resources/policyException';
import { ExceptionViewer } from './ExceptionViewer';

function openExceptionActivity(item: PolicyException) {
  Activity.launch({
    id: `kyverno-polex-${item.jsonData.metadata.namespace}-${item.jsonData.metadata.name}`,
    location: 'split-right',
    icon: <Icon icon="mdi:shield-off" />,
    title: `${item.jsonData.metadata.namespace}/${item.jsonData.metadata.name}`,
    content: (
      <ExceptionViewer
        name={item.jsonData.metadata.name}
        namespace={item.jsonData.metadata.namespace}
      />
    ),
  });
}

export function PolicyExceptionList() {
  return (
    <ResourceListView
      title="Policy Exceptions"
      resourceClass={PolicyException}
      columns={[
        {
          id: 'name',
          label: 'Name',
          getValue: item => item.jsonData.metadata.name,
          render: item => (
            <MuiLink
              component="button"
              onClick={() => openExceptionActivity(item)}
              sx={{ textAlign: 'left' }}
            >
              {item.jsonData.metadata.name}
            </MuiLink>
          ),
        },
        'namespace',
        {
          id: 'policies',
          label: 'Policies',
          getValue: item => (item as unknown as PolicyException).policyNames.join(', '),
          render: item => (
            <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
              {(item as unknown as PolicyException).policyNames.map(p => (
                <Chip key={p} label={p} size="small" variant="outlined" />
              ))}
            </span>
          ),
        },
        {
          id: 'exceptions',
          label: 'Rules',
          getValue: item => (item as unknown as PolicyException).exceptions.length,
          gridTemplate: '0.5fr',
        },
        {
          id: 'background',
          label: 'Background',
          getValue: item => ((item as unknown as PolicyException).background ? 'True' : 'False'),
          gridTemplate: '0.5fr',
        },
        'age',
      ]}
    />
  );
}
