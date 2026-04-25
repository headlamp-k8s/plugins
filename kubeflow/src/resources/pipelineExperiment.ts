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
import { KubeflowResourceCondition } from './common';

/**
 * Experiment spec fields rendered by the Headlamp UI.
 */
export interface KubeflowPipelineExperimentSpec {
  displayName?: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * Experiment status fields rendered by the Headlamp UI.
 */
export interface KubeflowPipelineExperimentStatus {
  phase?: string;
  state?: string;
  conditions?: KubeflowResourceCondition[];
  [key: string]: unknown;
}

/**
 * Typed Experiment custom resource shape.
 */
export interface KubeflowPipelineExperiment extends KubeObjectInterface {
  spec: KubeflowPipelineExperimentSpec;
  status?: KubeflowPipelineExperimentStatus;
}

/**
 * Headlamp resource class for the Kubeflow Experiment CRD.
 *
 * @see {@link https://www.kubeflow.org/docs/components/pipelines/ | Kubeflow Pipelines docs}
 */
export class PipelineExperimentClass extends KubeObject<KubeflowPipelineExperiment> {
  static apiVersion = ['pipelines.kubeflow.org/v2beta1', 'pipelines.kubeflow.org/v1beta1'];
  static kind = 'Experiment';
  static apiName = 'experiments';
  static isNamespaced = true;

  /**
   * Workaround for older Headlamp versions that need explicit detail routes.
   */
  static get detailsRoute() {
    return '/kubeflow/pipelines/experiments/:namespace/:name';
  }

  get spec(): KubeflowPipelineExperimentSpec {
    return this.jsonData.spec;
  }

  get status(): KubeflowPipelineExperimentStatus {
    return this.jsonData.status ?? {};
  }

  get displayName(): string {
    return this.spec.displayName ?? this.jsonData.metadata?.name ?? '';
  }

  get description(): string {
    return this.spec.description ?? '';
  }

  get conditions(): KubeflowResourceCondition[] {
    return this.status.conditions ?? [];
  }

  get latestCondition(): KubeflowResourceCondition | null {
    return this.conditions[this.conditions.length - 1] ?? null;
  }

  get phase(): string {
    return this.status.phase ?? this.status.state ?? '';
  }
}
