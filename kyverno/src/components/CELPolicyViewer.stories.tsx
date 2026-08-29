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

import type { Meta } from '@storybook/react';
import {
  DeletingPolicy,
  GeneratingPolicy,
  MutatingPolicy,
  ValidatingPolicy,
} from '../resources/celPolicies';
import { CELPolicyViewer } from './CELPolicyViewer';

const baseMetadata = {
  creationTimestamp: '2026-05-12T09:30:00Z',
  name: 'example-cel-policy',
  resourceVersion: '1',
  uid: 'fixture-uid',
};

const readyStatus = {
  conditionStatus: {
    ready: true,
  },
};

const podResourceRules = [
  {
    apiGroups: [''],
    apiVersions: ['v1'],
    operations: ['CREATE', 'UPDATE'],
    resources: ['pods'],
  },
];

const validatingPolicy = new ValidatingPolicy({
  apiVersion: 'policies.kyverno.io/v1',
  kind: 'ValidatingPolicy',
  metadata: {
    ...baseMetadata,
    name: 'disallow-privileged-containers',
  },
  spec: {
    validationActions: ['Enforce'],
    matchConstraints: {
      resourceRules: podResourceRules,
    },
    variables: [
      {
        name: 'containers',
        expression: 'object.spec.containers',
      },
    ],
    validations: [
      {
        expression:
          'variables.containers.all(c, !has(c.securityContext) || !c.securityContext.privileged)',
        message: 'Privileged containers are not allowed.',
        reason: 'Forbidden',
      },
    ],
    auditAnnotations: [
      {
        key: 'policy',
        valueExpression: '"disallow-privileged-containers"',
      },
    ],
  },
  status: readyStatus,
});

const mutatingPolicy = new MutatingPolicy({
  apiVersion: 'policies.kyverno.io/v1',
  kind: 'MutatingPolicy',
  metadata: {
    ...baseMetadata,
    name: 'add-default-labels',
  },
  spec: {
    matchConstraints: {
      resourceRules: podResourceRules,
    },
    variables: [
      {
        name: 'team',
        expression: '"platform"',
      },
    ],
    mutations: [
      {
        patchType: 'ApplyConfiguration',
        applyConfiguration: {
          expression: 'Object{metadata: Object.metadata{labels: {"team": variables.team}}}',
        },
      },
    ],
  },
  status: readyStatus,
});

const generatingPolicy = new GeneratingPolicy({
  apiVersion: 'policies.kyverno.io/v1',
  kind: 'GeneratingPolicy',
  metadata: {
    ...baseMetadata,
    name: 'generate-network-policy',
  },
  spec: {
    matchConstraints: {
      resourceRules: [
        {
          apiGroups: [''],
          apiVersions: ['v1'],
          operations: ['CREATE'],
          resources: ['namespaces'],
        },
      ],
    },
    generate: [
      {
        expression: 'Object{spec: Object.spec{podSelector: {}}}',
        name: 'default-deny',
        namespace: 'object.metadata.name',
      },
    ],
  },
  status: readyStatus,
});

const deletingPolicy = new DeletingPolicy({
  apiVersion: 'policies.kyverno.io/v1',
  kind: 'DeletingPolicy',
  metadata: {
    ...baseMetadata,
    name: 'cleanup-completed-jobs',
  },
  spec: {
    schedule: '0 0 * * *',
    matchConstraints: {
      resourceRules: [
        {
          apiGroups: ['batch'],
          apiVersions: ['v1'],
          operations: ['DELETE'],
          resources: ['jobs'],
        },
      ],
    },
    conditions: {
      all: [
        {
          key: '{{ request.object.status.completionTime }}',
          operator: 'NotEquals',
          value: '',
        },
      ],
    },
  },
  status: readyStatus,
});

export default {
  title: 'Kyverno/CELPolicyViewer',
  component: CELPolicyViewer,
} as Meta<typeof CELPolicyViewer>;

export const Validating = () => <CELPolicyViewer policy={validatingPolicy} />;

export const Mutating = () => <CELPolicyViewer policy={mutatingPolicy} />;

export const Generating = () => <CELPolicyViewer policy={generatingPolicy} />;

export const Deleting = () => <CELPolicyViewer policy={deletingPolicy} />;
