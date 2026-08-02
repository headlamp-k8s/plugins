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

import { parseGatewayConfigMap, parseGatewayConfigValue } from './gateway';

describe('parseGatewayConfigValue', () => {
  it('parses the YAML-list format used by Knative config-gateway', () => {
    expect(
      parseGatewayConfigValue(`
- class: istio
  gateway: istio-system/knative-gateway
  service: istio-system/istio-ingressgateway
  supported-features:
    - HTTPRouteRequestTimeout
    - HTTPRouteBackendRequestHeaderModifier
  proxy-protocol-enabled: true
`)
    ).toEqual({
      state: 'configured',
      config: {
        class: 'istio',
        gateway: { namespace: 'istio-system', name: 'knative-gateway' },
        service: { namespace: 'istio-system', name: 'istio-ingressgateway' },
        supportedFeatures: ['HTTPRouteRequestTimeout', 'HTTPRouteBackendRequestHeaderModifier'],
        proxyProtocolEnabled: true,
      },
    });
  });

  it('supports an omitted service and defaults optional values', () => {
    expect(
      parseGatewayConfigValue(`
- class: contour
  gateway: projectcontour/contour
`)
    ).toEqual({
      state: 'configured',
      config: {
        class: 'contour',
        gateway: { namespace: 'projectcontour', name: 'contour' },
        service: undefined,
        supportedFeatures: [],
        proxyProtocolEnabled: false,
      },
    });
  });

  it.each([undefined, null, '', '   ', '[]', 'null'])('%s uses controller defaults', value => {
    expect(parseGatewayConfigValue(value)).toEqual({ state: 'defaulted', config: null });
  });

  it.each([
    ['malformed YAML', '- class: [', 'Invalid YAML:'],
    ['an object instead of a list', 'class: istio', 'Value must be a YAML list.'],
    ['multiple entries', '- class: a\n  gateway: ns/a\n- class: b\n  gateway: ns/b', 'Exactly one'],
    ['a missing class', '- gateway: ns/gateway', 'class is required'],
    ['an invalid gateway reference', '- class: istio\n  gateway: gateway', 'namespace/name'],
    [
      'a non-boolean proxy setting',
      '- class: istio\n  gateway: ns/gateway\n  proxy-protocol-enabled: "false"',
      'must be a boolean',
    ],
  ])('rejects %s', (_name, value, error) => {
    const result = parseGatewayConfigValue(value);
    expect(result.state).toBe('invalid');
    if (result.state === 'invalid') {
      expect(result.error).toContain(error);
    }
  });
});

describe('parseGatewayConfigMap', () => {
  it('parses external and local keys independently', () => {
    const result = parseGatewayConfigMap({
      'external-gateways': '- class: istio\n  gateway: istio-system/external',
    });

    expect(result.external.state).toBe('configured');
    expect(result.local).toEqual({ state: 'defaulted', config: null });
  });
});
