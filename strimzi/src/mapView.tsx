import { Icon } from '@iconify/react';
import React, { useMemo } from 'react';
import { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { KafkaDetail } from './components/kafkas/Detail';
import { KafkaConnectDetail } from './components/connects/Detail';
import { KafkaConnectorDetail } from './components/connectors/Detail';
import { KafkaTopicDetail } from './components/topics/Detail';
import { KafkaUserDetail } from './components/users/Detail';
import { Kafka } from './resources/kafka';
import { KafkaConnect } from './resources/kafkaConnect';
import { KafkaConnector } from './resources/kafkaConnector';
import { KafkaTopic } from './resources/kafkaTopic';
import { KafkaUser } from './resources/kafkaUser';

const STRIMZI_BLUE = 'rgb(0, 132, 255)';
const CLUSTER_LABEL = 'strimzi.io/cluster';

type KubeLike = { metadata: { uid: string; name: string; namespace?: string; labels?: Record<string, string> } };

const makeEdge = (from: KubeLike, to: KubeLike) => ({
  id: `${from.metadata.uid}-${to.metadata.uid}`,
  source: from.metadata.uid,
  target: to.metadata.uid,
});

type DetailComponent = React.ComponentType<{ node: GraphNode }>;

/**
 * Build a `detailsComponent` for a map node that renders the existing list/detail
 * Detail page. `kubeObject` is optional on `GraphNode`, so we guard before
 * forwarding to the underlying detail component.
 */
function makeDetailsComponent(
  Detail: React.ComponentType<{ namespace?: string; name?: string }>
): DetailComponent {
  return function NodeDetails({ node }: { node: GraphNode }) {
    const meta = node.kubeObject?.jsonData?.metadata;
    if (!meta) return null;
    return <Detail namespace={meta.namespace} name={meta.name} />;
  };
}

/**
 * Find the Kafka cluster that a Strimzi child resource belongs to. Strimzi
 * stamps the `strimzi.io/cluster` label on KafkaTopic / KafkaUser / KafkaConnector
 * to mark which cluster they target. We match on (label, namespace) because
 * cluster names are only unique within a namespace.
 */
function findClusterByLabel<T extends KubeLike>(child: KubeLike, clusters: T[] | null): T | undefined {
  const clusterName = child.metadata.labels?.[CLUSTER_LABEL];
  if (!clusterName || !clusters) return undefined;
  return clusters.find(
    c => c.metadata.name === clusterName && c.metadata.namespace === child.metadata.namespace
  );
}

const kafkaIcon = <Icon icon="mdi:server-network" width="100%" height="100%" color={STRIMZI_BLUE} />;
const topicIcon = <Icon icon="mdi:file-tree" width="100%" height="100%" color={STRIMZI_BLUE} />;
const userIcon = <Icon icon="mdi:account-key" width="100%" height="100%" color={STRIMZI_BLUE} />;
const connectIcon = <Icon icon="mdi:transit-connection-variant" width="100%" height="100%" color={STRIMZI_BLUE} />;
const connectorIcon = <Icon icon="mdi:swap-horizontal" width="100%" height="100%" color={STRIMZI_BLUE} />;

/**
 * Strimzi 1.0+ retires the v1beta2 API and serves the CRDs as v1. The resource
 * classes declare both versions, so Headlamp negotiates the one the cluster
 * actually serves and the map works on old and new clusters alike.
 */
const kafkaSource = {
  id: 'strimzi-kafkas',
  label: 'Kafka clusters',
  icon: kafkaIcon,
  useData() {
    const [kafkas] = Kafka.useList();
    return useMemo(() => {
      if (!kafkas) return null;
      const KafkaNodeDetails = makeDetailsComponent(KafkaDetail);
      const nodes = kafkas.map(k => ({
        id: k.metadata.uid,
        kubeObject: k,
        weight: 3000,
        detailsComponent: KafkaNodeDetails,
      }));
      return { nodes };
    }, [kafkas]);
  },
};

const kafkaTopicSource = {
  id: 'strimzi-kafka-topics',
  label: 'Kafka topics',
  icon: topicIcon,
  useData() {
    const [topics] = KafkaTopic.useList();
    const [kafkas] = Kafka.useList();
    return useMemo(() => {
      if (!topics) return null;
      const TopicNodeDetails = makeDetailsComponent(KafkaTopicDetail);
      const nodes = topics.map(t => ({
        id: t.metadata.uid,
        kubeObject: t,
        weight: 1000,
        detailsComponent: TopicNodeDetails,
      }));

      const edges = topics
        .map(t => {
          const cluster = findClusterByLabel(t, kafkas);
          return cluster ? makeEdge(t, cluster) : null;
        })
        .filter((e): e is NonNullable<typeof e> => e !== null);

      return { nodes, edges };
    }, [topics, kafkas]);
  },
};

const kafkaUserSource = {
  id: 'strimzi-kafka-users',
  label: 'Kafka users',
  icon: userIcon,
  useData() {
    const [users] = KafkaUser.useList();
    const [kafkas] = Kafka.useList();
    return useMemo(() => {
      if (!users) return null;
      const UserNodeDetails = makeDetailsComponent(KafkaUserDetail);
      const nodes = users.map(u => ({
        id: u.metadata.uid,
        kubeObject: u,
        weight: 1000,
        detailsComponent: UserNodeDetails,
      }));

      const edges = users
        .map(u => {
          const cluster = findClusterByLabel(u, kafkas);
          return cluster ? makeEdge(u, cluster) : null;
        })
        .filter((e): e is NonNullable<typeof e> => e !== null);

      return { nodes, edges };
    }, [users, kafkas]);
  },
};

const kafkaConnectSource = {
  id: 'strimzi-kafka-connects',
  label: 'Kafka Connect clusters',
  icon: connectIcon,
  useData() {
    const [connects] = KafkaConnect.useList();
    return useMemo(() => {
      if (!connects) return null;
      const ConnectNodeDetails = makeDetailsComponent(KafkaConnectDetail);
      const nodes = connects.map(c => ({
        id: c.metadata.uid,
        kubeObject: c,
        weight: 2500,
        detailsComponent: ConnectNodeDetails,
      }));
      return { nodes };
    }, [connects]);
  },
};

const kafkaConnectorSource = {
  id: 'strimzi-kafka-connectors',
  label: 'Kafka connectors',
  icon: connectorIcon,
  useData() {
    const [connectors] = KafkaConnector.useList();
    const [connects] = KafkaConnect.useList();
    return useMemo(() => {
      if (!connectors) return null;
      const ConnectorNodeDetails = makeDetailsComponent(KafkaConnectorDetail);
      const nodes = connectors.map(c => ({
        id: c.metadata.uid,
        kubeObject: c,
        weight: 1000,
        detailsComponent: ConnectorNodeDetails,
      }));

      const edges = connectors
        .map(c => {
          const connect = findClusterByLabel(c, connects);
          return connect ? makeEdge(c, connect) : null;
        })
        .filter((e): e is NonNullable<typeof e> => e !== null);

      return { nodes, edges };
    }, [connectors, connects]);
  },
};

export const strimziSource = {
  id: 'strimzi',
  label: 'Strimzi',
  icon: kafkaIcon,
  sources: [
    kafkaSource,
    kafkaTopicSource,
    kafkaUserSource,
    kafkaConnectSource,
    kafkaConnectorSource,
  ],
};
