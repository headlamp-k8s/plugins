/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';

import { GameServerList } from './components/gameservers/List';
import { FleetList } from './components/fleets/List';
import { GameServerSetList } from './components/gameserversets/List';
import { FleetDetail } from './components/fleets/Detail';
import { GameServerDetail } from './components/gameservers/Detail';

console.log('🚀 Agones plugin loaded');

// --------------------
// Routes
// --------------------

registerRoute({
  path: '/agones/gameservers',
  sidebar: 'gameservers',
  name: 'GameServers',
  exact: true,
  component: GameServerList,
});

registerRoute({
  path: '/agones/fleets',
  sidebar: 'fleets',
  name: 'Fleets',
  exact: true,
  component: FleetList,
});

registerRoute({
  path: '/agones/gameserversets',
  sidebar: 'gameserversets',
  name: 'GameServerSets',
  exact: true,
  component: GameServerSetList,
});

// --------------------
// Sidebar
// --------------------

registerSidebarEntry({
  parent: null,
  name: 'agones',
  label: 'Agones',
  url: '/agones/gameservers',
  icon: 'mdi:controller-classic',
});

registerSidebarEntry({
  parent: 'agones',
  name: 'gameservers',
  label: 'GameServers',
  url: '/agones/gameservers',
});

registerSidebarEntry({
  parent: 'agones',
  name: 'fleets',
  label: 'Fleets',
  url: '/agones/fleets',
});

registerSidebarEntry({
  parent: 'agones',
  name: 'gameserversets',
  label: 'GameServerSets',
  url: '/agones/gameserversets',
});

registerRoute({
  path: '/agones/fleets/:namespace/:name',
  sidebar: 'fleets',
  name: 'agones-fleet',
  exact: true,
  component: () => <FleetDetail />,
});

registerRoute({
  path: '/agones/gameservers/:namespace/:name',
  sidebar: 'gameservers',
  name: 'agones-gameserver',
  exact: true,
  component: () => <GameServerDetail />,
});