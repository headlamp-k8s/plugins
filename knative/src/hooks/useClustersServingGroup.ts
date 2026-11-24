/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { useQuery } from '@tanstack/react-query';
import { REQUEST_TIMEOUT_MS } from '../components/kservices/detail/hooks/restartMachine';
import { queryClient } from '../queryClient';
import { isNotFoundError } from '../utils/error';

const noClusters: string[] = [];

/**
 * Reads whether a cluster serves an API group from the group's discovery document, which every
 * signed-in user may read, unlike the CRDs. Only a 404 shows that the group is not served; any
 * other failure, including no answer within {@link REQUEST_TIMEOUT_MS}, leaves it open, so the
 * group then counts as served.
 *
 * @param cluster - The cluster.
 * @param group - The API group, such as `eventing.knative.dev`.
 * @returns Whether the cluster serves the group, or may serve it.
 */
async function isApiGroupServed(cluster: string, group: string): Promise<boolean> {
  try {
    await ApiProxy.clusterRequest(`/apis/${group}`, {
      cluster,
      isJSON: false,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    return true;
  } catch (error) {
    return !isNotFoundError(error);
  }
}

/**
 * Finds the clusters that serve an API group, or may serve it. It takes the plugin's query client
 * itself, so it also works outside the plugin's pages, such as in a Map source.
 *
 * @param group - The API group, such as `eventing.knative.dev`.
 * @param clusters - The clusters to check.
 * @returns The clusters that serve the group, or null while they are checked.
 */
export function useClustersServingGroup(group: string, clusters: string[]): string[] | null {
  const { data } = useQuery(
    {
      queryKey: ['knative', 'api-group', group, clusters],
      queryFn: async () => {
        const served = await Promise.all(clusters.map(cluster => isApiGroupServed(cluster, group)));
        return clusters.filter((_, index) => served[index]);
      },
      enabled: clusters.length > 0,
      staleTime: Infinity,
    },
    queryClient
  );
  return clusters.length > 0 ? data ?? null : noClusters;
}
