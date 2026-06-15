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

/**
 * Re-exports from `@headlamp-k8s/ai-common/agents/holmes/client` with
 * headlamp-plugin's `clusterRequest` pre-bound.
 */

import {
  checkHolmesAgentHealth as checkHolmesAgentHealthBase,
  type ClusterRequestFn,
  type HolmesPluginConfig,
} from '@headlamp-k8s/ai-common/agents/holmes/client';
import { clusterRequest } from '@kinvolk/headlamp-plugin/lib/ApiProxy';

// Re-export everything from the ai-common module
export {
  DEFAULT_AGUI_URL,
  HOLMES_SERVICE_NAME,
  HOLMES_SERVICE_PORT,
  HOLMES_SERVICE_NAMESPACE,
  getHolmesServiceProxyPath,
  getHolmesProxyBaseUrl,
  HolmesAgent,
} from '@headlamp-k8s/ai-common/agents/holmes/client';

export type {
  HolmesPluginConfig,
  ClusterRequestFn,
} from '@headlamp-k8s/ai-common/agents/holmes/client';

/**
 * Check if the Holmes agent is reachable, using headlamp-plugin's `clusterRequest`.
 *
 * Thin wrapper that pre-binds the platform-specific cluster request function.
 */
export async function checkHolmesAgentHealth(
  cluster: string,
  config?: HolmesPluginConfig
): Promise<boolean> {
  return checkHolmesAgentHealthBase(clusterRequest as unknown as ClusterRequestFn, cluster, config);
}
