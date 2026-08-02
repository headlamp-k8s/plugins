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
import { KubeObject, type KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import {
  formatClusterPathParam,
  getSelectedClusters,
} from '@kinvolk/headlamp-plugin/lib/lib/cluster';

type KnativeResourceClass = {
  kind: string;
  apiName: string;
  apiVersion: string | string[];
  isNamespaced: boolean;
};

export function getKnativeCrdName(resourceClass: KnativeResourceClass): string {
  const apiVersion = Array.isArray(resourceClass.apiVersion)
    ? resourceClass.apiVersion[0]
    : resourceClass.apiVersion;
  const group = apiVersion.includes('/') ? apiVersion.split('/')[0] : '';
  return group ? `${resourceClass.apiName}.${group}` : resourceClass.apiName;
}

function getKnativeCustomResourceDetailsLink({
  resourceClass,
  name,
  namespace,
  cluster,
}: {
  resourceClass: KnativeResourceClass;
  name: string;
  namespace?: string;
  cluster?: string;
}): string {
  const selectedClusters = getSelectedClusters();
  const clusterPath = formatClusterPathParam(selectedClusters, cluster);

  return Router.createRouteURL('customresource', {
    cluster: clusterPath,
    crd: getKnativeCrdName(resourceClass),
    namespace: resourceClass.isNamespaced ? namespace || 'default' : '-',
    crName: name,
  });
}

/**
 * Routes CRD instances to Headlamp's standard Custom Resource list and detail views.
 */
export abstract class KnativeCustomResource<T extends KubeObjectInterface> extends KubeObject<T> {
  get metadata() {
    return this.jsonData.metadata;
  }

  get spec(): T['spec'] {
    return this.jsonData.spec;
  }

  get status(): T['status'] {
    return this.jsonData.status;
  }

  getDetailsLink(): string {
    return getKnativeCustomResourceDetailsLink({
      resourceClass: this._class(),
      name: this.getName(),
      namespace: this.getNamespace(),
      cluster: this.cluster,
    });
  }

  getListLink(): string {
    const selectedClusters = getSelectedClusters();
    const cluster = formatClusterPathParam(selectedClusters, this.cluster);

    return Router.createRouteURL('customresources', {
      cluster,
      crd: getKnativeCrdName(this._class()),
    });
  }
}
