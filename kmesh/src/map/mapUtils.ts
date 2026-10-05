/**
 * Pure helper functions for the KMesh traffic Map view. Kept separate from
 * mapView.tsx (which depends on React/KubeObject runtime) so this logic is
 * unit-testable in isolation, matching the convention used by waypointUtils.ts.
 */

/** Label set on a Namespace or Service to route it through a specific waypoint. */
export const USE_WAYPOINT_LABEL = 'istio.io/use-waypoint';

/** Label set on a Waypoint's own Gateway describing what traffic it handles. */
export const WAYPOINT_FOR_LABEL = 'istio.io/waypoint-for';

export type MapNodeStatus = 'error' | 'success' | 'warning' | undefined;

/**
 * Maps a Waypoint's human-readable Gateway API condition status
 * (see waypointUtils.getWaypointCurrentStatus) to a Map node status badge.
 *
 * @param currentStatus - Result of getWaypointCurrentStatus().
 * @returns The Map node status, or undefined for an indeterminate state.
 */
export function getWaypointNodeStatus(currentStatus: string): MapNodeStatus {
  switch (currentStatus) {
    case 'Programmed':
    case 'Accepted':
      return 'success';
    case 'Not Programmed':
    case 'Not Accepted':
      return 'error';
    default:
      return 'warning';
  }
}

/**
 * Resolves the name of the waypoint a resource is routed through, given its
 * own labels and (as a fallback) its namespace's labels — namespace-level
 * enrollment cascades to every Service in that namespace unless overridden.
 *
 * @param resourceLabels - Labels on the Service/workload itself.
 * @param namespaceLabels - Labels on the owning Namespace.
 * @returns The waypoint name, or undefined if neither is enrolled.
 */
export function resolveEffectiveWaypointName(
  resourceLabels: Record<string, string> | undefined,
  namespaceLabels: Record<string, string> | undefined
): string | undefined {
  return resourceLabels?.[USE_WAYPOINT_LABEL] ?? namespaceLabels?.[USE_WAYPOINT_LABEL];
}

/**
 * Whether a Namespace or Service is enrolled with a waypoint, directly or via
 * its namespace.
 *
 * @param resourceLabels - Labels on the Service/workload itself.
 * @param namespaceLabels - Labels on the owning Namespace.
 */
export function isWaypointEnrolled(
  resourceLabels: Record<string, string> | undefined,
  namespaceLabels: Record<string, string> | undefined
): boolean {
  return resolveEffectiveWaypointName(resourceLabels, namespaceLabels) !== undefined;
}
