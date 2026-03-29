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

export interface PolicyExceptionEntry {
  policyName: string;
  ruleNames: string[];
}

export interface PolicyExceptionSpec {
  match: {
    any?: Record<string, unknown>[];
    all?: Record<string, unknown>[];
  };
  exceptions: PolicyExceptionEntry[];
  conditions?: Record<string, unknown>;
  background?: boolean;
  podSecurity?: Record<string, unknown>[];
}

export interface PolicyExceptionInterface extends KubeObjectInterface {
  spec: PolicyExceptionSpec;
}

export class PolicyException extends KubeObject<PolicyExceptionInterface> {
  static kind = 'PolicyException';
  static apiName = 'policyexceptions';
  static apiVersion = 'kyverno.io/v2';
  static isNamespaced = true;

  get spec() {
    return this.jsonData.spec;
  }

  get exceptions(): PolicyExceptionEntry[] {
    return this.spec.exceptions || [];
  }

  get policyNames(): string[] {
    return this.exceptions.map(e => e.policyName);
  }

  get background(): boolean {
    return this.spec.background ?? true;
  }
}
