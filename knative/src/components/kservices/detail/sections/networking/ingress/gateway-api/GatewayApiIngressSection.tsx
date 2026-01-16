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

import { ResourceClasses } from '@kinvolk/headlamp-plugin/lib/k8s';
import HttpRoutesSection from './HttpRoutesSection';

const { HTTPRoute, ConfigMap } = ResourceClasses;

type HttpRoute = InstanceType<typeof HTTPRoute>;

type HttpRoutesByVisibility = {
  external: HttpRoute[] | null;
  internal: HttpRoute[] | null;
};

function useHttpRoutesByVisibilityForService(params: {
  cluster: string;
  namespace: string;
  serviceName: string;
}): HttpRoutesByVisibility {
  const { cluster, namespace, serviceName } = params;

  const [serviceLabelRoutes] = HTTPRoute.useList({
    cluster,
    namespace,
    labelSelector: `serving.knative.dev/service=${serviceName}`,
  });

  const [routeLabelRoutes] = HTTPRoute.useList({
    cluster,
    namespace,
    labelSelector: `serving.knative.dev/route=${serviceName}`,
  });

  const [domainMappingNamespaceRoutes] = HTTPRoute.useList({
    cluster,
    namespace,
    labelSelector: `serving.knative.dev/domainMappingNamespace=${namespace}`,
  });

  if (!serviceLabelRoutes && !routeLabelRoutes && !domainMappingNamespaceRoutes) {
    return { external: null, internal: null };
  }

  const mergedByName = new Map<string, HttpRoute>();

  for (const r of serviceLabelRoutes ?? []) {
    const name = r.metadata.name;
    if (name) {
      mergedByName.set(name, r);
    }
  }

  for (const r of routeLabelRoutes ?? []) {
    const name = r.metadata.name;
    if (name && !mergedByName.has(name)) {
      mergedByName.set(name, r);
    }
  }

  for (const r of domainMappingNamespaceRoutes ?? []) {
    const name = r.metadata.name;
    if (!name) continue;

    const rules = r.spec?.rules ?? [];
    const pointsToService = rules.some(rule =>
      (rule.backendRefs ?? []).some((br: { kind?: string; name?: string }) => {
        const kind = br.kind ?? 'Service';
        const backendName = br.name ?? '';
        return kind === 'Service' && backendName === serviceName;
      })
    );

    if (pointsToService) {
      mergedByName.set(name, r);
    }
  }

  const all = Array.from(mergedByName.values());

  const external = all.filter(
    r => (r.metadata.labels ?? {})['networking.knative.dev/visibility'] === ''
  );
  const internal = all.filter(
    r => (r.metadata.labels ?? {})['networking.knative.dev/visibility'] === 'cluster-local'
  );

  return { external, internal };
}

type NetworkTemplates = {
  domainTemplate: string;
  tagTemplate: string;
};

function useNetworkTemplatesForCluster(
  cluster: string | null | undefined
): NetworkTemplates | null {
  const DEFAULTS: NetworkTemplates = {
    domainTemplate: '{{.Name}}.{{.Namespace}}.{{.Domain}}',
    tagTemplate: '{{.Tag}}-{{.Name}}',
  };

  if (!cluster) {
    return null;
  }

  const [configMap] = ConfigMap.useGet('config-network', 'knative-serving', {
    cluster,
  });

  // If ConfigMap is missing, fall back to documented defaults.
  const data = configMap?.data ?? {};

  return {
    domainTemplate: data['domain-template'] || DEFAULTS.domainTemplate,
    tagTemplate: data['tag-template'] || DEFAULTS.tagTemplate,
  };
}

type GatewayApiIngressSectionProps = {
  namespace: string;
  serviceName: string;
  cluster: string;
};

export default function GatewayApiIngressSection({
  namespace,
  serviceName,
  cluster,
}: GatewayApiIngressSectionProps) {
  const { external: externalHttpRoutes, internal: internalHttpRoutes } =
    useHttpRoutesByVisibilityForService({
      cluster,
      namespace,
      serviceName,
    });

  const networkTemplates = useNetworkTemplatesForCluster(cluster);

  return (
    <>
      <HttpRoutesSection
        title="HTTPRoutes (external)"
        namespace={namespace}
        routes={externalHttpRoutes}
        serviceName={serviceName}
        networkTemplates={networkTemplates}
      />
      <HttpRoutesSection
        title="HTTPRoutes (internal)"
        namespace={namespace}
        routes={internalHttpRoutes}
        serviceName={serviceName}
        networkTemplates={networkTemplates}
      />
    </>
  );
}
