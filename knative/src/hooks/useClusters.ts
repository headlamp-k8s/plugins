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

import { useSelectedClusters } from '@kinvolk/headlamp-plugin/lib/k8s';
import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';

/**
 * Hook to get cluster names based on selected clusters or current cluster.
 * Returns an array of cluster names to use for API queries.
 *
 * Priority:
 * 1. Selected clusters (if any)
 * 2. Current cluster (if available)
 * 3. No cluster available -> empty list
 */
export function useClusters(): string[] {
  const selectedClusters = useSelectedClusters();
  const currentCluster = getCluster();

  // If there are selected clusters, use those
  if (selectedClusters && selectedClusters.length > 0) {
    return selectedClusters;
  }

  // Otherwise, use only the current cluster
  if (currentCluster) {
    return [currentCluster];
  }

  // Fallback: no cluster available, return empty list instead of throwing
  return [];
}
