import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { KeyUsage } from './certificate';
import { Condition, IssuerReference } from './common';
import { getConditionStatus, isConditionTrue } from './conditions';

export interface CertManagerCertificateRequest extends KubeObjectInterface {
  spec: {
    duration?: string;
    issuerRef: IssuerReference;
    request: string;
    isCA?: boolean;
    usages?: KeyUsage[];
    username?: string;
    uid?: string;
    groups?: string[];
    extra?: { [key: string]: string[] };
  };
  status: {
    conditions: Condition[];
    certificate?: string;
    ca?: string;
    failureTime?: string;
  };
}

export class CertificateRequest extends KubeObject<CertManagerCertificateRequest> {
  static kind = 'CertificateRequest';
  static apiName = 'certificaterequests';
  static apiVersion = 'cert-manager.io/v1';
  static isNamespaced = true;

  get status() {
    return this.jsonData.status;
  }

  // Note: This workaround is needed to make the plugin compatible with older versions of Headlamp
  static get detailsRoute() {
    return '/cert-manager/certificaterequests/:namespace/:name';
  }

  get spec() {
    return this.jsonData.spec;
  }

  /** Raw 'Approved' condition status ('True' | 'False' | 'Unknown'), or undefined when absent. */
  get approved() {
    return getConditionStatus(this.status?.conditions, 'Approved');
  }

  /** Raw 'Denied' condition status ('True' | 'False' | 'Unknown'), or undefined when absent. */
  get denied() {
    return getConditionStatus(this.status?.conditions, 'Denied');
  }

  /** True only when the 'Ready' condition status is 'True'. */
  get ready() {
    return isConditionTrue(this.status?.conditions, 'Ready');
  }
}
