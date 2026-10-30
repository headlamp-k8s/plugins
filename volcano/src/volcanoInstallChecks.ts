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
 */
export async function isVolcanoNamespaceQueueInstalled(): Promise<boolean> {
  try {
    const resourceList = await ApiProxy.request(getApiPath(volcanoSchedulingApiVersion), {
      method: 'GET',
    });

    return hasApiResource(resourceList, VolcanoNamespaceQueue.apiName);
  } catch (error) {
    return false;
  }
}
