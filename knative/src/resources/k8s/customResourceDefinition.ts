import { KubeObject, type KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

interface KubeCustomResourceDefinition extends KubeObjectInterface {
  spec?: unknown;
  status?: unknown;
}

export class CustomResourceDefinition extends KubeObject<KubeCustomResourceDefinition> {
  static kind = 'CustomResourceDefinition';
  static apiName = 'customresourcedefinitions';
  static apiVersion = 'apiextensions.k8s.io/v1';
  static isNamespaced = false;
}
