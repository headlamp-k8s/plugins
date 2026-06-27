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

import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { BareMetalHostDetail } from './BareMetalHost/Details';
import { BareMetalHosts } from './BareMetalHost/List';

registerSidebarEntry({
  parent: null,
  name: 'metal3',
  icon: 'mdi:server',
  label: 'Metal3',
  url: '/metal3/baremetalhosts',
});

// List route. Marked exact so it does not also match the detail path below.
registerRoute({
  path: '/metal3/baremetalhosts',
  sidebar: 'metal3',
  component: BareMetalHosts,
  name: 'baremetalhosts-list',
  exact: true,
});

// Detail route. Its name matches the class's detailsRoute; :namespace and :name
// are populated from the resource's metadata.
registerRoute({
  path: '/metal3/baremetalhosts/:namespace/:name',
  sidebar: 'metal3',
  component: () => <BareMetalHostDetail />,
  name: 'baremetalhost-detail',
});
