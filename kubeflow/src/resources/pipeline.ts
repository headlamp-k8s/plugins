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
 * Pipeline spec fields rendered by the Headlamp UI.
 */
export interface KubeflowPipelineSpec {
  displayName?: string;
  description?: string;
  packageUrl?: string;
  pipelineSpec?: {
    pipelineInfo?: {
      name?: string;
      description?: string;
    };
    sdkVersion?: string;
    root?: {
      dag?: { tasks?: Record<string, unknown> };
      tasks?: Record<string, unknown>;
    };
    deploymentSpec?: {
      executors?: Record<string, unknown>;
    };
  };
  [key: string]: unknown;
}

/**
 * Pipeline status fields rendered by the Headlamp UI.
 */
export interface KubeflowPipelineStatus {
  phase?: string;
  conditions?: KubeflowResourceCondition[];
  [key: string]: unknown;
}

/**
 * Typed Pipeline custom resource shape.
 */
export interface KubeflowPipeline extends KubeObjectInterface {
  spec: KubeflowPipelineSpec;
  status?: KubeflowPipelineStatus;
}

/**
 * Headlamp resource class for the Kubeflow Pipeline CRD (pipelines.kubeflow.org/v2beta1 and pipelines.kubeflow.org/v1beta1).
 *
 * @see {@link https://www.kubeflow.org/docs/components/pipelines/ | Kubeflow Pipelines docs}
 */
export class PipelineClass extends KubeObject<KubeflowPipeline> {
  static apiVersion = ['pipelines.kubeflow.org/v2beta1', 'pipelines.kubeflow.org/v1beta1'];
  static kind = 'Pipeline';
  static apiName = 'pipelines';
  static isNamespaced = true;

  /**
   * Workaround for older Headlamp versions that need explicit detail routes.
   */
  static get detailsRoute() {
    return '/kubeflow/pipelines/list/:namespace/:name';
  }

  get spec(): KubeflowPipelineSpec {
    return this.jsonData.spec;
  }

  get status(): KubeflowPipelineStatus {
    return this.jsonData.status ?? {};
  }

  get displayName(): string {
    return this.spec.displayName ?? this.jsonData.metadata?.name ?? '';
  }

  get description(): string {
    return this.spec.description ?? '';
  }

  get packageUrl(): string {
    return this.spec.packageUrl ?? '';
  }

  get pipelineSpec() {
    return this.spec.pipelineSpec;
  }

  get pipelineSpecName(): string {
    return this.pipelineSpec?.pipelineInfo?.name ?? '';
  }

  get pipelineSpecDescription(): string {
    return this.pipelineSpec?.pipelineInfo?.description ?? '';
  }

  get pipelineSdkVersion(): string {
    return this.pipelineSpec?.sdkVersion ?? '';
  }

  get taskNames(): string[] {
    const tasks = this.pipelineSpec?.root?.dag?.tasks ?? this.pipelineSpec?.root?.tasks ?? {};
    return Object.keys(tasks ?? {});
  }

  get executorNames(): string[] {
    const executors = this.pipelineSpec?.deploymentSpec?.executors ?? {};
    return Object.keys(executors ?? {});
  }

  get conditions(): KubeflowResourceCondition[] {
    return this.status.conditions ?? [];
  }

  get latestCondition(): KubeflowResourceCondition | null {
    return this.conditions[this.conditions.length - 1] ?? null;
  }

  get phase(): string {
    return this.status.phase ?? '';
  }
}
