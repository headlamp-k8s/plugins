import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import {
  getApiPath,
  volcanoFlowApiVersion,
  volcanoJobApiVersion,
  volcanoSchedulingApiVersion,
} from './utils/volcanoApi';

/**
 * Result of an API group discovery probe.
 *
 * `unreachable` is kept separate from `absent` on purpose. A probe that never
 * completed tells us nothing about whether Volcano is installed, so it must not
 * be reported as "not installed".
 */
export type InstallProbeResult = 'installed' | 'absent' | 'unreachable';

/**
 * Probes a single API group.
 *
 * Only a 404 proves the group is missing. Discovery is not RBAC gated (Kubernetes
 * binds the system:discovery ClusterRole to system:authenticated), so any
 * authenticated user gets a definitive answer. Every other failure means the probe
 * did not complete. Headlamp turns a thrown fetch into a 502 and a timeout into a
 * 408, and neither of those says anything about Volcano.
 *
 * @param apiPath Discovery path of the group, for example /apis/batch.volcano.sh/v1alpha1.
 * @returns 'installed', 'absent' if discovery returned 404, otherwise 'unreachable'.
 */
async function probeApiGroup(apiPath: string): Promise<InstallProbeResult> {
  try {
    await ApiProxy.request(apiPath, { method: 'GET' });
    return 'installed';
  } catch (error) {
    return (error as { status?: number })?.status === 404 ? 'absent' : 'unreachable';
  }
}

/**
 * Probes every group a feature needs and combines the results.
 *
 * Each probe catches its own failure, so one rejection cannot throw away what the
 * others already established. An inconclusive result beats an absent one: if any
 * group could not be reached we do not know the feature is missing, and claiming
 * otherwise is exactly the misreport this check is meant to avoid.
 *
 * @param apiPaths Discovery paths that all have to be served.
 * @returns 'installed' if every group is served, 'absent' if at least one is
 *   definitively missing, 'unreachable' if any probe did not complete.
 */
async function probeApiGroups(apiPaths: string[]): Promise<InstallProbeResult> {
  const results = await Promise.all(apiPaths.map(probeApiGroup));

  if (results.includes('unreachable')) {
    return 'unreachable';
  }

  return results.includes('absent') ? 'absent' : 'installed';
}

/** Probes the scheduling and job API groups that Volcano's core views need. */
export async function probeVolcanoCoreInstalled(): Promise<InstallProbeResult> {
  return probeApiGroups([
    getApiPath(volcanoSchedulingApiVersion),
    getApiPath(volcanoJobApiVersion),
  ]);
}

/** Probes the JobFlow and JobTemplate API group. */
export async function probeVolcanoFlowInstalled(): Promise<InstallProbeResult> {
  return probeApiGroups([getApiPath(volcanoFlowApiVersion)]);
}
