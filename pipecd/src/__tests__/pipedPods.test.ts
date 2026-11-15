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

import { describe, expect, it } from 'vitest';
import {
  clusterPipeds,
  type ConfigMapLike,
  pipedIdFromConfig,
  type PodLike,
} from '../utils/pipedPods';

// The shape the PipeCD Helm chart writes.
const CONFIG = `apiVersion: pipecd.dev/v1beta1
kind: Piped
spec:
  projectID: dev
  pipedID: 4f3f5b35-3d0f-4f0c-a644-7e28a56b5d04
  pipedKeyFile: /etc/piped-secret/piped-key
  apiAddress: dev.pipecd.dev:443`;

function configMap(name: string, namespace: string, config: string): ConfigMapLike {
  return { metadata: { name, namespace }, data: { 'piped-config.yaml': config } };
}

function pod(
  name: string,
  namespace: string,
  configMapName: string,
  status: PodLike['status']
): PodLike {
  return {
    metadata: { name, namespace },
    spec: { volumes: [{}, { configMap: { name: configMapName } }] },
    status,
  };
}

const RUNNING: PodLike['status'] = { phase: 'Running', containerStatuses: [{ ready: true }] };
const CRASHING: PodLike['status'] = {
  phase: 'Running',
  containerStatuses: [{ ready: false, state: { waiting: { reason: 'CrashLoopBackOff' } } }],
};

describe('pipedIdFromConfig', () => {
  it('reads the piped id from a piped config', () => {
    expect(pipedIdFromConfig(CONFIG)).toBe('4f3f5b35-3d0f-4f0c-a644-7e28a56b5d04');
  });

  it('accepts a quoted id', () => {
    expect(pipedIdFromConfig('spec:\n  pipedID: "abc-123"')).toBe('abc-123');
  });

  it('returns nothing when there is no id', () => {
    expect(pipedIdFromConfig('kind: Piped\nspec: {}')).toBeUndefined();
  });
});

describe('clusterPipeds', () => {
  const cms = [configMap('piped', 'piped', CONFIG)];
  const ID = '4f3f5b35-3d0f-4f0c-a644-7e28a56b5d04';

  it('marks a piped whose pod is ready as running', () => {
    const result = clusterPipeds([pod('piped-1', 'piped', 'piped', RUNNING)], cms);

    expect(result.get(ID)).toEqual({
      running: true,
      namespace: 'piped',
      pod: 'piped-1',
      reason: '',
    });
  });

  it('reports why a piped is not running', () => {
    const result = clusterPipeds([pod('piped-1', 'piped', 'piped', CRASHING)], cms);

    expect(result.get(ID)).toMatchObject({ running: false, reason: 'CrashLoopBackOff' });
  });

  it('uses the pod phase when no container says why', () => {
    const result = clusterPipeds([pod('piped-1', 'piped', 'piped', { phase: 'Pending' })], cms);

    expect(result.get(ID)).toMatchObject({ running: false, reason: 'Pending' });
  });

  it('counts a piped as running if any of its pods is, as during a rollout', () => {
    const result = clusterPipeds(
      [pod('piped-old', 'piped', 'piped', CRASHING), pod('piped-new', 'piped', 'piped', RUNNING)],
      cms
    );

    expect(result.get(ID)).toMatchObject({ running: true, pod: 'piped-new' });
  });

  it('only matches a ConfigMap in the pod namespace', () => {
    const result = clusterPipeds([pod('piped-1', 'other', 'piped', RUNNING)], cms);

    expect(result.size).toBe(0);
  });

  it('skips a pod whose ConfigMap has no piped id', () => {
    const result = clusterPipeds(
      [pod('piped-1', 'piped', 'piped', RUNNING)],
      [configMap('piped', 'piped', 'kind: Piped')]
    );

    expect(result.size).toBe(0);
  });
});
