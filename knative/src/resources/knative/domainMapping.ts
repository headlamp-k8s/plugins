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

import { Router } from '@kinvolk/headlamp-plugin/lib';
import type { DeleteParameters } from '@kinvolk/headlamp-plugin/lib/k8s/apiProxy';
import { KubeObject, type KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { ClusterDomainClaim } from './clusterDomainClaim';
import type { Condition } from './common';

interface DomainMappingResource extends KubeObjectInterface {
  spec: {
    ref: {
      apiVersion?: string;
      kind?: string;
      name: string;
      namespace?: string;
    };
  };
  status?: {
    url?: string;
    address?: {
      url?: string;
    };
    conditions?: Condition[];
  };
}

export class KnativeDomainMapping extends KubeObject<DomainMappingResource> {
  static kind = 'DomainMapping';
  static apiName = 'domainmappings';
  static apiVersion = 'serving.knative.dev/v1beta1';
  static isNamespaced = true;

  private static getSelectedClustersFromLocation(): string[] {
    // Headlamp cluster context is encoded as `/c/<clusterGroup>` where clusterGroup can be `a+b+...`.
    // In Electron, routing uses the hash; in web, it uses pathname.
    const rawPath =
      typeof window === 'undefined'
        ? ''
        : window.location.hash?.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.pathname;

    const match = rawPath.match(/\/c\/([^/]+)/);
    const clusterGroup = match?.[1];
    return clusterGroup ? clusterGroup.split('+') : [];
  }

  private static formatClusterPathParam(
    selectedClusters: string[],
    currentCluster?: string
  ): string {
    if (!currentCluster) return selectedClusters.join('+');
    if (selectedClusters.length === 0) return currentCluster;
    return [currentCluster, ...selectedClusters.filter(c => c !== currentCluster)].join('+');
  }

  /**
   * Headlamp core renders DomainMapping as a Custom Resource (CRD instance) under:
   * - list:    /customresources/:crd
   * - details: /customresources/:crd/:namespace/:crName
   *
   * The default KubeObject routing uses `kind`-based routes, which don't exist for CRDs.
   */
  getDetailsLink(): string {
    const selectedClusters = KnativeDomainMapping.getSelectedClustersFromLocation();
    const cluster = KnativeDomainMapping.formatClusterPathParam(selectedClusters, this.cluster);

    const group = KnativeDomainMapping.apiVersion.includes('/')
      ? KnativeDomainMapping.apiVersion.split('/')[0]
      : '';
    const crd = group ? `${KnativeDomainMapping.apiName}.${group}` : KnativeDomainMapping.apiName;

    // Headlamp's `createRouteURL` expects a route name (e.g. "customresource"), not a raw path.
    return Router.createRouteURL('customresource', {
      cluster,
      crd,
      namespace: this.getNamespace(),
      crName: this.getName(),
    });
  }

  getListLink(): string {
    const selectedClusters = KnativeDomainMapping.getSelectedClustersFromLocation();
    const cluster = KnativeDomainMapping.formatClusterPathParam(selectedClusters, this.cluster);

    const group = KnativeDomainMapping.apiVersion.includes('/')
      ? KnativeDomainMapping.apiVersion.split('/')[0]
      : '';
    const crd = group ? `${KnativeDomainMapping.apiName}.${group}` : KnativeDomainMapping.apiName;

    return Router.createRouteURL('customresources', { cluster, crd });
  }

  get metadata() {
    return this.jsonData.metadata;
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get host(): string | undefined {
    return this.metadata?.name;
  }

  get readyUrl(): string | undefined {
    const isReady =
      this.status?.conditions?.find((c: Condition) => c.type === 'Ready')?.status === 'True';
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
    } catch (e: unknown) {
      const err = e as { message?: string; status?: number } | undefined;
      const status = err?.status;
      const msg = String(err?.message ?? '');
      if (status === 404 || /NotFound|404/i.test(msg)) {
        return res;
      }
      // best-effort: ignore errors
      return res;
    }

    return res;
  }
}
