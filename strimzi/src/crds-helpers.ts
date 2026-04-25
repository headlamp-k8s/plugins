/**
 * CRD helper functions with minimal types so that tests can import
 * without loading resource classes (and thus @kinvolk/headlamp-plugin).
 * Re-exported from crds.ts for backward compatibility.
 */

/**
 * Minimal type for resources that have status.conditions (e.g. Ready).
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaStatus-reference
 */
export interface ReadyConditionResource {
  status?: {
    conditions?: Array<{ type: string; status: string }>;
  };
}

/**
 * Minimal type for Kafka-like resources (spec.zookeeper, status.conditions).
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-Kafka-reference
 */
export interface KafkaLike {
  spec?: { zookeeper?: unknown };
  status?: {
    conditions?: Array<{ type: string; status: string }>;
  };
}

export function isKafkaReady(kafka: ReadyConditionResource): boolean {
  const condition = kafka.status?.conditions?.find(c => c.type === 'Ready');
  return condition?.status === 'True';
}

export function isTopicReady(topic: ReadyConditionResource): boolean {
  const condition = topic.status?.conditions?.find(c => c.type === 'Ready');
  return condition?.status === 'True';
}

export function isUserReady(user: ReadyConditionResource): boolean {
  const condition = user.status?.conditions?.find(c => c.type === 'Ready');
  return condition?.status === 'True';
}

export function isConnectReady(connect: ReadyConditionResource): boolean {
  const condition = connect.status?.conditions?.find(c => c.type === 'Ready');
  return condition?.status === 'True';
}

/**
 * Minimal type for KafkaConnector-like resources, decoupled from the
 * resource class so tests can import without `@kinvolk/headlamp-plugin`.
 * @see https://strimzi.io/docs/operators/latest/full/configuring.html#type-KafkaConnectorSpec-reference
 */
export interface KafkaConnectorLike {
  spec?: {
    pause?: boolean;
    state?: 'running' | 'paused' | 'stopped';
  };
}

/**
 * Returns true if the connector spec requests the `paused` state, either
 * via the modern `state: paused` field or the deprecated `pause: true`
 * boolean. The two are mutually exclusive in practice; if both are set,
 * `state` wins (matching the operator's precedence).
 */
export function isConnectorPaused(connector: KafkaConnectorLike): boolean {
  if (connector.spec?.state) return connector.spec.state === 'paused';
  return connector.spec?.pause === true;
}

/**
 * Resolves the desired runtime state of a connector from its spec,
 * normalising the deprecated `pause: true` shorthand to `'paused'`.
 * Defaults to `'running'` when neither field is set.
 */
export function getConnectorDesiredState(
  connector: KafkaConnectorLike
): 'running' | 'paused' | 'stopped' {
  if (connector.spec?.state) return connector.spec.state;
  if (connector.spec?.pause) return 'paused';
  return 'running';
}

export function isKRaftMode(kafka: KafkaLike): boolean {
  return !kafka.spec?.zookeeper;
}

export function getClusterMode(kafka: KafkaLike): 'KRaft' | 'ZooKeeper' {
  return isKRaftMode(kafka) ? 'KRaft' : 'ZooKeeper';
}
