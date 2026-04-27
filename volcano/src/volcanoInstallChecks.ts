import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

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
    '/apis/scheduling.volcano.sh/v1beta1',
    '/apis/batch.volcano.sh/v1alpha1',
  ]);
}

export async function isVolcanoFlowInstalled(): Promise<boolean> {
  return areApiGroupsInstalled(['/apis/flow.volcano.sh/v1alpha1']);
}
