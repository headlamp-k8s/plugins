/**
 * Mock Strimzi CRs for Storybook (no cluster required).
 */
import type { KafkaInterface } from '../resources/kafka';
import type { KafkaTopicInterface } from '../resources/kafkaTopic';
import type { KafkaUserInterface } from '../resources/kafkaUser';

const ts = '2024-01-15T10:00:00Z';

export const mockKafkaClusters: KafkaInterface[] = [
  {
    apiVersion: 'kafka.strimzi.io/v1beta2',
    kind: 'Kafka',
    metadata: {
      name: 'my-cluster',
      namespace: 'default',
      creationTimestamp: ts,
      uid: 'k1',
      resourceVersion: '1',
    },
    spec: {
      kafka: {
        version: '3.7.0',
        replicas: 3,
        listeners: [{ name: 'plain', port: 9092, type: 'internal', tls: false }],
        storage: { type: 'persistent-claim', size: '100Gi' },
      },
      zookeeper: { replicas: 3, storage: { type: 'persistent-claim', size: '10Gi' } },
    },
    status: {
      conditions: [{ type: 'Ready', status: 'True', lastTransitionTime: ts }],
    },
  },
  {
    apiVersion: 'kafka.strimzi.io/v1beta2',
    kind: 'Kafka',
    metadata: {
      name: 'kraft-only',
      namespace: 'kafka',
      creationTimestamp: ts,
      uid: 'k2',
      resourceVersion: '2',
    },
    spec: {
      kafka: {
        version: '3.8.0',
        replicas: 1,
        listeners: [{ name: 'plain', port: 9092, type: 'internal', tls: false }],
        storage: { type: 'jbod', deleteClaim: false },
      },
    },
    status: {
      conditions: [{ type: 'Ready', status: 'False', lastTransitionTime: ts, reason: 'NotReady' }],
    },
  },
];

export const mockKafkaTopics: KafkaTopicInterface[] = [
  {
    apiVersion: 'kafka.strimzi.io/v1beta2',
    kind: 'KafkaTopic',
    metadata: {
      name: 'orders',
      namespace: 'default',
      creationTimestamp: ts,
      uid: 't1',
      labels: { 'strimzi.io/cluster': 'my-cluster' },
    },
    spec: { partitions: 6, replicas: 3 },
    status: { conditions: [{ type: 'Ready', status: 'True', lastTransitionTime: ts }] },
  },
  {
    apiVersion: 'kafka.strimzi.io/v1beta2',
    kind: 'KafkaTopic',
    metadata: {
      name: 'events',
      namespace: 'kafka',
      creationTimestamp: ts,
      uid: 't2',
      labels: { 'strimzi.io/cluster': 'kraft-only' },
    },
    spec: { partitions: 3, replicas: 1 },
    status: { conditions: [{ type: 'Ready', status: 'False', lastTransitionTime: ts }] },
  },
];

export const mockKafkaUsers: KafkaUserInterface[] = [
  {
    apiVersion: 'kafka.strimzi.io/v1beta2',
    kind: 'KafkaUser',
    metadata: {
      name: 'app-producer',
      namespace: 'default',
      creationTimestamp: ts,
      uid: 'u1',
      labels: { 'strimzi.io/cluster': 'my-cluster' },
    },
    spec: {
      authentication: { type: 'scram-sha-512' },
      authorization: { type: 'simple', acls: [] },
    },
    status: { conditions: [{ type: 'Ready', status: 'True', lastTransitionTime: ts }] },
  },
  {
    apiVersion: 'kafka.strimzi.io/v1beta2',
    kind: 'KafkaUser',
    metadata: {
      name: 'tls-client',
      namespace: 'kafka',
      creationTimestamp: ts,
      uid: 'u2',
      labels: { 'strimzi.io/cluster': 'kraft-only' },
    },
    spec: {
      authentication: { type: 'tls' },
      authorization: { type: 'none' },
    },
    status: { conditions: [{ type: 'Ready', status: 'False', lastTransitionTime: ts }] },
  },
];
