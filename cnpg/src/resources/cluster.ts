/*
 * Copyright 2026 The Kubernetes Authors
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

import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import {
  formatInstancesReady,
  getClusterPhase,
  getCurrentPrimary,
  getInstancesReady,
  InstancesReady,
} from '../utils/clusterSummary';
import { CnpgClusterJson, CnpgClusterSpec, CnpgClusterStatus, CnpgCondition } from './types';

export const CNPG_GROUP = 'postgresql.cnpg.io';
export const CNPG_VERSION = 'v1';
export const CNPG_API_PATH = `/apis/${CNPG_GROUP}/${CNPG_VERSION}`;

/**
 * Headlamp resource class for the CloudNativePG Cluster CRD
 * (postgresql.cnpg.io/v1).
 *
 * All derived values delegate to the pure helpers in utils/clusterSummary so
 * the same logic is unit-testable without constructing KubeObjects, and so a
 * cluster with partial status degrades to null instead of throwing.
 */
export class ClusterClass extends KubeObject<CnpgClusterJson> {
  static apiVersion = `${CNPG_GROUP}/${CNPG_VERSION}`;
  static kind = 'Cluster';
  static apiName = 'clusters';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/cnpg/clusters/:namespace/:name';
  }

  get spec(): CnpgClusterSpec {
    return this.jsonData.spec ?? {};
  }

  get status(): CnpgClusterStatus {
    return this.jsonData.status ?? {};
  }

  get conditions(): CnpgCondition[] {
    return this.status.conditions ?? [];
  }

  get phase(): string | null {
    return getClusterPhase(this.jsonData);
  }

  get instancesReady(): InstancesReady {
    return getInstancesReady(this.jsonData);
  }

  get instancesReadyText(): string {
    return formatInstancesReady(this.instancesReady);
  }

  get currentPrimary(): string | null {
    return getCurrentPrimary(this.jsonData);
  }
}
