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

import { KubeObject, type KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

interface ClusterDomainClaimResource extends KubeObjectInterface {
  spec: {
    namespace: string;
  };
  status?: Record<string, unknown>;
}

export class ClusterDomainClaim extends KubeObject<ClusterDomainClaimResource> {
  static kind = 'ClusterDomainClaim';
  static apiName = 'clusterdomainclaims';
  static apiVersion = 'networking.internal.knative.dev/v1alpha1';
  static isNamespaced = false;

  get metadata() {
    return this.jsonData.metadata;
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  /**
   * The namespace that owns this domain.
   */
  get targetNamespace(): string {
    return this.spec.namespace;
  }
}
