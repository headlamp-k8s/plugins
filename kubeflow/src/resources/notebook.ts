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

export interface KubeflowNotebook extends KubeObjectInterface {
  spec: {
    template: {
      spec: {
        containers: Array<{
          name: string;
          image: string;
          resources?: {
            requests?: Record<string, string>;
            limits?: Record<string, string>;
          };
          [key: string]: any;
        }>;
        volumes?: Array<Record<string, unknown>>;
        [key: string]: any;
      };
    };
    [key: string]: any;
  };
  status?: {
    readyReplicas?: number;
    conditions?: Array<{
      type: string;
      status: string;
      reason?: string;
      message?: string;
      lastTransitionTime?: string;
    }>;
    containerState?: Record<string, any>;
    [key: string]: any;
  };
}

/**
 * Headlamp resource class for the Kubeflow Notebook CRD (kubeflow.org/v1).
 *
 * @see {@link https://github.com/kubeflow/kubeflow/blob/master/components/notebook-controller/api/v1/notebook_types.go | Notebook API types}
 */
export class NotebookClass extends KubeObject<KubeflowNotebook> {
  static apiVersion = 'kubeflow.org/v1';
  static kind = 'Notebook';
  static apiName = 'notebooks';
  static isNamespaced = true;

  /**
   * Workaround for older Headlamp versions that need explicit detail routes.
   */
  static get detailsRoute() {
    return '/kubeflow/notebooks/servers/:namespace/:name';
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status || {};
  }

  get containers() {
    return this.spec?.template?.spec?.containers || [];
  }

  get containerImage(): string {
    return this.containers[0]?.image || '';
  }

  get volumes() {
    return this.spec?.template?.spec?.volumes || [];
  }

  get readyReplicas(): number {
    return this.status?.readyReplicas || 0;
  }
}
