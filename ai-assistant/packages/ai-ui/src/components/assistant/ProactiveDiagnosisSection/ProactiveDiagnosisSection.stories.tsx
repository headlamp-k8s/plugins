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

import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import type { DiagnosisResult } from '../../diagnosis/ProactiveDiagnosisManager';
import ProactiveDiagnosisSection from './ProactiveDiagnosisSection';

function createDiagnosis(overrides: Partial<DiagnosisResult>): DiagnosisResult {
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
      lastTimestamp: new Date().toISOString(),
      rawEvent: {},
    },
    diagnosis: '',
    diagnosedAt: Date.now(),
    loading: false,
    ...overrides,
  };
}

export default {
  title: 'AI UI/ProactiveDiagnosisSection',
  component: ProactiveDiagnosisSection,
} as Meta;

const Template: StoryFn<React.ComponentProps<typeof ProactiveDiagnosisSection>> = args => (
  <ProactiveDiagnosisSection {...args} />
);

const baseArgs: React.ComponentProps<typeof ProactiveDiagnosisSection> = {
  diagnoses: [],
  scrollToEventUid: null,
  onScrollComplete: () => console.log('Scroll complete'),
  isCycleRunning: false,
  onYamlAction: (yaml, title, resourceType, isDelete) =>
    console.log('YAML action:', { yaml, title, resourceType, isDelete }),
};

export const RunningCycle = Template.bind({});
RunningCycle.args = {
  ...baseArgs,
  isCycleRunning: true,
  diagnoses: [
    createDiagnosis({
      loading: true,
      thinkingSteps: [
        {
          id: 'step-1',
          content: 'Tool start: kubernetes_api_request',
          type: 'tool-start',
          timestamp: Date.now() - 3000,
        },
        {
          id: 'step-2',
          content: 'Checking related events and pod status...',
          type: 'intermediate-text',
          timestamp: Date.now() - 1500,
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
        lastTimestamp: new Date().toISOString(),
        rawEvent: {},
      },
      pending: true,
    }),
  ],
};

export const CompletedDiagnoses = Template.bind({});
CompletedDiagnoses.args = {
  ...baseArgs,
  diagnoses: [
    createDiagnosis({
      diagnosis:
        '🔧 kubernetes_api_request\n🔧 kubernetes_api_request (events)\n\nThe pod is crash looping because its readiness probe is hitting port 8080, but the container only listens on port 3000. Update the probe configuration and redeploy.',
      thinkingSteps: [
        {
          id: 'step-1',
          content: 'Tool start: kubernetes_api_request',
          type: 'tool-start',
          timestamp: Date.now() - 4000,
        },
        {
          id: 'step-2',
          content: 'Tool kubernetes_api_request returned pod and event details',
          type: 'tool-result',
          timestamp: Date.now() - 2500,
        },
      ],
    }),
  ],
};

export const WithFailure = Template.bind({});
WithFailure.args = {
  ...baseArgs,
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
        lastTimestamp: new Date().toISOString(),
        rawEvent: {},
      },
      error: 'Diagnosis request timed out while fetching cluster context.',
    }),
  ],
};
