/**
 * Strimzi CRD types and helpers.
 * Resource classes (Kafka, KafkaTopic, KafkaUser) live in src/resources/.
 * This file re-exports them and keeps shared types used by topology and tests.
 */

export interface ApiError {
  message: string;
}

export interface K8sListResponse<T> {
  items: T[];
  metadata?: {
    resourceVersion?: string;
    continue?: string;
  };
}

// Re-export resource classes and their interfaces
export {
  Kafka,
  KafkaV1,
  KafkaConnect,
  KafkaConnectV1,
  KafkaConnector,
  KafkaConnectorV1,
  KafkaTopic,
  KafkaTopicV1,
  KafkaUser,
  KafkaUserV1,
  type ConnectorPlugin,
  type KafkaConnectInterface,
  type KafkaConnectSpec,
  type KafkaConnectStatus,
  type KafkaConnectorInterface,
  type KafkaConnectorSpec,
  type KafkaConnectorState,
  type KafkaConnectorStatus,
  type KafkaInterface,
  type KafkaSpec,
  type KafkaTopicInterface,
  type KafkaTopicSpec,
  type KafkaUserInterface,
  type KafkaUserSpec,
  type StrimziStatus,
} from './resources';

// Types only used by topology (not yet in resources)
/**
 * Doc also defines jvmOptions, template. Roles are 'broker' and/or 'controller'.
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaNodePoolSpec-reference
 */
export interface KafkaNodePoolSpec {
  replicas: number;
  roles: string[];
  storage?: { type: string; size?: string };
  resources?: { requests?: Record<string, string>; limits?: Record<string, string> };
}

/**
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaNodePool-reference
 */
export interface KafkaNodePool {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    creationTimestamp?: string;
    [key: string]: unknown;
  };
  spec: KafkaNodePoolSpec;
  status?: import('./resources/common').StrimziStatus & { nodeIds?: number[] };
}

/**
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-StrimziPodSetSpec-reference
 */
export interface StrimziPodSetSpec {
  selector: { matchLabels: Record<string, string> };
  pods: Array<{ name: string; [key: string]: unknown }>;
}

/**
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-StrimziPodSet-reference
 */
export interface StrimziPodSet {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    creationTimestamp?: string;
    [key: string]: unknown;
  };
  spec: StrimziPodSetSpec;
  status?: import('./resources/common').StrimziStatus & {
    pods?: number;
    readyPods?: number;
    currentPods?: number;
  };
}

// Helper functions (re-exported from crds-helpers so tests can run without loading resource classes)
export {
  isKRaftMode,
  getClusterMode,
  isKafkaReady,
  isTopicReady,
  isUserReady,
  isConnectReady,
  isConnectorPaused,
  getConnectorDesiredState,
} from './crds-helpers';
