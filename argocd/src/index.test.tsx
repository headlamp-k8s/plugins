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

import { describe, expect, it, vi } from 'vitest';

const { mockRegisterRoute, mockRegisterSidebarEntry } = vi.hoisted(() => ({
  mockRegisterRoute: vi.fn(),
  mockRegisterSidebarEntry: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  registerRoute: mockRegisterRoute,
  registerSidebarEntry: mockRegisterSidebarEntry,
  K8s: {
    cluster: {
      KubeObject: class KubeObject {
        jsonData: any;
        constructor(jsonData: any) {
          this.jsonData = jsonData;
        }
      },
    },
  },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  ResourceListView: () => null,
  StatusLabel: () => null,
}));

// Static import triggers the module's top-level registration calls.
// vi.mock is hoisted above this by vitest, so mocks are ready.
import './index';

describe('argocd plugin', () => {
  it('should register the /argocd/applications route and sidebar entries', () => {
    expect(mockRegisterRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/argocd/applications',
        name: 'argocd-applications-list',
        sidebar: 'argocd-applications',
        exact: true,
      })
    );

    expect(mockRegisterSidebarEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'argocd',
        label: 'Argo CD',
        url: '/argocd/applications',
        parent: null,
      })
    );

    expect(mockRegisterSidebarEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'argocd-applications',
        label: 'Applications',
        url: '/argocd/applications',
        parent: 'argocd',
      })
    );
  });
});
