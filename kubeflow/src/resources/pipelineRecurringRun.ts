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
import { PipelineRuntimeConfig } from './pipelineRun';

/**
 * Recurring run trigger configuration.
 */
export interface PipelineRunTrigger {
  cronSchedule?: string | { cron?: string };
  intervalSecond?: number;
  [key: string]: unknown;
}

/**
 * Recurring run spec fields rendered by the Headlamp UI.
 */
export interface KubeflowPipelineRecurringRunSpec {
  displayName?: string;
  description?: string;
  pipelineName?: string;
  pipelineVersionName?: string;
  pipelineVersionReference?: { name?: string };
  experimentName?: string;
  enabled?: boolean;
  mode?: string;
  maxConcurrency?: number;
  trigger?: PipelineRunTrigger;
  cronSchedule?: string | { cron?: string };
  intervalSecond?: number;
  serviceAccountName?: string;
  runtimeConfig?: PipelineRuntimeConfig;
  [key: string]: unknown;
}

/**
 * Recurring run status fields rendered by the Headlamp UI.
 */
export interface KubeflowPipelineRecurringRunStatus {
  phase?: string;
  state?: string;
  lastRunTime?: string;
  nextRunTime?: string;
  message?: string;
  conditions?: KubeflowResourceCondition[];
  [key: string]: unknown;
}

/**
 * Typed RecurringRun custom resource shape.
 */
export interface KubeflowPipelineRecurringRun extends KubeObjectInterface {
  spec: KubeflowPipelineRecurringRunSpec;
  status?: KubeflowPipelineRecurringRunStatus;
}

/**
 * Headlamp resource class for the Kubeflow RecurringRun CRD.
 *
 * @see {@link https://www.kubeflow.org/docs/components/pipelines/ | Kubeflow Pipelines docs}
 */
export class PipelineRecurringRunClass extends KubeObject<KubeflowPipelineRecurringRun> {
  static apiVersion = ['pipelines.kubeflow.org/v2beta1', 'pipelines.kubeflow.org/v1beta1'];
  static kind = 'RecurringRun';
  static apiName = 'recurringruns';
  static isNamespaced = true;

  /**
   * Workaround for older Headlamp versions that need explicit detail routes.
   */
  static get detailsRoute() {
    return '/kubeflow/pipelines/recurring/:namespace/:name';
  }

  get spec(): KubeflowPipelineRecurringRunSpec {
    return this.jsonData.spec;
  }

  get status(): KubeflowPipelineRecurringRunStatus {
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

  get isEnabled(): boolean | undefined {
    if (this.spec.enabled !== undefined) {
      return this.spec.enabled;
    }
    if (this.spec.mode !== undefined) {
      return this.spec.mode === 'ENABLE';
    }
    return undefined;
  }

  get maxConcurrency(): number | undefined {
    return this.spec.maxConcurrency;
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

  get mode(): string {
    return this.spec.mode ?? '';
  }
}
