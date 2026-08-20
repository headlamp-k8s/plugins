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
import { parseGatewayConfigMap } from '../../config/gateway';
import { INGRESS_CLASS_GATEWAY_API } from '../../config/ingress';
import { ClusterNetworkingCard } from './Configuration';

const meta = {
  title: 'knative/Networking/ConfigurationCard',
  component: ClusterNetworkingCard,
} satisfies Meta<typeof ClusterNetworkingCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GatewayApiConfigured: Story = {
  args: {
    cluster: 'production',
    ingressClass: INGRESS_CLASS_GATEWAY_API,
    ingressClassRaw: INGRESS_CLASS_GATEWAY_API,
    gatewayConfig: parseGatewayConfigMap({
      'external-gateways': `
- class: istio
  gateway: istio-system/knative-gateway
  service: istio-system/istio-ingressgateway
  supported-features:
    - HTTPRouteRequestTimeout
  proxy-protocol-enabled: true
`,
      'local-gateways': `
- class: istio
  gateway: istio-system/knative-local-gateway
`,
    }),
  },
};

export const GatewayApiControllerDefaults: Story = {
  args: {
    cluster: 'staging',
    ingressClass: INGRESS_CLASS_GATEWAY_API,
    ingressClassRaw: INGRESS_CLASS_GATEWAY_API,
    gatewayConfig: parseGatewayConfigMap({}),
  },
};

export const GatewayApiMalformedConfig: Story = {
  args: {
    cluster: 'broken-config',
    ingressClass: INGRESS_CLASS_GATEWAY_API,
    ingressClassRaw: INGRESS_CLASS_GATEWAY_API,
    gatewayConfig: parseGatewayConfigMap({
      'external-gateways': '- class: [',
      'local-gateways': '- class: istio\n  gateway: missing-namespace',
    }),
  },
};

export const NonGatewayIngress: Story = {
  args: {
    cluster: 'legacy',
    ingressClass: 'istio.ingress.networking.knative.dev',
    ingressClassRaw: 'istio.ingress.networking.knative.dev',
    gatewayConfig: null,
  },
};

export const ConfigMapPermissionError: Story = {
  args: {
    cluster: 'restricted',
    ingressClass: null,
    ingressClassRaw: null,
    gatewayConfig: null,
    ingressClassError: 'Forbidden',
    gatewayConfigError: 'Forbidden',
  },
};
