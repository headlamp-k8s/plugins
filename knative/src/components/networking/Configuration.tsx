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

import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import ConfigMap from '@kinvolk/headlamp-plugin/lib/k8s/configMap';
import { Alert, Box, CircularProgress, Paper, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import type { GatewayConfigEntryResult, GatewayConfigResult } from '../../config/gateway';
import { parseGatewayConfigMap } from '../../config/gateway';
import {
  formatIngressClass,
  INGRESS_CLASS_GATEWAY_API,
  readIngressClass,
} from '../../config/ingress';
import { useClusters } from '../../hooks/useClusters';
import { useKnativeInstalled } from '../../hooks/useKnativeInstalled';
import { getErrorMessage } from '../../utils/error';
import { NotInstalledBanner } from '../common/NotInstalledBanner';
import { GatewayReadinessStatus } from './GatewayReadiness';

export type { GatewayConfig, GatewayConfigResult } from '../../config/gateway';

/** Values needed to preview the configuration card without querying a cluster. */
export interface ClusterNetworkingCardProps {
  cluster: string;
  ingressClass: string | null;
  ingressClassRaw: string | null;
  gatewayConfig: GatewayConfigResult | null;
  ingressClassError?: string | null;
  gatewayConfigError?: string | null;
  gatewayStatusContent?: {
    external?: ReactNode;
    local?: ReactNode;
  };
}

type IngressClassHookResult = {
  ingressClass: string | null;
  ingressClassRaw: string | null;
  ingressClassLoading: boolean;
  ingressClassError: string | null;
};

function useIngressClassForCluster(cluster: string): IngressClassHookResult {
  const {
    data: networkConfig,
    error,
    isLoading: ingressClassLoading,
  } = ConfigMap.useGet('config-network', 'knative-serving', { cluster });

  const { raw, value: ingressClass } = readIngressClass(networkConfig?.data);

  return {
    ingressClass,
    ingressClassRaw: raw,
    ingressClassLoading,
    ingressClassError: error ? getErrorMessage(error) : null,
  };
}

type GatewayConfigHookResult = {
  gatewayConfig: GatewayConfigResult | null;
  gatewayConfigLoading: boolean;
  gatewayConfigError: string | null;
};

function useGatewayConfigForCluster(cluster: string): GatewayConfigHookResult {
  const {
    data: gatewayConfigMap,
    error,
    isLoading: gatewayConfigLoading,
  } = ConfigMap.useGet('config-gateway', 'knative-serving', { cluster });

  return {
    gatewayConfig: gatewayConfigMap ? parseGatewayConfigMap(gatewayConfigMap.data) : null,
    gatewayConfigLoading,
    gatewayConfigError: error ? getErrorMessage(error) : null,
  };
}

function GatewaySection({
  label,
  result,
  cluster,
  statusContent,
}: {
  label: string;
  result: GatewayConfigEntryResult;
  cluster: string;
  statusContent?: ReactNode;
}) {
  const { t } = useTranslation();

  if (result.state === 'defaulted') {
    return (
      <Box sx={{ mt: 1.5 }}>
        <Typography variant="subtitle2">{t(label)}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t('Not set in ConfigMap (controller defaults apply).')}
        </Typography>
      </Box>
    );
  }

  if (result.state === 'invalid') {
    return (
      <Box sx={{ mt: 1.5 }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          {t(label)}
        </Typography>
        <Alert severity="warning">
          {t('Invalid config-gateway value: {{ error }}', { error: result.error })}
        </Alert>
      </Box>
    );
  }

  const { config } = result;
  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography variant="subtitle2">{t(label)}</Typography>
      <Typography variant="body2">
        {t('Class:')} <strong>{config.class}</strong>
      </Typography>
      <Typography variant="body2">
        {t('Gateway:')}{' '}
        <Link
          routeName="customresource"
          params={{
            cluster,
            crd: 'gateways.gateway.networking.k8s.io',
            namespace: config.gateway.namespace,
            crName: config.gateway.name,
          }}
        >
          {config.gateway.namespace}/{config.gateway.name}
        </Link>
      </Typography>
      <Typography variant="body2">
        {t('Service:')}{' '}
        {config.service ? (
          <Link
            routeName="service"
            params={{ namespace: config.service.namespace, name: config.service.name }}
            activeCluster={cluster}
          >
            {config.service.namespace}/{config.service.name}
          </Link>
        ) : (
          '-'
        )}
      </Typography>
      <Typography variant="body2">
        {t('Proxy protocol: {{ state }}', {
          state: config.proxyProtocolEnabled ? t('Enabled') : t('Disabled'),
        })}
      </Typography>
      <Typography variant="body2">
        {t('Supported features:')}{' '}
        {config.supportedFeatures.length > 0 ? config.supportedFeatures.join(', ') : '-'}
      </Typography>
      {statusContent}
    </Box>
  );
}

function ClusterNetworkingCardContainer({ cluster }: { cluster: string }) {
  const { t } = useTranslation();
  const { ingressClass, ingressClassRaw, ingressClassLoading, ingressClassError } =
    useIngressClassForCluster(cluster);
  const { gatewayConfig, gatewayConfigLoading, gatewayConfigError } =
    useGatewayConfigForCluster(cluster);

  if (ingressClassLoading || gatewayConfigLoading) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
          {t('Cluster: {{ cluster }}', { cluster })}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      </Paper>
    );
  }

  const gatewayStatusContent = gatewayConfig
    ? {
        external:
          gatewayConfig.external.state === 'configured' ? (
            <GatewayReadinessStatus config={gatewayConfig.external.config} cluster={cluster} />
          ) : undefined,
        local:
          gatewayConfig.local.state === 'configured' ? (
            <GatewayReadinessStatus config={gatewayConfig.local.config} cluster={cluster} />
          ) : undefined,
      }
    : undefined;

  return (
    <ClusterNetworkingCard
      cluster={cluster}
      ingressClass={ingressClass}
      ingressClassRaw={ingressClassRaw}
      gatewayConfig={gatewayConfig}
      ingressClassError={ingressClassError}
      gatewayConfigError={gatewayConfigError}
      gatewayStatusContent={gatewayStatusContent}
    />
  );
}

export function ClusterNetworkingCard({
  cluster,
  ingressClass,
  ingressClassRaw,
  gatewayConfig,
  ingressClassError,
  gatewayConfigError,
  gatewayStatusContent,
}: ClusterNetworkingCardProps) {
  const { t } = useTranslation();
  const isGatewayApi = ingressClass === INGRESS_CLASS_GATEWAY_API;
  const formattedIngressClass = ingressClass
    ? formatIngressClass(ingressClass)
    : t('(not set)');

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
        {t('Cluster: {{ cluster }}', { cluster })}
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">{t('Ingress')}</Typography>
        {ingressClassError ? (
          <Alert severity="error" sx={{ mt: 1 }}>
            {t('Unable to read config-network: {{ error }}', { error: ingressClassError })}
          </Alert>
        ) : (
          <>
            <Typography variant="body2">
              {t('Effective ingress class:')}{' '}
              <strong>{formattedIngressClass}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('Raw value: {{ value }}', {
                value: ingressClassRaw ?? t('(not set)'),
              })}
            </Typography>
          </>
        )}
      </Box>

      <Box>
        <Typography variant="h6">{t('Gateway API')}</Typography>
        {gatewayConfigError ? (
          <Alert severity="error" sx={{ mt: 1 }}>
            {t('Unable to read config-gateway: {{ error }}', { error: gatewayConfigError })}
          </Alert>
        ) : isGatewayApi ? (
          <>
            <Typography variant="body2" color="text.secondary">
              {t('Using Gateway API ingress (ingress class "{{ ingressClass }}").', {
                ingressClass: formattedIngressClass,
              })}
            </Typography>
            {gatewayConfig ? (
              <>
                <GatewaySection
                  label="External gateway"
                  result={gatewayConfig.external}
                  cluster={cluster}
                  statusContent={gatewayStatusContent?.external}
                />
                <GatewaySection
                  label="Local gateway (cluster-local)"
                  result={gatewayConfig.local}
                  cluster={cluster}
                  statusContent={gatewayStatusContent?.local}
                />
              </>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                {t('config-gateway has not been loaded.')}
              </Typography>
            )}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t(
              'Gateway API ingress class is not enabled. Current ingress class is {{ ingressClass }}.',
              { ingressClass: formattedIngressClass }
            )}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

export function NetworkingConfiguration() {
  const { t } = useTranslation();
  const clusters = useClusters();
  const hasCluster = clusters.length > 0;
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled('serving', clusters);

  if (!hasCluster) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="text.secondary">
          {t('No cluster selected. Select a cluster to view Knative networking details.')}
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
        <Typography variant="h5">{t('Networking Configuration')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t('Values read from the config-network and config-gateway ConfigMaps in knative-serving.')}
        </Typography>
      </Box>

      {clusters.map(cluster => (
        <ClusterNetworkingCardContainer key={cluster} cluster={cluster} />
      ))}
    </Box>
  );
}
