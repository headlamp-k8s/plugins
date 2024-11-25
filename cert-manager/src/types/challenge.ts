import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface CertManagerChallenge extends KubeObjectInterface {
  spec: {
    authorizationURL: string;
    dnsName: string;
    issuerRef: {
      kind: string;
      name: string;
    };
    key: string;
    solver: {
      http01: {
        ingress: {
          class: string;
        };
      };
    };
    token: string;
    type: string;
    url: string;
    wildcard: boolean;
  };
  status: {
    presented: boolean;
    processing: boolean;
    reason: string;
    state: string;
  };
}

export class Challenge extends KubeObject<CertManagerChallenge> {
  static kind = 'Challenge';
  static apiName = 'challenges';
  static apiVersion = ['acme.cert-manager.io/v1'];
  static isNamespaced = true;

  get status() {
    return this.jsonData.status;
  }

  get spec() {
    return this.jsonData.spec;
  }

  // Note: This workaround is needed to make the plugin compatible with older versions of Headlamp
  static get detailsRoute() {
    return '/cert-manager/challenges/:namespace/:name';
  }
}
