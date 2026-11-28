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
  registerDetailsViewSection,
  registerPluginSettings,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import PodConnections from './connections/PodConnections';
import Settings from './settings/Settings';
import HubbleStatus from './status/HubbleStatus';
import { hubbleRouteNames, hubbleRoutePaths } from './utils/routes';
import { PLUGIN_NAME } from './utils/settings';

registerSidebarEntry({
  parent: null,
  name: 'hubble',
  label: 'Hubble',
  icon: 'mdi:telescope',
  url: hubbleRoutePaths.status,
});

registerRoute({
  path: hubbleRoutePaths.status,
  sidebar: 'hubble',
  name: hubbleRouteNames.status,
  exact: true,
  component: () => <HubbleStatus />,
});

registerDetailsViewSection(({ resource }) => {
  if (resource?.kind !== 'Pod') {
    return null;
  }
  return (
    <PodConnections
      cluster={resource.cluster}
      namespace={resource.metadata.namespace}
      pod={resource.metadata.name}
    />
  );
});

registerPluginSettings(PLUGIN_NAME, Settings, true);
