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
import { Activity, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Chip, Link as MuiLink } from '@mui/material';
import { KyvernoPolicy } from '../resources/kyvernoPolicy';
import { PolicyViewer } from './PolicyViewer';

function openPolicyActivity(item: KyvernoPolicy) {
  Activity.launch({
    id: `kyverno-pol-${item.jsonData.metadata.namespace}-${item.jsonData.metadata.name}`,
    location: 'split-right',
    icon: <Icon icon="mdi:shield-edit" />,
    title: `${item.jsonData.metadata.namespace}/${item.jsonData.metadata.name}`,
    content: (
      <PolicyViewer
        name={item.jsonData.metadata.name}
        namespace={item.jsonData.metadata.namespace}
      />
    ),
  });
}

export function PolicyList() {
  const { t } = useTranslation();
  return (
    <ResourceListView
      title={t('Policies')}
      resourceClass={KyvernoPolicy}
      columns={[
        {
          id: 'name',
          label: t('Name'),
          getValue: item => item.jsonData.metadata.name,
          render: item => (
            <MuiLink
              component="button"
              onClick={() => openPolicyActivity(item)}
              sx={{ textAlign: 'left' }}
            >
              {item.jsonData.metadata.name}
            </MuiLink>
          ),
        },
        'namespace',
        {
          id: 'ready',
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
          id: 'action',
          label: t('Action'),
          getValue: item => item.validationFailureAction,
          gridTemplate: '0.7fr',
        },
        {
          id: 'background',
          label: t('Background'),
          getValue: item => (item.background ? 'True' : 'False'),
          gridTemplate: '0.7fr',
        },
        {
          id: 'ruleTypes',
          label: t('Rule Types'),
          getValue: item => item.ruleTypes.join(', '),
          render: item => (
            <span style={{ display: 'inline-flex', gap: 4 }}>
              {item.ruleTypes.map(rt => (
                <Chip key={rt} label={rt} size="small" variant="outlined" />
              ))}
            </span>
          ),
        },
        {
          id: 'rules',
          label: t('Rules'),
          getValue: item => item.rules.length,
          gridTemplate: '0.4fr',
        },
        'age',
      ]}
    />
  );
}
