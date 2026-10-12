import { BaseKedaAuthentication } from './authentication';
import { TRIGGER_AUTHENTICATION_KIND } from './common';

export class TriggerAuthentication extends BaseKedaAuthentication {
  static apiVersion = 'keda.sh/v1alpha1';
  static kind = TRIGGER_AUTHENTICATION_KIND;
  static apiName = 'triggerauthentications';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/keda/triggerauthentications/:namespace/:name';
  }
}
