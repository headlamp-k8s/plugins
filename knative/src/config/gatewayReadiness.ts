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

/**
 * The operational state displayed by the Knative Networking view.
 *
 * `ready` means the fields required by this plugin are present, `not-ready` means the API has
 * reported a concrete blocker, and `unknown` means the controller has not reported enough
 * information or the resource type is not covered by the evaluator.
 */
export type ReadinessState = 'ready' | 'not-ready' | 'unknown';

/**
 * The Gateway API condition fields used to explain why a Gateway is or is not usable.
 *
 * @see https://gateway-api.sigs.k8s.io/reference/api-spec/#gateway.networking.k8s.io/v1.GatewayStatus
 */
interface GatewayCondition {
  /** Condition name, such as `Accepted` or `Programmed`. */
  type: string;
  /** Kubernetes condition status: normally `True`, `False`, or `Unknown`. */
  status: string;
  /** Stable controller reason, such as `AddressNotAssigned`. */
  reason?: string;
  /** Human-readable controller explanation for the current condition. */
  message?: string;
}

/**
 * The subset of Gateway status inspected by the Networking view.
 *
 * Listener status is intentionally omitted because this view answers whether the configured
 * Gateway itself has been accepted, programmed, and assigned an address.
 *
 * @see https://gateway-api.sigs.k8s.io/reference/api-spec/#gateway.networking.k8s.io/v1.GatewayStatus
 */
interface GatewayStatus {
  /** Network addresses that the Gateway controller has bound to the Gateway. */
  addresses?: { value?: string }[];
  /** Gateway-level conditions reported by the Gateway controller. */
  conditions?: GatewayCondition[];
}

/** The Gateway readiness information rendered below one `config-gateway` entry. */
export interface GatewayReadinessResult {
  /** Plugin-level state derived from the Gateway's `Accepted` and `Programmed` conditions. */
  state: ReadinessState;
  /** Short fallback explanation used when no single blocking condition is available. */
  summary: string;
  /** The blocking or unknown condition whose reason and message should be shown to the operator. */
  condition?: GatewayCondition;
  /** Non-empty, de-duplicated values from `Gateway.status.addresses`. */
  addresses: string[];
}

/**
 * The Kubernetes Service port fields displayed for the Service referenced by `config-gateway`.
 *
 * @see https://kubernetes.io/docs/reference/kubernetes-api/service-resources/service-v1/#ServiceSpec
 */
interface ServicePort {
  /** Port exposed by the Service. */
  port?: number;
  /** Node port allocated for NodePort and applicable LoadBalancer Services. */
  nodePort?: number;
  /** Transport protocol; Kubernetes defaults this to `TCP`. */
  protocol?: string;
}

/**
 * The subset of a Kubernetes Service used to verify the address or port allocation promised by
 * its Service type.
 *
 * @see https://kubernetes.io/docs/reference/kubernetes-api/service-resources/service-v1/
 */
interface ServiceData {
  spec?: {
    /** Service exposure type; omitted values are treated as Kubernetes' `ClusterIP` default. */
    type?: string;
    /** Cluster-internal virtual IP; `None` represents a headless Service. */
    clusterIP?: string;
    /** User-specified external IPs that can satisfy a LoadBalancer address check. */
    externalIPs?: string[];
    /** Ports exposed by the Service. */
    ports?: ServicePort[];
  };
  status?: {
    loadBalancer?: {
      /** IP addresses or hostnames assigned by the load-balancer implementation. */
      ingress?: { hostname?: string; ip?: string }[];
    };
  };
}

/** The referenced Kubernetes Service readiness information rendered below a Gateway. */
export interface ServiceReadinessResult {
  /** Plugin-level state derived from the allocation rules for the reported Service type. */
  state: ReadinessState;
  /** Short explanation of the allocation that is present, pending, or unsupported. */
  summary: string;
  /** Effective Service type, including the `ClusterIP` default. */
  serviceType: string;
  /** Assigned external or cluster IP addresses relevant to the Service type. */
  addresses: string[];
  /** Service ports formatted as `port[:nodePort]/protocol`, for example `80:30080/TCP`. */
  ports: string[];
}

function nonEmptyUnique(values: Array<string | null | undefined>): string[] {
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed && !result.includes(trimmed)) result.push(trimmed);
  }
  return result;
}

/**
 * Evaluates the Gateway status used by the Networking view.
 *
 * This plugin reports a Gateway as ready only after the Gateway API controller has set both
 * `Accepted=True` and `Programmed=True`. This is an operational assessment made by the plugin; it
 * does not read or reproduce the optional Gateway API `Ready` condition. `Programmed` failures are
 * reported first because they usually contain the actionable data-plane reason, such as
 * `AddressNotAssigned`.
 *
 * @param status Gateway status returned by Headlamp, or no value while it has not been loaded.
 * @returns Display-ready state, explanation, relevant condition, and assigned addresses.
 * @see https://gateway-api.sigs.k8s.io/docs/concepts/troubleshooting/#status-and-conditions
 */
export function evaluateGatewayReadiness(
  status: GatewayStatus | null | undefined
): GatewayReadinessResult {
  const conditions = status?.conditions ?? [];
  const accepted = conditions.find(condition => condition.type === 'Accepted');
  const programmed = conditions.find(condition => condition.type === 'Programmed');
  const addresses = nonEmptyUnique(status?.addresses?.map(address => address.value) ?? []);

  const blockingCondition = [programmed, accepted].find(condition => condition?.status === 'False');
  if (blockingCondition) {
    return {
      state: 'not-ready',
      summary: `${blockingCondition.type}=False.`,
      condition: blockingCondition,
      addresses,
    };
  }

  const unknownCondition = [programmed, accepted].find(
    condition => condition && condition.status !== 'True'
  );
  if (unknownCondition) {
    return {
      state: 'unknown',
      summary: `${unknownCondition.type}=${unknownCondition.status}.`,
      condition: unknownCondition,
      addresses,
    };
  }

  if (accepted?.status === 'True' && programmed?.status === 'True') {
    return {
      state: 'ready',
      summary: 'Accepted and programmed.',
      addresses,
    };
  }

  const missingConditions = [accepted ? null : 'Accepted', programmed ? null : 'Programmed'].filter(
    Boolean
  );

  return {
    state: 'unknown',
    summary: `Waiting for Gateway condition${
      missingConditions.length === 1 ? '' : 's'
    }: ${missingConditions.join(', ')}.`,
    addresses,
  };
}

function formatServicePort(port: ServicePort): string {
  const servicePort = typeof port.port === 'number' ? String(port.port) : '?';
  const nodePort =
    typeof port.nodePort === 'number' && port.nodePort > 0 ? `:${port.nodePort}` : '';
  const protocol = port.protocol?.trim() || 'TCP';
  return `${servicePort}${nodePort}/${protocol}`;
}

/**
 * Evaluates the address or port allocation promised by each Kubernetes Service type.
 * This result complements the Gateway conditions and does not override them.
 *
 * LoadBalancer Services require an ingress or external IP, NodePort Services require every port to
 * have a nodePort, and ClusterIP Services require a non-headless clusterIP.
 *
 * @param service Service data returned by Headlamp, or no value while it has not been loaded.
 * @returns Display-ready Service type, state, explanation, addresses, and formatted ports.
 * @see https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types
 */
export function evaluateServiceReadiness(
  service: ServiceData | null | undefined
): ServiceReadinessResult {
  const serviceType = service?.spec?.type?.trim() || 'ClusterIP';
  const servicePorts = service?.spec?.ports ?? [];
  const ports = servicePorts.map(formatServicePort);

  if (serviceType === 'LoadBalancer') {
    const loadBalancerAddresses =
      service?.status?.loadBalancer?.ingress?.flatMap(ingress => [ingress.ip, ingress.hostname]) ??
      [];
    const addresses = nonEmptyUnique([
      ...loadBalancerAddresses,
      ...(service?.spec?.externalIPs ?? []),
    ]);

    return {
      state: addresses.length > 0 ? 'ready' : 'not-ready',
      summary: addresses.length > 0 ? 'External address assigned.' : 'External address pending.',
      serviceType,
      addresses,
      ports,
    };
  }

  if (serviceType === 'NodePort') {
    const allNodePortsAssigned =
      servicePorts.length > 0 &&
      servicePorts.every(port => typeof port.nodePort === 'number' && port.nodePort > 0);

    return {
      state: allNodePortsAssigned ? 'ready' : 'not-ready',
      summary: allNodePortsAssigned ? 'NodePorts assigned.' : 'NodePort assignment pending.',
      serviceType,
      addresses: [],
      ports,
    };
  }

  if (serviceType === 'ClusterIP') {
    const clusterIP = service?.spec?.clusterIP?.trim();
    const addressAssigned = !!clusterIP && clusterIP !== 'None';

    return {
      state: addressAssigned ? 'ready' : 'not-ready',
      summary: addressAssigned ? 'ClusterIP assigned.' : 'ClusterIP is not assigned.',
      serviceType,
      addresses: addressAssigned ? [clusterIP] : [],
      ports,
    };
  }

  return {
    state: 'unknown',
    summary: `Readiness check is not defined for Service type ${serviceType}.`,
    serviceType,
    addresses: [],
    ports,
  };
}
