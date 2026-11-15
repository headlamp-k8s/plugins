import { describe, expect, it, vi } from 'vitest';
import { nrcRouteNames, nrcRoutePaths, nrcSidebarNames } from './utils/routes';

const { recordedRoutes, recordedSidebarEntries } = vi.hoisted(() => ({
  recordedRoutes: [] as any[],
  recordedSidebarEntries: [] as any[],
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  registerRoute: (route: any) => recordedRoutes.push(route),
  registerSidebarEntry: (entry: any) => recordedSidebarEntries.push(entry),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/lib/k8s/crd', () => ({
  makeCustomResourceClass: vi.fn().mockReturnValue(class MockCRD {}),
}));

vi.mock('./LandingPage', () => ({
  default: () => null,
}));

vi.mock('./components/rules', () => ({
  RuleDetails: () => null,
  RuleList: () => null,
}));

// Import the index file to trigger the registrations
import './index';

describe('node-readiness-controller plugin registration', () => {
  it('should register landing, list, and details routes', () => {
    expect(recordedRoutes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: nrcRoutePaths.overview,
          name: nrcRouteNames.overview,
          sidebar: nrcSidebarNames.overview,
          exact: true,
        }),
        expect.objectContaining({
          path: nrcRoutePaths.rulesList,
          name: nrcRouteNames.rulesList,
          sidebar: nrcSidebarNames.rulesList,
          exact: true,
        }),
        expect.objectContaining({
          path: nrcRoutePaths.ruleDetail,
          name: nrcRouteNames.ruleDetail,
          sidebar: nrcSidebarNames.rulesList,
          exact: true,
        }),
      ])
    );
  });

  it('should register all sidebar entries', () => {
    expect(recordedSidebarEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: nrcSidebarNames.root,
          label: 'Node Readiness',
          icon: 'mdi:shield-check',
          url: nrcRoutePaths.overview,
        }),
        expect.objectContaining({
          parent: nrcSidebarNames.root,
          name: nrcSidebarNames.overview,
          label: 'Overview',
          url: nrcRoutePaths.overview,
        }),
        expect.objectContaining({
          parent: nrcSidebarNames.root,
          name: nrcSidebarNames.rulesList,
          label: 'Readiness Rules',
          url: nrcRoutePaths.rulesList,
        }),
      ])
    );
  });
});
