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
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Chip, Link as MuiLink } from '@mui/material';
import CELPolicyViewer from './CELPolicyViewer';
import {
  DeletingPolicy,
  GeneratingPolicy,
  MutatingPolicy,
  ValidatingPolicy,
} from '../resources/celPolicies';

interface CELPolicyListProps {
  title: string;
  resourceClass:
    | typeof ValidatingPolicy
    | typeof MutatingPolicy
    | typeof GeneratingPolicy
    | typeof DeletingPolicy;
  extraColumns?: {
    id: string;
    label: string;
    getValue: (item: KubeObject) => string | number;
    gridTemplate?: string;
  }[];
}

function ReadyChip({ item }: { item: { ready: boolean } }) {
  return (
    <Chip
      label={item.ready ? 'True' : 'False'}
      color={item.ready ? 'success' : 'error'}
      size="small"
    />
  );
}

function CELPolicyList({ title, resourceClass, extraColumns = [] }: CELPolicyListProps) {
  return (
    <ResourceListView
      title={title}
      resourceClass={resourceClass}
      columns={[
        {
          id: 'name',
          label: 'Name',
          getValue: item => item.jsonData.metadata.name,
          render: item => (
            <MuiLink
              component="button"
              sx={{ textAlign: 'left' }}
              onClick={() =>
                Activity.launch({
                  id: `kyverno-cel-${resourceClass.kind}-${item.jsonData.metadata.name}`,
                  location: 'split-right',
                  icon: <Icon icon="mdi:shield-check" />,
                  title: item.jsonData.metadata.name,
                  content: (
                    <CELPolicyViewer
                      name={item.jsonData.metadata.name}
                      resourceClass={resourceClass}
                    />
                  ),
                })
              }
            >
              {item.jsonData.metadata.name}
            </MuiLink>
          ),
        },
        {
          id: 'ready',
          label: 'Ready',
          getValue: item => ((item as unknown as { ready: boolean }).ready ? 'True' : 'False'),
          render: item => <ReadyChip item={item as unknown as { ready: boolean }} />,
          gridTemplate: '0.5fr',
        },
        ...extraColumns,
        'age',
      ]}
    />
  );
}

export function ValidatingPolicyList() {
  return (
    <CELPolicyList
      title="Validating Policies"
      resourceClass={ValidatingPolicy}
      extraColumns={[
        {
          id: 'actions',
          label: 'Actions',
          getValue: item => (item as unknown as ValidatingPolicy).validationActions.join(', '),
        },
        {
          id: 'validations',
          label: 'Validations',
          getValue: item => (item as unknown as ValidatingPolicy).validationCount,
          gridTemplate: '0.5fr',
        },
      ]}
    />
  );
}

export function MutatingPolicyList() {
  return (
    <CELPolicyList
      title="Mutating Policies"
      resourceClass={MutatingPolicy}
      extraColumns={[
        {
          id: 'mutations',
          label: 'Mutations',
          getValue: item => (item as unknown as MutatingPolicy).mutationCount,
          gridTemplate: '0.5fr',
        },
      ]}
    />
  );
}

export function GeneratingPolicyList() {
  return (
    <CELPolicyList
      title="Generating Policies"
      resourceClass={GeneratingPolicy}
      extraColumns={[
        {
          id: 'generators',
          label: 'Generators',
          getValue: item => (item as unknown as GeneratingPolicy).generateCount,
          gridTemplate: '0.5fr',
        },
      ]}
    />
  );
}

export function DeletingPolicyList() {
  return (
    <CELPolicyList
      title="Deleting Policies"
      resourceClass={DeletingPolicy}
      extraColumns={[
        {
          id: 'schedule',
          label: 'Schedule',
          getValue: item => (item as unknown as DeletingPolicy).schedule,
        },
      ]}
    />
  );
}
