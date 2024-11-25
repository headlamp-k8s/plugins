import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface CertManagerOrder extends KubeObjectInterface {
  spec: {
    commonName: string;
    dnsNames: string[];
    issuerRef: {
      name: string;
      kind: string;
    };
    request: string;
  };
  status: {
    authorizations: {
      challenges: {
        lastTransitionTime: string;
        message: string;
        observedGeneration: number;
        reason: string;
        status: string;
        type: string;
      }[];
      identifier: string;
      initialState: string;
      url: string;
      wildcard: boolean;
    }[];
    state: string;
    url: string;
    finalizeURL: string;
  };
}

export class Order extends KubeObject<CertManagerOrder> {
  static kind = 'Order';
  static apiName = 'orders';
  static apiVersion = ['acme.cert-manager.io/v1'];
  static isNamespaced = false;

  get status() {
    return this.jsonData.status;
  }

  get spec() {
    return this.jsonData.spec;
  }

  get state() {
    return this.status.state;
  }

  // Note: This workaround is needed to make the plugin compatible with older versions of Headlamp
  static get detailsRoute() {
    return '/cert-manager/orders/:namespace/:name';
  }
}
