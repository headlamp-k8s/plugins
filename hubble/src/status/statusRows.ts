/** Result of one check on the status page. */
export type CheckState = 'found' | 'missing' | 'unknown' | 'checking';

/** One row of the status page. */
export interface StatusRow {
  component: string;
  state: CheckState;
  details: string;
}

/** The part of an API error this module reads. */
export interface ErrorLike {
  status?: number;
}

/** The CRD that tells us Cilium is installed. */
export const CILIUM_CRD = 'ciliumnetworkpolicies.cilium.io';

/** The Service that Hubble Relay is reachable through. */
export const HUBBLE_RELAY_SERVICE = 'hubble-relay';

/**
 * Describes an API error for a check that could not be done. Both checks are lists, so
 * "missing" is an empty list; an error (403 from RBAC, network errors) only means we
 * couldn't look.
 *
 * @param error - The error returned by the request.
 * @returns For example "Couldn't check (403)".
 */
function couldNotCheck(error: ErrorLike) {
  return error.status ? `Couldn't check (${error.status})` : "Couldn't check";
}

/**
 * Builds the "Cilium" row from a list of CRDs filtered to the CiliumNetworkPolicy CRD.
 * The error is checked first: when a refresh fails, useList still returns the last list
 * it got, so permissions being revoked or the cluster going away must not show Found.
 *
 * @param crds - The CRDs found, or null while the list is loading.
 * @param error - The list error, if any.
 * @returns The row.
 */
export function getCiliumRow(crds: unknown[] | null, error: ErrorLike | null): StatusRow {
  const component = 'Cilium';
  if (error) {
    return { component, state: 'unknown', details: couldNotCheck(error) };
  }
  if (crds?.length) {
    return { component, state: 'found', details: `${CILIUM_CRD} is installed` };
  }
  if (crds) {
    return { component, state: 'missing', details: `${CILIUM_CRD} is not installed` };
  }
  return { component, state: 'checking', details: 'Checking' };
}

/**
 * Builds the "Hubble Relay" row from a lookup of hubble-relay Services in all namespaces.
 * Cilium usually runs Relay in kube-system, but some installs use their own namespace.
 *
 * @param services - The Services found, or null while the list is loading.
 * @param error - The list error, if any.
 * @returns The row.
 */
export function getRelayRow(
  services: { namespace: string }[] | null,
  error: ErrorLike | null
): StatusRow {
  const component = 'Hubble Relay';
  if (services?.length) {
    const namespaces = [...new Set(services.map(service => service.namespace))].sort();
    return {
      component,
      state: 'found',
      details: `Service ${HUBBLE_RELAY_SERVICE} in ${namespaces.join(', ')}`,
    };
  }
  if (error) {
    return { component, state: 'unknown', details: couldNotCheck(error) };
  }
  if (services) {
    return {
      component,
      state: 'missing',
      details: `No ${HUBBLE_RELAY_SERVICE} Service. Enable Hubble Relay to see traffic flows.`,
    };
  }
  return { component, state: 'checking', details: 'Checking' };
}
