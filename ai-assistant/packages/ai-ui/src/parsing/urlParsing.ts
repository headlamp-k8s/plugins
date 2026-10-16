/** Returns whether the URL targets a log endpoint. */
export const isLogRequest = (url: string): boolean => {
  return url.includes('/log?') || url.endsWith('/log') || url.includes('/log&');
};

/**
 * Returns whether the URL ends in `/<word>` (optionally with a trailing `/`)
 * after an `/api/` or `/apis/` segment.
 *
 * Matches `/\/(?:api|apis)\/.*?\/\w+\/?$/` in linear time; that regex is
 * quadratic on repeated `/api/` text.
 */
function isApiListUrl(url: string): boolean {
  // `.` doesn't match line terminators, so only the last line can match.
  const lineStart =
    Math.max(
      url.lastIndexOf('\n'),
      url.lastIndexOf('\r'),
      url.lastIndexOf('\u2028'),
      url.lastIndexOf('\u2029')
    ) + 1;
  const line = url.slice(lineStart);
  const end = line.endsWith('/') ? line.length - 1 : line.length;
  let segmentStart = end;
  while (segmentStart > 0 && /\w/.test(line[segmentStart - 1])) segmentStart--;
  if (segmentStart === end || line[segmentStart - 1] !== '/') return false;
  return /\/apis?\//.test(line.slice(0, segmentStart - 1));
}

/** Returns whether the URL points to a single Kubernetes resource instead of a list endpoint. */
export const isSpecificResourceRequestHelper = (url: string): boolean => {
  // This matches patterns like /api/v1/namespaces/default/pods/my-pod
  // But doesn't match /api/v1/namespaces/default/pods

  // Check if this is a simple resource type URL (list endpoint)
  if (isApiListUrl(url)) {
    return false;
  }

  // More specific resource pattern that should end with a resource name
  // Pattern like /api/v1/namespaces/default/pods/my-pod
  const specificResourcePattern = /\/(?:namespaces\/[\w-]+\/)?[\w-]+\/[\w-]+\/?$/;
  const isSpecific = specificResourcePattern.test(url);

  return isSpecific;
};
