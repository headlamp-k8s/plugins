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

import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { ReleaseDetail } from '../components/ReleaseDetail';
import { ReleaseList } from '../components/ReleaseList';
import { HELM_ROUTES, HELM_SIDEBAR } from './routes';

/** Registers the "Helm > Releases" menu and its two read-only pages. */
export function registerHelmReleasesPlugin(): void {
  registerSidebarEntry({
    parent: null,
    name: HELM_SIDEBAR.root,
    label: 'Helm',
    url: HELM_ROUTES.list.path,
    icon: 'mdi:ship-wheel',
  });

  registerSidebarEntry({
    parent: HELM_SIDEBAR.root,
    name: HELM_SIDEBAR.releases,
    label: 'Releases',
    url: HELM_ROUTES.list.path,
  });

  // Headlamp evaluates plugin routes in registration order: the most specific one comes first.
  registerRoute({
    path: HELM_ROUTES.detail.path,
    sidebar: HELM_SIDEBAR.releases,
    name: HELM_ROUTES.detail.name,
    exact: true,
    component: ReleaseDetail,
  });

  registerRoute({
    path: HELM_ROUTES.list.path,
    sidebar: HELM_SIDEBAR.releases,
    name: HELM_ROUTES.list.name,
    exact: true,
    component: ReleaseList,
  });
}
