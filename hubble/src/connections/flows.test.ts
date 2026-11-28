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

import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_ADAPTER_SERVICE } from '../utils/settings';
import { flowsPath, getFlowSnapshot } from './flows';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { clusterRequest: vi.fn() },
  ConfigStore: class {},
}));

const clusterRequest = vi.mocked(ApiProxy.clusterRequest);

describe('flowsPath', () => {
  it('goes through the Service proxy of the adapter', () => {
    expect(flowsPath(DEFAULT_ADAPTER_SERVICE, { namespace: 'shop' })).toBe(
      '/api/v1/namespaces/kube-system/services/hubble-flows-adapter:http/proxy/v1/flows?namespace=shop'
    );
  });

  it('asks for one pod when given', () => {
    const path = flowsPath(
      { namespace: 'cilium', name: 'flows', port: '8080' },
      { namespace: 'shop', pod: 'web-1' }
    );
    expect(path).toBe(
      '/api/v1/namespaces/cilium/services/flows:8080/proxy/v1/flows?namespace=shop&pod=web-1'
    );
  });

  it('escapes values so they cannot change the path', () => {
    const path = flowsPath(
      { namespace: 'a/b', name: 'x?y', port: '80' },
      { namespace: 'shop&pod=other' }
    );
    expect(path).toBe(
      '/api/v1/namespaces/a%2Fb/services/x%3Fy:80/proxy/v1/flows?namespace=shop%26pod%3Dother'
    );
  });
});

describe('getFlowSnapshot', () => {
  beforeEach(() => {
    clusterRequest.mockReset();
  });

  it('asks the given cluster and returns the flows and lost events', async () => {
    const flows = [{ protocol: 'TCP' }];
    clusterRequest.mockResolvedValue({ flows, lostEvents: 3, unreadNodes: [] });

    const snapshot = await getFlowSnapshot('prod', DEFAULT_ADAPTER_SERVICE, {
      namespace: 'shop',
      pod: 'web-1',
    });

    expect(snapshot).toEqual({ flows, lostEvents: 3, unreadNodes: [] });
    expect(clusterRequest).toHaveBeenCalledWith(
      flowsPath(DEFAULT_ADAPTER_SERVICE, { namespace: 'shop', pod: 'web-1' }),
      { cluster: 'prod', autoLogoutOnAuthError: false }
    );
  });

  it('treats missing lost events as none', async () => {
    clusterRequest.mockResolvedValue({ flows: [] });
    await expect(
      getFlowSnapshot('prod', DEFAULT_ADAPTER_SERVICE, { namespace: 'shop' })
    ).resolves.toEqual({ flows: [], lostEvents: 0, unreadNodes: [] });
  });

  it('returns the nodes Relay could not read', async () => {
    clusterRequest.mockResolvedValue({ flows: [], unreadNodes: ['node-b'] });
    await expect(
      getFlowSnapshot('prod', DEFAULT_ADAPTER_SERVICE, { namespace: 'shop' })
    ).resolves.toMatchObject({ unreadNodes: ['node-b'] });
  });

  it.each([null, {}, { flows: 'many' }, 'ok'])(
    'rejects an answer without flows: %j',
    async body => {
      clusterRequest.mockResolvedValue(body);
      await expect(
        getFlowSnapshot('prod', DEFAULT_ADAPTER_SERVICE, { namespace: 'shop' })
      ).rejects.toThrow('not a list of flows');
    }
  );

  it('passes on request errors with their status', async () => {
    clusterRequest.mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }));
    await expect(
      getFlowSnapshot('prod', DEFAULT_ADAPTER_SERVICE, { namespace: 'shop' })
    ).rejects.toMatchObject({ status: 403 });
  });
});
