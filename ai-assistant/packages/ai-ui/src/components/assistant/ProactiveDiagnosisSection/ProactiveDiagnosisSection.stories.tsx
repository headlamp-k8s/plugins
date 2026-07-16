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

import type { Meta, StoryObj } from '@storybook/react';
import type { DiagnosisResult } from '../../../diagnosis/ProactiveDiagnosisManager';
import ProactiveDiagnosisSection from './ProactiveDiagnosisSection';

export function createDiagnosis(overrides: Partial<DiagnosisResult> = {}): DiagnosisResult {
  return {
    eventUid: 'event-1',
    event: {
      uid: 'event-1',
      name: 'pod-warning.1827a1',
      type: 'Warning',
      reason: 'BackOff',
      message: 'Back-off restarting failed container',
      objectKind: 'Pod',
      objectName: 'nginx-7b6c9f5d4d-rx2jm',
      objectNamespace: 'default',
      lastTimestamp: '2025-01-01T00:00:00Z',
      rawEvent: {},
    },
    diagnosis: '',
    diagnosedAt: Date.now(),
    loading: false,
    ...overrides,
  };
}

const meta = {
  title: 'AI UI/ProactiveDiagnosisSection',
  component: ProactiveDiagnosisSection,
} satisfies Meta<typeof ProactiveDiagnosisSection>;
export default meta;
type Story = StoryObj<typeof meta>;

export const baseDiagnosisArgs: React.ComponentProps<typeof ProactiveDiagnosisSection> = {
  diagnoses: [],
  scrollToEventUid: null,
  onScrollComplete: () => undefined,
  isCycleRunning: false,
  onYamlAction: () => undefined,
};

export const runningCycleArgs: React.ComponentProps<typeof ProactiveDiagnosisSection> = {
  ...baseDiagnosisArgs,
  isCycleRunning: true,
  diagnoses: [
    createDiagnosis({
      loading: true,
      thinkingSteps: [
        {
          id: 'step-1',
          content: 'Tool start: kubernetes_api_request',
          type: 'tool-start',
          timestamp: 1,
        },
        {
          id: 'step-2',
          content: 'Checking related events and pod status...',
          type: 'intermediate-text',
          timestamp: 2,
        },
      ],
    }),
    createDiagnosis({
      eventUid: 'event-2',
      event: {
        uid: 'event-2',
        name: 'deployment-warning.1827b2',
        type: 'Warning',
        reason: 'FailedScheduling',
        message: '0/3 nodes are available: insufficient memory.',
        objectKind: 'Deployment',
        objectName: 'payments-api',
        objectNamespace: 'prod',
        lastTimestamp: '2025-01-01T00:00:00Z',
        rawEvent: {},
      },
      pending: true,
    }),
  ],
};
export const RunningCycle: Story = { args: runningCycleArgs };

export const completedDiagnosesArgs: React.ComponentProps<typeof ProactiveDiagnosisSection> = {
  ...baseDiagnosisArgs,
  diagnoses: [
    createDiagnosis({
      diagnosis:
        '🔧 kubernetes_api_request\n🔧 kubernetes_api_request (events)\n\nThe pod is crash looping because its readiness probe is hitting port 8080, but the container only listens on port 3000. Update the probe configuration and redeploy.',
      thinkingSteps: [
        {
          id: 'step-1',
          content: 'Tool start: kubernetes_api_request',
          type: 'tool-start',
          timestamp: 1,
        },
        {
          id: 'step-2',
          content: 'Tool kubernetes_api_request returned pod and event details',
          type: 'tool-result',
          timestamp: 2,
        },
      ],
    }),
  ],
};
export const CompletedDiagnoses: Story = { args: completedDiagnosesArgs };

export const failureDiagnosisArgs: React.ComponentProps<typeof ProactiveDiagnosisSection> = {
  ...baseDiagnosisArgs,
  diagnoses: [
    createDiagnosis({
      eventUid: 'event-3',
      event: {
        uid: 'event-3',
        name: 'job-error.1827c3',
        type: 'Error',
        reason: 'ImagePullBackOff',
        message: 'Failed to pull image ghcr.io/example/private-image:latest',
        objectKind: 'Job',
        objectName: 'nightly-backup',
        objectNamespace: 'ops',
        lastTimestamp: '2025-01-01T00:00:00Z',
        rawEvent: {},
      },
      error: 'Diagnosis request timed out while fetching cluster context.',
    }),
  ],
};
export const WithFailure: Story = { args: failureDiagnosisArgs };
