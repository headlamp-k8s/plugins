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

import ConfigMap from '@kinvolk/headlamp-plugin/lib/k8s/configMap';
import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import { formatIngressClass, INGRESS_CLASS_GATEWAY_API } from '../../config/ingress';
import { useClusters } from '../../hooks/useClusters';
import { useKnativeInstalled } from '../../hooks/useKnativeInstalled';
import { NotInstalledBanner } from '../common/NotInstalledBanner';

type GatewayConfig = {
  class: string;
  gateway: {
    namespace: string;
    name: string;
  };
  service?: {
    namespace: string;
    name: string;
  };
  supportedFeatures?: string[];
  controllerName?: string;
};

type GatewayConfigResult = {
  external: GatewayConfig | null;
  local: GatewayConfig | null;
};

type IngressClassHookResult = {
  ingressClass: string | null;
  ingressClassRaw: string | null;
  ingressClassLoading: boolean;
};

function useIngressClassForCluster(cluster: string): IngressClassHookResult {
  const { data: networkConfig, isLoading: ingressClassLoading } = ConfigMap.useGet(
    'config-network',
    'knative-serving',
    { cluster }
  );

  const raw = networkConfig?.data?.['ingress.class'] ?? null;
  const trimmed = raw?.trim();
  const ingressClass = trimmed && trimmed !== '' ? trimmed : null;

  return {
    ingressClass,
    ingressClassRaw: raw,
    ingressClassLoading,
  };
}

type GatewayConfigHookResult = {
  gatewayConfig: GatewayConfigResult | null;
  gatewayConfigLoading: boolean;
};

function useGatewayConfigForCluster(cluster: string): GatewayConfigHookResult {
  const { data: gatewayConfigMap, isLoading: gatewayConfigLoading } = ConfigMap.useGet(
    'config-gateway',
    'knative-serving',
    { cluster }
  );

  const data = gatewayConfigMap?.data ?? {};

  const parseConfig = (value?: string | null): GatewayConfig | null => {
    if (!value || !value.trim()) return null;
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      const cls = typeof parsed.class === 'string' ? parsed.class : '';

      const gateway = parsed.gateway as Record<string, unknown> | undefined;
      const gwNamespace =
        gateway && typeof gateway.namespace === 'string' ? gateway.namespace : null;
      const gwName = gateway && typeof gateway.name === 'string' ? gateway.name : null;
      if (!gwNamespace || !gwName) {
        return null;
      }

      const service = parsed.service as Record<string, unknown> | undefined;
      const svcNamespace =
        service && typeof service.namespace === 'string' ? service.namespace : undefined;
      const svcName = service && typeof service.name === 'string' ? service.name : undefined;
      const svc = svcNamespace && svcName ? { namespace: svcNamespace, name: svcName } : undefined;

      const supportedFeatures =
        Array.isArray(parsed['supported-features']) && parsed['supported-features'].length
          ? (parsed['supported-features'] as unknown[]).filter(
              (v: unknown): v is string => typeof v === 'string'
            )
          : undefined;

      const controllerName =
        typeof parsed.controllerName === 'string' ? parsed.controllerName : undefined;

      return {
        class: cls,
        gateway: {
          namespace: gwNamespace,
          name: gwName,
        },
        service: svc,
        supportedFeatures,
        controllerName,
      };
    } catch {
      return null;
    }
  };

  const external = parseConfig(data['external-gateways'] ?? null);
  const local = parseConfig(data['local-gateways'] ?? null);

  return {
    gatewayConfig: { external, local },
    gatewayConfigLoading,
  };
}

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

function ClusterNetworkingCardContainer({ cluster }: { cluster: string }) {
  const { ingressClass, ingressClassRaw, ingressClassLoading } = useIngressClassForCluster(cluster);
  const { gatewayConfig, gatewayConfigLoading } = useGatewayConfigForCluster(cluster);

  if (ingressClassLoading || gatewayConfigLoading) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
          Cluster: {cluster}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      </Paper>
    );
  }

  return (
    <ClusterNetworkingCard
      cluster={cluster}
      ingressClass={ingressClass}
      ingressClassRaw={ingressClassRaw}
      gatewayConfig={gatewayConfig}
    />
  );
}

function ClusterNetworkingCard({
  cluster,
  ingressClass,
  ingressClassRaw,
  gatewayConfig,
}: {
  cluster: string;
  ingressClass: string | null;
  ingressClassRaw: string | null;
  gatewayConfig: GatewayConfigResult | null;
}) {
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

export function NetworkingOverview() {
  const clusters = useClusters();
  const hasCluster = clusters.length > 0;
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled(clusters);

  if (!hasCluster) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="text.secondary">
          No cluster selected. Select a cluster to view Knative networking details.
        </Typography>
      </Box>
    );
  }

  if (!isKnativeInstalled) {
    return <NotInstalledBanner isLoading={isKnativeCheckLoading} />;
  }

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ mb: 1 }}>
        <Typography variant="h5">Knative Networking</Typography>
        <Typography variant="body2" color="text.secondary">
          Overview of ingress settings configured
        </Typography>
      </Box>

      {clusters.map(cluster => (
        <ClusterNetworkingCardContainer key={cluster} cluster={cluster} />
      ))}
    </Box>
  );
}
