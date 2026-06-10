/*
 * Copyright 2026 The Kubernetes Authors
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
import { addIcon, Icon } from '@iconify/react';
import {
  registerKindIcon,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import { TinkerbellRouteWrapper } from './components/common/TinkerbellRouteWrapper';
import { HardwareList } from './components/hardware/List';
import { TinkerbellOverview } from './components/Overview';
import { TemplateList } from './components/templates/List';
import { WorkflowList } from './components/workflows/List';

addIcon('simple-icons:tinkerbell', {
  body: '<path fill="currentColor" d="M12 2a3 3 0 0 1 2.95 2.46l.12.66 4.87 2.81a2 2 0 0 1 .73 2.73l-1.26 2.18.5 2.83a2 2 0 0 1-1.63 2.31l-2.8.5-1.44 2.5a2 2 0 0 1-3.46 0l-1.44-2.5-2.8-.5a2 2 0 0 1-1.63-2.31l.5-2.83-1.26-2.18a2 2 0 0 1 .73-2.73l4.87-2.81.12-.66A3 3 0 0 1 12 2Zm0 2a1 1 0 0 0-.98.82l-.28 1.52-5.06 2.92 1.31 2.27-.55 3.1 3.08.55L11.27 18a.85.85 0 0 0 1.46 0l1.75-2.82 3.08-.55-.55-3.1 1.31-2.27-5.06-2.92-.28-1.52A1 1 0 0 0 12 4Zm0 4.5 1.06 2.15 2.37.34-1.72 1.68.41 2.36L12 13.92l-2.12 1.11.41-2.36-1.72-1.68 2.37-.34L12 8.5Z" />',
  width: 24,
  height: 24,
});

registerSidebarEntry({
  parent: null,
  name: 'tinkerbell',
  icon: 'simple-icons:tinkerbell',
  label: 'Tinkerbell',
  url: '/tinkerbell/overview',
});

registerSidebarEntry({
  parent: 'tinkerbell',
  name: 'tinkerbell-overview',
  label: 'Overview',
  url: '/tinkerbell/overview',
});

registerRoute({
  path: '/tinkerbell/overview',
  sidebar: 'tinkerbell-overview',
  component: () => (
    <TinkerbellRouteWrapper>
      <TinkerbellOverview />
    </TinkerbellRouteWrapper>
  ),
  exact: true,
  name: 'tinkerbell-overview',
});

registerSidebarEntry({
  parent: 'tinkerbell',
  name: 'tinkerbell-hardware',
  label: 'Hardware',
  url: '/tinkerbell/hardware',
});

registerRoute({
  path: '/tinkerbell/hardware',
  sidebar: 'tinkerbell-hardware',
  component: () => (
    <TinkerbellRouteWrapper>
      <HardwareList />
    </TinkerbellRouteWrapper>
  ),
  exact: true,
  name: 'tinkerbell-hardware',
});

registerSidebarEntry({
  parent: 'tinkerbell',
  name: 'tinkerbell-workflows',
  label: 'Workflows',
  url: '/tinkerbell/workflows',
});

registerRoute({
  path: '/tinkerbell/workflows',
  sidebar: 'tinkerbell-workflows',
  component: () => (
    <TinkerbellRouteWrapper>
      <WorkflowList />
    </TinkerbellRouteWrapper>
  ),
  exact: true,
  name: 'tinkerbell-workflows',
});

registerSidebarEntry({
  parent: 'tinkerbell',
  name: 'tinkerbell-templates',
  label: 'Templates',
  url: '/tinkerbell/templates',
});

registerRoute({
  path: '/tinkerbell/templates',
  sidebar: 'tinkerbell-templates',
  component: () => (
    <TinkerbellRouteWrapper>
      <TemplateList />
    </TinkerbellRouteWrapper>
  ),
  exact: true,
  name: 'tinkerbell-templates',
});

registerKindIcon('Hardware', {
  icon: <Icon icon="mdi:server" width="70%" height="70%" />,
  color: 'rgb(50, 108, 229)',
});

registerKindIcon('Workflow', {
  icon: <Icon icon="mdi:transit-connection-variant" width="70%" height="70%" />,
  color: 'rgb(50, 108, 229)',
});

registerKindIcon('Template', {
  icon: <Icon icon="mdi:file-document-outline" width="70%" height="70%" />,
  color: 'rgb(50, 108, 229)',
});
