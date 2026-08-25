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

/**
 * Identifies which desktop distribution the plugin is running inside.
 *
 * Detection is feature based rather than name based: AKS Desktop is the only
 * host whose preload bridge exposes `registerAKSCluster`, and it also puts its
 * bundled Azure tooling (`az`, `aks-mcp`) on the process `PATH`.
 *
 * @returns Whether the plugin is running inside AKS Desktop.
 */
export function isAksDesktopHost(): boolean {
  if (typeof window === 'undefined') return false;
  const desktopApi = window.desktopApi as { registerAKSCluster?: unknown } | undefined;
  return typeof desktopApi?.registerAKSCluster === 'function';
}
