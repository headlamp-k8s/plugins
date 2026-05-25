import {
  registerKindIcon,
  registerMapSource,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import { Icon } from '@iconify/react';
import React from 'react';
import { KafkaDetail } from './components/kafkas/Detail';
import { KafkaList } from './components/KafkaList';
import { KafkaTopicDetail } from './components/topics/Detail';
import { KafkaTopicList } from './components/KafkaTopicList';
import { KafkaUserDetail } from './components/users/Detail';
import { KafkaUserList } from './components/KafkaUserList';
import { KafkaConnectDetail } from './components/connects/Detail';
import { KafkaConnectList } from './components/KafkaConnectList';
import { KafkaConnectorDetail } from './components/connectors/Detail';
import { KafkaConnectorList } from './components/KafkaConnectorList';
import { StrimziErrorBoundary } from './components/StrimziErrorBoundary';
import { strimziSource } from './mapView';

/**
 * Wraps a component in StrimziErrorBoundary so that any uncaught render
 * error inside the plugin is contained here and never propagates up to
 * Headlamp's root React tree.
 */
function safe(Component: React.ComponentType): () => React.ReactElement {
  function SafeWrapper(): React.ReactElement {
    return React.createElement(StrimziErrorBoundary, null, React.createElement(Component));
  }
  SafeWrapper.displayName = `Safe(${Component.displayName ?? Component.name})`;
  return SafeWrapper;
}

// List routes
registerRoute({
  path: '/strimzi/kafkas',
  sidebar: 'kafkas',
  name: 'Kafka Clusters',
  exact: true,
  component: safe(KafkaList),
});

registerRoute({
  path: '/strimzi/topics',
  sidebar: 'topics',
  name: 'Kafka Topics',
  exact: true,
  component: safe(KafkaTopicList),
});

registerRoute({
  path: '/strimzi/users',
  sidebar: 'users',
  name: 'Kafka Users',
  exact: true,
  component: safe(KafkaUserList),
});

registerRoute({
  path: '/strimzi/connects',
  sidebar: 'connects',
  name: 'Kafka Connect Clusters',
  exact: true,
  component: safe(KafkaConnectList),
});

registerRoute({
  path: '/strimzi/connectors',
  sidebar: 'connectors',
  name: 'Kafka Connectors',
  exact: true,
  component: safe(KafkaConnectorList),
});

// Detail routes (used by ResourceListView name link and direct navigation)
registerRoute({
  path: '/strimzi/kafkas/:namespace/:name',
  sidebar: 'kafkas',
  name: 'Kafka Cluster',
  exact: true,
  component: safe(KafkaDetail),
});

registerRoute({
  path: '/strimzi/topics/:namespace/:name',
  sidebar: 'topics',
  name: 'Kafka Topic',
  exact: true,
  component: safe(KafkaTopicDetail),
});

registerRoute({
  path: '/strimzi/users/:namespace/:name',
  sidebar: 'users',
  name: 'Kafka User',
  exact: true,
  component: safe(KafkaUserDetail),
});

registerRoute({
  path: '/strimzi/connects/:namespace/:name',
  sidebar: 'connects',
  name: 'Kafka Connect Cluster',
  exact: true,
  component: safe(KafkaConnectDetail),
});

registerRoute({
  path: '/strimzi/connectors/:namespace/:name',
  sidebar: 'connectors',
  name: 'Kafka Connector',
  exact: true,
  component: safe(KafkaConnectorDetail),
});

// Register sidebar entries
registerSidebarEntry({
  parent: null,
  name: 'strimzi',
  label: 'Strimzi',
  url: '/strimzi/kafkas',
  icon: 'streamline-ultimate:share',
});

registerSidebarEntry({
  parent: 'strimzi',
  name: 'kafkas',
  label: 'Kafka Clusters',
  url: '/strimzi/kafkas',
});

registerSidebarEntry({
  parent: 'strimzi',
  name: 'topics',
  label: 'Kafka Topics',
  url: '/strimzi/topics',
});

registerSidebarEntry({
  parent: 'strimzi',
  name: 'users',
  label: 'Kafka Users',
  url: '/strimzi/users',
});

registerSidebarEntry({
  parent: 'strimzi',
  name: 'connects',
  label: 'Kafka Connect',
  url: '/strimzi/connects',
});

registerSidebarEntry({
  parent: 'strimzi',
  name: 'connectors',
  label: 'Kafka Connectors',
  url: '/strimzi/connectors',
});

// Register Strimzi resources as nodes on Headlamp's Map view, with edges
// connecting topics/users/connectors to the Kafka cluster they target.
registerMapSource(strimziSource);

const STRIMZI_BLUE = 'rgb(0, 132, 255)';

registerKindIcon('Kafka', {
  icon: <Icon icon="mdi:server-network" width="70%" height="70%" />,
  color: STRIMZI_BLUE,
});

registerKindIcon('KafkaTopic', {
  icon: <Icon icon="mdi:file-tree" width="70%" height="70%" />,
  color: STRIMZI_BLUE,
});

registerKindIcon('KafkaUser', {
  icon: <Icon icon="mdi:account-key" width="70%" height="70%" />,
  color: STRIMZI_BLUE,
});

registerKindIcon('KafkaConnect', {
  icon: <Icon icon="mdi:transit-connection-variant" width="70%" height="70%" />,
  color: STRIMZI_BLUE,
});

registerKindIcon('KafkaConnector', {
  icon: <Icon icon="mdi:swap-horizontal" width="70%" height="70%" />,
  color: STRIMZI_BLUE,
});
