import { KubeObject } from '@kinvolk/headlamp-plugin/lib';

export interface StrimziStatus {
  conditions?: Array<{
    type: string;
    status: string;
    lastTransitionTime?: string;
    reason?: string;
    message?: string;
  }>;
  observedGeneration?: number;
  listeners?: Array<{
    type: string;
    addresses: Array<{
      host: string;
      port: number;
    }>;
  }>;
  clusterId?: string;
}

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
    config?: Record<string, any>;
    storage: {
      type: string;
      size?: string;
      deleteClaim?: boolean;
    };
    // KRaft mode configuration
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
    topicOperator?: Record<string, any>;
    userOperator?: Record<string, any>;
  };
}

export interface KafkaTopicSpec {
  partitions?: number;
  replicas?: number;
  config?: Record<string, any>;
  topicName?: string;
}

export interface KafkaUserSpec {
  authentication: {
    type: string;
  };
  authorization?: {
    type: string;
    acls?: Array<{
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

export class Kafka extends KubeObject<KafkaSpec, StrimziStatus> {
  static kind = 'Kafka';
  static apiName = 'kafkas';
  static apiVersion = 'kafka.strimzi.io/v1beta2';
  static isNamespaced = true;

  get spec(): KafkaSpec {
    return this.jsonData.spec;
  }

  get status(): StrimziStatus | undefined {
    return this.jsonData.status;
  }

  getReadyCondition() {
    return this.status?.conditions?.find(c => c.type === 'Ready');
  }

  isReady(): boolean {
    const condition = this.getReadyCondition();
    return condition?.status === 'True';
  }

  isKRaftMode(): boolean {
    return !this.spec.zookeeper;
  }

  getClusterMode(): 'KRaft' | 'ZooKeeper' {
    return this.isKRaftMode() ? 'KRaft' : 'ZooKeeper';
  }

  getMetadataVersion(): string | undefined {
    return this.spec.kafka.metadataVersion;
  }
}

export class KafkaTopic extends KubeObject<KafkaTopicSpec, StrimziStatus> {
  static kind = 'KafkaTopic';
  static apiName = 'kafkatopics';
  static apiVersion = 'kafka.strimzi.io/v1beta2';
  static isNamespaced = true;

  get spec(): KafkaTopicSpec {
    return this.jsonData.spec;
  }

  get status(): StrimziStatus | undefined {
    return this.jsonData.status;
  }

  isReady(): boolean {
    const condition = this.status?.conditions?.find(c => c.type === 'Ready');
    return condition?.status === 'True';
  }
}

export class KafkaUser extends KubeObject<KafkaUserSpec, StrimziStatus> {
  static kind = 'KafkaUser';
  static apiName = 'kafkausers';
  static apiVersion = 'kafka.strimzi.io/v1beta2';
  static isNamespaced = true;

  get spec(): KafkaUserSpec {
    return this.jsonData.spec;
  }

  get status(): StrimziStatus | undefined {
    return this.jsonData.status;
  }

  isReady(): boolean {
    const condition = this.status?.conditions?.find(c => c.type === 'Ready');
    return condition?.status === 'True';
  }
}
