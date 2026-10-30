import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { VolcanoNamespaceQueue } from './resources/namespacequeue';
import {
  getApiPath,
  hasApiResource,
  volcanoFlowApiVersion,
  volcanoJobApiVersion,
  volcanoSchedulingApiVersion,
} from './utils/volcanoApi';

async function areApiGroupsInstalled(apiPaths: string[]): Promise<boolean> {
  try {
    const responses = await Promise.all(
      apiPaths.map(apiPath => ApiProxy.request(apiPath, { method: 'GET' }))
    );

    return responses.every(response => !!response);
  } catch (error) {
    return false;
  }
}

export async function isVolcanoCoreInstalled(): Promise<boolean> {
  return areApiGroupsInstalled([
    getApiPath(volcanoSchedulingApiVersion),
    getApiPath(volcanoJobApiVersion),
  ]);
}

export async function isVolcanoFlowInstalled(): Promise<boolean> {
  return areApiGroupsInstalled([getApiPath(volcanoFlowApiVersion)]);
}

/**
 * Checks that the cluster serves the NamespaceQueue CRD. The scheduling API group alone is not
 * enough because NamespaceQueue is only part of recent Volcano builds.
 *
 * @param cluster Cluster to probe. Defaults to the current cluster when omitted.
 * @returns `true` when the cluster serves the NamespaceQueue resource.
 */
export async function isVolcanoNamespaceQueueInstalled(cluster?: string): Promise<boolean> {
  try {
    const resourceList = await ApiProxy.request(getApiPath(volcanoSchedulingApiVersion), {
      method: 'GET',
      cluster,
    });

    return hasApiResource(resourceList, VolcanoNamespaceQueue.apiName);
  } catch (error) {
    return false;
  }
}
