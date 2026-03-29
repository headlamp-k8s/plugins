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

export interface PolicyRule {
  name: string;
  match?: {
    any?: Record<string, unknown>[];
    all?: Record<string, unknown>[];
  };
  exclude?: {
    any?: Record<string, unknown>[];
    all?: Record<string, unknown>[];
  };
  validate?: {
    message?: string;
    pattern?: unknown;
    anyPattern?: unknown[];
    deny?: unknown;
    cel?: unknown;
    podSecurity?: {
      level?: string;
      version?: string;
    };
    failureAction?: string;
    [key: string]: unknown;
  };
  mutate?: Record<string, unknown>;
  generate?: Record<string, unknown>;
  verifyImages?: unknown[];
  context?: unknown[];
  preconditions?: unknown;
  skipBackgroundRequests?: boolean;
}

export interface PolicyCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

export interface KyvernoPolicySpec {
  rules: PolicyRule[];
  validationFailureAction?: string;
  failurePolicy?: string;
  background?: boolean;
  admission?: boolean;
  webhookTimeoutSeconds?: number;
  applyRules?: string;
  generateExisting?: boolean;
  mutateExistingOnPolicyUpdate?: boolean;
  useServerSideApply?: boolean;
  skipBackgroundRequests?: boolean;
}

export interface KyvernoPolicyStatus {
  ready?: boolean;
  conditions?: PolicyCondition[];
  autogen?: {
    rules?: PolicyRule[];
  };
  rulecount?: {
    validate?: number;
    generate?: number;
    mutate?: number;
    verifyimages?: number;
  };
}

export interface KyvernoPolicyInterface extends KubeObjectInterface {
  spec: KyvernoPolicySpec;
  status?: KyvernoPolicyStatus;
}

function getRuleTypes(rules: PolicyRule[]): string[] {
  const types: string[] = [];
  for (const rule of rules) {
    if (rule.validate && !types.includes('Validate')) types.push('Validate');
    if (rule.mutate && !types.includes('Mutate')) types.push('Mutate');
    if (rule.generate && !types.includes('Generate')) types.push('Generate');
    if (rule.verifyImages && !types.includes('VerifyImages')) types.push('VerifyImages');
  }
  return types;
}

export class KyvernoPolicy extends KubeObject<KyvernoPolicyInterface> {
  static kind = 'Policy';
  static apiName = 'policies';
  static apiVersion = 'kyverno.io/v1';
  static isNamespaced = true;

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get ready(): boolean {
    return this.status?.ready ?? false;
  }

  get rules(): PolicyRule[] {
    return this.spec.rules || [];
  }

  get ruleTypes(): string[] {
    return getRuleTypes(this.rules);
  }

  get validationFailureAction(): string {
    return this.spec.validationFailureAction || 'Audit';
  }

  get background(): boolean {
    return this.spec.background ?? true;
  }
}

export class KyvernoClusterPolicy extends KubeObject<KyvernoPolicyInterface> {
  static kind = 'ClusterPolicy';
  static apiName = 'clusterpolicies';
  static apiVersion = 'kyverno.io/v1';
  static isNamespaced = false;

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get ready(): boolean {
    return this.status?.ready ?? false;
  }

  get rules(): PolicyRule[] {
    return this.spec.rules || [];
  }

  get ruleTypes(): string[] {
    return getRuleTypes(this.rules);
  }

  get validationFailureAction(): string {
    return this.spec.validationFailureAction || 'Audit';
  }

  get background(): boolean {
    return this.spec.background ?? true;
  }
}
