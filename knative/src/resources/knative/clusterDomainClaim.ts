import { KubeObject, type KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

interface ClusterDomainClaimResource extends KubeObjectInterface {
  spec: {
    namespace: string;
  };
  status?: Record<string, unknown>;
}

export class ClusterDomainClaim extends KubeObject<ClusterDomainClaimResource> {
  static kind = 'ClusterDomainClaim';
  static apiName = 'clusterdomainclaims';
  static apiVersion = 'networking.internal.knative.dev/v1alpha1';
  static isNamespaced = false;

  get metadata() {
    return this.jsonData.metadata;
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  /**
   * The namespace that owns this domain.
   */
  get targetNamespace(): string {
    return this.spec.namespace;
  }
}
