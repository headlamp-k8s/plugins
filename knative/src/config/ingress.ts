/**
 * Ingress class constants for Knative networking configuration.
 *
 * These values correspond to the ingress.class setting in the config-network ConfigMap.
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
