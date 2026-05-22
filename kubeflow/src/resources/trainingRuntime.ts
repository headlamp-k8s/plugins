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

import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import {
  KubeflowTrainingRuntime,
  MLPolicy,
  PodGroupPolicy,
  RuntimeTemplate,
} from './trainerCommon';

class BaseTrainingRuntimeClass<T extends KubeflowTrainingRuntime> extends KubeObject<T> {
  get spec() {
    return this.jsonData.spec ?? {};
  }

  get mlPolicy(): MLPolicy {
    return this.spec.mlPolicy ?? {};
  }

  get podGroupPolicy(): PodGroupPolicy {
    return this.spec.podGroupPolicy ?? {};
  }

  get template(): RuntimeTemplate {
    return this.spec.template ?? {};
  }

  get framework(): string {
    return this.metadata.labels?.['trainer.kubeflow.org/framework'] ?? '';
  }

  get defaultNumNodes(): number | null {
    const value = this.mlPolicy.numNodes;
    return value === undefined || value === null ? null : value;
  }

  get templateJobCount(): number {
    return this.template.spec?.replicatedJobs?.length ?? 0;
  }

  get schedulingMode(): string {
    if (this.podGroupPolicy.volcano) {
      return 'Volcano';
    }
    if (this.podGroupPolicy.coscheduling) {
      return 'Coscheduling';
    }
    return '';
  }
}

/**
 * Headlamp resource class for namespace-scoped Kubeflow TrainingRuntime objects.
 */
export class TrainingRuntimeClass extends BaseTrainingRuntimeClass<KubeflowTrainingRuntime> {
  static apiVersion = 'trainer.kubeflow.org/v1alpha1';
  static kind = 'TrainingRuntime';
  static apiName = 'trainingruntimes';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/kubeflow/training/trainingruntimes/:namespace/:name';
  }
}

/**
 * Headlamp resource class for cluster-scoped Kubeflow ClusterTrainingRuntime objects.
 */
export class ClusterTrainingRuntimeClass extends BaseTrainingRuntimeClass<KubeflowTrainingRuntime> {
  static apiVersion = 'trainer.kubeflow.org/v1alpha1';
  static kind = 'ClusterTrainingRuntime';
  static apiName = 'clustertrainingruntimes';
  static isNamespaced = false;

  static get detailsRoute() {
    return '/kubeflow/training/clustertrainingruntimes/:name';
  }
}
