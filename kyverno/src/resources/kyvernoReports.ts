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
import { PolicyReportResult, PolicyReportSummary } from './policyReport';

// Kyverno's intermediate / ephemeral reports place results, summary and scope-equivalent
// data under `spec`, unlike wgpolicyk8s PolicyReports which expose them at the top level.
export interface KyvernoReportOwner {
  apiVersion?: string;
  kind?: string;
  name?: string;
  namespace?: string;
  uid?: string;
}

export interface KyvernoReportInterface extends KubeObjectInterface {
  spec?: {
    owner?: KyvernoReportOwner;
    summary?: PolicyReportSummary;
    results?: PolicyReportResult[];
  };
}

abstract class KyvernoReportBase extends KubeObject<KyvernoReportInterface> {
  get summary(): PolicyReportSummary {
    return this.jsonData.spec?.summary || {};
  }

  get results(): PolicyReportResult[] {
    return this.jsonData.spec?.results || [];
  }

  get owner(): KyvernoReportOwner | undefined {
    return this.jsonData.spec?.owner;
  }

  get scope() {
    const owner = this.owner;
    if (!owner) return undefined;
    return {
      apiVersion: owner.apiVersion,
      kind: owner.kind,
      name: owner.name,
      namespace: owner.namespace,
      uid: owner.uid,
    };
  }

  get totalResults(): number {
    const s = this.summary;
    return (s.pass || 0) + (s.fail || 0) + (s.warn || 0) + (s.error || 0) + (s.skip || 0);
  }

  get failCount(): number {
    return (this.summary.fail || 0) + (this.summary.error || 0);
  }
}

export class AdmissionReport extends KyvernoReportBase {
  static kind = 'AdmissionReport';
  static apiName = 'admissionreports';
  static apiVersion = 'kyverno.io/v2';
  static isNamespaced = true;
}

export class ClusterAdmissionReport extends KyvernoReportBase {
  static kind = 'ClusterAdmissionReport';
  static apiName = 'clusteradmissionreports';
  static apiVersion = 'kyverno.io/v2';
  static isNamespaced = false;
}

export class BackgroundScanReport extends KyvernoReportBase {
  static kind = 'BackgroundScanReport';
  static apiName = 'backgroundscanreports';
  static apiVersion = 'kyverno.io/v2';
  static isNamespaced = true;
}

export class ClusterBackgroundScanReport extends KyvernoReportBase {
  static kind = 'ClusterBackgroundScanReport';
  static apiName = 'clusterbackgroundscanreports';
  static apiVersion = 'kyverno.io/v2';
  static isNamespaced = false;
}

export class EphemeralReport extends KyvernoReportBase {
  static kind = 'EphemeralReport';
  static apiName = 'ephemeralreports';
  static apiVersion = 'reports.kyverno.io/v1';
  static isNamespaced = true;
}

export class ClusterEphemeralReport extends KyvernoReportBase {
  static kind = 'ClusterEphemeralReport';
  static apiName = 'clusterephemeralreports';
  static apiVersion = 'reports.kyverno.io/v1';
  static isNamespaced = false;
}
