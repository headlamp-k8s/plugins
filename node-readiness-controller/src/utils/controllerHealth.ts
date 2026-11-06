/**
 * Known leader election lease identifier for Node Readiness Controller.
 * Defined in cmd/main.go upstream.
 */
export const NRC_LEASE_NAME = 'ba65f13e.readiness.node.x-k8s.io';

/**
 * Controller health classification status.
 */
export type ControllerHealthStatus =
  | 'active-leader'
  | 'active-deployment'
  | 'inactive'
  | 'not-detected'
  | 'loading'
  | 'forbidden';

/**
 * Evaluated controller health assessment result:
 * provides operational status, diagnostic reasoning, and UI badge metadata.
 */
export interface ControllerHealthResult {
  /** Boolean indicating whether controller is actively running */
  active: boolean;
  /** Explicit diagnostic reason describing detection verdict */
  reason: string;
  /** High-level operational status category */
  status: ControllerHealthStatus;
  /** Label for the UI StatusLabel badge */
  badgeLabel?: string;
  /** Severity/type for the StatusLabel */
  badgeStatus?: 'success' | 'warning' | 'error';
  /** Descriptive tooltip detailing why the status was determined */
  tooltip?: string;
  /** Detailed metadata about the detected instance */
  details?: {
    type: 'lease' | 'deployment';
    holderIdentity?: string;
    renewAgeSeconds?: number;
    deploymentName?: string;
    readyReplicas?: number;
  };
}

/**
 * Minimal structural typing for a Kubernetes Lease resource (compatible with Headlamp's Lease class and test fixtures).
 */
export interface K8sLeaseResource {
  metadata?: { name?: string; namespace?: string; [key: string]: any };
  spec?: {
    holderIdentity?: string;
    renewTime?: string;
    acquireTime?: string;
    leaseDurationSeconds?: number;
    leaseTransitions?: number;
    [key: string]: any;
  };
}

/**
 * Minimal structural typing for a Kubernetes Deployment resource (compatible with Headlamp's Deployment class and test fixtures).
 */
export interface K8sDeploymentResource {
  metadata?: { name?: string; namespace?: string; [key: string]: any };
  spec?: {
    replicas?: number;
    template?: {
      spec?: {
        containers?: Array<{
          name?: string;
          image?: string;
          command?: string[];
          args?: string[];
          [key: string]: any;
        }>;
        [key: string]: any;
      };
    };
    [key: string]: any;
  };
  status?: {
    replicas?: number;
    readyReplicas?: number;
    [key: string]: any;
  };
}

/**
 * Structural typing for API query errors.
 */
export interface K8sApiError {
  status?: number;
  message?: string;
  [key: string]: any;
}

/**
 * Input parameters for getControllerHealth().
 */
export interface GetControllerHealthOptions {
  /** Lease resources returned from Lease.useList(), if any */
  leases: K8sLeaseResource[] | null;
  /** Error object returned from Lease.useList(), if any */
  leaseError: K8sApiError | null;
  /** Deployment resources returned from Deployment.useList(), if any */
  deployments: K8sDeploymentResource[] | null;
  /** Error object returned from Deployment.useList(), if any */
  deploymentError: K8sApiError | null;
  /** Current timestamp (epoch ms) to allow deterministic testing */
  now?: number;
  /** Whether Headlamp is restricted to allowed namespaces and cannot query cluster-wide */
  hasRestrictedNamespaces?: boolean;
}

/**
 * Checks if a container corresponds to the Node Readiness Controller.
 */
export function isNRCContainer(container: { image?: string; command?: string[] }): boolean {
  return Boolean(
    container.image?.includes('node-readiness-controller') ||
      container.image?.includes('nrrcontroller') ||
      container.image?.includes('nrr-controller') ||
      container.command?.includes('/manager')
  );
}

/**
 * Finds the most relevant NRC deployment from a list of deployments.
 * Prioritizes a ready deployment candidate over one with zero ready replicas.
 */
export function findMatchingNRCDeployment(
  deployments: K8sDeploymentResource[] | null
): K8sDeploymentResource | undefined {
  if (!deployments) return undefined;
  const matchingDeployments = deployments.filter(d => {
    const containers = d.spec?.template?.spec?.containers || [];
    return containers.some(isNRCContainer);
  });

  return (
    matchingDeployments.find(d => (d.status?.readyReplicas ?? 0) > 0) ?? matchingDeployments[0]
  );
}

/**
 * Evaluates controller health using Lease-based detection as the source of truth,
 * with a graceful Deployment fallback when RBAC restricts Lease access:
 *
 * 1. Primary Check: Leader Election Lease (ba65f13e.readiness.node.x-k8s.io)
 *    - If alive: Active (Leader: ${holderIdentity})
 *    - If expired: Inactive (Leader lease expired)
 *    - If no lease found: Not Detected (Controller leader lease not found) - no fallback.
 *    - If non-403 query error: Not Detected without badge (API error preserved).
 *
 * 2. Fallback Check: Deployment Check (ONLY on 403 Forbidden on Lease query)
 *    - If deployment has readyReplicas > 0: Active (Lease access restricted by RBAC; verified via ready deployment replicas)
 *    - If deployment has readyReplicas === 0: Inactive
 *    - If deployment also 403 Forbidden or not found: Forbidden (Access denied: RBAC restricts reading controller lease)
 *
 * @param options Query results and optional clock timestamp.
 * @returns Evaluated ControllerHealthResult.
 */
export function getControllerHealth(options: GetControllerHealthOptions): ControllerHealthResult {
  const {
    leases,
    leaseError,
    deployments,
    deploymentError,
    now = Date.now(),
    hasRestrictedNamespaces = false,
  } = options;

  // 1. Loading barrier for leases
  if (leases === null && !leaseError) {
    return {
      active: false,
      reason: 'Loading controller status...',
      status: 'loading',
    };
  }

  // 2. Primary Check: Lease query succeeded (Source of Truth)
  if (!leaseError) {
    const matchingLeases =
      leases?.filter(
        l => l.metadata?.name === NRC_LEASE_NAME && Boolean(l.spec?.holderIdentity?.trim())
      ) || [];

    // Sort leases descending by timestamp (newest first) for multi-namespace determinism
    const sortedLeases = [...matchingLeases].sort((a, b) => {
      const timeA = new Date(a.spec?.renewTime || a.spec?.acquireTime || 0).getTime();
      const timeB = new Date(b.spec?.renewTime || b.spec?.acquireTime || 0).getTime();
      return timeB - timeA;
    });

    if (sortedLeases.length > 0) {
      const activeLease = sortedLeases.find(l => {
        const timestampStr = l.spec?.renewTime || l.spec?.acquireTime;
        if (!timestampStr) return false;
        const renewTimeMs = new Date(timestampStr).getTime();
        const duration = (l.spec?.leaseDurationSeconds || 15) * 2 * 1000;
        return now - renewTimeMs < duration;
      });

      if (activeLease) {
        const holderIdentity = activeLease.spec?.holderIdentity || 'Unknown Pod';
        const timestampStr = activeLease.spec?.renewTime || activeLease.spec?.acquireTime;
        const renewTimeMs = timestampStr ? new Date(timestampStr).getTime() : now;
        const renewAgeSeconds = Math.round(Math.max(0, (now - renewTimeMs) / 1000));
        const reason = `Active (Leader: ${holderIdentity})`;

        return {
          active: true,
          reason,
          status: 'active-leader',
          badgeLabel: 'Active (Leader)',
          badgeStatus: 'success',
          tooltip: `${reason} • Renewed ${renewAgeSeconds}s ago`,
          details: {
            type: 'lease',
            holderIdentity,
            renewAgeSeconds,
          },
        };
      }

      // Expired lease
      const latestLease = sortedLeases[0];
      const holderIdentity = latestLease.spec?.holderIdentity || 'Unknown Pod';
      const timestampStr = latestLease.spec?.renewTime || latestLease.spec?.acquireTime;
      const renewTimeMs = timestampStr ? new Date(timestampStr).getTime() : now;
      const renewAgeSeconds = Math.round(Math.max(0, (now - renewTimeMs) / 1000));
      const leaseDurationMs = (latestLease.spec?.leaseDurationSeconds || 15) * 2 * 1000;
      const reason = 'Leader lease expired';

      return {
        active: false,
        reason,
        status: 'inactive',
        badgeLabel: 'Inactive',
        badgeStatus: 'error',
        tooltip: `${reason} (${renewAgeSeconds}s ago, duration window ${Math.round(
          leaseDurationMs / 1000
        )}s)`,
        details: {
          type: 'lease',
          holderIdentity,
          renewAgeSeconds,
        },
      };
    }

    // No matching lease found in the queried namespaces:
    // If Headlamp is restricted to allowed namespaces, we cannot verify whether the lease
    // exists in an omitted controller namespace -> hide badge gracefully (status: 'forbidden')
    if (hasRestrictedNamespaces) {
      return {
        active: false,
        reason: 'Allowed namespaces configured; cannot verify controller lease cluster-wide',
        status: 'forbidden',
      };
    }

    // No matching lease found in the cluster (user has read permissions) -> do not fallback
    const reason = 'Controller leader lease not found';
    return {
      active: false,
      reason,
      status: 'not-detected',
      badgeLabel: 'Not Detected',
      badgeStatus: 'warning',
      tooltip: `${reason} (${NRC_LEASE_NAME})`,
    };
  }

  // 3. Fallback Check: When RBAC restricts reading Leases (403 Forbidden), fallback to Deployments
  if (leaseError.status === 403) {
    if (deployments === null && !deploymentError) {
      return {
        active: false,
        reason: 'Loading controller status...',
        status: 'loading',
      };
    }

    if (deploymentError?.status === 403) {
      return {
        active: false,
        reason: 'Access denied: RBAC restricts reading controller lease and deployment',
        status: 'forbidden',
      };
    }

    if (deploymentError) {
      return {
        active: false,
        reason: deploymentError.message || 'API query failed',
        status: 'not-detected',
      };
    }

    const matchingDeployment = findMatchingNRCDeployment(deployments);
    if (!matchingDeployment) {
      return {
        active: false,
        reason: hasRestrictedNamespaces
          ? 'Allowed namespaces configured; cannot verify controller deployment cluster-wide'
          : 'Access denied: RBAC restricts reading controller lease and no matching deployment found',
        status: 'forbidden',
      };
    }

    const readyReplicas = matchingDeployment.status?.readyReplicas ?? 0;
    const deployName = matchingDeployment.metadata?.name || 'NRC Deployment';

    if (readyReplicas > 0) {
      const reason = 'Lease access restricted by RBAC; verified via ready deployment replicas';
      return {
        active: true,
        reason,
        status: 'active-deployment',
        badgeLabel: 'Active',
        badgeStatus: 'success',
        tooltip: `${reason}: ${deployName} (${readyReplicas} replica${
          readyReplicas > 1 ? 's' : ''
        })`,
        details: {
          type: 'deployment',
          deploymentName: deployName,
          readyReplicas,
        },
      };
    }

    const isScaledToZero =
      matchingDeployment.spec?.replicas === 0 && (matchingDeployment.status?.replicas ?? 0) === 0;
    const reason = isScaledToZero
      ? 'Deployment scaled to 0 replicas'
      : 'Deployment has 0 ready replicas';

    return {
      active: false,
      reason,
      status: 'inactive',
      badgeLabel: 'Inactive',
      badgeStatus: 'error',
      tooltip: `${reason}: ${deployName}`,
      details: {
        type: 'deployment',
        deploymentName: deployName,
        readyReplicas: 0,
      },
    };
  }

  // 4. Non-403 Lease Query Errors (e.g. 500, network error)
  return {
    active: false,
    reason: leaseError.message || 'API query failed',
    status: 'not-detected',
  };
}

/**
 * Lightweight helper returning boolean controller activity and diagnostic reasoning.
 */
export function detectControllerActive(options: GetControllerHealthOptions): {
  active: boolean;
  reason: string;
} {
  const result = getControllerHealth(options);
  return {
    active: result.active,
    reason: result.reason,
  };
}
