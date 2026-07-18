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

import {
  registerMapSource,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import { BareMetalHostDetail } from './BareMetalHost/Details';
import { BareMetalHosts } from './BareMetalHost/List';
import { metal3Source } from './mapView';
import { Metal3MachineDetail } from './Metal3Machine/Details';
import { Metal3Machines } from './Metal3Machine/List';
import { Metal3MachineTemplateDetail } from './Metal3MachineTemplate/Details';
import { Metal3MachineTemplates } from './Metal3MachineTemplate/List';

// Parent Metal3 group. Its url points at the first child's list so the group
// header is itself navigable.
registerSidebarEntry({
  parent: null,
  name: 'metal3',
  icon: 'mdi:server',
  label: 'Metal3',
  url: '/metal3/baremetalhosts',
});

registerSidebarEntry({
  parent: 'metal3',
  name: 'baremetalhosts',
  label: 'Bare Metal Hosts',
  url: '/metal3/baremetalhosts',
});

// List route. Marked exact so it does not also match the detail path below.
registerRoute({
  path: '/metal3/baremetalhosts',
  sidebar: 'baremetalhosts',
  component: BareMetalHosts,
  name: 'baremetalhosts-list',
  exact: true,
});

// Detail route. Its name matches the class's detailsRoute; :namespace and :name
// are populated from the resource's metadata.
registerRoute({
  path: '/metal3/baremetalhosts/:namespace/:name',
  sidebar: 'baremetalhosts',
  component: () => <BareMetalHostDetail />,
  name: 'baremetalhost-detail',
});

registerSidebarEntry({
  parent: 'metal3',
  name: 'metal3machines',
  label: 'Metal3 Machines',
  url: '/metal3/metal3machines',
});

registerRoute({
  path: '/metal3/metal3machines',
  sidebar: 'metal3machines',
  component: Metal3Machines,
  name: 'metal3machines-list',
  exact: true,
});

registerRoute({
  path: '/metal3/metal3machines/:namespace/:name',
  sidebar: 'metal3machines',
  component: () => <Metal3MachineDetail />,
  name: 'metal3machine-detail',
});

registerSidebarEntry({
  parent: 'metal3',
  name: 'metal3machinetemplates',
  label: 'Metal3 Machine Templates',
  url: '/metal3/metal3machinetemplates',
});

registerRoute({
  path: '/metal3/metal3machinetemplates',
  sidebar: 'metal3machinetemplates',
  component: Metal3MachineTemplates,
  name: 'metal3machinetemplates-list',
  exact: true,
});

registerRoute({
  path: '/metal3/metal3machinetemplates/:namespace/:name',
  sidebar: 'metal3machinetemplates',
  component: () => <Metal3MachineTemplateDetail />,
  name: 'metal3machinetemplate-detail',
});

// Map source. Draws the Metal3Machine to BareMetalHost link and the Cluster API
// Machine to Metal3Machine link, neither of which Headlamp derives on its own.
registerMapSource(metal3Source);
