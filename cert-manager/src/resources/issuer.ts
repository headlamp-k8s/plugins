import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { ACMEIssuerStatus, Condition, IssuerSpec } from './common';

export interface IssuerStatus {
  conditions: Condition[];
  acme?: ACMEIssuerStatus;
}

export interface CertManagerIssuer extends KubeObjectInterface {
  spec: IssuerSpec;
  status: IssuerStatus;
}

export class Issuer extends KubeObject<CertManagerIssuer> {
  static kind = 'Issuer';
  static apiName = 'issuers';
  static apiVersion = 'cert-manager.io/v1';
  static isNamespaced = true;

  get status() {
    return this.jsonData.status;
  }

  get spec() {
    return this.jsonData.spec;
  }

  get ready() {
    return this.status?.conditions?.find(condition => condition.type === 'Ready')?.status;
  }

  // Note: This workaround is needed to make the plugin compatible with older versions of Headlamp
  static get detailsRoute() {
    return '/cert-manager/issuers/:namespace/:name';
  }
}
