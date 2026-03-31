import { KubeObject, KubeObjectInterface, Time } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { ObjectMeta } from './common';
import { KubeadmConfigSpec } from './kubeadmconfig';

const KCPT_API_GROUP = 'controlplane.cluster.x-k8s.io';
const KCPT_CRD_NAME = 'kubeadmcontrolplanetemplates.controlplane.cluster.x-k8s.io';

export class KubeadmControlPlaneTemplate extends KubeObject<ClusterApiKubeadmControlPlaneTemplate> {
  static readonly apiName = 'kubeadmcontrolplanetemplates';
  static apiVersion = `${KCPT_API_GROUP}/v1beta1`;
  static readonly crdName = KCPT_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'KubeadmControlPlaneTemplate';

  static get detailsRoute() {
    return '/cluster-api/kubeadmcontrolplanetemplates/:namespace/:name';
  }

  static withApiVersion(version: string): typeof KubeadmControlPlaneTemplate {
    const versionedClass =
      class extends KubeadmControlPlaneTemplate {} as typeof KubeadmControlPlaneTemplate;
    versionedClass.apiVersion = `${KCPT_API_GROUP}/${version}`;
    return versionedClass;
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
