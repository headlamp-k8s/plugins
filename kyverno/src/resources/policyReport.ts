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

export type PolicyResultStatus = 'pass' | 'fail' | 'warn' | 'error' | 'skip';

export interface PolicyReportResult {
  policy: string;
  rule?: string;
  result: PolicyResultStatus;
  message?: string;
  category?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  scored?: boolean;
  source?: string;
  timestamp?: {
    seconds: number;
    nanos: number;
  };
  resources?: {
    apiVersion?: string;
    kind?: string;
    name?: string;
    namespace?: string;
    uid?: string;
  }[];
  properties?: Record<string, string>;
}

export interface PolicyReportSummary {
  pass?: number;
  fail?: number;
  warn?: number;
  error?: number;
  skip?: number;
}

export interface PolicyReportInterface extends KubeObjectInterface {
  scope?: {
    apiVersion?: string;
    kind?: string;
    name?: string;
    namespace?: string;
    uid?: string;
  };
  summary?: PolicyReportSummary;
  results?: PolicyReportResult[];
}

export class PolicyReport extends KubeObject<PolicyReportInterface> {
  static kind = 'PolicyReport';
  static apiName = 'policyreports';
  static apiVersion = 'wgpolicyk8s.io/v1alpha2';
  static isNamespaced = true;

  get summary(): PolicyReportSummary {
    return this.jsonData.summary || {};
  }

  get results(): PolicyReportResult[] {
    return this.jsonData.results || [];
  }

  get scope() {
    return this.jsonData.scope;
  }

  get totalResults(): number {
    const s = this.summary;
    return (s.pass || 0) + (s.fail || 0) + (s.warn || 0) + (s.error || 0) + (s.skip || 0);
  }

  get failCount(): number {
    return (this.summary.fail || 0) + (this.summary.error || 0);
  }
}

export class ClusterPolicyReport extends KubeObject<PolicyReportInterface> {
  static kind = 'ClusterPolicyReport';
  static apiName = 'clusterpolicyreports';
  static apiVersion = 'wgpolicyk8s.io/v1alpha2';
  static isNamespaced = false;

  get summary(): PolicyReportSummary {
    return this.jsonData.summary || {};
  }

  get results(): PolicyReportResult[] {
    return this.jsonData.results || [];
  }

  get scope() {
    return this.jsonData.scope;
  }

  get totalResults(): number {
    const s = this.summary;
    return (s.pass || 0) + (s.fail || 0) + (s.warn || 0) + (s.error || 0) + (s.skip || 0);
  }

  get failCount(): number {
    return (this.summary.fail || 0) + (this.summary.error || 0);
  }
}
