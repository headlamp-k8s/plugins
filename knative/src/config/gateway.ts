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

import { parse } from 'yaml';

export interface NamespacedName {
  namespace: string;
  name: string;
}

/** A gateway entry read from knative-serving/config-gateway. */
export interface GatewayConfig {
  class: string;
  gateway: NamespacedName;
  service?: NamespacedName;
  supportedFeatures: string[];
  proxyProtocolEnabled: boolean;
}

export type GatewayConfigEntryResult =
  | { state: 'configured'; config: GatewayConfig }
  | { state: 'defaulted'; config: null }
  | { state: 'invalid'; config: null; error: string };

/** The external and cluster-local gateway entries displayed for one cluster. */
export interface GatewayConfigResult {
  external: GatewayConfigEntryResult;
  local: GatewayConfigEntryResult;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDnsLabel(value: string): boolean {
  return value.length <= 63 && /^[a-z0-9](?:[-a-z0-9]*[a-z0-9])?$/.test(value);
}

function isDnsSubdomain(value: string): boolean {
  return value.length <= 253 && value.split('.').every(isDnsLabel);
}

function parseNamespacedName(value: unknown, field: string): NamespacedName {
  if (typeof value !== 'string') {
    throw new Error(`${field} must be in namespace/name form.`);
  }

  const parts = value.trim().split('/');
  if (parts.length !== 2 || !isDnsLabel(parts[0]) || !isDnsSubdomain(parts[1])) {
    throw new Error(`${field} must be a valid namespace/name.`);
  }

  return { namespace: parts[0], name: parts[1] };
}

function parseEntry(entry: unknown): GatewayConfig {
  if (!isRecord(entry)) {
    throw new Error('Each gateway entry must be a YAML mapping.');
  }

  if (typeof entry.class !== 'string' || !entry.class.trim()) {
    throw new Error('class is required.');
  }

  const supportedFeaturesValue = entry['supported-features'];
  if (
    supportedFeaturesValue !== undefined &&
    (!Array.isArray(supportedFeaturesValue) ||
      supportedFeaturesValue.some(feature => typeof feature !== 'string' || !feature.trim()))
  ) {
    throw new Error('supported-features must be a list of non-empty strings.');
  }

  const proxyProtocolValue = entry['proxy-protocol-enabled'];
  if (proxyProtocolValue !== undefined && typeof proxyProtocolValue !== 'boolean') {
    throw new Error('proxy-protocol-enabled must be a boolean.');
  }

  const serviceValue = entry.service;
  return {
    class: entry.class.trim(),
    gateway: parseNamespacedName(entry.gateway, 'gateway'),
    service:
      typeof serviceValue === 'string' && !serviceValue.trim()
        ? undefined
        : serviceValue === undefined
        ? undefined
        : parseNamespacedName(serviceValue, 'service'),
    supportedFeatures:
      (supportedFeaturesValue as string[] | undefined)?.map(feature => feature.trim()) ?? [],
    proxyProtocolEnabled: proxyProtocolValue === true,
  };
}

/** Parses one config-gateway data value using Knative's YAML-list format. */
export function parseGatewayConfigValue(value?: string | null): GatewayConfigEntryResult {
  if (!value?.trim()) {
    return { state: 'defaulted', config: null };
  }

  let document: unknown;
  try {
    document = parse(value);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message.split('\n')[0] : String(error);
    return { state: 'invalid', config: null, error: `Invalid YAML: ${message}` };
  }

  if (document === null || (Array.isArray(document) && document.length === 0)) {
    return { state: 'defaulted', config: null };
  }
  if (!Array.isArray(document)) {
    return { state: 'invalid', config: null, error: 'Value must be a YAML list.' };
  }
  if (document.length !== 1) {
    return {
      state: 'invalid',
      config: null,
      error: `Exactly one gateway entry is supported; found ${document.length}.`,
    };
  }

  try {
    return { state: 'configured', config: parseEntry(document[0]) };
  } catch (error: unknown) {
    return {
      state: 'invalid',
      config: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function parseGatewayConfigMap(data?: Record<string, string>): GatewayConfigResult {
  return {
    external: parseGatewayConfigValue(data?.['external-gateways']),
    local: parseGatewayConfigValue(data?.['local-gateways']),
  };
}
