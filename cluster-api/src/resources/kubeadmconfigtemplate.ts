import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { ObjectMeta } from './common';
import { KubeadmConfigSpec } from './kubeadmconfig';

export class KubeadmConfigTemplate extends KubeObject<ClusterApiKubeadmConfigTemplate> {
  static readonly apiName = 'kubeadmconfigtemplates';
  static readonly apiVersion = 'bootstrap.cluster.x-k8s.io/v1beta1';
  static readonly isNamespaced = true;
  static readonly kind = 'KubeadmConfigTemplate';

  static get detailsRoute() {
    return '/cluster-api/kubeadmconfigtemplates/:namespace/:name';
  }

  get spec() {
    return this.jsonData.spec;
  }
}

export interface ClusterApiKubeadmConfigTemplate extends KubeObjectInterface {
  spec?: {
    template: {
      metadata?: ObjectMeta;
      spec?: KubeadmConfigSpec;
    };
  };
}
