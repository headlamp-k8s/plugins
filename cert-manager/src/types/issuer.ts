import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface CertManagerIssuer extends KubeObjectInterface {
  spec: {
    acme: {
      email: string;
      privateKeySecretRef: {
        name: string;
      };
      server: string;
      solvers: {
        http01: {
          ingress: {
            class: string;
          };
        };
      }[];
    };
  };
  status: {
    acme: {
      lastPrivateKeyHash: string;
      lastRegisteredEmail: string;
      uri: string;
    };
    conditions: {
      lastTransitionTime: string;
      message: string;
      observedGeneration: number;
      reason: string;
      status: string;
      type: string;
    }[];
  };
}

export class Issuer extends KubeObject<CertManagerIssuer> {
  static kind = 'Issuer';
  static apiName = 'issuers';
  static apiVersion = ['cert-manager.io/v1'];
  static isNamespaced = true;

  get status() {
    return this.jsonData.status;
  }

  get spec() {
    return this.jsonData.spec;
  }

  get ready() {
    return this.status.conditions.find(condition => condition.type === 'Ready')?.status;
  }

  // Note: This workaround is needed to make the plugin compatible with older versions of Headlamp
  static get detailsRoute() {
    return '/cert-manager/issuers/:namespace/:name';
  }
}
