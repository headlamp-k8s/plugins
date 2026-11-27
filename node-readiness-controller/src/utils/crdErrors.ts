/**
 * Inspects a Headlamp / Kubernetes API error to determine if it represents HTTP 403 Forbidden.
 */
export function isForbiddenError(err: unknown): boolean {
  const e = err as any;
  const message = String(e?.message || e?.data?.message || err || '').toLowerCase();
  return (
    e?.status === 403 ||
    e?.code === 403 ||
    e?.reason === 'Forbidden' ||
    e?.data?.code === 403 ||
    e?.data?.reason === 'Forbidden' ||
    message.includes('forbidden') ||
    message.includes('403')
  );
}

/**
 * Inspects a Headlamp / Kubernetes API error to determine if it represents HTTP 404 Not Found.
 */
export function isNotFoundError(err: unknown): boolean {
  const e = err as any;
  const message = String(e?.message || e?.data?.message || err || '').toLowerCase();
  return (
    e?.status === 404 ||
    e?.code === 404 ||
    e?.reason === 'NotFound' ||
    e?.data?.code === 404 ||
    e?.data?.reason === 'NotFound' ||
    message.includes('not found') ||
    message.includes('404')
  );
}

export interface NormalizedListResult<T> {
  items: T[] | null;
  errors: any[] | null;
  isLoading: boolean;
  hasAnyClusterSuccess: boolean;
}

/**
 * Normalizes Headlamp `KubeObject.useList()` return values across tuple and object forms,
 * including multi-cluster loading/success metadata.
 */
export function normalizeListResult<T>(listResult: any): NormalizedListResult<T> {
  const items: T[] | null = listResult?.items ?? listResult?.[0] ?? null;
  const primaryError = listResult?.error ?? listResult?.[1] ?? null;
  const errors: any[] | null = listResult?.errors ?? (primaryError ? [primaryError] : null);
  const clusterResults: Record<string, any> | undefined = listResult?.clusterResults;
  const isLoading =
    Boolean(listResult?.isLoading) ||
    Boolean(clusterResults && Object.values(clusterResults).some(result => result?.isLoading));
  const hasAnyClusterSuccess = clusterResults
    ? Object.values(clusterResults).some(result => result?.isSuccess)
    : Array.isArray(items) && items.length > 0;

  return { items, errors, isLoading, hasAnyClusterSuccess };
}

export interface CrdErrorBannerState {
  isForbidden: boolean;
  title: string;
  description: string;
}

export interface CrdErrorCopyOptions {
  resourceName: string;
  forbiddenTitle: string;
  forbiddenDescription: string;
  mixedTitle?: string;
  mixedDescription?: string;
  notFoundTitle: string;
  notFoundDescription: string;
}

/**
 * Resolves 403/404 error classification for single- or multi-cluster CRD queries.
 * Returns null if errors are non-CRD/RBAC errors or if another cluster succeeded / is still loading.
 */
export function resolveCrdErrorState(
  errors: any[] | null | undefined,
  options: CrdErrorCopyOptions,
  {
    isLoading = false,
    hasAnyClusterSuccess = false,
  }: { isLoading?: boolean; hasAnyClusterSuccess?: boolean } = {}
): CrdErrorBannerState | null {
  if (isLoading || hasAnyClusterSuccess || !errors || errors.length === 0) {
    return null;
  }

  const allForbiddenOrNotFound = errors.every(err => isForbiddenError(err) || isNotFoundError(err));
  if (!allForbiddenOrNotFound) {
    return null;
  }

  const hasForbidden = errors.some(isForbiddenError);
  const hasNotFound = errors.some(isNotFoundError);
  const isForbidden = hasForbidden && !hasNotFound;

  if (isForbidden) {
    return {
      isForbidden: true,
      title: options.forbiddenTitle,
      description: options.forbiddenDescription,
    };
  }

  if (hasForbidden && options.mixedTitle && options.mixedDescription) {
    return {
      isForbidden: false,
      title: options.mixedTitle,
      description: options.mixedDescription,
    };
  }

  return {
    isForbidden: false,
    title: options.notFoundTitle,
    description: options.notFoundDescription,
  };
}
