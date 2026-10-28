import { describe, expect, it, vi } from 'vitest';
import { nrcRoutePaths, nrcSidebarNames } from './utils/routes';

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

vi.mock('./components/rules', () => ({
  RuleDetails: () => null,
  RuleList: () => null,
}));

// Import the index file to trigger the registrations
import './index';

describe('node-readiness-controller plugin registration', () => {
  it('should register the list and details routes', () => {
    expect(recordedRoutes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: nrcRoutePaths.rulesList,
          name: 'Readiness Rules',
          sidebar: nrcSidebarNames.rulesList,
          exact: true,
        }),
        expect.objectContaining({
          path: nrcRoutePaths.ruleDetail,
          name: 'nrc-rule-details',
          sidebar: nrcSidebarNames.rulesList,
          exact: true,
        }),
      ])
    );
  });

  it('should register both sidebar entries', () => {
    expect(recordedSidebarEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: nrcSidebarNames.root,
          label: 'Node Readiness',
          icon: 'mdi:shield-check',
          url: nrcRoutePaths.rulesList,
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
