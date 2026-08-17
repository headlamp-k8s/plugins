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

import type * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import ArgoNamespaceInsights from './components/namespaces/ArgoNamespaceInsights';

const {
  mockRegisterDetailsViewSectionsProcessor,
  mockRegisterRoute,
  mockRegisterSidebarEntry,
  mockRegisterSidebarEntryFilter,
  mockRegisterMapSource,
  mockRegisterKindIcon,
} = vi.hoisted(() => ({
  mockRegisterDetailsViewSectionsProcessor: vi.fn(),
  mockRegisterRoute: vi.fn(),
  mockRegisterSidebarEntry: vi.fn(),
  mockRegisterSidebarEntryFilter: vi.fn(),
  mockRegisterMapSource: vi.fn(),
  mockRegisterKindIcon: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  DefaultDetailsViewSection: {
    METADATA: 'METADATA',
  },
  registerDetailsViewSectionsProcessor: mockRegisterDetailsViewSectionsProcessor,
  registerRoute: mockRegisterRoute,
  registerSidebarEntry: mockRegisterSidebarEntry,
  registerSidebarEntryFilter: mockRegisterSidebarEntryFilter,
  registerMapSource: mockRegisterMapSource,
  registerKindIcon: mockRegisterKindIcon,
  ApiProxy: { request: vi.fn() },
  K8s: {
    cluster: {
      KubeObject: class KubeObject {
        jsonData: any;
        constructor(jsonData: any) {
          this.jsonData = jsonData;
        }
      },
    },
    ResourceClasses: {
      CustomResourceDefinition: {
        apiList: vi.fn(() => vi.fn()),
      },
    },
  },
  Utils: {
    getCluster: vi.fn(() => 'default'),
  },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  ActionButton: () => null,
  AuthVisible: ({ children }: { children: React.ReactNode }) => children,
  DetailsGrid: () => null,
  Link: ({ children }: { children: React.ReactNode }) => children,
  NameValueTable: () => null,
  ResourceListView: () => null,
  SectionBox: () => null,
  SimpleTable: () => null,
  StatusLabel: () => null,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  ConditionsTable: () => null,
}));

vi.mock('@iconify/react', () => ({
  addIcon: vi.fn(),
  Icon: () => null,
}));

vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: vi.fn() }),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ namespace: 'argocd', name: 'test-app' }),
}));

// Static import triggers the module's top-level registration calls.
// vi.mock is hoisted above this by vitest, so mocks are ready.
import './index';

describe('argocd plugin', () => {
  it('should register the application list and detail routes', () => {
    expect(mockRegisterRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/argocd/applications',
        name: 'argocd-applications-list',
        sidebar: 'argocd-applications',
        exact: true,
      })
    );

    expect(mockRegisterRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/argocd/applications/:namespace/:name',
        name: 'argocd-application-detail',
        sidebar: 'argocd-applications',
        exact: true,
      })
    );
  });

  it('should register the AppProject list and detail routes', () => {
    expect(mockRegisterRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/argocd/projects',
        name: 'argocd-projects-list',
        sidebar: 'argocd-projects',
        exact: true,
      })
    );

    expect(mockRegisterRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/argocd/projects/:namespace/:name',
        name: 'argocd-project-detail',
        sidebar: 'argocd-projects',
        exact: true,
      })
    );
  });

  it('should register sidebar entries with the Argo CD icon', () => {
    expect(mockRegisterSidebarEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'argocd',
        label: 'Argo CD',
        url: '/argocd/applications',
        icon: 'simple-icons:argo',
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

    expect(mockRegisterSidebarEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'argocd-projects',
        label: 'Projects',
        url: '/argocd/projects',
        parent: 'argocd',
      })
    );
  });

  it('should register the CRD sidebar entry filter', () => {
    expect(mockRegisterSidebarEntryFilter).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should register the namespace Argo CD insights details section', () => {
    expect(mockRegisterDetailsViewSectionsProcessor).toHaveBeenCalledWith(expect.any(Function));

    const processor = mockRegisterDetailsViewSectionsProcessor.mock.calls[0][0];
    const namespace = { kind: 'Namespace', metadata: { name: 'argocd' } };
    const processedSections = processor(namespace, [
      { id: 'MAIN_HEADER', section: null },
      { id: 'METADATA', section: null },
      { id: 'headlamp.namespace-owned-resourcequotas', section: null },
    ]);

    expect(processedSections.map((section: { id: string }) => section.id)).toEqual([
      'MAIN_HEADER',
      'METADATA',
      'argocd.namespace-gitops-insights',
      'headlamp.namespace-owned-resourcequotas',
    ]);

    const insightsSection = processedSections[2];
    expect(insightsSection.section).toMatchObject({
      type: ArgoNamespaceInsights,
      props: { resource: namespace },
    });
  });

  it('should register the Argo CD resource tree map source', () => {
    expect(mockRegisterMapSource).toHaveBeenCalledTimes(1);
    expect(mockRegisterMapSource).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'argocd-resource-tree',
        label: 'Argo CD',
      })
    );
  });

  it('should register the Application and AppProject kind icons', () => {
    expect(mockRegisterKindIcon).toHaveBeenCalledWith(
      'Application',
      expect.anything(),
      'argoproj.io'
    );
    expect(mockRegisterKindIcon).toHaveBeenCalledWith('Application', expect.anything());
    expect(mockRegisterKindIcon).toHaveBeenCalledWith(
      'AppProject',
      expect.anything(),
      'argoproj.io'
    );
    expect(mockRegisterKindIcon).toHaveBeenCalledWith('AppProject', expect.anything());
  });
});
