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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { KServiceRestartTracker } from './KServiceRestartTracker';

const mocks = vi.hoisted(() => ({
  clusterRequest: vi.fn(),
  useList: vi.fn(),
  useRestartRollout: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { clusterRequest: mocks.clusterRequest },
}));

vi.mock('./useDeploymentList', () => ({
  useDeploymentList: mocks.useList,
  toDeployments: (items: object[], cluster: string) => items.map(item => ({ ...item, cluster })),
}));

vi.mock('../hooks/useRestartRollout', () => ({ useRestartRollout: mocks.useRestartRollout }));

const SELECTOR = 'serving.knative.dev/service=service-a';

/**
 * Renders the tracker of `service-a` in namespace `default` of `cluster-a`.
 *
 * @param onFinished - Called once the restart has been shown.
 * @returns The options the tracker handed to `useRestartRollout`.
 */
function track(onFinished = vi.fn()) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <KServiceRestartTracker
        cluster="cluster-a"
        namespace="default"
        serviceName="service-a"
        onFinished={onFinished}
      />
    </QueryClientProvider>
  );
  return mocks.useRestartRollout.mock.lastCall![0];
}

/**
 * Returns the options the tracker last handed to `useRestartRollout`.
 *
 * @returns The options of the latest call.
 */
function lastOptions() {
  return mocks.useRestartRollout.mock.lastCall![0];
}

describe('KServiceRestartTracker', () => {
  beforeEach(() => {
    mocks.clusterRequest.mockReset();
    mocks.useList.mockReset();
    mocks.useRestartRollout.mockReset();
    mocks.useList.mockReturnValue({ items: null, error: null, isSuccess: false, isFetching: true });
    mocks.clusterRequest.mockReturnValue(new Promise(() => {}));
  });

  it("watches the Service's Deployments", () => {
    track();

    expect(mocks.useList).toHaveBeenCalledWith('cluster-a', 'default', SELECTOR);
  });

  it('renders nothing', () => {
    mocks.useList.mockReturnValue({ items: [], error: null, isSuccess: true, isFetching: false });

    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <KServiceRestartTracker
          cluster="cluster-a"
          namespace="default"
          serviceName="service-a"
          onFinished={vi.fn()}
        />
      </QueryClientProvider>
    );

    expect(container.innerHTML).toBe('');
  });

  it('hands the watched Deployments to the restart', () => {
    const items = [{ metadata: { name: 'service-a-00001-deployment' } }];
    const error = new Error('boom');
    const onFinished = vi.fn();
    mocks.useList.mockReturnValue({ items, error, isSuccess: false, isFetching: true });

    const options = track(onFinished);

    expect(options).toMatchObject({
      serviceKey: 'cluster-a/default/service-a',
      deployments: items,
      listError: error,
      onFinished,
    });
  });

  it('starts from one read of its own, not from the list the watch begins with', async () => {
    const cached = [{ metadata: { name: 'service-a-00001-deployment' } }];
    const current = [{ metadata: { name: 'service-a-00002-deployment' } }];
    mocks.useList.mockReturnValue({
      items: cached,
      error: null,
      isSuccess: true,
      isFetching: false,
    });
    mocks.clusterRequest.mockResolvedValueOnce({ items: current });

    expect(track().start).toBeNull();

    await waitFor(() =>
      expect(lastOptions().start).toEqual([{ ...current[0], cluster: 'cluster-a' }])
    );
    expect(lastOptions().deployments).toBe(cached);
    expect(mocks.clusterRequest).toHaveBeenCalledTimes(1);
  });

  it('fails the restart when the read it starts from fails', async () => {
    const error = new Error('forbidden');
    mocks.clusterRequest.mockRejectedValueOnce(error);

    track();

    await waitFor(() => expect(lastOptions().listError).toBe(error));
  });

  it('reads the Deployments once through the API proxy', async () => {
    const items = [{ metadata: { name: 'service-a-00001-deployment' } }];
    mocks.clusterRequest.mockResolvedValue({ items });

    await expect(track().readDeployments()).resolves.toBe(items);

    expect(mocks.clusterRequest).toHaveBeenCalledWith(
      '/apis/apps/v1/namespaces/default/deployments',
      { cluster: 'cluster-a' },
      { labelSelector: SELECTOR }
    );
  });

  it('reads no Deployments when the API server returns no list', async () => {
    mocks.clusterRequest.mockResolvedValue(undefined);

    await expect(track().readDeployments()).resolves.toEqual([]);
  });
});
