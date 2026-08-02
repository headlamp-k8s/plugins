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

export type ReadinessState = 'ready' | 'not-ready' | 'unknown';

interface GatewayCondition {
  type: string;
  status: string;
  reason?: string;
  message?: string;
}

interface GatewayStatus {
  addresses?: { value?: string }[];
  conditions?: GatewayCondition[];
}

export interface GatewayReadinessResult {
  state: ReadinessState;
  summary: string;
  condition?: GatewayCondition;
  addresses: string[];
}

interface ServicePort {
  port?: number;
  nodePort?: number;
  protocol?: string;
}

interface ServiceData {
  spec?: {
    type?: string;
    clusterIP?: string;
    externalIPs?: string[];
    ports?: ServicePort[];
  };
  status?: {
    loadBalancer?: {
      ingress?: { hostname?: string; ip?: string }[];
    };
  };
}

export interface ServiceReadinessResult {
  state: ReadinessState;
  summary: string;
  serviceType: string;
  addresses: string[];
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
 * A Gateway is ready only after the Gateway API controller has accepted and programmed it.
 * Programmed failures are reported first because they usually contain the actionable data-plane
 * reason, such as AddressNotAssigned.
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
