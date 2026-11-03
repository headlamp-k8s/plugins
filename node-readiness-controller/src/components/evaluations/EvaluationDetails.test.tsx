/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeReadinessEvaluation } from '../../resources';
import EvaluationDetails, { getEvaluationDetailSections } from './EvaluationDetails';

const { mockDetailsGridProps, mockUseGet, mockGetAuthorization } = vi.hoisted(() => ({
  mockDetailsGridProps: vi.fn(),
  mockUseGet: vi.fn(),
  mockGetAuthorization: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: {
    ResourceClasses: {
      Node: {
        getAuthorization: mockGetAuthorization,
      },
    },
  },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/lib/k8s/crd', () => ({
  makeCustomResourceClass: vi.fn().mockImplementation(() => {
    return class MockCRD {
      jsonData: any;
      metadata: any;
      constructor(jsonData: any) {
        this.jsonData = jsonData;
        this.metadata = jsonData?.metadata;
      }
      static useGet(...args: any[]) {
        return mockUseGet(...args);
      }
    };
  }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Link: ({ children, url, routeName, params, activeCluster }: any) => (
    <a
      href={url}
      data-routename={routeName}
      data-params={JSON.stringify(params)}
      data-cluster={activeCluster}
    >
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
  beforeEach(() => {
    mockUseGet.mockReturnValue([null, null]);
    mockGetAuthorization.mockResolvedValue({ status: { allowed: true } });
  });

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
    expect(lastCall.withEvents).toBeUndefined();

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

  it('forwards activeCluster on Target Node and EvaluationRuleTable, and guards lastEvaluatedAt against missing/invalid timestamps', () => {
    const mockEval = new NodeReadinessEvaluation({
      metadata: { name: 'worker-node-04' },
      spec: { nodeName: 'worker-node-04' },
      status: {
        state: 'Available',
        rules: [
          {
            ruleName: 'rule-no-ts',
            ruleStatus: 'Satisfied',
            taintStatus: 'Absent',
          },
          {
            ruleName: 'rule-valid-ts',
            ruleStatus: 'Satisfied',
            taintStatus: 'Absent',
            lastEvaluatedAt: '2026-11-06T10:00:00Z',
          },
          {
            ruleName: 'rule-invalid-ts',
            ruleStatus: 'Satisfied',
            taintStatus: 'Absent',
            lastEvaluatedAt: 'not-a-valid-timestamp',
          },
        ],
      },
    });
    (mockEval as any).cluster = 'cluster-eu';

    const sections = getEvaluationDetailSections(mockEval);
    const targetNodeSection = sections.find(s => s.name === 'Target Node');
    const { container: nodeContainer } = render(<>{targetNodeSection?.value}</>);
    expect(nodeContainer.querySelector('a')).toHaveAttribute('data-cluster', 'cluster-eu');

    const lastEvalSection = sections.find(s => s.name === 'Last Evaluated At');
    const { container: evalTsContainer } = render(<>{lastEvalSection?.value}</>);
    expect(evalTsContainer).toHaveTextContent('2026-11-06T10:00:00Z');

    render(<EvaluationDetails />);
    const lastCall = mockDetailsGridProps.mock.calls.at(-1)?.[0];
    const extraSections = lastCall.extraSections(mockEval);
    expect(extraSections[0].section.props.activeCluster).toBe('cluster-eu');
  });

  it('shows Evaluation Pending in Rules Progress when evaluation status is pending', () => {
    const pendingEval = new NodeReadinessEvaluation({
      metadata: { name: 'worker-pending' },
      spec: { nodeName: 'worker-pending' },
    });

    const sections = getEvaluationDetailSections(pendingEval);
    const rulesProgressSection = sections.find(s => s.name === 'Rules Progress');
    const { container } = render(<>{rulesProgressSection?.value}</>);
    expect(container).toHaveTextContent('Evaluation Pending');
    expect(container).not.toHaveTextContent('Total: 0');
  });

  it('renders plain node name without link when user lacks nodes get permission', async () => {
    const mockEval = new NodeReadinessEvaluation({
      metadata: { name: 'worker-node-05' },
      spec: { nodeName: 'worker-node-05' },
      status: { state: 'Available', rules: [] },
    });
    (mockEval as any).cluster = 'restricted-cluster';

    const sections = getEvaluationDetailSections(mockEval, false);
    const targetNodeSection = sections.find(s => s.name === 'Target Node');
    const { container } = render(<>{targetNodeSection?.value}</>);
    expect(container).toHaveTextContent('worker-node-05');
    expect(container.querySelector('a')).toBeNull();

    mockUseGet.mockReturnValue([mockEval, null]);
    mockGetAuthorization.mockResolvedValue({ status: { allowed: false } });
    render(<EvaluationDetails />);

    await waitFor(() => {
      expect(mockGetAuthorization).toHaveBeenCalledWith('get', {}, 'restricted-cluster');
      expect(mockGetAuthorization).toHaveBeenCalledWith(
        'get',
        { name: 'worker-node-05' },
        'restricted-cluster'
      );
    });
  });

  it('enables Target Node link when resourceNames RBAC grants access to the target node', async () => {
    const mockEval = new NodeReadinessEvaluation({
      metadata: { name: 'worker-node-06' },
      spec: { nodeName: 'worker-node-06' },
      status: { state: 'Available', rules: [] },
    });
    (mockEval as any).cluster = 'scoped-cluster';

    mockUseGet.mockReturnValue([mockEval, null]);
    mockGetAuthorization.mockImplementation((_verb: string, attrs: any) => {
      if (attrs?.name === 'worker-node-06') {
        return Promise.resolve({ status: { allowed: true } });
      }
      return Promise.resolve({ status: { allowed: false } });
    });

    render(<EvaluationDetails />);

    await waitFor(() => {
      expect(mockGetAuthorization).toHaveBeenCalledWith(
        'get',
        { name: 'worker-node-06' },
        'scoped-cluster'
      );
    });

    const latestProps = mockDetailsGridProps.mock.calls.at(-1)?.[0];
    const sections = latestProps.extraInfo(mockEval);
    const targetNodeSection = sections.find((s: any) => s.name === 'Target Node');
    const { container } = render(<>{targetNodeSection?.value}</>);
    expect(container).toHaveTextContent('View Node (worker-node-06)');
    expect(container.querySelector('a')).toHaveAttribute('data-routename', 'node');
  });

  it('renders CrdNotInstalled when NodeReadinessEvaluation lookup fails with 404 or 403', () => {
    mockUseGet.mockReturnValue([null, { status: 404, message: 'Resource not found' }]);
    render(<EvaluationDetails />);
    expect(screen.getByText('NodeReadinessEvaluation Unavailable')).toBeInTheDocument();
    expect(screen.queryByTestId('details-grid')).not.toBeInTheDocument();

    cleanup();

    mockUseGet.mockReturnValue([null, { status: 403, message: 'Forbidden' }]);
    render(<EvaluationDetails />);
    expect(
      screen.getByText('Permission Denied: Cannot Read Node Readiness Evaluation')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('details-grid')).not.toBeInTheDocument();
  });
});
