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
 * Ingress class constants for Knative networking configuration.
 *
 * These values correspond to the ingress-class (or legacy ingress.class) setting in the config-network ConfigMap.
 */

const INGRESS_CLASS_SUFFIX = '.ingress.networking.knative.dev';

export const INGRESS_CLASS_GATEWAY_API = `gateway-api${INGRESS_CLASS_SUFFIX}`;

// Future ingress classes (commented out for reference)
// export const INGRESS_CLASS_CONTOUR = `contour${INGRESS_CLASS_SUFFIX}`;
// export const INGRESS_CLASS_ISTIO = `istio${INGRESS_CLASS_SUFFIX}`;

/**
 * Helper function to format ingress class for display.
 * Removes the common suffix if present.
 */
export function formatIngressClass(ingressClass: string | null): string {
  if (!ingressClass) return '(not set)';
  return ingressClass.endsWith(INGRESS_CLASS_SUFFIX)
    ? ingressClass.slice(0, -INGRESS_CLASS_SUFFIX.length)
    : ingressClass;
}

/**
 * Extracts the exact, uncleaned ingress class string from the provided ConfigMap data.
 *
 * @param data - The parsed key-value data object from the config-network ConfigMap.
 * @returns The exact ingress class string as provided, or null if not set.
 */
export function getIngressClassRaw(data: Record<string, string | undefined> | null | undefined): string | null {
  return data?.['ingress-class'] ?? data?.['ingress.class'] ?? null;
}

/**
 * Extracts the active ingress class name from the provided ConfigMap data.
 *
 * Modern versions of Knative use the `ingress-class` key instead of the older
 * `ingress.class` key. If a ConfigMap contains both, the modern dashed version
 * is given priority.
 *
 * @param data - The parsed key-value data object from the config-network ConfigMap.
 * @returns The trimmed ingress class string, or null if not set or empty.
 * @see https://knative.dev/docs/serving/config-network-adapters/#ingress-configurations
 */
export function getIngressClass(data: Record<string,string | undefined> | null | undefined){
  const raw = getIngressClassRaw(data);
  const trimmed = raw?.trim();
  return trimmed && trimmed !== '' ? trimmed : null;
}