import { BaseKedaAuthentication } from './authentication';
import { CLUSTER_TRIGGER_AUTHENTICATION_KIND } from './common';

export class ClusterTriggerAuthentication extends BaseKedaAuthentication {
  static apiVersion = 'keda.sh/v1alpha1';
  static kind = CLUSTER_TRIGGER_AUTHENTICATION_KIND;
  static apiName = 'clustertriggerauthentications';
  static isNamespaced = false;

  static get detailsRoute() {
    return '/keda/clustertriggerauthentications/:name';
  }
}
