import { KubeObject, KubeObjectInterface, Time } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { ObjectMeta } from './common';
import { KubeadmConfigSpec } from './kubeadmconfig';

export class KubeadmControlPlaneTemplate extends KubeObject<ClusterApiKubeadmControlPlaneTemplate> {
  static readonly apiName = 'kubeadmcontrolplanetemplates';
  static readonly apiVersion = 'controlplane.cluster.x-k8s.io/v1beta1';
  static readonly isNamespaced = true;
  static readonly kind = 'KubeadmControlPlaneTemplate';

  static get detailsRoute() {
    return '/cluster-api/kubeadmcontrolplanetemplates/:namespace/:name';
  }

  get spec() {
    return this.jsonData.spec;
  }
}

export interface ClusterApiKubeadmControlPlaneTemplate extends KubeObjectInterface {
  spec?: {
    template: {
      metadata?: ObjectMeta;
      spec: {
        machineTemplate?: {
          metadata?: ObjectMeta;
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
    };
  };
}
