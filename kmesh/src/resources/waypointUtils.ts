export interface WaypointCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  reason?: string;
  message?: string;
}

/** Annotation key for the proxy image injected by Istio / KMesh */
export const WAYPOINT_PROXY_IMAGE_ANNOTATION = 'sidecar.istio.io/proxyImage';

/**
 * Gets the proxy image used by the waypoint from its annotations.
 * Pure function — testable without KubeObject runtime.
 *
 * @param annotations - The annotations record from the waypoint object's metadata.
 * @returns The value of the proxy image annotation, or '-' if not found.
 */
export function getWaypointImage(annotations?: Record<string, string>): string {
  return annotations?.[WAYPOINT_PROXY_IMAGE_ANNOTATION] ?? '-';
}

/**
 * Determines the current status of the waypoint based on its conditions.
 * Pure function — testable without KubeObject runtime.
 *
 * @see https://gateway-api.sigs.k8s.io/reference/api-types/gateway/
 *
 * @param conditions - An array of condition objects from the waypoint status.
 * @returns A string representing the current status (e.g., 'Programmed', 'Accepted', 'Not Programmed', 'Not Accepted', or 'Unknown').
 */
export function getWaypointCurrentStatus(conditions?: WaypointCondition[]): string {
  const programmed = conditions?.find(c => c.type === 'Programmed');
  if (programmed) {
    if (programmed.status === 'True') return 'Programmed';
    if (programmed.status === 'False') return 'Not Programmed';
    return 'Unknown';
  }

  const accepted = conditions?.find(c => c.type === 'Accepted');
  if (accepted) {
    if (accepted.status === 'True') return 'Accepted';
    if (accepted.status === 'False') return 'Not Accepted';
    return 'Unknown';
  }

  return 'Unknown';
}
