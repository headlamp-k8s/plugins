import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

/**
 * Result of an API group discovery probe.
 *
 * `unreachable` is kept separate from `absent` on purpose. A probe that never
 * completed tells us nothing about whether the operator is installed, so it must
 * not be reported as "not installed".
 */
export type InstallProbeResult = 'installed' | 'absent' | 'unreachable';

const CERT_MANAGER_API_PATH = '/apis/cert-manager.io/v1';

/**
 * Checks whether the cluster serves the cert-manager API group.
 *
 * Only a 404 proves the group is missing. Discovery is not RBAC gated (Kubernetes
 * binds the system:discovery ClusterRole to system:authenticated), so any
 * authenticated user gets a definitive answer. Every other failure means the probe
 * did not complete. Headlamp turns a thrown fetch into a 502 and a timeout into a
 * 408, and neither of those says anything about cert-manager.
 *
 * @returns 'installed', 'absent' if discovery returned 404, otherwise 'unreachable'.
 */
export async function probeCertManagerInstalled(): Promise<InstallProbeResult> {
  try {
    await ApiProxy.request(CERT_MANAGER_API_PATH, { method: 'GET' });
    return 'installed';
  } catch (error) {
    return (error as { status?: number })?.status === 404 ? 'absent' : 'unreachable';
  }
}
