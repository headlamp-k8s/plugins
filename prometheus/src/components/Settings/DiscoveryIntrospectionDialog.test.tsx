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

import { render, screen } from '@testing-library/react';
import { inspectPrometheusDiscovery, KubernetesType } from '../../request';
import { DiscoveryIntrospectionDialog } from './DiscoveryIntrospectionDialog';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { request: vi.fn() },
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) =>
      key.replace(/{{(\w+)}}/g, (_, name) => options?.[name] ?? ''),
  }),
}));
vi.mock('../../request', async () => {
  const actual = await vi.importActual<typeof import('../../request')>('../../request');
  return { ...actual, inspectPrometheusDiscovery: vi.fn() };
});

const mockInspect = vi.mocked(inspectPrometheusDiscovery);

const noEndpoint = {
  type: KubernetesType.none,
  name: undefined,
  namespace: undefined,
  port: undefined,
};

describe('DiscoveryIntrospectionDialog', () => {
  beforeEach(() => {
    mockInspect.mockReset();
  });

  it('runs discovery on the selected cluster and shows steps while it is still running', async () => {
    mockInspect.mockImplementation((_cluster, onStep) => {
      onStep?.({
        sequence: 1,
        strategyId: 'customPod',
        resourceType: KubernetesType.pods,
        labelSelector: 'headlamp-prometheus=true',
        matched: false,
      });
      return new Promise(() => {});
    });

    render(<DiscoveryIntrospectionDialog open onClose={() => {}} cluster="cluster-b" />);

    expect(mockInspect).toHaveBeenCalledWith('cluster-b', expect.any(Function));
    expect(await screen.findByText('Custom Pod Label Search')).toBeTruthy();
    expect(screen.getByText('Running Prometheus autodetection search...')).toBeTruthy();
  });

  it('shows the error message of a failed step', async () => {
    const step = {
      sequence: 1,
      strategyId: 'customPod' as const,
      resourceType: KubernetesType.pods,
      labelSelector: 'headlamp-prometheus=true',
      matched: false,
      error: 'pods is forbidden',
    };
    mockInspect.mockImplementation(async (_cluster, onStep) => {
      onStep?.(step);
      return { steps: [step], finalEndpoint: noEndpoint };
    });

    render(<DiscoveryIntrospectionDialog open onClose={() => {}} cluster="cluster-b" />);

    expect(await screen.findByText('pods is forbidden')).toBeTruthy();
    expect(screen.getByText('Error')).toBeTruthy();
    expect(screen.getByText('Autodetection failed: pods is forbidden')).toBeTruthy();
    expect(screen.queryByText(/No reachable Prometheus instance detected/)).toBeNull();
  });

  it('shows a labelled resource that is not reachable', async () => {
    const step = {
      sequence: 1,
      strategyId: 'customPod' as const,
      resourceType: KubernetesType.pods,
      labelSelector: 'headlamp-prometheus=true',
      matched: true,
      matchedResource: { name: 'prometheus-pod', namespace: 'monitoring', ports: ['9090'] },
    };
    mockInspect.mockImplementation(async (_cluster, onStep) => {
      onStep?.(step);
      return { steps: [step], finalEndpoint: noEndpoint };
    });

    render(<DiscoveryIntrospectionDialog open onClose={() => {}} cluster="cluster-b" />);

    expect(await screen.findByText('Unreachable')).toBeTruthy();
    expect(screen.getByText('monitoring/prometheus-pod, ports: 9090')).toBeTruthy();
  });
});
