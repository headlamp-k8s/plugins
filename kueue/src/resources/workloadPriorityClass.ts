import { KubeObject } from '@kinvolk/headlamp-plugin/lib/K8s/cluster';



export class WorkloadPriorityClass extends KubeObject {
  static kind = 'WorkloadPriorityClass';
  static apiName = 'workloadpriorityclasses';
  static apiVersion = 'kueue.x-k8s.io/v1beta2';
  static isNamespaced = false;

  get value(): number | undefined {
    return this.jsonData.value;
  }

  get description(): string | undefined {
    return this.jsonData.description;
  }
}
