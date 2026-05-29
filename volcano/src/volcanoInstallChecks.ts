import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import {
  getApiPath,
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
