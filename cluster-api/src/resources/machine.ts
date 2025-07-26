import { KubeObject, KubeObjectInterface, Time } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Condition, ReadinessGate } from './common';

export class Machine extends KubeObject<ClusterApiMachine> {
  static readonly apiName = 'machines';
  static readonly apiVersion = 'cluster.x-k8s.io/v1beta1';
  static readonly isNamespaced = true;
  static readonly kind = 'Machine';

  static get detailsRoute() {
    return '/cluster-api/machines/:namespace/:name';
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }
}

export interface ClusterApiMachine extends KubeObjectInterface {
  spec?: MachineSpec;
  status?: {
    nodeRef?: KubeObjectInterface;
    nodeInfo?: {
      machineID: string;
      systemUUID: string;
      bootID: string;
      kernelVersion: string;
      osImage: string;
      containerRuntimeVersion: string;
      kubeletVersion: string;
      kubeProxyVersion: string;
      operatingSystem: string;
      architecture: string;
      swap?: {
        capacity?: bigint;
      };
    };
    lastUpdated?: Time;
    failureReason?: string; // deprecated
    failureMessage?: string; // deprecated
    addresses?: Array<{
      type: string;
      address: string;
    }>;
    phase?: string;
    certificateExpiryDate?: Time;
    bootstrapReady: boolean;
    infrastructureReady: boolean;
    observedGeneration?: bigint;
    conditions?: Condition[];
    deletion?: {
      nodeDrainStartTime?: Time;
      waitForNodeVolumeDetachTime?: Time;
    };
    v1beta2?: {
      conditions?: Condition[];
    };
  };
}

export interface MachineSpec {
  clusterName: string;
  bootstrap: {
    configRef?: KubeObjectInterface;
    dataSecretName?: string;
  };
  infrastructureRef: KubeObjectInterface;
  version?: string;
  providerID?: string;
  failureDomain?: string;
  // minReadySeconds?: number;
  readinessGates?: ReadinessGate[];
  nodeDrainTimeout?: number;
  nodeVolumeDetachTimeout?: number;
  nodeDeletionTimeout?: number;
}
