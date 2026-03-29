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

// Shared interfaces for CEL-based policies (policies.kyverno.io/v1)

export interface CELVariable {
  name: string;
  expression: string;
}

export interface ResourceRule {
  apiGroups?: string[];
  apiVersions?: string[];
  operations?: string[];
  resources?: string[];
}

export interface MatchConstraints {
  resourceRules?: ResourceRule[];
  namespaceSelector?: Record<string, unknown>;
  labelSelector?: Record<string, unknown>;
  matchConditions?: { name: string; expression: string }[];
}

export interface CELPolicyEvaluation {
  admission?: { enabled?: boolean };
  background?: { enabled?: boolean };
  mode?: string;
}

export interface CELPolicyStatus {
  conditionStatus?: {
    ready?: boolean;
    message?: string;
    conditions?: PolicyCondition[];
  };
  generated?: boolean;
}

// --- ValidatingPolicy ---

export interface CELValidation {
  message?: string;
  messageExpression?: string;
  expression: string;
  reason?: string;
}

export interface ValidatingPolicySpec {
  validationActions?: string[];
  matchConstraints?: MatchConstraints;
  variables?: CELVariable[];
  validations?: CELValidation[];
  evaluation?: CELPolicyEvaluation;
  webhookConfiguration?: { timeoutSeconds?: number };
  auditAnnotations?: { key: string; valueExpression: string }[];
}

export interface ValidatingPolicyInterface extends KubeObjectInterface {
  spec: ValidatingPolicySpec;
  status?: CELPolicyStatus;
}

export class ValidatingPolicy extends KubeObject<ValidatingPolicyInterface> {
  static kind = 'ValidatingPolicy';
  static apiName = 'validatingpolicies';
  static apiVersion = 'policies.kyverno.io/v1';
  static isNamespaced = false;

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get validationActions(): string[] {
    return this.spec.validationActions || ['Audit'];
  }

  get validationCount(): number {
    return this.spec.validations?.length || 0;
  }

  get isAdmissionEnabled(): boolean {
    return this.spec.evaluation?.admission?.enabled ?? true;
  }

  get isBackgroundEnabled(): boolean {
    return this.spec.evaluation?.background?.enabled ?? true;
  }

  get ready(): boolean {
    return this.status?.conditionStatus?.ready ?? false;
  }
}

// --- MutatingPolicy ---

export interface CELMutation {
  patchType?: string;
  applyConfiguration?: { expression: string };
  rfc6902?: { expression: string };
}

export interface MutatingPolicySpec {
  matchConstraints?: MatchConstraints;
  variables?: CELVariable[];
  mutations?: CELMutation[];
  evaluation?: CELPolicyEvaluation;
  webhookConfiguration?: { timeoutSeconds?: number };
}

export interface MutatingPolicyInterface extends KubeObjectInterface {
  spec: MutatingPolicySpec;
  status?: CELPolicyStatus;
}

export class MutatingPolicy extends KubeObject<MutatingPolicyInterface> {
  static kind = 'MutatingPolicy';
  static apiName = 'mutatingpolicies';
  static apiVersion = 'policies.kyverno.io/v1';
  static isNamespaced = false;

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get mutationCount(): number {
    return this.spec.mutations?.length || 0;
  }

  get isAdmissionEnabled(): boolean {
    return this.spec.evaluation?.admission?.enabled ?? true;
  }

  get isBackgroundEnabled(): boolean {
    return this.spec.evaluation?.background?.enabled ?? true;
  }

  get ready(): boolean {
    return this.status?.conditionStatus?.ready ?? false;
  }
}

// --- GeneratingPolicy ---

export interface CELGeneration {
  expression?: string;
  name?: string;
  namespace?: string;
}

export interface GeneratingPolicySpec {
  matchConstraints?: MatchConstraints;
  variables?: CELVariable[];
  generate?: CELGeneration[];
  evaluation?: CELPolicyEvaluation;
}

export interface GeneratingPolicyInterface extends KubeObjectInterface {
  spec: GeneratingPolicySpec;
  status?: CELPolicyStatus;
}

export class GeneratingPolicy extends KubeObject<GeneratingPolicyInterface> {
  static kind = 'GeneratingPolicy';
  static apiName = 'generatingpolicies';
  static apiVersion = 'policies.kyverno.io/v1';
  static isNamespaced = false;

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get generateCount(): number {
    return this.spec.generate?.length || 0;
  }

  get ready(): boolean {
    return this.status?.conditionStatus?.ready ?? false;
  }
}

// --- DeletingPolicy ---

export interface DeletingPolicySpec {
  matchConstraints?: MatchConstraints;
  variables?: CELVariable[];
  conditions?: Record<string, unknown>;
  schedule?: string;
  deletionPropagationPolicy?: string;
  evaluation?: CELPolicyEvaluation;
}

export interface DeletingPolicyInterface extends KubeObjectInterface {
  spec: DeletingPolicySpec;
  status?: CELPolicyStatus & { lastExecutionTime?: string };
}

export class DeletingPolicy extends KubeObject<DeletingPolicyInterface> {
  static kind = 'DeletingPolicy';
  static apiName = 'deletingpolicies';
  static apiVersion = 'policies.kyverno.io/v1';
  static isNamespaced = false;

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get schedule(): string {
    return this.spec.schedule || '-';
  }

  get ready(): boolean {
    return this.status?.conditionStatus?.ready ?? false;
  }
}

// --- ImageValidatingPolicy ---

export interface Attestor {
  name?: string;
  cosign?: {
    key?: { data?: string; kms?: string };
    keyless?: Record<string, unknown>;
    certificate?: Record<string, unknown>;
    trustRoot?: Record<string, unknown>;
  };
  notary?: Record<string, unknown>;
}

export interface ImageValidatingPolicySpec {
  matchImageReferences?: string[];
  attestors?: Attestor[];
  attestations?: { name: string; predicateType: string; conditions?: unknown[] }[];
  evaluation?: CELPolicyEvaluation;
  matchConstraints?: MatchConstraints;
  variables?: CELVariable[];
}

export interface ImageValidatingPolicyInterface extends KubeObjectInterface {
  spec: ImageValidatingPolicySpec;
  status?: CELPolicyStatus;
}

export class ImageValidatingPolicy extends KubeObject<ImageValidatingPolicyInterface> {
  static kind = 'ImageValidatingPolicy';
  static apiName = 'imagevalidatingpolicies';
  static apiVersion = 'policies.kyverno.io/v1';
  static isNamespaced = false;

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get imagePatterns(): string[] {
    return this.spec.matchImageReferences || [];
  }

  get attestorCount(): number {
    return this.spec.attestors?.length || 0;
  }

  get ready(): boolean {
    return this.status?.conditionStatus?.ready ?? false;
  }
}
