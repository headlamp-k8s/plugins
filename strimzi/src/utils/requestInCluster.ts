import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

type RequestParams = Parameters<typeof ApiProxy.request>[1];

/**
 * Sends a request to the cluster an object was listed from.
 *
 * With several clusters selected, `ApiProxy.request` goes to the first one, so an
 * action on a row from another cluster would read or change the object with the
 * same name in the wrong cluster. `cluster` is the Headlamp cluster of the object
 * (`KubeObject.cluster`), not its Kafka cluster.
 *
 * The cluster is only added when it is known: `ApiProxy.request` spreads `params`
 * over its own cluster, so `cluster: undefined` would drop the current cluster.
 *
 * @param cluster - Headlamp cluster of the object, if known.
 * @param path - API path of the request.
 * @param params - Request options, like the method and body.
 * @returns The response of the request.
 */
export function requestInCluster(
  cluster: string | undefined,
  path: string,
  params?: RequestParams
) {
  return ApiProxy.request(path, cluster ? { ...params, cluster } : params);
}
