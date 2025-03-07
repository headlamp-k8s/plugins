import { BaseKedaAuthentication } from './authentication';

export class ClusterTriggerAuthentication extends BaseKedaAuthentication {
  static apiVersion = 'keda.sh/v1alpha1';
  static kind = 'ClusterTriggerAuthentication';
  static apiName = 'clustertriggerauthentications';
  static isNamespaced = false;

  static get detailsRoute() {
    return '/keda/clustertriggerauthentications/:name';
  }
}
