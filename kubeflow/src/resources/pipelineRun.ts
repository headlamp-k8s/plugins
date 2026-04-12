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
 * Runtime configuration exposed by KFP Run resources.
 */
export interface PipelineRuntimeConfig {
  pipelineRoot?: string;
  [key: string]: unknown;
}

/**
 * Run spec fields rendered by the Headlamp UI.
 */
export interface KubeflowPipelineRunSpec {
  displayName?: string;
  description?: string;
  pipelineName?: string;
  pipelineVersionName?: string;
  pipelineVersionReference?: { name?: string };
  experimentName?: string;
  serviceAccountName?: string;
  runtimeConfig?: PipelineRuntimeConfig;
  pipelineSpec?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Run status fields rendered by the Headlamp UI.
 */
export interface KubeflowPipelineRunStatus {
  phase?: string;
  state?: string;
  message?: string;
  startTime?: string;
  completionTime?: string;
  lastTransitionTime?: string;
  conditions?: KubeflowResourceCondition[];
  [key: string]: unknown;
}

/**
 * Typed Run custom resource shape.
 */
export interface KubeflowPipelineRun extends KubeObjectInterface {
  spec: KubeflowPipelineRunSpec;
  status?: KubeflowPipelineRunStatus;
}

/**
 * Headlamp resource class for the Kubeflow Run CRD.
 *
 * @see {@link https://www.kubeflow.org/docs/components/pipelines/ | Kubeflow Pipelines docs}
 */
export class PipelineRunClass extends KubeObject<KubeflowPipelineRun> {
  static apiVersion = ['pipelines.kubeflow.org/v2beta1', 'pipelines.kubeflow.org/v1beta1'];
  static kind = 'Run';
  static apiName = 'runs';
  static isNamespaced = true;

  /**
   * Workaround for older Headlamp versions that need explicit detail routes.
   */
  static get detailsRoute() {
    return '/kubeflow/pipelines/runs/:namespace/:name';
  }

  get spec(): KubeflowPipelineRunSpec {
    return this.jsonData.spec;
  }

  get status(): KubeflowPipelineRunStatus {
    return this.jsonData.status ?? {};
  }

  get displayName(): string {
    return this.spec.displayName ?? this.jsonData.metadata?.name ?? '';
  }

  get description(): string {
    return this.spec.description ?? '';
  }

  get pipelineName(): string {
    return this.spec.pipelineName ?? '';
  }

  get pipelineVersionName(): string {
    return this.spec.pipelineVersionName ?? this.spec.pipelineVersionReference?.name ?? '';
  }

  get experimentName(): string {
    return this.spec.experimentName ?? '';
  }

  get pipelineRoot(): string {
    return this.spec.runtimeConfig?.pipelineRoot ?? '';
  }

  get serviceAccountName(): string {
    return this.spec.serviceAccountName ?? '';
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

  get state(): string {
    return this.status.state ?? this.status.phase ?? '';
  }
}
