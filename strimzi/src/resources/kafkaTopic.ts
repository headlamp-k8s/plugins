import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { StrimziStatus } from './common';

/**
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaTopicSpec-reference
 */
export interface KafkaTopicSpec {
  partitions?: number;
  replicas?: number;
  config?: Record<string, unknown>;
  topicName?: string;
}

/**
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaTopic-reference
 */
export interface KafkaTopicInterface extends KubeObjectInterface {
  spec: KafkaTopicSpec;
  status?: StrimziStatus;
}

/**
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaTopic-reference
 */
export class KafkaTopic extends KubeObject<KafkaTopicInterface> {
  static apiVersion = 'kafka.strimzi.io/v1beta2';
  static kind = 'KafkaTopic';
  static apiName = 'kafkatopics';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/strimzi/topics/:namespace/:name';
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

  get partitions(): number {
    return this.spec?.partitions ?? 0;
  }

  get replicas(): number {
    return this.spec?.replicas ?? 0;
  }
}

/** KafkaTopic resource class targeting the `kafka.strimzi.io/v1` API (Strimzi 1.0.0+). */
export class KafkaTopicV1 extends KafkaTopic {
  static apiVersion = 'kafka.strimzi.io/v1';
}
