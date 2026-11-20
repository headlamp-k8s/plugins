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

import type { ConversationMessage } from '@headlamp-k8s/ai-common/conversation/types';
import type { Meta, StoryObj } from '@storybook/react';
import ExportSessionDialog from './ExportSessionDialog';

const meta = {
  title: 'AI UI/ExportSessionDialog',
  component: ExportSessionDialog,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ExportSessionDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleMessages: ConversationMessage[] = [
  {
    role: 'user',
    content: 'Why is the frontend deployment failing to start in the production namespace?',
  },
  {
    role: 'assistant',
    content:
      'I will inspect the pods in the `production` namespace to diagnose the startup failure.',
    toolCalls: [
      {
        id: 'call_1',
        name: 'kubernetes_api_request',
        args: {
          endpoint: '/api/v1/namespaces/production/pods',
          method: 'GET',
        },
      },
    ],
  },
  {
    role: 'tool',
    content: JSON.stringify({
      kind: 'PodList',
      items: [
        {
          metadata: { name: 'frontend-76b4c95d9-xk28m', namespace: 'production' },
          status: {
            phase: 'Pending',
            containerStatuses: [
              {
                name: 'frontend',
                ready: false,
                restartCount: 4,
                state: {
                  waiting: {
                    reason: 'CrashLoopBackOff',
                    message: 'Back-off 2m40s restarting failed container',
                  },
                },
              },
            ],
          },
        },
      ],
    }),
  },
  {
    role: 'assistant',
    content: `### Root Cause Analysis

The pod \`frontend-76b4c95d9-xk28m\` is entering **CrashLoopBackOff** due to a misconfigured database connection endpoint in its environment variables.

| Metric | Status | Note |
|---|---|---|
| Phase | Pending / Crashing | Container exiting with status 1 |
| Restarts | 4 | Exponential backoff active |
| Resource Limits | Normal | 250m CPU, 512Mi Memory |

#### Recommended Remediation:
1. Verify the Secret \`frontend-db-credentials\` exists in \`production\`.
2. Check that the DB service \`postgres.internal\` is reachable via CoreDNS.
3. Apply the updated deployment specification:

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: production
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: frontend
          image: ghcr.io/headlamp-k8s/frontend:v2.4.0
          env:
            - name: DATABASE_HOST
              value: "postgres.production.svc.cluster.local"
\`\`\`
`,
  },
];

export const Default: Story = {
  args: {
    open: true,
    onClose: () => undefined,
    messages: sampleMessages,
    cluster: 'minikube-production',
    clusters: ['minikube-production'],
  },
};

export const MultiCluster: Story = {
  args: {
    open: true,
    onClose: () => undefined,
    messages: sampleMessages,
    clusters: ['us-east-prod', 'eu-west-prod'],
  },
};

export const EmptySession: Story = {
  args: {
    open: true,
    onClose: () => undefined,
    messages: [],
    cluster: 'minikube',
  },
};
