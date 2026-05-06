import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { StrimziStatus } from './common';

/**
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaUserSpec-reference
 */
export interface KafkaUserSpec {
  authentication: {
    type: string;
  };
  authorization?: {
    type: string;
    acls?: Array<{
      /** ACL rule type: allow or deny. Default is allow. */
      type?: 'allow' | 'deny';
      resource: {
        type: string;
        name?: string;
        patternType?: string;
      };
      operations?: string[];
      host?: string;
    }>;
  };
  quotas?: {
    producerByteRate?: number;
    consumerByteRate?: number;
    requestPercentage?: number;
  };
}

/**
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaUser-reference
 */
export interface KafkaUserInterface extends KubeObjectInterface {
  spec: KafkaUserSpec;
  status?: StrimziStatus;
}

/**
 * Payload for creating a KafkaUser (POST). Server adds metadata.creationTimestamp, metadata.uid.
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaUser-reference
 */
export interface CreateKafkaUserPayload {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
  };
  spec: KafkaUserSpec;
}

/**
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaUser-reference
 */
export class KafkaUser extends KubeObject<KafkaUserInterface> {
  static apiVersion = 'kafka.strimzi.io/v1beta2';
  static kind = 'KafkaUser';
  static apiName = 'kafkausers';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/strimzi/users/:namespace/:name';
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status || {};
  }

  get readyStatus(): string | undefined {
    return this.status?.conditions?.find((c: { type: string }) => c.type === 'Ready')?.status;
  }

  get authenticationType(): string {
    return this.spec?.authentication?.type ?? '';
  }

  get authorizationType(): string {
    return this.spec?.authorization?.type ?? 'None';
  }
}

/** KafkaUser resource class targeting the `kafka.strimzi.io/v1` API (Strimzi 1.0.0+). */
export class KafkaUserV1 extends KafkaUser {
  static apiVersion = 'kafka.strimzi.io/v1';
}
