/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeReadinessRule } from '../../resources';
import RuleDetails, { getRuleDetailSections } from './RuleDetails';

const { mockUseGet, mockDetailsGridProps } = vi.hoisted(() => ({
  mockUseGet: vi.fn(),
  mockDetailsGridProps: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/lib/k8s/crd', () => ({
  makeCustomResourceClass: vi.fn().mockImplementation(() => {
    return class MockCRD {
      jsonData: any;
      constructor(jsonData: any) {
        this.jsonData = jsonData;
      }
      static useGet(...args: any[]) {
        return mockUseGet(...args);
      }
    };
  }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  DateLabel: ({ date }: { date: string }) => <span>{date}</span>,
  StatusLabel: ({ children }: any) => <span>{children}</span>,
  Resource: {
    DetailsGrid: (props: any) => {
      mockDetailsGridProps(props);
      return <div data-testid="details-grid">{props.name}</div>;
    },
  },
  SectionBox: ({ title, children }: any) => (
    <div data-testid="section-box">
      {title && <h3>{title}</h3>}
      {children}
    </div>
  ),
  SimpleTable: () => null,
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ name: 'my-test-rule' }),
}));

describe('NodeReadinessRuleDetails getRuleDetailSections', () => {
  beforeEach(() => {
    mockUseGet.mockReturnValue([null, null]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  it('handles a newly created dry-run rule with no status without throwing', () => {
    const mockRule = new NodeReadinessRule({
      spec: {
        dryRun: true,
        enforcementMode: 'continuous',
        conditionPolicy: 'allOf',
        conditions: [{ type: 'Ready', requiredStatus: 'True' }],
        nodeSelector: {},
        taint: { key: 'example.com/unready', effect: 'NoSchedule' },
      },
    });

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
    const mockRule = new NodeReadinessRule({
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
    });

    const sections = getRuleDetailSections(mockRule);
    const sectionNames = sections.map(s => s.name);

    expect(sectionNames).toContain('Dry-Run Simulation');
    expect(sectionNames).not.toContain('Node Status');

    const lastEvalSection = sections.find(s => s.name === 'Last Evaluated At');
    expect(lastEvalSection?.value).toBe('Not Available (Dry Run)');
  });

  it('renders normal Node Status counters for non-dry-run rules', () => {
    const mockRule = new NodeReadinessRule({
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
    });

    const sections = getRuleDetailSections(mockRule);
    const sectionNames = sections.map(s => s.name);

    expect(sectionNames).toContain('Node Status');
    expect(sectionNames).not.toContain('Dry-Run Simulation');
  });

  it('returns empty array when rule or spec is missing', () => {
    expect(getRuleDetailSections(null)).toEqual([]);
    expect(getRuleDetailSections(new NodeReadinessRule({} as any))).toEqual([]);
  });

  it('renders CrdNotInstalled when NodeReadinessRule lookup fails with 404 or 403', () => {
    mockUseGet.mockReturnValue([null, { status: 404, message: 'Resource not found' }]);
    render(<RuleDetails />);
    expect(screen.getByText('NodeReadinessRule Unavailable')).toBeInTheDocument();
    expect(screen.queryByTestId('details-grid')).not.toBeInTheDocument();

    cleanup();

    mockUseGet.mockReturnValue([null, { status: 403, message: 'Forbidden' }]);
    render(<RuleDetails />);
    expect(
      screen.getByText('Permission Denied: Cannot Read Node Readiness Rule')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('details-grid')).not.toBeInTheDocument();
  });
});
