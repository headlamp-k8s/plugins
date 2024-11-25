import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface CertManagerCertificateRequest extends KubeObjectInterface {
  spec: {
    extra?: {
      [key: string]: string[];
    };
    groups?: string[];
    issuerRef: {
      name: string;
      kind: string;
    };
    request: string;
    uid: string;
    username: string;
    duration: string;
    ownerReferences: {
      name: string;
      kind: string;
    }[];
  };
  status: {
    conditions: {
      lastTransitionTime: string;
      message: string;
      observedGeneration?: number;
      reason: string;
      status: string;
      type: string;
    }[];
  };
}

export class CertificateRequest extends KubeObject<CertManagerCertificateRequest> {
  static kind = 'CertificateRequest';
  static apiName = 'certificaterequests';
  static apiVersion = ['cert-manager.io/v1'];
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

  get approved() {
    return this.status.conditions.find(condition => condition.type === 'Approved')?.status;
  }

  get denied() {
    return this.status.conditions.find(condition => condition.type === 'Denied')?.status;
  }

  get ready() {
    return this.status.conditions.find(condition => condition.type === 'Ready')?.status;
  }
}
