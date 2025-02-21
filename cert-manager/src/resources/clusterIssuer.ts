import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { IssuerSpec, IssuerStatus } from './common';

export interface CertManagerClusterIssuer extends KubeObjectInterface {
  spec: IssuerSpec;
  status: IssuerStatus;
}

export class ClusterIssuer extends KubeObject<CertManagerClusterIssuer> {
  static kind = 'ClusterIssuer';
  static apiName = 'clusterissuers';
  static apiVersion = 'cert-manager.io/v1';
  static isNamespaced = false;

  get status() {
    return this.jsonData.status;
  }

  get spec() {
    return this.jsonData.spec;
  }

  // Note: This workaround is needed to make the plugin compatible with older versions of Headlamp
  static get detailsRoute() {
    return '/cert-manager/clusterissuers/:name';
  }
}
