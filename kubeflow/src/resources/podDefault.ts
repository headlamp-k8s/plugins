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

export interface KubeflowPodDefault extends KubeObjectInterface {
  spec: {
    desc?: string;
    selector?: {
      matchLabels?: Record<string, string>;
    };
    env?: Array<{
      name: string;
      value?: string;
      valueFrom?: any;
    }>;
    volumes?: Array<any>;
    volumeMounts?: Array<any>;
    annotations?: Record<string, string>;
    tolerations?: Array<{
      key?: string;
      operator?: string;
      value?: string;
      effect?: string;
      tolerationSeconds?: number;
    }>;
    serviceAccountName?: string;
    [key: string]: any;
  };
  status?: any;
}

/**
 * Headlamp resource class for the Kubeflow PodDefault CRD (kubeflow.org/v1alpha1).
 *
 * PodDefaults are admission webhook rules that inject environment variables,
 * volumes, and other pod spec fields into matching workloads.
 *
 * @see {@link https://github.com/kubeflow/kubeflow/blob/master/components/admission-webhook/api/v1alpha1/poddefault_types.go | PodDefault API types}
 */
export class PodDefaultClass extends KubeObject<KubeflowPodDefault> {
  static apiVersion = 'kubeflow.org/v1alpha1';
  static kind = 'PodDefault';
  static apiName = 'poddefaults';
  static isNamespaced = true;

  /**
   * Workaround for older Headlamp versions that need explicit detail routes.
   */
  static get detailsRoute() {
    return '/kubeflow/notebooks/poddefaults/:namespace/:name';
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status || {};
  }

  get desc() {
    return this.spec?.desc || 'No description';
  }

  get matchLabels() {
    return this.spec?.selector?.matchLabels;
  }

  get env() {
    return this.spec?.env || [];
  }

  get volumes() {
    return this.spec?.volumes || [];
  }

  get volumeMounts() {
    return this.spec?.volumeMounts || [];
  }

  get annotations() {
    return this.spec?.annotations || {};
  }

  get tolerations() {
    return this.spec?.tolerations || [];
  }

  get serviceAccountName() {
    return this.spec?.serviceAccountName;
  }
}
