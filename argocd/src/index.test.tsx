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
  mockApiList,
  mockRegisterDetailsViewSectionsProcessor,
  mockRegisterKindIcon,
  mockRegisterMapSource,
  mockRegisterProjectDetailsTab,
  mockRegisterProjectOverviewSection,
  mockRegisterRoute,
  mockRegisterSidebarEntry,
  mockRegisterSidebarEntryFilter,
} = vi.hoisted(() => ({
  mockApiList: vi.fn(() => vi.fn()),
  mockRegisterDetailsViewSectionsProcessor: vi.fn(),
  mockRegisterKindIcon: vi.fn(),
  mockRegisterMapSource: vi.fn(),
  mockRegisterProjectDetailsTab: vi.fn(),
  mockRegisterProjectOverviewSection: vi.fn(),
  mockRegisterRoute: vi.fn(),
  mockRegisterSidebarEntry: vi.fn(),
  mockRegisterSidebarEntryFilter: vi.fn(),
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
  registerProjectDetailsTab: mockRegisterProjectDetailsTab,
  registerProjectOverviewSection: mockRegisterProjectOverviewSection,
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
        apiList: mockApiList,
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

  it('should register the ApplicationSet list and detail routes', () => {
    expect(mockRegisterRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/argocd/applicationsets',
        name: 'argocd-applicationsets-list',
        sidebar: 'argocd-applicationsets',
        exact: true,
      })
    );
    expect(mockRegisterRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/argocd/applicationsets/:namespace/:name',
        name: 'argocd-applicationset-detail',
        sidebar: 'argocd-applicationsets',
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

    expect(mockRegisterSidebarEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'argocd-applicationsets',
        label: 'ApplicationSets',
        url: '/argocd/applicationsets',
        parent: 'argocd',
        icon: 'simple-icons:argo',
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

  it('hides only entries whose exact CRD is missing', () => {
    const filter = mockRegisterSidebarEntryFilter.mock.calls[0][0];
    const applications = { name: 'argocd-applications', parent: 'argocd' };
    const applicationSets = { name: 'argocd-applicationsets', parent: 'argocd' };

    expect(filter(applications)).toBe(applications);
    const success = (mockApiList.mock.calls as any)[0][0] as (crds: unknown[]) => void;
    success([{ jsonData: { metadata: { name: 'applications.argoproj.io' } } }]);

    expect(filter(applications)).toBe(applications);
    expect(filter(applicationSets)).toBeNull();
  });

  it('keeps an ApplicationSet-only installation usable', () => {
    const filter = mockRegisterSidebarEntryFilter.mock.calls[0][0];
    const success = (mockApiList.mock.calls as any)[0][0] as (crds: unknown[]) => void;
    success([{ jsonData: { metadata: { name: 'applicationsets.argoproj.io' } } }]);

    expect(filter({ name: 'argocd', parent: null, url: '/argocd/applications' })).toEqual(
      expect.objectContaining({ url: '/argocd/applicationsets' })
    );
    expect(filter({ name: 'argocd-applications', parent: 'argocd' })).toBeNull();
    expect(filter({ name: 'argocd-applicationsets', parent: 'argocd' })).not.toBeNull();
  });

  it('keeps Argo CD navigation visible when CRD discovery is forbidden', () => {
    const filter = mockRegisterSidebarEntryFilter.mock.calls[0][0];
    const failure = (mockApiList.mock.calls as any)[0][1] as () => void;
    failure();

    const parent = { name: 'argocd', parent: null, url: '/argocd/applications' };
    const applications = { name: 'argocd-applications', parent: 'argocd' };
    const projects = { name: 'argocd-projects', parent: 'argocd' };
    const applicationSets = { name: 'argocd-applicationsets', parent: 'argocd' };

    expect(filter(parent)).toBe(parent);
    expect(filter(applications)).toBe(applications);
    expect(filter(projects)).toBe(projects);
    expect(filter(applicationSets)).toBe(applicationSets);
  });

  it('registers the Project integrations exactly once', () => {
    expect(mockRegisterProjectOverviewSection).toHaveBeenCalledTimes(1);
    expect(mockRegisterProjectOverviewSection).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'argocd.project-overview' })
    );
    expect(mockRegisterProjectDetailsTab).toHaveBeenCalledTimes(1);
    expect(mockRegisterProjectDetailsTab).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'argocd.project-applications',
        label: 'Argo CD Applications',
        icon: 'simple-icons:argo',
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

  it('registers group-specific and fallback ApplicationSet icons', () => {
    expect(mockRegisterKindIcon).toHaveBeenCalledWith(
      'ApplicationSet',
      expect.objectContaining({ color: '#EF7B4D' }),
      'argoproj.io'
    );
    expect(mockRegisterKindIcon).toHaveBeenCalledWith(
      'ApplicationSet',
      expect.objectContaining({ color: '#EF7B4D' })
    );
  });
});
