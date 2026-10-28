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

import { getCluster, getClusterPrefixedPath } from '@kinvolk/headlamp-plugin/lib/Utils';

/**
 * Builds a URL for one of this plugin's routes.
 *
 * Headlamp mounts plugin routes under the active cluster (`/c/<cluster>/...`)
 * because `Route.useClusterURL` defaults to true, so a link written as a plain
 * `/pipecd/...` path resolves to the not-found page. Falls back to the bare
 * path when there is no cluster in the URL.
 */
export function pluginURL(path: string): string {
  const cluster = getCluster();
  return cluster ? getClusterPrefixedPath(path).replace(':cluster', cluster) : path;
}
