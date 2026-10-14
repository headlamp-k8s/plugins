import { describe, expect, it, vi } from 'vitest';
import { getRuleDetailSections } from './RuleDetails';

vi.mock('@kinvolk/headlamp-plugin/lib/lib/k8s/crd', () => ({
  makeCustomResourceClass: vi.fn().mockReturnValue(class MockCRD {}),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  DateLabel: ({ date }: { date: string }) => <span>{date}</span>,
  StatusLabel: ({ children }: any) => <span>{children}</span>,
  Resource: {
    DetailsGrid: () => null,
  },
  SectionBox: ({ children }: any) => <div>{children}</div>,
  SimpleTable: () => null,
}));

describe('NodeReadinessRuleDetails getRuleDetailSections', () => {
  it('handles a newly created dry-run rule with no status without throwing', () => {
    const mockRule = {
      jsonData: {
        spec: {
          dryRun: true,
          enforcementMode: 'continuous',
          conditionPolicy: 'allOf',
          conditions: [{ type: 'Ready', requiredStatus: 'True' }],
          nodeSelector: {},
          taint: { key: 'example.com/unready', effect: 'NoSchedule' },
        },
      },
    } as any;

    expect(() => getRuleDetailSections(mockRule)).not.toThrow();

    const sections = getRuleDetailSections(mockRule);
    const sectionNames = sections.map(s => s.name);

    expect(sectionNames).toContain('Dry-Run Simulation');
    expect(sectionNames).not.toContain('Node Status');

    const dryRunSection = sections.find(s => s.name === 'Dry-Run Simulation');
    expect(dryRunSection?.value).toBe('Pending simulation');

    const lastEvalSection = sections.find(s => s.name === 'Last Evaluated At');
    expect(lastEvalSection?.value).toBe('Not Available (Dry Run)');
  });

  it('renders simulation results as primary section for dry-run rules with results', () => {
    const mockRule = {
      jsonData: {
        spec: {
          dryRun: true,
          enforcementMode: 'continuous',
          conditionPolicy: 'allOf',
          conditions: [{ type: 'Ready', requiredStatus: 'True' }],
          nodeSelector: {},
          taint: { key: 'example.com/unready', effect: 'NoSchedule' },
        },
        status: {
          dryRunResults: {
            summary: 'Dry run completed successfully',
            affectedNodes: 5,
            taintsToAdd: 2,
            taintsToRemove: 1,
            riskyOperations: 0,
          },
        },
      },
    } as any;

    const sections = getRuleDetailSections(mockRule);
    const sectionNames = sections.map(s => s.name);

    expect(sectionNames).toContain('Dry-Run Simulation');
    expect(sectionNames).not.toContain('Node Status');

    const lastEvalSection = sections.find(s => s.name === 'Last Evaluated At');
    expect(lastEvalSection?.value).toBe('Not Available (Dry Run)');
  });

  it('renders normal Node Status counters for non-dry-run rules', () => {
    const mockRule = {
      jsonData: {
        spec: {
          dryRun: false,
          enforcementMode: 'continuous',
          conditions: [],
          taint: { key: 'example.com/unready', effect: 'NoSchedule' },
        },
        status: {
          nodeEvaluations: [
            {
              nodeName: 'node-1',
              taintStatus: 'Absent',
              lastEvaluationTime: '2026-10-14T00:00:00Z',
              conditionResults: [],
            },
          ],
          failedNodes: [],
        },
      },
    } as any;

    const sections = getRuleDetailSections(mockRule);
    const sectionNames = sections.map(s => s.name);

    expect(sectionNames).toContain('Node Status');
    expect(sectionNames).not.toContain('Dry-Run Simulation');
  });

  it('returns empty array when rule or spec is missing', () => {
    expect(getRuleDetailSections(null)).toEqual([]);
    expect(getRuleDetailSections({ jsonData: {} } as any)).toEqual([]);
  });
});
