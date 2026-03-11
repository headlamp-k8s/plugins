/**
 * CRD helper functions with minimal types so that tests can import
 * without loading resource classes (and thus @kinvolk/headlamp-plugin).
 * Re-exported from crds.ts for backward compatibility.
 */

export interface ReadyConditionResource {
  status?: {
    conditions?: Array<{ type: string; status: string }>;
  };
}

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

export function isKRaftMode(kafka: KafkaLike): boolean {
  return !kafka.spec?.zookeeper;
}

export function getClusterMode(kafka: KafkaLike): 'KRaft' | 'ZooKeeper' {
  return isKRaftMode(kafka) ? 'KRaft' : 'ZooKeeper';
}
