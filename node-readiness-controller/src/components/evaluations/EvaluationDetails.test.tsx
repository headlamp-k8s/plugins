/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NodeReadinessEvaluation } from '../../resources';
import EvaluationDetails, { getEvaluationDetailSections } from './EvaluationDetails';

const mockDetailsGridProps = vi.fn();

vi.mock('@kinvolk/headlamp-plugin/lib/lib/k8s/crd', () => ({
  makeCustomResourceClass: vi.fn().mockImplementation(() => {
    return class MockCRD {
      jsonData: any;
      metadata: any;
      constructor(jsonData: any) {
        this.jsonData = jsonData;
        this.metadata = jsonData?.metadata;
      }
    };
  }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Link: ({ children, url, routeName, params }: any) => (
    <a href={url} data-routename={routeName} data-params={JSON.stringify(params)}>
      {children}
    </a>
  ),
  StatusLabel: ({ children, status }: any) => (
    <span data-testid="status-label" data-status={status}>
      {children}
    </span>
  ),
  DateLabel: ({ date }: any) => <span data-testid="date-label">{date}</span>,
  SectionBox: ({ title, children }: any) => (
    <div data-testid={`section-${title}`}>
      <h3>{title}</h3>
      {children}
    </div>
  ),
  SimpleTable: ({ columns, data }: any) => (
    <table data-testid="simple-table">
      <tbody>
        {data.map((item: any, idx: number) => (
          <tr key={idx}>
            {columns.map((col: any, colIdx: number) => (
              <td key={colIdx}>{col.getter(item)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  Resource: {
    DetailsGrid: (props: any) => {
      mockDetailsGridProps(props);
      return (
        <div data-testid="details-grid">
          <h1>{props.name}</h1>
        </div>
      );
    },
  },
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ name: 'worker-node-01' }),
}));

describe('EvaluationDetails & getEvaluationDetailSections', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('returns empty array when evaluation is null', () => {
    expect(getEvaluationDetailSections(null)).toEqual([]);
  });

  it('computes correct section items for an Available node evaluation', () => {
    const mockEval = new NodeReadinessEvaluation({
      metadata: { name: 'worker-node-01' },
      spec: { nodeName: 'worker-node-01' },
      status: {
        state: 'Available',
        rules: [
          {
            ruleName: 'rule-cni',
            ruleStatus: 'Satisfied',
            taintStatus: 'Absent',
            lastEvaluatedAt: '2026-11-06T10:00:00Z',
          },
        ],
      },
    });

    const sections = getEvaluationDetailSections(mockEval);
    const names = sections.map(s => s.name);
    expect(names).toContain('Target Node');
    expect(names).toContain('Readiness State');
    expect(names).toContain('Rules Progress');
    expect(names).toContain('Active NRC Taints');
    expect(names).toContain('Last Evaluated At');

    // Target node link
    const targetNodeSection = sections.find(s => s.name === 'Target Node');
    const { container: nodeContainer } = render(<>{targetNodeSection?.value}</>);
    expect(nodeContainer).toHaveTextContent('View Node (worker-node-01)');

    // Readiness state
    const stateSection = sections.find(s => s.name === 'Readiness State');
    const { container: stateContainer } = render(<>{stateSection?.value}</>);
    expect(stateContainer).toHaveTextContent('Available');

    // NRC taints
    const taintsSection = sections.find(s => s.name === 'Active NRC Taints');
    expect(taintsSection?.value).toBe('None');
  });

  it('displays present taints and warning status for a NotAvailable node evaluation', () => {
    const mockEval = new NodeReadinessEvaluation({
      metadata: { name: 'worker-node-02' },
      spec: { nodeName: 'worker-node-02' },
      status: {
        state: 'NotAvailable',
        rules: [
          {
            ruleName: 'rule-gpu',
            ruleStatus: 'Unsatisfied',
            taintStatus: 'Present',
            taintKey: 'example.com/gpu-unready',
            taintEffect: 'NoSchedule',
            lastEvaluatedAt: '2026-11-06T10:05:00Z',
          },
        ],
      },
    });

    const sections = getEvaluationDetailSections(mockEval);
    const stateSection = sections.find(s => s.name === 'Readiness State');
    const { container: stateContainer } = render(<>{stateSection?.value}</>);
    expect(stateContainer).toHaveTextContent('NotAvailable');

    const taintsSection = sections.find(s => s.name === 'Active NRC Taints');
    const { container: taintsContainer } = render(<>{taintsSection?.value}</>);
    expect(taintsContainer).toHaveTextContent('example.com/gpu-unready:NoSchedule');
  });

  it('de-duplicates active taints when multiple rules apply the same taint', () => {
    const mockEval = new NodeReadinessEvaluation({
      metadata: { name: 'worker-node-03' },
      status: {
        state: 'NotAvailable',
        rules: [
          {
            ruleName: 'rule-gpu-driver',
            taintStatus: 'Present',
            taintKey: 'example.com/gpu-unready',
            taintEffect: 'NoSchedule',
          },
          {
            ruleName: 'rule-gpu-firmware',
            taintStatus: 'Present',
            taintKey: 'example.com/gpu-unready',
            taintEffect: 'NoSchedule',
          },
        ],
      },
    });

    const sections = getEvaluationDetailSections(mockEval);
    const taintsSection = sections.find(s => s.name === 'Active NRC Taints');
    const { container: taintsContainer } = render(<>{taintsSection?.value}</>);
    expect(taintsContainer).toHaveTextContent('example.com/gpu-unready:NoSchedule');
    // Ensure only 1 chip was rendered for the duplicate taint
    const chips = taintsContainer.querySelectorAll('[data-testid="status-label"], .MuiChip-root');
    expect(chips.length).toBe(1);
  });

  it('renders Resource.DetailsGrid with NodeReadinessEvaluation resourceType and extraSections', () => {
    render(<EvaluationDetails />);
    expect(screen.getByTestId('details-grid')).toBeInTheDocument();
    expect(screen.getByText('worker-node-01')).toBeInTheDocument();

    const lastCall = mockDetailsGridProps.mock.calls.at(-1)?.[0];
    expect(lastCall.resourceType).toBe(NodeReadinessEvaluation);
    expect(lastCall.name).toBe('worker-node-01');

    // Test extraSections execution
    const mockEval = new NodeReadinessEvaluation({
      metadata: { name: 'worker-node-01' },
      spec: { nodeName: 'worker-node-01' },
      status: {
        rules: [
          {
            ruleName: 'rule-cni',
            ruleStatus: 'Satisfied',
            taintStatus: 'Absent',
            readinessConditions: [
              { type: 'CNIReady', currentStatus: 'True', requiredStatus: 'True' },
            ],
          },
        ],
        conditions: [
          {
            type: 'Evaluated',
            status: 'True',
            reason: 'AllRulesEvaluated',
          },
        ],
      },
    });

    const extraSections = lastCall.extraSections(mockEval);
    expect(extraSections.length).toBe(2);
    expect(extraSections[0].id).toBe('nrc-evaluation-rules');
    expect(extraSections[1].id).toBe('nrc-evaluation-conditions');
  });
});
