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
import { OTelOverlay } from './pages/OTelOverlay';
import { PolicyView } from './pages/PolicyView';
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

// A sibling "Policies" view: Gatekeeper Constraints / Kyverno policies
// and the resources they enforce.
registerSidebarEntry({
  parent: null,
  name: 'kubeatlas-policy',
  label: 'Policies',
  url: '/kubeatlas-policy',
  icon: 'mdi:shield-check-outline',
});

registerRoute({
  path: '/kubeatlas-policy',
  sidebar: 'kubeatlas-policy',
  name: 'Policies',
  component: () => <PolicyView />,
});

// A "OTel Overlay" view (F-204, KubeAtlas v1.5): the observed runtime
// call topology inferred from OpenTelemetry traces, plus a recent-trace
// strip that links out to Jaeger/Tempo. Requires a Tier 2 KubeAtlas with
// otel.enabled; on any other server the view surfaces a clear message.
registerSidebarEntry({
  parent: null,
  name: 'kubeatlas-otel',
  label: 'OTel Overlay',
  url: '/kubeatlas-otel',
  icon: 'mdi:transit-connection-variant',
});

registerRoute({
  path: '/kubeatlas-otel',
  sidebar: 'kubeatlas-otel',
  name: 'OTel Overlay',
  component: () => <OTelOverlay />,
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
