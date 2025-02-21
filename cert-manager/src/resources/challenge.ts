import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { ACMEChallengeSolver, IssuerReference } from './common';

export interface CertManagerChallenge extends KubeObjectInterface {
  spec: {
    url: string;
    authorizationURL: string;
    dnsName: string;
    wildcard?: boolean;
    type: 'HTTP-01' | 'DNS-01';
    token: string;
    key: string;
    issuerRef: IssuerReference;
    solver: ACMEChallengeSolver;
  };
  status: {
    presented: boolean;
    processing: boolean;
    reason?: string;
    state?: 'valid' | 'ready' | 'pending' | 'processing' | 'invalid' | 'expired' | 'errored' | '';
  };
}

export class Challenge extends KubeObject<CertManagerChallenge> {
  static kind = 'Challenge';
  static apiName = 'challenges';
  static apiVersion = 'acme.cert-manager.io/v1';
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
