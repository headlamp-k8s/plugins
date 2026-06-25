// Duck-type makeCRClass instead of importing ApiError: that import resolves to a host
// API path older Headlamp versions don't provide, which crashes the page at load.
export function getCanaryResourceClass(canary: unknown) {
  return canary && typeof (canary as { makeCRClass?: unknown }).makeCRClass === 'function'
    ? (canary as { makeCRClass: () => unknown }).makeCRClass()
    : undefined;
}
