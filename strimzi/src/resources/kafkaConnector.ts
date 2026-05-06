import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { StrimziStatus } from './common';

/**
 * Allowed states for `spec.state` (since Strimzi 0.36).
 * `pause` is the older (deprecated) boolean form.
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaConnectorSpec-reference
 */
export type KafkaConnectorState = 'running' | 'paused' | 'stopped';

/**
 * KafkaConnector custom resource spec. Only the fields rendered by the
 * plugin are typed; the rest of the connector configuration is passed
 * through as `config`.
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaConnectorSpec-reference
 */
export interface KafkaConnectorSpec {
  /** Connector class (e.g. `org.apache.kafka.connect.file.FileStreamSourceConnector`). */
  class: string;
  /** Maximum number of tasks the connector may run. */
  tasksMax?: number;
  /** Connector configuration passed to Connect (key/value pairs). */
  config?: Record<string, unknown>;
  /** Deprecated boolean pause flag; prefer `state`. */
  pause?: boolean;
  /** Desired runtime state of the connector. */
  state?: KafkaConnectorState;
  /** Auto-restart configuration. */
  autoRestart?: {
    enabled?: boolean;
    maxRestarts?: number;
  };
}

/**
 * Strimzi enriches the connector status with the Kafka Connect REST
 * representation (state, worker_id, tasks, …) under `connectorStatus`.
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaConnectorStatus-reference
 */
export interface KafkaConnectorStatus extends StrimziStatus {
  /** Effective tasksMax reported by the operator. */
  tasksMax?: number;
  /** Topics the connector is consuming from / producing to. */
  topics?: string[];
  /** Snapshot of the Connect REST API status for the connector. */
  connectorStatus?: {
    name?: string;
    type?: string;
    connector?: { state?: string; worker_id?: string };
    tasks?: Array<{ id?: number; state?: string; worker_id?: string; trace?: string }>;
  };
  /** Auto-restart counters reported by the operator. */
  autoRestart?: {
    count?: number;
    connectorName?: string;
    lastRestartTimestamp?: string;
  };
}

/**
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaConnector-reference
 */
export interface KafkaConnectorInterface extends KubeObjectInterface {
  spec: KafkaConnectorSpec;
  status?: KafkaConnectorStatus;
}

/**
 * KafkaConnector KubeObject — represents a single connector running
 * inside a `KafkaConnect` cluster. Linked to its Connect cluster via the
 * `strimzi.io/cluster` label.
 *
 * `desiredState` reflects what the user has requested in `spec`;
 * `runtimeState` reflects what the Connect REST API currently reports.
 * They can disagree briefly during a reconcile.
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaConnector-reference
 */
export class KafkaConnector extends KubeObject<KafkaConnectorInterface> {
  static apiVersion = 'kafka.strimzi.io/v1beta2';
  static kind = 'KafkaConnector';
  static apiName = 'kafkaconnectors';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/strimzi/connectors/:namespace/:name';
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

  /** Connector class from the spec. */
  get connectorClass(): string {
    return this.spec?.class ?? '';
  }

  /** Connect cluster this connector targets, taken from the `strimzi.io/cluster` label. */
  get connectClusterName(): string {
    return this.jsonData?.metadata?.labels?.['strimzi.io/cluster'] ?? '';
  }

  /** Desired state from the spec, normalised to a `KafkaConnectorState`. */
  get desiredState(): KafkaConnectorState {
    if (this.spec?.state) return this.spec.state;
    if (this.spec?.pause) return 'paused';
    return 'running';
  }

  /** Runtime state from `status.connectorStatus.connector.state`, lowercased. */
  get runtimeState(): string | undefined {
    return this.status?.connectorStatus?.connector?.state?.toLowerCase();
  }

  /** Effective max tasks (status if reported by operator, else spec). */
  get tasksMax(): number | undefined {
    return this.status?.tasksMax ?? this.spec?.tasksMax;
  }
}

/**
 * KafkaConnector resource class targeting the `kafka.strimzi.io/v1` API
 * (Strimzi 1.0.0+). In v1, `spec.pause` is removed; `spec.state` is the
 * only supported lifecycle field.
 */
export class KafkaConnectorV1 extends KafkaConnector {
  static apiVersion = 'kafka.strimzi.io/v1';

  get desiredState(): KafkaConnectorState {
    return this.spec?.state ?? 'running';
  }
}
