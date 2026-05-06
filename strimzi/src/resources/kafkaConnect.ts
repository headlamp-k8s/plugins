import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { StrimziStatus } from './common';

/**
 * Plugin descriptor reported by Strimzi on the Connect cluster status.
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-ConnectorPlugin-reference
 */
export interface ConnectorPlugin {
  class: string;
  type?: string;
  version?: string;
}

/**
 * Status fields specific to KafkaConnect (extends the shared StrimziStatus).
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaConnectStatus-reference
 */
export interface KafkaConnectStatus extends StrimziStatus {
  /** REST endpoint of the Connect cluster, used by Connector reconciliation. */
  url?: string;
  /** Number of ready replicas reported by the operator. */
  replicas?: number;
  /** Pod selector exposed by the operator. */
  labelSelector?: string;
  /** Connector plugins discovered on the workers. */
  connectorPlugins?: ConnectorPlugin[];
}

/**
 * KafkaConnect custom resource spec. Doc also defines `image`, `jvmOptions`,
 * `template`, `metricsConfig`, `tracing`, etc.; we type only the fields used
 * by the plugin and pass through the rest as `config`.
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaConnectSpec-reference
 */
export interface KafkaConnectSpec {
  /** Number of Connect worker pods. */
  replicas: number;
  /** Comma-separated list of Kafka bootstrap servers. */
  bootstrapServers: string;
  /** Optional Kafka Connect version pin (e.g. "3.7.0"). */
  version?: string;
  /** Optional override image for the Connect workers. */
  image?: string;
  /** Connect cluster configuration (e.g. `group.id`, converters). */
  config?: Record<string, unknown>;
  /** TLS configuration for the Kafka client. */
  tls?: {
    trustedCertificates?: Array<{ secretName: string; certificate: string }>;
  };
  /** Authentication configuration for the Kafka client. */
  authentication?: {
    type: string;
    [key: string]: unknown;
  };
  /** Pod resource requests / limits. */
  resources?: {
    requests?: Record<string, string>;
    limits?: Record<string, string>;
  };
}

/**
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaConnect-reference
 */
export interface KafkaConnectInterface extends KubeObjectInterface {
  spec: KafkaConnectSpec;
  status?: KafkaConnectStatus;
}

/**
 * KafkaConnect KubeObject — represents a Strimzi Kafka Connect cluster.
 * Connectors (KafkaConnector) are linked to a connect cluster via the
 * `strimzi.io/cluster` label.
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaConnect-reference
 */
export class KafkaConnect extends KubeObject<KafkaConnectInterface> {
  static apiVersion = 'kafka.strimzi.io/v1beta2';
  static kind = 'KafkaConnect';
  static apiName = 'kafkaconnects';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/strimzi/connects/:namespace/:name';
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status || {};
  }

  /** Status of the `Ready` condition reported by the Strimzi operator. */
  get readyStatus(): string | undefined {
    return this.status?.conditions?.find((c: { type: string }) => c.type === 'Ready')?.status;
  }

  /** Connect REST endpoint, useful as a deep-link from the detail view. */
  get connectUrl(): string | undefined {
    return this.status?.url;
  }

  /** Connect worker pod replica count from the spec. */
  get replicas(): number {
    return this.spec?.replicas ?? 0;
  }

  /** Comma-separated bootstrap servers of the target Kafka cluster. */
  get bootstrapServers(): string {
    return this.spec?.bootstrapServers ?? '';
  }

  /** Kafka Connect version (best-effort, falls back to "N/A"). */
  get connectVersion(): string {
    return this.spec?.version || 'N/A';
  }

  /** Plugins discovered by the operator on the workers (may be empty). */
  get connectorPlugins(): ConnectorPlugin[] {
    return this.status?.connectorPlugins ?? [];
  }
}

/** KafkaConnect resource class targeting the `kafka.strimzi.io/v1` API (Strimzi 1.0.0+). */
export class KafkaConnectV1 extends KafkaConnect {
  static apiVersion = 'kafka.strimzi.io/v1';
}
