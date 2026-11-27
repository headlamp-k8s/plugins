import { describe, expect, it, vi } from 'vitest';
import { nrcRouteNames, nrcRoutePaths, nrcSidebarNames } from './utils/routes';

const { recordedRoutes, recordedSidebarEntries, recordedSectionProcessors } = vi.hoisted(() => ({
  recordedRoutes: [] as any[],
  recordedSidebarEntries: [] as any[],
  recordedSectionProcessors: [] as any[],
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  registerRoute: (route: any) => recordedRoutes.push(route),
  registerSidebarEntry: (entry: any) => recordedSidebarEntries.push(entry),
  registerDetailsViewSectionsProcessor: (processor: any) =>
    recordedSectionProcessors.push(processor),
  DefaultDetailsViewSection: {
    EVENTS: 'EVENTS',
    METADATA: 'METADATA',
  },
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

vi.mock('./components/evaluations', () => ({
  EvaluationList: () => null,
  EvaluationDetails: () => null,
}));

vi.mock('./components/node-extension', () => ({
  NodeReadinessExtension: () => null,
}));

// Import the index file to trigger the registrations
import './index';

describe('node-readiness-controller plugin registration', () => {
  it('should register landing, rules, and evaluation routes', () => {
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
        expect.objectContaining({
          path: nrcRoutePaths.evaluationsList,
          name: nrcRouteNames.evaluationsList,
          sidebar: nrcSidebarNames.evaluationsList,
          exact: true,
        }),
        expect.objectContaining({
          path: nrcRoutePaths.evaluationDetail,
          name: nrcRouteNames.evaluationDetail,
          sidebar: nrcSidebarNames.evaluationsList,
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
        expect.objectContaining({
          parent: nrcSidebarNames.root,
          name: nrcSidebarNames.evaluationsList,
          label: 'Node Evaluations',
          url: nrcRoutePaths.evaluationsList,
        }),
      ])
    );
  });

  it('should register Node details view section processor', () => {
    expect(recordedSectionProcessors.length).toBeGreaterThan(0);
    const processor = recordedSectionProcessors[0];

    // Verify it adds section for Node resources
    const nodeResource = { kind: 'Node' };
    const sections: any[] = [];
    const result = processor(nodeResource, sections);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'nrc-node-readiness-lifecycle',
        }),
      ])
    );

    // Verify it positions the section directly above the EVENTS section when present
    const sectionsWithEvents: any[] = [{ id: 'METADATA' }, { id: 'EVENTS' }];
    const resultWithEvents = processor(nodeResource, sectionsWithEvents);
    expect(resultWithEvents.map((s: any) => s.id)).toEqual([
      'METADATA',
      'nrc-node-readiness-lifecycle',
      'EVENTS',
    ]);

    // Verify it ignores non-Node resources (e.g., Pod)
    const podResource = { kind: 'Pod' };
    const podSections: any[] = [];
    const resultPod = processor(podResource, podSections);
    expect(resultPod.length).toBe(0);

    // Verify it ignores NodeReadinessEvaluation custom resources
    const nreResource = {
      kind: 'NodeReadinessEvaluation',
      jsonData: { kind: 'NodeReadinessEvaluation' },
    };
    const nreSections: any[] = [];
    const resultNre = processor(nreResource, nreSections);
    expect(resultNre.length).toBe(0);

    // Verify it prevents duplicate injection if already added
    const duplicateSections: any[] = [{ id: 'nrc-node-readiness-lifecycle' }];
    const resultDup = processor(nodeResource, duplicateSections);
    expect(resultDup.length).toBe(1);
  });
});
