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

import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { PolicyCondition } from './kyvernoPolicy';

export interface CleanupPolicySpec {
  match?: {
    any?: Record<string, unknown>[];
    all?: Record<string, unknown>[];
  };
  exclude?: {
    any?: Record<string, unknown>[];
    all?: Record<string, unknown>[];
  };
  conditions?: Record<string, unknown>;
  schedule: string;
  deletionPropagationPolicy?: string;
  context?: unknown[];
}

export interface CleanupPolicyStatus {
  conditions?: PolicyCondition[];
  lastExecutionTime?: string;
}

export interface CleanupPolicyInterface extends KubeObjectInterface {
  spec: CleanupPolicySpec;
  status?: CleanupPolicyStatus;
}

export class CleanupPolicy extends KubeObject<CleanupPolicyInterface> {
  static kind = 'CleanupPolicy';
  static apiName = 'cleanuppolicies';
  static apiVersion = 'kyverno.io/v2';
  static isNamespaced = true;

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get schedule(): string {
    return this.spec.schedule;
  }

  get lastExecutionTime(): string | undefined {
    return this.status?.lastExecutionTime;
  }

  get ready(): boolean {
    return this.status?.conditions?.some(c => c.type === 'Ready' && c.status === 'True') ?? false;
  }
}

export class ClusterCleanupPolicy extends KubeObject<CleanupPolicyInterface> {
  static kind = 'ClusterCleanupPolicy';
  static apiName = 'clustercleanuppolicies';
  static apiVersion = 'kyverno.io/v2';
  static isNamespaced = false;

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get schedule(): string {
    return this.spec.schedule;
  }

  get lastExecutionTime(): string | undefined {
    return this.status?.lastExecutionTime;
  }

  get ready(): boolean {
    return this.status?.conditions?.some(c => c.type === 'Ready' && c.status === 'True') ?? false;
  }
}
