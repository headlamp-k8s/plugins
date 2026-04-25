import { KubeObject, KubeObjectInterface, Time } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { ObjectMeta } from './common';
import { KubeadmConfigSpec } from './kubeadmconfig';

const KCPT_API_GROUP = 'controlplane.cluster.x-k8s.io';
const KCPT_CRD_NAME = 'kubeadmcontrolplanetemplates.controlplane.cluster.x-k8s.io';

/**
 * KubeadmControlPlaneTemplate is the KubeObject implementation for the Cluster API KubeadmControlPlaneTemplate resource.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#control-plane-template
 */
export class KubeadmControlPlaneTemplate extends KubeObject<ClusterApiKubeadmControlPlaneTemplate> {
  static readonly apiName = 'kubeadmcontrolplanetemplates';
  static apiVersion = `${KCPT_API_GROUP}/v1beta1`;
  static readonly crdName = KCPT_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'KubeadmControlPlaneTemplate';

  /**
   * Returns the route for the kubeadm control plane template details page.
   */
  static get detailsRoute() {
    return '/cluster-api/kubeadmcontrolplanetemplates/:namespace/:name';
  }

  /**
   * Returns a version of the KubeadmControlPlaneTemplate class with a specific API version.
   */
  static withApiVersion(version: string): typeof KubeadmControlPlaneTemplate {
    const versionedClass =
      class extends KubeadmControlPlaneTemplate {} as typeof KubeadmControlPlaneTemplate;
    versionedClass.apiVersion = `${KCPT_API_GROUP}/${version}`;
    return versionedClass;
  }

  /**
   * Returns the kubeadm control plane template specification.
   */
  get spec() {
    return this.jsonData.spec;
  }
}

/**
 * KubeadmControlPlaneTemplate resource definition.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#control-plane-template
 */
export interface ClusterApiKubeadmControlPlaneTemplate extends KubeObjectInterface {
  /** Spec defines the desired state of KubeadmControlPlaneTemplate. */
  spec?: {
    /** Template is the resource template. */
    template: {
      /** Metadata is the metadata of the resource. */
      metadata?: ObjectMeta;
      /** Spec is the specification of the KubeadmControlPlane. */
      spec: {
        /** MachineTemplate contains the information to create control plane machines. */
        machineTemplate?: {
          /** Metadata is the metadata of the machines. */
          metadata?: ObjectMeta;
          /** NodeDrainTimeout is the maximum duration for a node to drain. */
          nodeDrainTimeout?: number;
          /** NodeVolumeDetachTimeout is the maximum duration for a volume to detach. */
          nodeVolumeDetachTimeout?: number;
          /** NodeDeletionTimeout is the maximum duration for a node to be deleted. */
          nodeDeletionTimeout?: number;
        };
        /** KubeadmConfigSpec is the base kubeadm configuration to use for the control plane. */
        kubeadmConfigSpec?: KubeadmConfigSpec;
        /** RolloutBefore defines conditions to check before starting a rollout. */
        rolloutBefore?: {
          certificateExpiryDays?: number;
        };
        /** RolloutAfter is a field to indicate a rollout should be performed after the specified time. */
        rolloutAfter?: Time;
        /** RolloutStrategy defines the rollout strategy. */
        rolloutStrategy?: {
          /** Type is the type of rollout strategy. */
          type?: string;
          /** RollingUpdate defines the rolling update strategy. */
          rollingUpdate?: {
            /** MaxSurge is the maximum number of machines that can be created above the desired number of machines. */
            maxSurge?: number | string;
          };
        };
        /** RemediationStrategy defines how to remediate unhealthy control plane machines. */
        remediationStrategy?: {
          /** MaxRetry is the maximum number of times to retry remediation. */
          maxRetry?: number;
          /** RetryPeriod is the duration to wait between remediation retries. */
          retryPeriod?: number;
          /** MinHealthyPeriod is the duration to wait before a machine is considered healthy. */
          minHealthyPeriod?: number;
        };
        /** MachineNamingStrategy allows to configure how control plane machines are named. */
        machineNamingStrategy?: {
          template?: string;
        };
      };
    };
  };
}
