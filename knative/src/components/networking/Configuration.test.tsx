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

import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GatewayConfig } from '../../config/gateway';
import { NetworkingConfiguration } from './Configuration';

const mocks = vi.hoisted(() => ({
  configMapUseGet: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/k8s/configMap', () => ({
  default: { useGet: mocks.configMapUseGet },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock('../../hooks/useClusters', () => ({
  useClusters: () => ['cluster-a'],
}));

vi.mock('../../hooks/useKnativeInstalled', () => ({
  useKnativeInstalled: () => ({ isKnativeInstalled: true, isKnativeCheckLoading: false }),
}));

vi.mock('./GatewayReadiness', () => ({
  GatewayReadinessStatus: ({ config }: { config: GatewayConfig }) => (
    <div>{`gateway-status:${config.gateway.name}`}</div>
  ),
}));

/**
 * Builds the result Headlamp's useGet returns. useGet serves null placeholder data until the first
 * response arrives, so React Query reports that wait as a success with isLoading false: only the
 * missing data and error show the ConfigMap has not loaded.
 */
function useGetResult(data: unknown, error: (Error & { status?: number }) | null = null) {
  if (data && error) {
    throw new Error('useGet never returns data and an error together');
  }
  return {
    data,
    error,
    isError: error !== null,
    isLoading: false,
    isFetching: !data && !error,
    isSuccess: error === null,
    status: error ? 'error' : 'success',
  };
}

const loading = useGetResult(null);

const gatewayApiNetworkConfig = useGetResult({
  data: { 'ingress-class': 'gateway-api.ingress.networking.knative.dev' },
});

const gatewayConfig = useGetResult({
  data: {
    'external-gateways': [
      '- class: istio',
      '  gateway: istio-system/knative-gateway',
      '  service: istio-system/istio-ingressgateway',
    ].join('\n'),
  },
});

function mockConfigMaps(results: {
  'config-network': ReturnType<typeof useGetResult>;
  'config-gateway': ReturnType<typeof useGetResult>;
}) {
  mocks.configMapUseGet.mockImplementation((name: keyof typeof results) => results[name]);
}

function renderPage(): string {
  return renderToStaticMarkup(<NetworkingConfiguration />);
}

beforeEach(() => {
  mocks.configMapUseGet.mockReset();
});

describe('NetworkingConfiguration', () => {
  it('shows a loading indicator, not unset values, while config-network loads', () => {
    mockConfigMaps({ 'config-network': loading, 'config-gateway': gatewayConfig });

    const html = renderPage();

    expect(html).toContain('MuiCircularProgress');
    expect(html).not.toContain('(not set)');
    expect(html).not.toContain('Gateway API ingress class is not enabled');
  });

  it('shows a loading indicator while config-gateway loads', () => {
    mockConfigMaps({ 'config-network': gatewayApiNetworkConfig, 'config-gateway': loading });

    const html = renderPage();

    expect(html).toContain('MuiCircularProgress');
    expect(html).not.toContain('config-gateway has not been loaded');
  });

  it('shows the configured Gateway once both ConfigMaps have loaded', () => {
    mockConfigMaps({
      'config-network': gatewayApiNetworkConfig,
      'config-gateway': gatewayConfig,
    });

    const html = renderPage();

    expect(html).not.toContain('MuiCircularProgress');
    expect(html).toContain('Effective ingress class: <strong>gateway-api</strong>');
    expect(html).toContain('gateway-status:knative-gateway');
  });

  it('reports a config-network read failure instead of waiting for it', () => {
    mockConfigMaps({
      'config-network': useGetResult(
        null,
        Object.assign(new Error('configmaps "config-network" is forbidden'), { status: 403 })
      ),
      'config-gateway': gatewayConfig,
    });

    const html = renderPage();

    expect(html).not.toContain('MuiCircularProgress');
    expect(html).toContain('Unable to read config-network');
  });
});
