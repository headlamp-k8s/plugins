/**
 * Copyright 2025 The Headlamp Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface KubeflowProfile extends KubeObjectInterface {
  spec: {
    owner: {
      kind: string;
      name: string;
    };
    resourceQuotaSpec?: {
      hard?: Record<string, string | number>;
    };
    plugins?: Array<{
      kind: string;
      spec: any;
    }>;
    [key: string]: any;
  };
  status?: {
    conditions?: Array<{
      type: string;
      status: string;
      reason?: string;
      message?: string;
      lastTransitionTime?: string;
    }>;
    [key: string]: any;
  };
}

/**
 * Headlamp resource class for the Kubeflow Profile CRD (kubeflow.org/v1).
 *
 * Profiles represent multi-tenant namespaces managed by the Kubeflow Profile Controller.
 *
 * @see {@link https://github.com/kubeflow/kubeflow/blob/master/components/profile-controller/api/v1/profile_types.go | Profile API types}
 */
export class ProfileClass extends KubeObject<KubeflowProfile> {
  static apiVersion = 'kubeflow.org/v1';
  static kind = 'Profile';
  static apiName = 'profiles';
  static isNamespaced = false;

  /**
   * Workaround for older Headlamp versions that need explicit detail routes.
   */
  static get detailsRoute() {
    return '/kubeflow/notebooks/profiles/:name';
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status || {};
  }

  get owner() {
    return this.spec?.owner;
  }

  get resourceQuotaHard() {
    return this.spec?.resourceQuotaSpec?.hard;
  }

  get plugins() {
    return this.spec?.plugins || [];
  }
}
