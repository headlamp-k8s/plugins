/**
 * Copyright 2025 The Headlamp Authors.
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

export interface SparkApplicationSpec {
  type: string;
  mode?: string;
  image?: string;
  imagePullPolicy?: string;
  mainApplicationFile?: string;
  mainClass?: string;
  arguments?: string[];
  sparkVersion?: string;
  pythonVersion?: string;
  restartPolicy?: {
    type: string;
    onSubmissionFailureRetries?: number;
    onSubmissionFailureRetryInterval?: number;
    onFailureRetries?: number;
    onFailureRetryInterval?: number;
  };
  driver?: Record<string, any>;
  executor?: Record<string, any>;
  deps?: Record<string, any>;
  sparkConf?: Record<string, string>;
  hadoopConf?: Record<string, string>;
  dynamicAllocation?: {
    enabled: boolean;
    initialExecutors?: number;
    minExecutors?: number;
    maxExecutors?: number;
  };
  monitoring?: Record<string, any>;
  batchScheduler?: string;
  batchSchedulerOptions?: Record<string, any>;
  timeToLiveSeconds?: number;
  volumes?: any[];
  sparkConfigMap?: string;
  hadoopConfigMap?: string;
}

export interface SparkApplicationStatus {
  sparkApplicationId?: string;
  submissionID?: string;
  lastSubmissionAttemptTime?: string;
  terminationTime?: string;
  driverInfo?: {
    podName?: string;
    webUIServiceName?: string;
    webUIPort?: number;
    webUIAddress?: string;
    webUIIngressName?: string;
    webUIIngressAddress?: string;
  };
  applicationState?: {
    state?: string;
    errorMessage?: string;
  };
  executorState?: Record<string, string>;
  executionAttempts?: number;
  submissionAttempts?: number;
}

export type SparkApplication = K8s.cluster.KubeObjectInterface & {
  spec: SparkApplicationSpec;
  status?: SparkApplicationStatus;
};

/**
 * Headlamp resource class for the SparkApplication CRD (sparkoperator.k8s.io/v1beta2).
 */
export class SparkApplicationClass extends K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: 'sparkoperator.k8s.io', version: 'v1beta2' }],
  isNamespaced: true,
  pluralName: 'sparkapplications',
  singularName: 'sparkapplication',
  kind: 'SparkApplication',
}) {
  get spec(): SparkApplicationSpec {
    return this.jsonData.spec;
  }

  get status(): SparkApplicationStatus {
    return this.jsonData.status || {};
  }

  get applicationType() {
    return this.spec.type;
  }

  get mode() {
    return this.spec.mode;
  }

  get sparkVersion() {
    return this.spec.sparkVersion;
  }

  get driverInfo() {
    return (
      this.status?.driverInfo || {
        podName: '',
        webUIServiceName: '',
        webUIPort: 0,
        webUIAddress: '',
        webUIIngressName: '',
        webUIIngressAddress: '',
      }
    );
  }

  get driverPodName() {
    return this.driverInfo.podName;
  }

  get applicationState() {
    return this.status?.applicationState || { state: 'UNKNOWN', errorMessage: '' };
  }

  get applicationStateLabel() {
    return this.applicationState.state;
  }

  get applicationErrorMessage() {
    return this.applicationState.errorMessage;
  }

  get submissionAttempts() {
    return this.status?.submissionAttempts;
  }

  get executionAttempts() {
    return this.status?.executionAttempts;
  }

  get lastSubmissionAttemptTime() {
    return this.status?.lastSubmissionAttemptTime;
  }

  get terminationTime() {
    return this.status?.terminationTime;
  }

  get driverSpec() {
    return this.spec.driver || {};
  }

  get executorSpec() {
    return this.spec.executor || {};
  }

  get serviceAccountName() {
    return this.driverSpec.serviceAccount || 'default';
  }

  static get detailsRoute() {
    return '/kubeflow/spark/sparkapplications/:namespace/:name';
  }
}

export interface ScheduledSparkApplicationSpec {
  schedule: string;
  template: SparkApplicationSpec;
  suspend?: boolean;
  concurrencyPolicy?: string;
  successfulRunHistoryLimit?: number;
  failedRunHistoryLimit?: number;
}

export interface ScheduledSparkApplicationStatus {
  lastRun?: string;
  lastRunName?: string;
  nextRun?: string;
  scheduleState?: string;
  reason?: string;
  pastSuccessfulRunNames?: string[];
  pastFailedRunNames?: string[];
}

export type ScheduledSparkApplication = K8s.cluster.KubeObjectInterface & {
  spec: ScheduledSparkApplicationSpec;
  status?: ScheduledSparkApplicationStatus;
};

/**
 * Headlamp resource class for the ScheduledSparkApplication CRD (sparkoperator.k8s.io/v1beta2).
 */
export class ScheduledSparkApplicationClass extends K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: 'sparkoperator.k8s.io', version: 'v1beta2' }],
  isNamespaced: true,
  pluralName: 'scheduledsparkapplications',
  singularName: 'scheduledsparkapplication',
  kind: 'ScheduledSparkApplication',
}) {
  get spec(): ScheduledSparkApplicationSpec {
    return this.jsonData.spec;
  }

  get status(): ScheduledSparkApplicationStatus {
    return this.jsonData.status || {};
  }

  get schedule() {
    return this.spec.schedule;
  }

  get template() {
    return this.spec.template;
  }

  get suspend() {
    return !!this.spec.suspend;
  }

  get concurrencyPolicy() {
    return this.spec.concurrencyPolicy;
  }

  get lastRun() {
    return this.status.lastRun;
  }

  get lastRunName() {
    return this.status.lastRunName;
  }

  get nextRun() {
    return this.status.nextRun;
  }

  get scheduleState() {
    return this.status.scheduleState;
  }

  get scheduleReason() {
    return this.status.reason;
  }

  static get detailsRoute() {
    return '/kubeflow/spark/scheduledsparkapplications/:namespace/:name';
  }
}
