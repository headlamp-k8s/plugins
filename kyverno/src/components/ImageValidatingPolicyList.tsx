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
import {
  ImageValidatingPolicy,
  NamespacedImageValidatingPolicy,
} from '../resources/celPolicies';
import { ImageValidatingPolicyViewer } from './ImageValidatingPolicyViewer';

function openActivity(item: ImageValidatingPolicy | NamespacedImageValidatingPolicy) {
  const namespace = item.jsonData.metadata.namespace;
  Activity.launch({
    id: `kyverno-ivpol-${namespace ? namespace + '-' : ''}${item.jsonData.metadata.name}`,
    location: 'split-right',
    icon: <Icon icon="mdi:shield-lock" />,
    title: namespace ? `${namespace}/${item.jsonData.metadata.name}` : item.jsonData.metadata.name,
    content: (
      <ImageValidatingPolicyViewer name={item.jsonData.metadata.name} namespace={namespace} />
    ),
  });
}

export function ImageValidatingPolicyList() {
  const { t } = useTranslation();
  return (
    <ResourceListView
      title={t('Image Validating Policies')}
      resourceClass={ImageValidatingPolicy}
      columns={[
        {
          id: 'name',
          label: t('Name'),
          getValue: item => item.jsonData.metadata.name,
          render: item => (
            <MuiLink
              component="button"
              onClick={() => openActivity(item)}
              sx={{ textAlign: 'left' }}
            >
              {item.jsonData.metadata.name}
            </MuiLink>
          ),
        },
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
          id: 'images',
          label: t('Image Patterns'),
          getValue: item => item.imagePatterns.join(', ') || '-',
        },
        {
          id: 'attestors',
          label: t('Attestors'),
          getValue: item => item.attestorCount,
          gridTemplate: '0.5fr',
        },
        'age',
      ]}
    />
  );
}

export function NamespacedImageValidatingPolicyList() {
  const { t } = useTranslation();
  return (
    <ResourceListView
      title={t('Namespaced Image Validating Policies')}
      resourceClass={NamespacedImageValidatingPolicy}
      columns={[
        {
          id: 'name',
          label: t('Name'),
          getValue: item => item.jsonData.metadata.name,
          render: item => (
            <MuiLink
              component="button"
              onClick={() => openActivity(item)}
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
          id: 'images',
          label: t('Image Patterns'),
          getValue: item => item.imagePatterns.join(', ') || '-',
        },
        {
          id: 'attestors',
          label: t('Attestors'),
          getValue: item => item.attestorCount,
          gridTemplate: '0.5fr',
        },
        'age',
      ]}
    />
  );
}
