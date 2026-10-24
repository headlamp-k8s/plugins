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

// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GatewayConfig } from '../../config/gateway';
import { GatewayReadinessStatus } from './GatewayReadiness';

const mocks = vi.hoisted(() => ({
  gatewayUseGet: vi.fn(),
  serviceUseGet: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/k8s', () => ({
  ResourceClasses: {
    Gateway: { useGet: mocks.gatewayUseGet },
    Service: { useGet: mocks.serviceUseGet },
  },
}));

vi.mock('../common/ReadyStatusLabel', () => ({
  ReadyStatusLabel: ({ status }: { status: string }) => <span>{`Ready=${status}`}</span>,
}));

const config: GatewayConfig = {
  class: 'istio',
  gateway: { namespace: 'istio-system', name: 'knative-gateway' },
  service: { namespace: 'istio-system', name: 'istio-ingressgateway' },
  supportedFeatures: [],
  proxyProtocolEnabled: false,
};

/**
 * Builds the result Headlamp's useGet returns. useGet serves null placeholder data until the first
 * response arrives, so React Query reports that wait as a success with isLoading false: only the
 * missing data and error show the resource has not loaded. A missing resource arrives as a 404.
 */
function useGetResult(
  data: unknown,
  error: (Error & { status?: number }) | null = null,
  { isFetching = false } = {}
) {
  if (data && error) {
    throw new Error('useGet never returns data and an error together');
  }
  return {
    data,
    error,
    isError: error !== null,
    isLoading: false,
    isFetching,
    isSuccess: error === null,
    status: error ? 'error' : 'success',
  };
}

function apiError(status: number): Error & { status: number } {
  return Object.assign(new Error(`request failed with status ${status}`), { status });
}

const readyGateway = {
  status: {
    addresses: [{ value: '203.0.113.10' }],
    conditions: [
      { type: 'Accepted', status: 'True' },
      { type: 'Programmed', status: 'True' },
    ],
  },
};

const readyService = {
  jsonData: {
    spec: { type: 'ClusterIP', clusterIP: '10.96.0.20', ports: [{ port: 80, protocol: 'TCP' }] },
  },
};

function renderStatus(): string {
  return renderToStaticMarkup(<GatewayReadinessStatus config={config} cluster="cluster-a" />);
}

beforeEach(() => {
  mocks.gatewayUseGet.mockReset().mockReturnValue(useGetResult(readyGateway));
  mocks.serviceUseGet.mockReset().mockReturnValue(useGetResult(readyService));
});

describe('GatewayReadinessStatus', () => {
  it('reports the Gateway as loading while its first request is in flight', () => {
    mocks.gatewayUseGet.mockReturnValue(useGetResult(null, null, { isFetching: true }));

    const html = renderStatus();

    expect(html).toContain('Checking Gateway readiness');
    expect(html).not.toContain('was not found');
  });

  it('reports the Gateway as loading while Headlamp resolves the Gateway API version', () => {
    // Gateway is served at more than one API version, so useGet holds the request back until it
    // has found one that works. Nothing is fetching yet, and there is still no data or error.
    mocks.gatewayUseGet.mockReturnValue(useGetResult(null));

    const html = renderStatus();

    expect(html).toContain('Checking Gateway readiness');
    expect(html).not.toContain('was not found');
  });

  it('reports the Service as loading while its first request is in flight', () => {
    mocks.serviceUseGet.mockReturnValue(useGetResult(null, null, { isFetching: true }));

    const html = renderStatus();

    expect(html).toContain('Checking Service readiness');
    expect(html).not.toContain('was not found');
  });

  it('reports a Gateway that does not exist as not found', () => {
    mocks.gatewayUseGet.mockReturnValue(useGetResult(null, apiError(404)));

    const html = renderStatus();

    expect(html).toContain('Gateway istio-system/knative-gateway was not found.');
    expect(html).toContain('Ready=False');
  });

  it('reports a Service that does not exist as not found', () => {
    mocks.serviceUseGet.mockReturnValue(useGetResult(null, apiError(404)));

    const html = renderStatus();

    expect(html).toContain('Service istio-system/istio-ingressgateway was not found.');
  });

  it('reports a Gateway that cannot be read as unknown', () => {
    mocks.gatewayUseGet.mockReturnValue(useGetResult(null, apiError(403)));

    const html = renderStatus();

    expect(html).toContain('Unable to read Gateway istio-system/knative-gateway');
    expect(html).toContain('Ready=Unknown');
    expect(html).not.toContain('was not found');
  });

  it('shows the evaluated readiness once the Gateway and Service have loaded', () => {
    const html = renderStatus();

    expect(html).toContain('Accepted and programmed.');
    expect(html).toContain('ClusterIP assigned.');
    expect(html).not.toContain('Checking');
    expect(html).not.toContain('was not found');
  });
});
