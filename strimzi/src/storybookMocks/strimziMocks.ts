/**
 * Mock Strimzi CRs for Storybook (no cluster required).
 */
import type { KafkaInterface } from '../resources/kafka';
import type { KafkaConnectInterface } from '../resources/kafkaConnect';
import type { KafkaConnectorInterface } from '../resources/kafkaConnector';
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

export const mockKafkaConnects: KafkaConnectInterface[] = [
  {
    apiVersion: 'kafka.strimzi.io/v1beta2',
    kind: 'KafkaConnect',
    metadata: {
      name: 'analytics-connect',
      namespace: 'default',
      creationTimestamp: ts,
      uid: 'kc1',
    },
    spec: {
      replicas: 3,
      bootstrapServers: 'my-cluster-kafka-bootstrap:9092',
      version: '3.7.0',
      config: { 'group.id': 'analytics-connect-cluster' },
    },
    status: {
      conditions: [{ type: 'Ready', status: 'True', lastTransitionTime: ts }],
      url: 'http://analytics-connect-connect-api.default.svc:8083',
      replicas: 3,
      connectorPlugins: [
        { class: 'io.debezium.connector.postgresql.PostgresConnector', type: 'source', version: '2.5.0' },
        { class: 'io.confluent.connect.s3.S3SinkConnector', type: 'sink', version: '10.5.0' },
      ],
    },
  },
  {
    apiVersion: 'kafka.strimzi.io/v1beta2',
    kind: 'KafkaConnect',
    metadata: {
      name: 'edge-connect',
      namespace: 'kafka',
      creationTimestamp: ts,
      uid: 'kc2',
    },
    spec: {
      replicas: 1,
      bootstrapServers: 'kraft-only-kafka-bootstrap:9092',
    },
    status: {
      conditions: [{ type: 'Ready', status: 'False', lastTransitionTime: ts, reason: 'NotReady' }],
    },
  },
];

export const mockKafkaConnectors: KafkaConnectorInterface[] = [
  {
    apiVersion: 'kafka.strimzi.io/v1beta2',
    kind: 'KafkaConnector',
    metadata: {
      name: 'orders-cdc',
      namespace: 'default',
      creationTimestamp: ts,
      uid: 'kn1',
      labels: { 'strimzi.io/cluster': 'analytics-connect' },
    },
    spec: {
      class: 'io.debezium.connector.postgresql.PostgresConnector',
      tasksMax: 1,
      state: 'running',
      config: {
        'database.hostname': 'orders-db.default.svc',
        'database.dbname': 'orders',
        'topic.prefix': 'orders',
      },
    },
    status: {
      conditions: [{ type: 'Ready', status: 'True', lastTransitionTime: ts }],
      tasksMax: 1,
      topics: ['orders.public.line_items', 'orders.public.orders'],
      connectorStatus: {
        name: 'orders-cdc',
        type: 'source',
        connector: { state: 'RUNNING', worker_id: '10.0.0.5:8083' },
        tasks: [{ id: 0, state: 'RUNNING', worker_id: '10.0.0.5:8083' }],
      },
    },
  },
  {
    apiVersion: 'kafka.strimzi.io/v1beta2',
    kind: 'KafkaConnector',
    metadata: {
      name: 'audit-s3',
      namespace: 'default',
      creationTimestamp: ts,
      uid: 'kn2',
      labels: { 'strimzi.io/cluster': 'analytics-connect' },
    },
    spec: {
      class: 'io.confluent.connect.s3.S3SinkConnector',
      tasksMax: 2,
      state: 'paused',
      config: {
        'topics': 'audit-events',
        's3.bucket.name': 'audit-events-prod',
      },
    },
    status: {
      conditions: [{ type: 'Ready', status: 'True', lastTransitionTime: ts }],
      tasksMax: 2,
      connectorStatus: {
        name: 'audit-s3',
        type: 'sink',
        connector: { state: 'PAUSED', worker_id: '10.0.0.6:8083' },
        tasks: [
          { id: 0, state: 'PAUSED', worker_id: '10.0.0.6:8083' },
          { id: 1, state: 'PAUSED', worker_id: '10.0.0.6:8083' },
        ],
      },
    },
  },
  {
    apiVersion: 'kafka.strimzi.io/v1beta2',
    kind: 'KafkaConnector',
    metadata: {
      name: 'broken-connector',
      namespace: 'kafka',
      creationTimestamp: ts,
      uid: 'kn3',
      labels: { 'strimzi.io/cluster': 'edge-connect' },
    },
    spec: {
      class: 'org.example.NonExistentConnector',
      tasksMax: 1,
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'False',
          lastTransitionTime: ts,
          reason: 'ConnectorClassNotFound',
        },
      ],
    },
  },
];
