import { KubeObject, KubeObjectInterface, Time } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Condition, ObjectMeta, ReadinessGate } from './common';
import { KubeadmConfigSpec } from './kubeadmconfig';

export class KubeadmControlPlane extends KubeObject<ClusterApiKubeadmControlPlane> {
  static readonly apiName = 'kubeadmcontrolplanes';
  static readonly apiVersion = 'controlplane.cluster.x-k8s.io/v1beta1';
  static readonly isNamespaced = true;
  static readonly kind = 'KubeadmControlPlane';

  static get detailsRoute() {
    return '/cluster-api/kubeadmcontrolplanes/:namespace/:name';
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }
}

export interface ClusterApiKubeadmControlPlane extends KubeObjectInterface {
  spec?: {
    replicas?: number;
    version: string;
    machineTemplate?: {
      metadata?: ObjectMeta;
      infrastructureRef: KubeObjectInterface;
      readinessGates?: ReadinessGate[];
      nodeDrainTimeout?: number;
      nodeVolumeDetachTimeout?: number;
      nodeDeletionTimeout?: number;
    };
    kubeadmConfigSpec?: KubeadmConfigSpec;
    rolloutBefore?: {
      certificateExpiryDays?: number;
    };
    rolloutAfter?: Time;
    rolloutStrategy?: {
      type?: string;
      rollingUpdate?: {
        maxSurge?: number | string;
      };
    };
    remediationStrategy?: {
      maxRetry?: number;
      retryPeriod?: number;
      minHealthyPeriod?: number;
    };
    machineNamingStrategy?: {
      template?: string;
    };
  };
  status?: {
    selector?: string;
    replicas: number;
    version?: string;
    updatedReplicas: number;
    readyReplicas: number;
    unavailableReplicas: number; // deprecated
    initialized: boolean;
    ready: boolean;
    failureReason?: string; // deprecated
    failureMessage?: string; // deprecated
    observedGeneration?: bigint;
    conditions?: Condition[];
    lastRemediationStatus?: {
      machine: string;
      lastRemediatedTime: Time;
      retryCount: number;
    };
    v1beta2?: {
      conditions?: Condition[];
      readyReplicas?: number;
      availableReplicas?: number;
      upToDateReplicas?: number;
    };
  };
}
