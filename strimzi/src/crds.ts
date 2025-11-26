// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Angelo Cesaro

export interface ApiError {
  message: string;
}

/**
 * Generic Kubernetes API list response structure.
 * Used for all K8s resource list endpoints (e.g., /apis/kafka.strimzi.io/v1beta2/kafkas)
 */
export interface K8sListResponse<T> {
  items: T[];
  metadata?: {
    resourceVersion?: string;
    continue?: string;
  };
}

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

export interface Kafka {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp?: string;
    [key: string]: any;
  };
  spec: KafkaSpec;
  status?: StrimziStatus;
}

export interface KafkaTopicSpec {
  partitions?: number;
  replicas?: number;
  config?: Record<string, any>;
  topicName?: string;
}

export interface KafkaTopic {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp?: string;
    [key: string]: any;
  };
  spec: KafkaTopicSpec;
  status?: StrimziStatus;
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

export interface KafkaUser {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp?: string;
    [key: string]: any;
  };
  spec: KafkaUserSpec;
  status?: StrimziStatus;
}

export interface KafkaNodePoolSpec {
  replicas: number;
  roles: string[];
  storage?: {
    type: string;
    size?: string;
  };
  resources?: {
    requests?: Record<string, string>;
    limits?: Record<string, string>;
  };
}

export interface KafkaNodePool {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
    creationTimestamp?: string;
    [key: string]: any;
  };
  spec: KafkaNodePoolSpec;
  status?: StrimziStatus & {
    nodeIds?: number[];
  };
}

// Helper functions
export function isKRaftMode(kafka: Kafka): boolean {
  return !kafka.spec.zookeeper;
}

export function getClusterMode(kafka: Kafka): 'KRaft' | 'ZooKeeper' {
  return isKRaftMode(kafka) ? 'KRaft' : 'ZooKeeper';
}

export function isKafkaReady(kafka: Kafka): boolean {
  const condition = kafka.status?.conditions?.find((c) => c.type === 'Ready');
  return condition?.status === 'True';
}

export function isTopicReady(topic: KafkaTopic): boolean {
  const condition = topic.status?.conditions?.find((c) => c.type === 'Ready');
  return condition?.status === 'True';
}

export function isUserReady(user: KafkaUser): boolean {
  const condition = user.status?.conditions?.find((c) => c.type === 'Ready');
  return condition?.status === 'True';
}
