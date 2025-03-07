import { BaseKedaAuthentication } from './authentication';

export class TriggerAuthentication extends BaseKedaAuthentication {
  static apiVersion = 'keda.sh/v1alpha1';
  static kind = 'TriggerAuthentication';
  static apiName = 'triggerauthentications';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/keda/triggerauthentications/:namespace/:name';
  }
}
