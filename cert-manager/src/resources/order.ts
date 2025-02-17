import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { IssuerReference } from './common';

export interface OrderAuthorization {
  challenges: {
    type: string;
    token: string;
    url: string;
  }[];
  identifier: string;
  initialState?: string;
  url: string;
  wildcard: boolean;
}

export interface CertManagerOrder extends KubeObjectInterface {
  spec: {
    commonName?: string;
    dnsNames?: string[];
    issuerRef: IssuerReference;
    request: string;
    ipAddresses?: string[];
    duration?: string;
  };
  status: {
    authorizations?: OrderAuthorization[];
    state?: string;
    url?: string;
    finalizeURL?: string;
    certificate?: string;
    failureTime?: string;
    reason?: string;
  };
}

export class Order extends KubeObject<CertManagerOrder> {
  static kind = 'Order';
  static apiName = 'orders';
  static apiVersion = 'acme.cert-manager.io/v1';
  static isNamespaced = true;

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
