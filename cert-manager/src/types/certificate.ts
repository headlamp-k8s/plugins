import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface CertManagerCertificate extends KubeObjectInterface {
  spec: {
    commonName: string;
    dnsNames: string[];
    issuerRef: {
      name: string;
      kind: string;
    };
    secretName: string;
    renewBefore: string;
    subject: {
      organizations: string[];
    };
    duration: string;
  };
  status: {
    conditions: {
      lastTransitionTime: string;
      message: string;
      observedGeneration: number;
      reason: string;
      status: string;
      type: string;
    }[];
    nextPrivateKeySecretName: string;
  };
}

export class Certificate extends KubeObject<CertManagerCertificate> {
  static kind = 'Certificate';
  static apiName = 'certificates';
  static apiVersion = ['cert-manager.io/v1'];
  static isNamespaced = true;

  get ready() {
    return this.status.conditions.find(condition => condition.type === 'Ready')?.status === 'True';
  }

  // Note: This workaround is needed to make the plugin compatible with older versions of Headlamp
  static get detailsRoute() {
    return '/cert-manager/certificates/:namespace/:name';
  }

  get organizations(): string[] {
    return this.spec.subject?.organizations || [];
  }

  get status() {
    return this.jsonData.status;
  }

  get spec() {
    return this.jsonData.spec;
  }
}
