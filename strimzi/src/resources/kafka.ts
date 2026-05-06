import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { StrimziStatus } from './common';

/**
 * Kafka custom resource spec. Doc also defines clusterCa, clientsCa, cruiseControl,
 * kafkaExporter, maintenanceTimeWindows; we type only the fields used by the plugin.
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaSpec-reference
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaClusterSpec-reference
 */
export interface KafkaSpec {
  kafka: {
    version?: string;
    replicas: number;
    listeners: Array<{
      name: string;
      port: number;
      type: string;
      tls: boolean;
    }>;
    config?: Record<string, unknown>;
    storage: {
      type: string;
      size?: string;
      deleteClaim?: boolean;
    };
    metadataVersion?: string;
  };
  zookeeper?: {
    replicas: number;
    storage: {
      type: string;
      size?: string;
      deleteClaim?: boolean;
    };
  };
  entityOperator?: {
    topicOperator?: Record<string, unknown>;
    userOperator?: Record<string, unknown>;
  };
}

/**
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-Kafka-reference
 */
export interface KafkaInterface extends KubeObjectInterface {
  spec: KafkaSpec;
  status?: StrimziStatus;
}

/**
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-Kafka-reference
 */
export class Kafka extends KubeObject<KafkaInterface> {
  static apiVersion = 'kafka.strimzi.io/v1beta2';
  static kind = 'Kafka';
  static apiName = 'kafkas';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/strimzi/kafkas/:namespace/:name';
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

  get clusterMode(): 'KRaft' | 'ZooKeeper' {
    return this.spec?.zookeeper ? 'ZooKeeper' : 'KRaft';
  }

  get kafkaVersion(): string {
    return this.spec?.kafka?.version || 'N/A';
  }

  get kafkaReplicas(): number | undefined {
    return this.spec?.kafka?.replicas;
  }

  get zookeeperReplicas(): number | undefined {
    return this.spec?.zookeeper?.replicas;
  }

  get replicasDisplay(): string {
    const zk = this.zookeeperReplicas;
    const k = this.kafkaReplicas;
    if (zk !== undefined) return `${zk} Zookeeper / ${k} Kafka`;
    if (k !== undefined) return String(k);
    return 'N/A';
  }
}

/** Kafka resource class targeting the `kafka.strimzi.io/v1` API (Strimzi 1.0.0+). */
export class KafkaV1 extends Kafka {
  static apiVersion = 'kafka.strimzi.io/v1';
}
