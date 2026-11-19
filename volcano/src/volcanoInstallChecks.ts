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
 * Only a 404 proves the group is missing. Discovery is not RBAC gated for
 * authenticated users: Kubernetes binds the system:discovery ClusterRole to
 * system:authenticated, so they get a definitive answer from /apis even when they
 * are denied every resource in the group. An anonymous request is not covered by
 * that binding and can be refused with a 403, which lands in 'unreachable', the
 * right answer for it.
 *
 * Every other failure means the probe did not complete. Headlamp turns a thrown
 * fetch into a 502 and a timeout into a 408, and neither of those says anything
 * about Volcano.
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
 * others already established.
 *
 * The paths are a conjunction: the feature needs all of them. That makes a single
 * 404 conclusive on its own, because one provably missing group means the feature
 * cannot be there whatever the other probes returned. So 'absent' is checked
 * first. 'unreachable' is left for the case where nothing definitive came back at
 * all, which still keeps a probe that never completed from producing 'absent' by
 * itself.
 *
 * @param apiPaths Discovery paths that all have to be served.
 * @returns 'absent' if at least one group is definitively missing, 'unreachable'
 *   if nothing was definitive and a probe did not complete, otherwise 'installed'.
 */
async function probeApiGroups(apiPaths: string[]): Promise<InstallProbeResult> {
  const results = await Promise.all(apiPaths.map(probeApiGroup));

  if (results.includes('absent')) {
    return 'absent';
  }

  return results.includes('unreachable') ? 'unreachable' : 'installed';
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
