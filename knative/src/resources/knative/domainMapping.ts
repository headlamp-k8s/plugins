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

import type { DeleteParameters } from '@kinvolk/headlamp-plugin/lib/k8s/apiProxy';
import type { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { ClusterDomainClaim } from './clusterDomainClaim';
import { ConditionedKnativeCustomResource, type ConditionedStatus } from './conditionedResource';

interface DomainMappingResource extends KubeObjectInterface {
  spec: {
    ref: {
      apiVersion?: string;
      kind?: string;
      name: string;
      namespace?: string;
    };
  };
  status?: ConditionedStatus & {
    url?: string;
    address?: {
      url?: string;
    };
  };
}

export class KnativeDomainMapping extends ConditionedKnativeCustomResource<DomainMappingResource> {
  static kind = 'DomainMapping';
  static apiName = 'domainmappings';
  static apiVersion = 'serving.knative.dev/v1beta1';
  static isNamespaced = true;

  get host(): string | undefined {
    return this.metadata?.name;
  }

  get readyUrl(): string | undefined {
    const isReady = this.readyCondition?.status === 'True';
    const url = this.status?.url || this.status?.address?.url;
    return isReady && url ? url : undefined;
  }

  /**
   * Delete DomainMapping and (best-effort) delete the corresponding ClusterDomainClaim (same host).
   * If the claim doesn't exist, ignore it. Any other errors are ignored as DomainMapping deletion
   * should be the source of truth for the UI action.
   */
  async delete(force?: boolean): Promise<any> {
    // 1) Delete DomainMapping first.
    const res = await super.delete(force);

    // 2) Best-effort delete ClusterDomainClaim (same host).
    const host = this.host?.trim();
    if (!host) return res;

    const deleteParams: DeleteParameters | undefined = force
      ? { gracePeriodSeconds: 0 }
      : undefined;
    const cdcEndpoint = ClusterDomainClaim.apiEndpoint as unknown as {
      delete: (name: string, deleteParams?: DeleteParameters, cluster?: string) => Promise<any>;
    };
    try {
      await cdcEndpoint.delete(host, deleteParams, this.cluster);
    } catch (error: unknown) {
      // Best-effort cleanup: DomainMapping deletion remains the source of truth.
      const apiError = error as
        | { message?: string; response?: { status?: number }; status?: number }
        | undefined;
      const status = apiError?.status ?? apiError?.response?.status;
      const message = String(apiError?.message ?? '');
      if (status !== 404 && !/NotFound|404/i.test(message)) {
        console.warn(`Failed to clean up ClusterDomainClaim "${host}":`, error);
      }
    }

    return res;
  }
}
