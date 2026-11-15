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

// Shape of a single match/exclude selector in Kyverno's spec. Kyverno groups
// these with `any` (OR) or `all` (AND). Captures the fields the UI reads;
// other keys (clusterRoles, roles, ...) are still permitted via the index sig.
export interface MatchSelectorEntry {
  resources?: {
    kinds?: string[];
    // Kyverno still supports this singular form alongside the plural `names` below (both are
    // real fields on the Go ResourceDescription type, confirmed against
    // api/kyverno/v1/match_resources_types.go), a single exact name instead of a pattern list.
    name?: string;
    names?: string[];
    namespaces?: string[];
    operations?: string[];
    // A resource-level annotation restriction, confirmed on the real ResourceDescription type
    // alongside kinds/names/namespaces above, not to be confused with `selector` (a label
    // selector) below.
    annotations?: Record<string, string>;
    selector?: Record<string, unknown>;
    namespaceSelector?: Record<string, unknown>;
  };
  subjects?: {
    kind?: string;
    name?: string;
    namespace?: string;
  }[];
  [key: string]: unknown;
}

export interface MatchSelector {
  any?: MatchSelectorEntry[];
  all?: MatchSelectorEntry[];
  // The direct form: resource/user constraints set straight on match/exclude
  // instead of wrapped in any/all. Kyverno deprecates this in favor of
  // any/all but it's still real and still supported, confirmed against the
  // actual MatchResources Go type (api/kyverno/v1/match_resources_types.go),
  // which embeds ResourceDescription directly, serialized as `resources`,
  // identical in shape to a single any/all entry (ResourceFilter embeds the
  // same ResourceDescription).
  resources?: MatchSelectorEntry['resources'];
}

export interface PolicyRule {
  name: string;
  match?: MatchSelector;
  exclude?: MatchSelector;
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

abstract class KyvernoPolicyBase extends KubeObject<KyvernoPolicyInterface> {
  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get ready(): boolean {
    const conditions = this.status?.conditions || [];
    const readyCond = conditions.find(c => c.type === 'Ready');
    return readyCond?.status === 'True';
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

export class KyvernoPolicy extends KyvernoPolicyBase {
  static kind = 'Policy';
  static apiName = 'policies';
  static apiVersion = 'kyverno.io/v1';
  static isNamespaced = true;
}

export class KyvernoClusterPolicy extends KyvernoPolicyBase {
  static kind = 'ClusterPolicy';
  static apiName = 'clusterpolicies';
  static apiVersion = 'kyverno.io/v1';
  static isNamespaced = false;
}
