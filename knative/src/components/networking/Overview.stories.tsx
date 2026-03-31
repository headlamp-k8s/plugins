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

import { Box, Paper, Typography } from '@mui/material';
import { Meta, StoryFn } from '@storybook/react';
import { formatIngressClass, INGRESS_CLASS_GATEWAY_API } from '../../config/ingress';
import { GatewayConfig, PureClusterNetworkingCardProps } from './Overview';

function GatewaySection({ label, config }: { label: string; config: GatewayConfig | null }) {
  if (!config) {
    return (
      <Box sx={{ mt: 1.5 }}>
        <Typography variant="subtitle2">{label}</Typography>
        <Typography variant="body2" color="text.secondary">
          Not configured.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography variant="subtitle2">{label}</Typography>
      <Typography variant="body2">
        GatewayClass: <strong>{config.class}</strong>
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Controller: {config.controllerName ?? '(unknown)'}
      </Typography>
      <Typography variant="body2">
        Gateway: {config.gateway.namespace}/{config.gateway.name}
      </Typography>
      <Typography variant="body2">
        KService:{' '}
        {config.service ? `${config.service.namespace}/${config.service.name}` : '(not set)'}
      </Typography>
      {config.supportedFeatures && config.supportedFeatures.length > 0 && (
        <Typography variant="body2">
          Supported features: {config.supportedFeatures.join(', ')}
        </Typography>
      )}
    </Box>
  );
}

function PureClusterNetworkingCard({
  cluster,
  ingressClass,
  ingressClassRaw,
  gatewayConfig,
}: PureClusterNetworkingCardProps) {
  const isGatewayApi = ingressClass === INGRESS_CLASS_GATEWAY_API;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
        Cluster: {cluster}
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Ingress</Typography>
        <Typography variant="body2">
          Effective ingress class: <strong>{formatIngressClass(ingressClass)}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Raw value: {ingressClassRaw ?? '(not set)'}
        </Typography>
      </Box>

      <Box>
        <Typography variant="h6">Gateway API</Typography>
        {isGatewayApi ? (
          <>
            <Typography variant="body2" color="text.secondary">
              Using Gateway API ingress (ingress class &quot;
              {formatIngressClass(ingressClass)}&quot;).
            </Typography>
            <GatewaySection label="External gateway" config={gatewayConfig?.external ?? null} />
            <GatewaySection
              label="Local gateway (cluster-local)"
              config={gatewayConfig?.local ?? null}
            />
            {!gatewayConfig?.external && !gatewayConfig?.local && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                No external or local gateway entries found in the config-gateway ConfigMap.
              </Typography>
            )}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Gateway API ingress class is not enabled. Current ingress class is{' '}
            {formatIngressClass(ingressClass)}.
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

export default {
  title: 'knative/Networking/ClusterNetworkingCard',
  component: PureClusterNetworkingCard,
} as Meta;

const Template: StoryFn<PureClusterNetworkingCardProps> = args => (
  <PureClusterNetworkingCard {...args} />
);

const externalGateway: GatewayConfig = {
  class: 'istio',
  gateway: { namespace: 'knative-serving', name: 'knative-external-gateway' },
  service: { namespace: 'istio-system', name: 'istio-ingressgateway' },
  supportedFeatures: ['HTTPRouteRequestTimeout', 'HTTPRouteBackendRequestHeaderModifier'],
  controllerName: 'istio.io/gateway-controller',
};

const localGateway: GatewayConfig = {
  class: 'istio',
  gateway: { namespace: 'knative-serving', name: 'knative-local-gateway' },
  service: { namespace: 'istio-system', name: 'knative-local-gateway' },
  controllerName: 'istio.io/gateway-controller',
};

export const GatewayApiEnabled = Template.bind({});
GatewayApiEnabled.args = {
  cluster: 'production',
  ingressClass: INGRESS_CLASS_GATEWAY_API,
  ingressClassRaw: 'gateway-api.ingress.networking.knative.dev',
  gatewayConfig: { external: externalGateway, local: localGateway },
};

export const GatewayApiNoGateways = Template.bind({});
GatewayApiNoGateways.args = {
  cluster: 'staging',
  ingressClass: INGRESS_CLASS_GATEWAY_API,
  ingressClassRaw: 'gateway-api.ingress.networking.knative.dev',
  gatewayConfig: { external: null, local: null },
};

export const IstioIngress = Template.bind({});
IstioIngress.args = {
  cluster: 'legacy',
  ingressClass: 'istio.ingress.networking.knative.dev',
  ingressClassRaw: 'istio.ingress.networking.knative.dev',
  gatewayConfig: null,
};

export const KourierIngress = Template.bind({});
KourierIngress.args = {
  cluster: 'dev',
  ingressClass: 'kourier.ingress.networking.knative.dev',
  ingressClassRaw: 'kourier.ingress.networking.knative.dev',
  gatewayConfig: null,
};

export const IngressClassNotSet = Template.bind({});
IngressClassNotSet.args = {
  cluster: 'minimal',
  ingressClass: null,
  ingressClassRaw: null,
  gatewayConfig: null,
};

export const ExternalOnlyGateway = Template.bind({});
ExternalOnlyGateway.args = {
  cluster: 'edge',
  ingressClass: INGRESS_CLASS_GATEWAY_API,
  ingressClassRaw: 'gateway-api.ingress.networking.knative.dev',
  gatewayConfig: { external: externalGateway, local: null },
};
