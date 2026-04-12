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
 * Inline pipeline metadata embedded inside a PipelineVersion spec.
 */
export interface PipelineInfo {
  name?: string;
  description?: string;
}

/**
 * Minimal inline pipeline spec shape surfaced by the PipelineVersion CRD.
 */
export interface PipelineSpec {
  pipelineInfo?: PipelineInfo;
  sdkVersion?: string;
  root?: {
    dag?: { tasks?: Record<string, unknown> };
    tasks?: Record<string, unknown>;
  };
  deploymentSpec?: {
    executors?: Record<string, unknown>;
  };
  [key: string]: unknown;
}

/**
 * PipelineVersion spec fields rendered by the Headlamp UI.
 */
export interface KubeflowPipelineVersionSpec {
  displayName?: string;
  description?: string;
  pipelineName?: string;
  pipelineSpecURI?: string;
  codeSourceURL?: string;
  pipelineSpec?: PipelineSpec;
  [key: string]: unknown;
}

/**
 * PipelineVersion status fields rendered by the Headlamp UI.
 */
export interface KubeflowPipelineVersionStatus {
  phase?: string;
  conditions?: KubeflowResourceCondition[];
  [key: string]: unknown;
}

/**
 * Typed PipelineVersion custom resource shape.
 */
export interface KubeflowPipelineVersion extends KubeObjectInterface {
  spec: KubeflowPipelineVersionSpec;
  status?: KubeflowPipelineVersionStatus;
}

/**
 * Headlamp resource class for the Kubeflow PipelineVersion CRD.
 *
 * @see {@link https://www.kubeflow.org/docs/components/pipelines/ | Kubeflow Pipelines docs}
 */
export class PipelineVersionClass extends KubeObject<KubeflowPipelineVersion> {
  static apiVersion = ['pipelines.kubeflow.org/v2beta1', 'pipelines.kubeflow.org/v1beta1'];
  static kind = 'PipelineVersion';
  static apiName = 'pipelineversions';
  static isNamespaced = true;

  /**
   * Workaround for older Headlamp versions that need explicit detail routes.
   */
  static get detailsRoute() {
    return '/kubeflow/pipelines/versions/:namespace/:name';
  }

  get spec(): KubeflowPipelineVersionSpec {
    return this.jsonData.spec;
  }

  get status(): KubeflowPipelineVersionStatus {
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

  get pipelineSpec(): PipelineSpec | undefined {
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

  get sourceLabel(): string {
    if (this.spec.pipelineSpecURI) {
      return 'Pipeline Spec URI';
    }
    if (this.spec.codeSourceURL) {
      return 'Code Source URL';
    }
    if (this.pipelineSpec) {
      return 'Inline Spec';
    }
    return 'Unknown';
  }

  get sourceValue(): string {
    if (this.spec.pipelineSpecURI) {
      return this.spec.pipelineSpecURI;
    }
    if (this.spec.codeSourceURL) {
      return this.spec.codeSourceURL;
    }
    if (this.pipelineSpec) {
      return this.pipelineSpecName || 'Embedded pipeline spec';
    }
    return '';
  }
}
