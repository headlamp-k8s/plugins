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
import {
  DeletingPolicy,
  GeneratingPolicy,
  MutatingPolicy,
  ValidatingPolicy,
} from '../resources/celPolicies';

function ReadyChip({ ready }: { ready: boolean }) {
  return <Chip label={ready ? 'True' : 'False'} color={ready ? 'success' : 'error'} size="small" />;
}

export function ValidatingPolicyList() {
  const { t } = useTranslation();
  return (
    <ResourceListView
      title={t('Validating Policies')}
      resourceClass={ValidatingPolicy}
      columns={[
        {
          id: 'name',
          label: t('Name'),
          getValue: item => item.jsonData.metadata.name,
        },
        {
          id: 'ready',
          label: t('Ready'),
          getValue: item => (item.ready ? 'True' : 'False'),
          render: item => <ReadyChip ready={item.ready} />,
          gridTemplate: '0.5fr',
        },
        {
          id: 'actions',
          label: t('Actions'),
          getValue: item => item.validationActions.join(', '),
        },
        {
          id: 'validations',
          label: t('Validations'),
          getValue: item => item.validationCount,
          gridTemplate: '0.5fr',
        },
        'age',
      ]}
    />
  );
}

export function MutatingPolicyList() {
  const { t } = useTranslation();
  return (
    <ResourceListView
      title={t('Mutating Policies')}
      resourceClass={MutatingPolicy}
      columns={[
        {
          id: 'name',
          label: t('Name'),
          getValue: item => item.jsonData.metadata.name,
        },
        {
          id: 'ready',
          label: t('Ready'),
          getValue: item => (item.ready ? 'True' : 'False'),
          render: item => <ReadyChip ready={item.ready} />,
          gridTemplate: '0.5fr',
        },
        {
          id: 'mutations',
          label: t('Mutations'),
          getValue: item => item.mutationCount,
          gridTemplate: '0.5fr',
        },
        'age',
      ]}
    />
  );
}

export function GeneratingPolicyList() {
  const { t } = useTranslation();
  return (
    <ResourceListView
      title={t('Generating Policies')}
      resourceClass={GeneratingPolicy}
      columns={[
        {
          id: 'name',
          label: t('Name'),
          getValue: item => item.jsonData.metadata.name,
        },
        {
          id: 'ready',
          label: t('Ready'),
          getValue: item => (item.ready ? 'True' : 'False'),
          render: item => <ReadyChip ready={item.ready} />,
          gridTemplate: '0.5fr',
        },
        {
          id: 'generators',
          label: t('Generators'),
          getValue: item => item.generateCount,
          gridTemplate: '0.5fr',
        },
        'age',
      ]}
    />
  );
}

export function DeletingPolicyList() {
  const { t } = useTranslation();
  return (
    <ResourceListView
      title={t('Deleting Policies')}
      resourceClass={DeletingPolicy}
      columns={[
        {
          id: 'name',
          label: t('Name'),
          getValue: item => item.jsonData.metadata.name,
        },
        {
          id: 'ready',
          label: t('Ready'),
          getValue: item => (item.ready ? 'True' : 'False'),
          render: item => <ReadyChip ready={item.ready} />,
          gridTemplate: '0.5fr',
        },
        {
          id: 'schedule',
          label: t('Schedule'),
          getValue: item => item.schedule,
        },
        'age',
      ]}
    />
  );
}
