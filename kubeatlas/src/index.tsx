/*
 * Copyright 2026 The KubeAtlas Authors
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
  type DetailsViewSectionProps,
  registerDetailsViewSection,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import { DependencyGraphPage } from './pages/DependencyGraph';
import { DependenciesSection, isSupportedKind } from './sections/DependenciesSection';

// The plugin contributes a top-level "Dependency Graph" sidebar entry
// (the cluster-level view) and its route.
registerSidebarEntry({
  parent: null,
  name: 'kubeatlas-dependency-graph',
  label: 'Dependency Graph',
  url: '/kubeatlas',
  icon: 'mdi:graph-outline',
});

registerRoute({
  path: '/kubeatlas',
  sidebar: 'kubeatlas-dependency-graph',
  name: 'Dependency Graph',
  component: () => <DependencyGraphPage />,
});

// It also adds a "KubeAtlas Dependencies" section to the details page
// of every resource kind KubeAtlas graphs, showing that resource's
// one-hop neighbourhood. Unsupported kinds register nothing, so no
// empty section is ever shown.
registerDetailsViewSection(({ resource }: DetailsViewSectionProps) => {
  if (!resource || !isSupportedKind(resource.kind)) {
    return null;
  }
  return (
    <DependenciesSection
      kind={resource.kind}
      namespace={resource.metadata?.namespace ?? ''}
      name={resource.metadata?.name ?? ''}
    />
  );
});
