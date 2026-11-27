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

import {
  K8s,
  registerRoute,
  registerSidebarEntry,
  registerSidebarEntryFilter,
  Router,
  useTranslation,
  Utils,
} from '@kinvolk/headlamp-plugin/lib';
import { EmptyContent, Loader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { type ComponentType, useEffect, useState } from 'react';
import { matchPath } from 'react-router-dom';
import { discoverExtensions } from './extensionDiscovery';
import {
  SandboxClaimDetail,
  SandboxClaimList,
  SandboxDetail,
  SandboxList,
  SandboxTemplateDetail,
  SandboxTemplateList,
  SandboxWarmPoolDetail,
  SandboxWarmPoolList,
} from './pages';

const rootEntry = {
  name: 'agent-sandbox',
  label: 'Agent Sandbox',
  url: '/agent-sandbox/sandboxes',
  icon: 'mdi:robot-outline',
  parent: '',
};

const sandboxListRoute = 'agent-sandbox-sandboxes';

const resources = [
  {
    name: sandboxListRoute,
    label: 'Sandboxes',
    path: 'sandboxes',
    list: SandboxList,
    detail: SandboxDetail,
    detailName: 'agent-sandbox-sandbox',
  },
  {
    name: 'agent-sandbox-claims',
    label: 'Sandbox Claims',
    extension: 'sandboxclaims',
    path: 'claims',
    list: SandboxClaimList,
    detail: SandboxClaimDetail,
    detailName: 'agent-sandbox-claim',
  },
  {
    name: 'agent-sandbox-warmpools',
    label: 'Sandbox WarmPools',
    extension: 'sandboxwarmpools',
    path: 'warmpools',
    list: SandboxWarmPoolList,
    detail: SandboxWarmPoolDetail,
    detailName: 'agent-sandbox-warmpool',
  },
  {
    name: 'agent-sandbox-templates',
    label: 'Sandbox Templates',
    extension: 'sandboxtemplates',
    path: 'templates',
    list: SandboxTemplateList,
    detail: SandboxTemplateDetail,
    detailName: 'agent-sandbox-template',
  },
];

interface ClusterDiscovery {
  selection: string;
  resources: ReadonlySet<string> | null;
}

function clusterSelection(clusters: string[]) {
  return [...clusters].sort().join('+');
}

// The sidebar filter runs outside the page's React tree.
let sidebarDiscovery: ClusterDiscovery | undefined;

registerSidebarEntryFilter(entry => {
  if (entry.parent !== rootEntry.name) return entry;

  const extension = resources.find(resource => resource.name === entry.name)?.extension;
  if (!extension) return entry;

  // Headlamp resolves the full cluster group for both web and desktop routes.
  const route = Router.createRouteURL(sandboxListRoute);
  const match = matchPath<{ cluster: string }>(route, Utils.getClusterPrefixedPath());
  return match &&
    sidebarDiscovery?.selection === clusterSelection(match.params.cluster.split('+')) &&
    sidebarDiscovery.resources?.has(extension)
    ? entry
    : null;
});

function withDiscovery(Component: ComponentType, extension?: string) {
  return function AgentSandboxPage() {
    const selection = clusterSelection(K8s.useSelectedClusters());
    const { t, ready } = useTranslation();
    const [discovery, setDiscovery] = useState<ClusterDiscovery>();

    useEffect(() => {
      setDiscovery(undefined);
      if (!selection) return;

      let current = true;
      const publish = (resourceNames: ReadonlySet<string> | null) => {
        if (!current) return;
        const result = { selection, resources: resourceNames };
        sidebarDiscovery = result;
        setDiscovery(result);
        // Refresh the filtered sidebar after asynchronous discovery completes.
        registerSidebarEntry(rootEntry);
      };

      Promise.all(selection.split('+').map(discoverExtensions)).then(
        discovered => {
          // Lists query all selected clusters, so only show resources common to them.
          const available = [...discovered[0]].filter(name =>
            discovered.every(names => names.has(name))
          );
          publish(new Set(available));
        },
        () => publish(null)
      );

      return () => {
        current = false;
      };
    }, [selection]);

    if (extension) {
      if (!ready || (selection && discovery?.selection !== selection)) {
        return <Loader title="" />;
      }
      if (discovery?.resources === null) {
        return <EmptyContent>{t('Could not discover Agent Sandbox extensions.')}</EmptyContent>;
      }
      if (!selection || !discovery?.resources?.has(extension)) {
        return (
          <EmptyContent>
            {t('This extension is unavailable in the selected clusters.')}
          </EmptyContent>
        );
      }
    }

    return <Component />;
  };
}

registerSidebarEntry(rootEntry);

for (const resource of resources) {
  registerSidebarEntry({
    name: resource.name,
    label: resource.label,
    url: `/agent-sandbox/${resource.path}`,
    parent: rootEntry.name,
  });

  registerRoute({
    path: `/agent-sandbox/${resource.path}`,
    sidebar: resource.name,
    name: resource.name,
    exact: true,
    component: withDiscovery(resource.list, resource.extension),
  });

  registerRoute({
    path: `/agent-sandbox/${resource.path}/:namespace/:name`,
    sidebar: resource.name,
    name: resource.detailName,
    exact: true,
    component: withDiscovery(resource.detail, resource.extension),
  });
}
