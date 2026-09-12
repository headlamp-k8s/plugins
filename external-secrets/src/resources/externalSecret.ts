import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Condition, isConditionTrue } from './conditions';
import {
  ExternalSecretSpec,
  ExternalSecretStatus,
  getStoreKind,
  getStoreName,
  getTargetSecretName,
} from './externalSecretTypes';

export type {
  ExternalSecretData,
  ExternalSecretDataFrom,
  ExternalSecretSpec,
  ExternalSecretStatus,
  RemoteRef,
  SecretStoreRef,
} from './externalSecretTypes';

export interface KubeExternalSecret extends KubeObjectInterface {
  spec: ExternalSecretSpec;
  status?: ExternalSecretStatus;
}

export class ExternalSecret extends KubeObject<KubeExternalSecret> {
  static apiVersion = 'external-secrets.io/v1';
  static kind = 'ExternalSecret';
  static apiName = 'externalsecrets';
  static isNamespaced = true;

  // Note: This workaround is needed to make the plugin compatible with older versions of Headlamp
  static get detailsRoute() {
    return '/external-secrets/externalsecrets/:namespace/:name';
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  /** The referenced store name, or '-' when the reference is absent. */
  get storeName(): string {
    return getStoreName(this.spec);
  }

  /** The referenced store kind. ESO defaults an absent kind to SecretStore. */
  get storeKind(): string {
    return getStoreKind(this.spec);
  }

  /** The name of the Kubernetes Secret this resource syncs into. */
  get targetSecretName(): string {
    return getTargetSecretName(this.spec, this.metadata.name);
  }

  /** True only when the 'Ready' condition status is 'True'. */
  get ready(): boolean {
    return isConditionTrue(this.status?.conditions, 'Ready');
  }

  /** The full Ready condition, for surfacing its reason and message. */
  get readyCondition(): Condition | undefined {
    return this.status?.conditions?.find(condition => condition.type === 'Ready');
  }

  /** Timestamp of the last successful refresh, if any. */
  get lastRefresh(): string | undefined {
    return this.status?.refreshTime;
  }
}
