export type ClusterState = 'loading' | 'active' | 'unavailable' | 'auth-error' | 'permission-error';

// Mirrors what Headlamp passes: undefined = not yet known, null = reachable, object = failed.
export type ClusterError = { status?: number } | null | undefined;

export function getClusterState(error: ClusterError): ClusterState {
  if (error === undefined) return 'loading';
  if (error === null) return 'active';
  if (error.status === 401) return 'auth-error';
  if (error.status === 403) return 'permission-error';
  return 'unavailable';
}
