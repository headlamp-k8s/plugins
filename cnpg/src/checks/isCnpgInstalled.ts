/*
 * Copyright 2026 The Kubernetes Authors
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
import { CNPG_API_PATH } from '../resources/cluster';
import { InstalledVerdict, verdictForDiscoveryError } from './discoveryVerdict';

/**
 * Reports whether the CloudNativePG API group is served by the given cluster.
 *
 * This uses API discovery rather than reading the CustomResourceDefinition
 * object, because discovery is normally readable by any authenticated user
 * while `get customresourcedefinitions` frequently is not.
 *
 * Returns null when the check could not be answered. A failure is not a
 * negative: the caller caches this verdict, so treating a dropped connection or
 * a denied discovery request as "not installed" would hide the entire plugin
 * for the length of that cache, with nothing on screen to explain it.
 */
export async function isCnpgInstalled(cluster?: string): Promise<InstalledVerdict> {
  try {
    const response = await ApiProxy.request(CNPG_API_PATH, {
      method: 'GET',
      cluster,
    });
    return !!response;
  } catch (error) {
    return verdictForDiscoveryError(error as { status?: number; message?: string });
  }
}
