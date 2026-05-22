/**
 * Copyright 2026 The Headlamp Authors.
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

import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { KubeflowResourceCondition } from './common';
import {
  KubeflowTrainJob,
  KubeflowTrainJobStatus,
  RuntimePatch,
  RuntimeRef,
  TrainerSpec,
  TrainerStatus,
  TrainJobChildStatus,
} from './trainerCommon';

/**
 * Headlamp resource class for the Kubeflow TrainJob CRD (trainer.kubeflow.org/v1alpha1).
 */
export class TrainJobClass extends KubeObject<KubeflowTrainJob> {
  static apiVersion = 'trainer.kubeflow.org/v1alpha1';
  static kind = 'TrainJob';
  static apiName = 'trainjobs';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/kubeflow/training/trainjobs/:namespace/:name';
  }

  get spec() {
    return this.jsonData.spec ?? {};
  }

  get status(): KubeflowTrainJobStatus {
    return this.jsonData.status ?? {};
  }

  get conditions(): KubeflowResourceCondition[] {
    return this.status.conditions ?? [];
  }

  get latestCondition(): KubeflowResourceCondition | null {
    return this.conditions[this.conditions.length - 1] ?? null;
  }

  get runtimeRef(): RuntimeRef {
    return this.spec.runtimeRef ?? {};
  }

  get runtimeKind(): string {
    return this.runtimeRef.kind ?? 'ClusterTrainingRuntime';
  }

  get runtimeName(): string {
    return this.runtimeRef.name ?? '';
  }

  get runtimeApiGroup(): string {
    return this.runtimeRef.apiGroup ?? 'trainer.kubeflow.org';
  }

  get trainer(): TrainerSpec {
    return this.spec.trainer ?? {};
  }

  get trainerStatus(): TrainerStatus | null {
    return this.status.trainerStatus ?? null;
  }

  get jobsStatus(): TrainJobChildStatus[] {
    return this.status.jobsStatus ?? [];
  }

  get runtimePatches(): RuntimePatch[] {
    return this.spec.runtimePatches ?? [];
  }

  get suspended(): boolean {
    return !!this.spec.suspend;
  }

  get managedBy(): string {
    return this.spec.managedBy ?? '';
  }

  get trainerImage(): string {
    return this.trainer.image ?? '';
  }

  get numNodes(): number | null {
    const value = this.trainer.numNodes;
    return value === undefined || value === null ? null : value;
  }

  get numProcPerNode(): string {
    const value = this.trainer.numProcPerNode;
    return value === undefined || value === null ? '' : String(value);
  }

  get progress(): string {
    const value = this.trainerStatus?.progressPercentage;
    return value === undefined || value === null ? '' : String(value);
  }

  get estimatedRemainingTimeSeconds(): number | null {
    const value = this.trainerStatus?.estimatedRemainingSeconds;
    return typeof value === 'number' ? value : null;
  }

  get lastUpdatedTime(): string {
    return this.trainerStatus?.lastUpdatedTime ?? '';
  }

  get phase(): string {
    const trueCondition =
      this.conditions.find(
        condition => condition.status === 'True' && condition.type === 'Failed'
      ) ??
      this.conditions.find(
        condition => condition.status === 'True' && condition.type === 'Succeeded'
      ) ??
      this.conditions.find(
        condition => condition.status === 'True' && condition.type === 'Suspended'
      ) ??
      this.conditions.find(condition => condition.status === 'True');

    return trueCondition?.type ?? this.latestCondition?.type ?? '';
  }
}

/**
 * Minimal custom resource wrapper used to discover JobSet children owned by a TrainJob.
 */
export const JobSetClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: 'jobset.x-k8s.io', version: 'v1alpha2' }],
  isNamespaced: true,
  pluralName: 'jobsets',
  singularName: 'jobset',
  kind: 'JobSet',
});
