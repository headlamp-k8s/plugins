export const volcanoJobApiGroup = 'batch.volcano.sh';
export const volcanoSchedulingApiGroup = 'scheduling.volcano.sh';
export const volcanoFlowApiGroup = 'flow.volcano.sh';
export const volcanoBusApiGroup = 'bus.volcano.sh';

export const volcanoJobApiVersion = `${volcanoJobApiGroup}/v1alpha1`;
export const volcanoSchedulingApiVersion = `${volcanoSchedulingApiGroup}/v1beta1`;
export const volcanoFlowApiVersion = `${volcanoFlowApiGroup}/v1alpha1`;
export const volcanoBusApiVersion = `${volcanoBusApiGroup}/v1alpha1`;

export function getApiPath(apiVersion: string) {
  return `/apis/${apiVersion}`;
}

/**
 * Reports whether an API group version discovery response lists a resource.
 *
 * @param resourceList Response of `GET /apis/<group>/<version>`.
 * @param resourceName Plural resource name to look for, for example `namespacequeues`.
 * @returns `true` when the group version serves the resource.
 */
export function hasApiResource(resourceList: unknown, resourceName: string): boolean {
  const resources = (resourceList as { resources?: Array<{ name?: string }> } | null)?.resources;

  return Array.isArray(resources) && resources.some(resource => resource?.name === resourceName);
}

export function isApiVersionInGroup(apiVersion: string | undefined, apiGroup: string) {
  return apiVersion?.startsWith(`${apiGroup}/`) || false;
}

export function isVolcanoJobApiVersion(apiVersion: string | undefined) {
  return isApiVersionInGroup(apiVersion, volcanoJobApiGroup);
}

export function isVolcanoPodGroupApiVersion(apiVersion: string | undefined) {
  return isApiVersionInGroup(apiVersion, volcanoSchedulingApiGroup);
}
