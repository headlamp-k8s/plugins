// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Angelo Cesaro

import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { KafkaList } from './components/KafkaList';
import { KafkaTopicList } from './components/KafkaTopicList';
import { KafkaUserList } from './components/KafkaUserList';

// Register routes
registerRoute({
  path: '/strimzi/kafkas',
  sidebar: 'kafkas',
  name: 'Kafka Clusters',
  exact: true,
  component: () => React.createElement(KafkaList),
});

registerRoute({
  path: '/strimzi/topics',
  sidebar: 'topics',
  name: 'Kafka Topics',
  exact: true,
  component: () => React.createElement(KafkaTopicList),
});

registerRoute({
  path: '/strimzi/users',
  sidebar: 'users',
  name: 'Kafka Users',
  exact: true,
  component: () => React.createElement(KafkaUserList),
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
