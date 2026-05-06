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
