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
 * Katib Experiment Objective configuration.
 * @see {@link https://www.kubeflow.org/docs/components/katib/experiment/#objective Katib Objective Docs}
 */
export interface KatibObjective {
  /** The type of the objective (e.g., maximize, minimize). */
  type?: string;
  /** The primary metric name to optimize. */
  objectiveMetricName?: string;
  /** Additional metric names to collect. */
  additionalMetricNames?: string[];
  /** The target value for the objective metric. */
  goal?: number;
}

export interface KatibAlgorithm {
  algorithmName?: string;
  algorithmSettings?: Array<{ name?: string; value?: string }>;
}

export interface KatibParameterSpec {
  name?: string;
  parameterType?: string;
  feasibleSpace?: {
    min?: string;
    max?: string;
    list?: string[];
    step?: string;
  };
}

export interface KatibTrialTemplate {
  trialSpec?: {
    apiVersion?: string;
    kind?: string;
    spec?: {
      template?: {
        spec?: {
          serviceAccountName?: string;
        };
      };
      runSpec?: {
        template?: {
          spec?: {
            serviceAccountName?: string;
          };
        };
      };
      tfReplicaSpecs?: {
        Worker?: {
          template?: {
            spec?: {
              serviceAccountName?: string;
            };
          };
        };
      };
      pytorchReplicaSpecs?: {
        Worker?: {
          template?: {
            spec?: {
              serviceAccountName?: string;
            };
          };
        };
      };
    };
    [key: string]: unknown;
  };
  primaryContainerName?: string;
  trialParameters?: Array<{
    name?: string;
    description?: string;
    reference?: string;
  }>;
  [key: string]: unknown;
}

export interface KatibExperimentSpec {
  objective?: KatibObjective;
  algorithm?: KatibAlgorithm;
  parameters?: KatibParameterSpec[];
  earlyStopping?: KatibAlgorithm;
  trialTemplate?: KatibTrialTemplate;
  parallelTrialCount?: number;
  maxTrialCount?: number;
  maxFailedTrialCount?: number;
  resumePolicy?: string;
  [key: string]: unknown;
}

export interface KatibObservation {
  metrics?: Array<{
    name?: string;
    value?: string;
  }>;
  [key: string]: unknown;
}

export interface KatibExperimentStatus {
  conditions?: KubeflowResourceCondition[];
  currentOptimalTrial?: {
    parameterAssignments?: Array<{ name?: string; value?: string }>;
    observation?: KatibObservation;
  };
  currentTrialCount?: number;
  failedTrialCount?: number;
  succeededTrialCount?: number;
  [key: string]: unknown;
}

interface KatibSuggestionSpecFields {
  suggestionSpec?: {
    serviceAccountName?: string;
    template?: {
      spec?: {
        serviceAccountName?: string;
      };
    };
  };
  suggestion?: {
    serviceAccountName?: string;
  };
}

export interface KatibExperiment extends KubeObjectInterface {
  spec: KatibExperimentSpec;
  status?: KatibExperimentStatus;
}

/**
 * Headlamp resource class for the Katib Experiment CRD (kubeflow.org/v1beta1).
 *
 * @see {@link https://www.kubeflow.org/docs/components/katib/ | Katib docs}
 */
export class KatibExperimentClass extends KubeObject<KatibExperiment> {
  static apiVersion = 'kubeflow.org/v1beta1';
  static kind = 'Experiment';
  static apiName = 'experiments';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/kubeflow/katib/experiments/:namespace/:name';
  }

  get spec(): KatibExperimentSpec {
    return this.jsonData.spec ?? {};
  }

  get status(): KatibExperimentStatus {
    return this.jsonData.status ?? {};
  }

  get conditions(): KubeflowResourceCondition[] {
    return this.status.conditions ?? [];
  }

  get latestCondition(): KubeflowResourceCondition | null {
    return this.conditions[this.conditions.length - 1] ?? null;
  }

  get phase(): string {
    return this.latestCondition?.type ?? '';
  }

  get objectiveMetricName(): string {
    return this.spec.objective?.objectiveMetricName ?? '';
  }

  get objectiveType(): string {
    return this.spec.objective?.type ?? '';
  }

  get objectiveGoal(): string {
    const goal = this.spec.objective?.goal;
    return goal === undefined || goal === null ? '' : String(goal);
  }

  get algorithmName(): string {
    return this.spec.algorithm?.algorithmName ?? '';
  }

  get parameters(): KatibParameterSpec[] {
    return this.spec.parameters ?? [];
  }

  get searchSpaceSize(): string {
    if (this.parameters.length === 0) {
      return '-';
    }
    return `${this.parameters.length} parameter${this.parameters.length === 1 ? '' : 's'}`;
  }

  get earlyStoppingEnabled(): boolean {
    return !!this.spec.earlyStopping?.algorithmName;
  }

  get earlyStoppingAlgorithm(): string {
    return this.spec.earlyStopping?.algorithmName ?? '';
  }

  get trialWorkerKind(): string {
    return this.spec.trialTemplate?.trialSpec?.kind ?? '';
  }

  get trialWorkerApiVersion(): string {
    return this.spec.trialTemplate?.trialSpec?.apiVersion ?? '';
  }

  get primaryContainerName(): string {
    return this.spec.trialTemplate?.primaryContainerName ?? '';
  }

  get trialServiceAccountName(): string {
    const spec = this.spec.trialTemplate?.trialSpec?.spec;
    return (
      spec?.template?.spec?.serviceAccountName ??
      spec?.runSpec?.template?.spec?.serviceAccountName ??
      spec?.tfReplicaSpecs?.Worker?.template?.spec?.serviceAccountName ??
      spec?.pytorchReplicaSpecs?.Worker?.template?.spec?.serviceAccountName ??
      ''
    );
  }

  get suggestionServiceAccountName(): string {
    const spec = this.spec as KatibExperimentSpec & KatibSuggestionSpecFields;
    return (
      spec?.suggestionSpec?.serviceAccountName ??
      spec?.suggestion?.serviceAccountName ??
      spec?.suggestionSpec?.template?.spec?.serviceAccountName ??
      ''
    );
  }
}
