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

import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { KubeflowResourceCondition } from './common';

/**
 * Name/value metric reported by Trainer into TrainJob status.
 */
export interface TrainerMetric {
  /**
   * Name of the metric.
   */
  name?: string;
  /**
   * Value of the metric.
   */
  value?: string;
}

/**
 * Runtime progress and metric status reported by the trainer step.
 * For more details, see the Kubeflow Trainer API reference for TrainerStatus:
 * https://github.com/kubeflow/trainer/blob/main/pkg/apis/trainer/v1alpha1/trainjob_types.go
 */
export interface TrainerStatus {
  /**
   * Current progress of the training job (0-100).
   */
  progressPercentage?: number;
  /**
   * Estimated remaining training time in seconds.
   */
  estimatedRemainingSeconds?: number;
  /**
   * Last time the status was updated.
   */
  lastUpdatedTime?: string;
  /**
   * Current metrics reported by the trainer.
   */
  metrics?: TrainerMetric[];
}

/**
 * Aggregated status counters for a TrainJob child Job.
 */
export interface TrainJobChildStatus {
  /**
   * Name of the child resource.
   */
  name?: string;
  /**
   * Number of ready pods.
   */
  ready?: number;
  /**
   * Number of succeeded pods.
   */
  succeeded?: number;
  /**
   * Number of failed pods.
   */
  failed?: number;
  /**
   * Number of active pods.
   */
  active?: number;
  /**
   * Number of suspended pods.
   */
  suspended?: number;
}

/**
 * Reference to the runtime resource backing a TrainJob.
 */
export interface RuntimeRef {
  /**
   * API group of the referenced runtime.
   */
  apiGroup?: string;
  /**
   * Kind of the referenced runtime (TrainingRuntime or ClusterTrainingRuntime).
   */
  kind?: string;
  /**
   * Name of the referenced runtime.
   */
  name?: string;
}

/**
 * Dataset or model initializer source and secret configuration.
 */
export interface InitializerAsset {
  /**
   * URI of the remote storage (e.g., s3://, gs://, hf://).
   */
  storageUri?: string;
  /**
   * Environment variables for the initializer container.
   */
  env?: Array<{
    name?: string;
    value?: string;
    valueFrom?: Record<string, unknown>;
  }>;
  /**
   * Reference to a Secret containing credentials for storage access.
   */
  secretRef?: {
    name?: string;
  };
}

/**
 * TrainJob initializer configuration for dataset and model bootstrap.
 * For more details, see the Kubeflow Trainer API reference for InitializerSpec:
 * https://github.com/kubeflow/trainer/blob/main/pkg/apis/trainer/v1alpha1/trainjob_types.go
 */
export interface InitializerSpec {
  /**
   * Configuration for dataset initialization.
   */
  dataset?: InitializerAsset;
  /**
   * Configuration for model initialization.
   */
  model?: InitializerAsset;
}

/**
 * TrainJob trainer container configuration.
 * For more details, see the Kubeflow Trainer API reference for TrainerSpec:
 * https://github.com/kubeflow/trainer/blob/main/pkg/apis/trainer/v1alpha1/trainjob_types.go
 */
export interface TrainerSpec {
  /**
   * Training container image.
   */
  image?: string;
  /**
   * Entrypoint command for the training container.
   */
  command?: string[];
  /**
   * Arguments for the entrypoint command.
   */
  args?: string[];
  /**
   * Environment variables for the training container.
   */
  env?: Array<{
    name?: string;
    value?: string;
    valueFrom?: Record<string, unknown>;
  }>;
  /**
   * Number of nodes for distributed training.
   */
  numNodes?: number;
  /**
   * Number of processes per node.
   */
  numProcPerNode?: string | number;
  /**
   * Resource requests and limits per node.
   */
  resourcesPerNode?: {
    /**
     * Resource requests (e.g., cpu, memory, nvidia.com/gpu).
     */
    requests?: Record<string, string>;
    /**
     * Resource limits (e.g., cpu, memory, nvidia.com/gpu).
     */
    limits?: Record<string, string>;
    [key: string]: unknown;
  };
}

/**
 * Torch-specific ML policy settings.
 * For more details, see the Kubeflow Trainer API reference for TorchMLPolicySource:
 * https://github.com/kubeflow/trainer/blob/main/pkg/apis/trainer/v1alpha1/mlpolicy_types.go
 */
export interface TorchPolicy {
  /**
   * Number of processes per node for PyTorch distributed training.
   */
  numProcPerNode?: string | number;
}

/**
 * MPI-specific ML policy settings.
 * For more details, see the Kubeflow Trainer API reference for MPIMLPolicySource:
 * https://github.com/kubeflow/trainer/blob/main/pkg/apis/trainer/v1alpha1/mlpolicy_types.go
 */
export interface MPIPolicy {
  /**
   * Defines the number of processes to run per node (slots per node).
   */
  numProcPerNode?: number;
  /**
   * Specifies which MPI distribution to use (e.g., OpenMPI, Intel, MPICH).
   */
  mpiImplementation?: string;
  /**
   * Path to mount SSH keys if the implementation requires SSH-based communication between nodes.
   */
  sshAuthMountPath?: string;
  /**
   * Indicates whether the launcher pod should also participate in the computation as a worker node.
   */
  runLauncherAsNode?: boolean;
}

/**
 * Flux-specific ML policy settings.
 * For more details, see the Kubeflow Trainer API reference for FluxMLPolicySource:
 * https://github.com/kubeflow/trainer/blob/main/pkg/apis/trainer/v1alpha1/mlpolicy_types.go
 */
export interface FluxPolicy {
  /**
   * Number of processes per node for Flux HPC scheduler integration.
   */
  numProcPerNode?: number;
}

/**
 * XGBoost-specific ML policy settings.
 * For more details, see the Kubeflow Trainer API reference for XGBoostMLPolicySource:
 * https://github.com/kubeflow/trainer/blob/main/pkg/apis/trainer/v1alpha1/mlpolicy_types.go
 */
export interface XGBoostPolicy {
  /**
   * Number of XGBoost workers.
   */
  numWorkers?: number;
}

/**
 * Runtime-level ML framework policy configuration.
 * For more details, see the Kubeflow Trainer API reference for MLPolicy:
 * https://github.com/kubeflow/trainer/blob/main/pkg/apis/trainer/v1alpha1/mlpolicy_types.go
 */
export interface MLPolicy {
  /**
   * Total number of nodes for the distributed job.
   */
  numNodes?: number;
  /**
   * PyTorch-specific policy.
   */
  torch?: TorchPolicy;
  /**
   * MPI-specific policy.
   */
  mpi?: MPIPolicy;
  /**
   * Flux-specific policy.
   */
  flux?: FluxPolicy;
  /**
   * JAX-specific policy.
   */
  jax?: Record<string, never>;
  /**
   * XGBoost-specific policy.
   */
  xgboost?: XGBoostPolicy;
}

/**
 * Coscheduling plugin settings for gang scheduling.
 * For more details, see the Kubeflow Trainer API reference for CoschedulingPodGroupPolicySource:
 * https://github.com/kubeflow/trainer/blob/main/pkg/apis/trainer/v1alpha1/podgrouppolicy_types.go
 */
export interface CoschedulingPolicy {
  /**
   * Maximum duration (in seconds) to wait for scheduling a PodGroup.
   */
  scheduleTimeoutSeconds?: number;
}

/**
 * Volcano scheduling settings for PodGroup creation.
 * For more details, see the Kubeflow Trainer API reference for VolcanoPodGroupPolicySource:
 * https://github.com/kubeflow/trainer/blob/main/pkg/apis/trainer/v1alpha1/podgrouppolicy_types.go
 */
export interface VolcanoPolicy {
  /**
   * Volcano queue name.
   */
  queue?: string;
  /**
   * Priority class name for the PodGroup.
   */
  priorityClassName?: string;
  /**
   * Minimum resources required to start the PodGroup.
   */
  minResources?: Record<string, string>;
}

/**
 * Gang scheduling policy configuration for Trainer runtimes.
 * For more details, see the Kubeflow Trainer API reference for PodGroupPolicy:
 * https://github.com/kubeflow/trainer/blob/main/pkg/apis/trainer/v1alpha1/podgrouppolicy_types.go
 */
export interface PodGroupPolicy {
  /**
   * Coscheduling settings for the Kubernetes Scheduler Plugins.
   */
  coscheduling?: CoschedulingPolicy;
  /**
   * Volcano settings for the Volcano gang-scheduler.
   */
  volcano?: VolcanoPolicy;
}

/**
 * Restricted container patch allowed through the RuntimePatches API.
 */
export interface RuntimeContainerPatch {
  /**
   * Name of the container to patch.
   */
  name?: string;
  /**
   * Environment variables to add or override in the container.
   */
  env?: Array<Record<string, unknown>>;
  /**
   * Volume mounts to add or override in the container.
   */
  volumeMounts?: Array<Record<string, unknown>>;
  /**
   * Security context to add or override in the container.
   */
  securityContext?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Restricted pod spec patch allowed through the RuntimePatches API.
 */
export interface PodSpecPatch {
  /**
   * Service account name for the pods.
   */
  serviceAccountName?: string;
  /**
   * Node selector labels for pod placement.
   */
  nodeSelector?: Record<string, string>;
  /**
   * Pod tolerations for scheduling on tainted nodes.
   */
  tolerations?: Array<Record<string, unknown>>;
  /**
   * Pod affinity/anti-affinity rules.
   */
  affinity?: Record<string, unknown>;
  /**
   * Pod volumes configuration.
   */
  volumes?: Array<Record<string, unknown>>;
  /**
   * Container patches to apply.
   */
  containers?: RuntimeContainerPatch[];
  [key: string]: unknown;
}

/**
 * Restricted pod template patch allowed through the RuntimePatches API.
 */
export interface PodTemplatePatch {
  /**
   * Metadata patches for the pod template.
   */
  metadata?: {
    /**
     * Labels to add or override.
     */
    labels?: Record<string, string>;
    /**
     * Annotations to add or override.
     */
    annotations?: Record<string, string>;
    [key: string]: unknown;
  };
  /**
   * Pod spec patches.
   */
  spec?: PodSpecPatch;
}

/**
 * Restricted Job template patch for runtime-patched JobSet entries.
 */
export interface JobTemplatePatch {
  /**
   * Metadata patches for the job template.
   */
  metadata?: {
    /**
     * Labels to add or override.
     */
    labels?: Record<string, string>;
    /**
     * Annotations to add or override.
     */
    annotations?: Record<string, string>;
    [key: string]: unknown;
  };
  /**
   * Job spec patches.
   */
  spec?: {
    /**
     * Pod template patches.
     */
    template?: PodTemplatePatch;
    [key: string]: unknown;
  };
}

/**
 * Patch entry keyed by replicated job name.
 */
export interface ReplicatedJobPatch {
  /**
   * Name of the replicated job in the JobSet.
   */
  name?: string;
  /**
   * Template patches for the replicated job.
   */
  template?: JobTemplatePatch;
  [key: string]: unknown;
}

/**
 * Restricted TrainingRuntime spec patch allowed on a TrainJob.
 */
export interface TrainingRuntimeSpecPatch {
  /**
   * Template patches for the TrainingRuntime.
   */
  template?: {
    /**
     * Metadata patches for the runtime template.
     */
    metadata?: {
      /**
       * Labels to add or override.
       */
      labels?: Record<string, string>;
      /**
       * Annotations to add or override.
       */
      annotations?: Record<string, string>;
      [key: string]: unknown;
    };
    /**
     * Spec patches for the runtime template.
     */
    spec?: {
      /**
       * Patches for replicated jobs in the JobSet.
       */
      replicatedJobs?: ReplicatedJobPatch[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

/**
 * Manager-owned runtime patch attached to a TrainJob.
 * For more details, see the Kubeflow Trainer API reference for RuntimePatch:
 * https://github.com/kubeflow/trainer/blob/main/pkg/apis/trainer/v1alpha1/trainingruntime_types.go
 */
export interface RuntimePatch {
  /**
   * Name of the manager/controller that owns this patch (e.g., "kueue.x-k8s.io/manager").
   */
  manager?: string;
  /**
   * Time when the patch was applied.
   */
  time?: string;
  /**
   * Specific patches for the training runtime spec.
   */
  trainingRuntimeSpec?: TrainingRuntimeSpecPatch;
}

/**
 * JobSet template embedded in a Trainer runtime.
 */
export interface RuntimeTemplate {
  /**
   * Metadata for the JobSet template.
   */
  metadata?: {
    /**
     * Labels for the JobSet.
     */
    labels?: Record<string, string>;
    /**
     * Annotations for the JobSet.
     */
    annotations?: Record<string, string>;
    [key: string]: unknown;
  };
  /**
   * Spec for the JobSet template.
   */
  spec?: {
    /**
     * Replicated jobs defining the training cluster topology.
     */
    replicatedJobs?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Shared spec shape for TrainingRuntime and ClusterTrainingRuntime resources.
 * For more details, see the Kubeflow Trainer API reference for TrainingRuntimeSpec:
 * https://github.com/kubeflow/trainer/blob/main/pkg/apis/trainer/v1alpha1/trainingruntime_types.go
 */
export interface TrainingRuntimeSpec {
  /**
   * ML framework policy (Distributed training configuration).
   */
  mlPolicy?: MLPolicy;
  /**
   * Gang scheduling policy configuration.
   */
  podGroupPolicy?: PodGroupPolicy;
  /**
   * JobSet template defining the underlying Kubernetes resources.
   */
  template?: RuntimeTemplate;
}

/**
 * Status payload exposed by the TrainJob CRD.
 * For more details, see the Kubeflow Trainer API reference for TrainJobStatus:
 * https://github.com/kubeflow/trainer/blob/main/pkg/apis/trainer/v1alpha1/trainjob_types.go
 */
export interface KubeflowTrainJobStatus {
  /**
   * List of current conditions for the TrainJob.
   */
  conditions?: KubeflowResourceCondition[];
  /**
   * Aggregated status of child jobs managed by the TrainJob.
   */
  jobsStatus?: TrainJobChildStatus[];
  /**
   * Detailed runtime status reported by the trainer.
   */
  trainerStatus?: TrainerStatus;
  [key: string]: unknown;
}

/**
 * Raw TrainJob CRD shape consumed by the Headlamp resource wrapper.
 * For more details, see the Kubeflow Trainer API reference for TrainJob:
 * https://github.com/kubeflow/trainer/blob/main/pkg/apis/trainer/v1alpha1/trainjob_types.go
 */
export interface KubeflowTrainJob extends KubeObjectInterface {
  /**
   * Desired state of the TrainJob.
   */
  spec?: {
    /**
     * Reference to the TrainingRuntime to use.
     */
    runtimeRef?: RuntimeRef;
    /**
     * Data and model initialization configuration.
     */
    initializer?: InitializerSpec;
    /**
     * Training container configuration.
     */
    trainer?: TrainerSpec;
    /**
     * Whether the TrainJob should be suspended.
     */
    suspend?: boolean;
    /**
     * Controller that manages the TrainJob.
     */
    managedBy?: string;
    /**
     * List of patches to apply to the runtime.
     */
    runtimePatches?: RuntimePatch[];
    /**
     * Maximum duration in seconds the job may be active.
     */
    activeDeadlineSeconds?: number;
    [key: string]: unknown;
  };
  /**
   * Observed state of the TrainJob.
   */
  status?: KubeflowTrainJobStatus;
}

/**
 * Raw TrainingRuntime or ClusterTrainingRuntime CRD shape.
 * For more details, see the Kubeflow Trainer API reference for TrainingRuntime:
 * https://github.com/kubeflow/trainer/blob/main/pkg/apis/trainer/v1alpha1/trainingruntime_types.go
 */
export interface KubeflowTrainingRuntime extends KubeObjectInterface {
  /**
   * Desired state of the TrainingRuntime.
   */
  spec?: TrainingRuntimeSpec;
}
