import { makeKubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster.js';
import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';

export interface CertManagerCertificate extends KubeObjectInterface {
  spec: {
    dnsNames: string[];
    issuerRef: {
      name: string;
    };
    secretName: string;
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

export class Certificate extends makeKubeObject<CertManagerCertificate>('Certificate') {
  static kind = 'Certificate';
  static apiName = 'certificates';
  static apiVersion = ['cert-manager.io/v1'];
  static isNamespaced = true;

  getStatus() {
    return this.jsonData.status;
  }

  getSpec() {
    return this.jsonData.spec;
  }
}
