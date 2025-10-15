import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { KafkaList } from './components/KafkaList';
import { KafkaTopicList } from './components/KafkaTopicList';
import { KafkaUserList } from './components/KafkaUserList';

// Register routes
registerRoute({
  path: '/strimzi/kafkas',
  sidebar: 'strimzi',
  name: 'Kafka Clusters',
  component: () => React.createElement(KafkaList),
});

registerRoute({
  path: '/strimzi/topics',
  sidebar: 'strimzi',
  name: 'Kafka Topics',
  component: () => React.createElement(KafkaTopicList),
});

registerRoute({
  path: '/strimzi/users',
  sidebar: 'strimzi',
  name: 'Kafka Users',
  component: () => React.createElement(KafkaUserList),
});

// Register sidebar entry
registerSidebarEntry({
  parent: null,
  name: 'strimzi',
  label: 'Strimzi',
  url: '/strimzi/kafkas',
});
