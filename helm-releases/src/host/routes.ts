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

import { Router } from '@kinvolk/headlamp-plugin/lib';

/**
 * Routes of the plugin.
 *
 * The paths under `/helm` belong to the app-catalog plugin, and other plugins name routes after
 * Helm too: these paths and names stay clear of them, so that the plugins can be loaded together.
 */
export const HELM_ROUTES = {
  list: { path: '/helm-releases', name: 'helm-releases-list' },
  detail: { path: '/helm-releases/:namespace/:name', name: 'helm-releases-detail' },
} as const;

/** Names of the sidebar entries. The app-catalog plugin owns `Helm` and `Releases`. */
export const HELM_SIDEBAR = {
  root: 'helm-releases',
  releases: 'helm-releases-list',
} as const;

/**
 * Resolves the URL of the releases list through Headlamp's route registry, which adds the
 * `/c/<cluster>` prefix of the selected cluster.
 *
 * @returns undefined when Headlamp cannot resolve the route, so that callers fall back to the
 * browser history instead of navigating to a wrong page.
 */
export function releaseListURL(): string | undefined {
  const url = Router.createRouteURL(HELM_ROUTES.list.name);
  // Headlamp answers `/` when a cluster route is asked for without a selected cluster.
  return url && url !== '/' ? url : undefined;
}
