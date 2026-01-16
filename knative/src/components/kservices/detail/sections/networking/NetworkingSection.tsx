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
import { Alert, Stack } from '@mui/material';
import { formatIngressClass, INGRESS_CLASS_GATEWAY_API } from '../../../../../config/ingress';
import { KService } from '../../../../../resources/knative';
import DomainMappingSection from './DomainMappingSection';
import IngressIntegrationsSection from './IngressIntegrationsSection';

type KServiceSectionProps = {
  kservice: KService;
};

type IngressClassHookResult = {
  ingressClass: string | null;
  ingressClassLoading: boolean;
  ingressClassLoaded: boolean;
};

function useIngressClassForCluster(cluster: string): IngressClassHookResult {
  const { data: networkConfig, isLoading: ingressClassLoading } = ConfigMap.useGet(
    'config-network',
    'knative-serving',
    { cluster }
  );
  const ingressClassLoaded = !ingressClassLoading && !!networkConfig;

  let ingressClass: string | null = null;

  if (networkConfig?.data) {
    const data = networkConfig.data as Record<string, string | undefined>;
    const raw = data['ingress.class'];
    const trimmed = raw?.trim();

    if (trimmed && trimmed !== '') {
      ingressClass = trimmed;
    }
  }

  return {
    ingressClass,
    ingressClassLoading,
    ingressClassLoaded,
  };
}

type IngressClassValueProps = {
  cluster: string;
};

export function IngressClassValue({ cluster }: IngressClassValueProps) {
  const { ingressClass, ingressClassLoading } = useIngressClassForCluster(cluster);

  if (ingressClassLoading) {
    // Keep the loading state subtle in the metadata/header areas.
    return null;
  }

  return formatIngressClass(ingressClass);
}

export function NetworkingSection({ kservice }: KServiceSectionProps) {
  const {
    cluster,
    metadata: { name },
  } = kservice;
  const namespace = kservice.metadata.namespace!;

  const { ingressClass, ingressClassLoading, ingressClassLoaded } =
    useIngressClassForCluster(cluster);

  const shouldShowIngressWarning =
    !ingressClassLoading && ingressClass !== INGRESS_CLASS_GATEWAY_API;

  return (
    <Stack spacing={2}>
      {shouldShowIngressWarning && (
        <Alert severity="warning" variant="filled">
          Gateway API integration may be limited because Knative "config-network" ConfigMap
          ingress.class
          {ingressClass === null
            ? ' is not set.'
            : ` is set to "${ingressClass}", not "${INGRESS_CLASS_GATEWAY_API}".`}
        </Alert>
      )}

      <DomainMappingSection
        namespace={namespace}
        serviceName={name}
        cluster={cluster}
        kservice={kservice}
      />

      <IngressIntegrationsSection
        namespace={namespace}
        serviceName={name}
        ingressClass={ingressClass}
        ingressClassLoaded={ingressClassLoaded}
        cluster={cluster}
      />
    </Stack>
  );
}
