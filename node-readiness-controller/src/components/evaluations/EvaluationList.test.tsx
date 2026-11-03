/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EvaluationList from './EvaluationList';

const { mockResourceListViewProps, mockUseList, mockGetAuthorization } = vi.hoisted(() => ({
  mockResourceListViewProps: vi.fn(),
  mockUseList: vi.fn(),
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
  makeCustomResourceClass: vi.fn().mockReturnValue(
    class MockCRD {
      static useList(...args: any[]) {
        return mockUseList(...args);
      }
    }
  ),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  useThrottle: (value: any) => value,
  Link: ({ children, routeName, url, params, activeCluster }: any) => (
    <a
      href={`#${routeName || url || 'test'}`}
      data-routename={routeName}
      data-url={url}
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
  SectionBox: ({ title, children }: any) => (
    <div data-testid="section-box">
      <h2>{title}</h2>
      {children}
    </div>
  ),
  ResourceListView: (props: any) => {
    mockResourceListViewProps(props);
    return (
      <div data-testid="resource-list-view">
        <h1>{props.title}</h1>
      </div>
    );
  },
}));

describe('EvaluationList component', () => {
  beforeEach(() => {
    mockUseList.mockReturnValue([[], null]);
    mockGetAuthorization.mockResolvedValue({ status: { allowed: true } });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders ResourceListView with correct title and resourceClass', () => {
    render(<EvaluationList />);

    expect(screen.getByTestId('resource-list-view')).toBeInTheDocument();
    expect(screen.getByText('Node Readiness Evaluations')).toBeInTheDocument();

    const lastCall = mockResourceListViewProps.mock.calls.at(-1)?.[0];
    expect(lastCall).toBeDefined();
    expect(lastCall.title).toBe('Node Readiness Evaluations');
    expect(lastCall.id).toBe('nrc-node-evaluations');
    expect(lastCall.data).toBeDefined();
    expect(lastCall.enableRowActions).toBe(false);
    expect(lastCall.enableRowSelection).toBe(false);
  });

  it('configures expected columns', () => {
    render(<EvaluationList />);
    const lastCall = mockResourceListViewProps.mock.calls.at(-1)?.[0];
    const columnIds = lastCall.columns.map((c: any) => (typeof c === 'string' ? c : c.id));

    expect(columnIds).toEqual(['name', 'state', 'rulesStatus', 'activeTaints', 'age']);
  });

  it('correctly extracts and renders name column with RBAC-gated View Node links scoped per cluster', async () => {
    const mockEvalClusterA = {
      metadata: { name: 'worker-node-01' },
      nodeName: 'worker-node-01',
      cluster: 'prod-east',
    } as any;

    const mockEvalClusterA2 = {
      metadata: { name: 'worker-node-02' },
      nodeName: 'worker-node-02',
      cluster: 'prod-east',
    } as any;

    const mockEvalClusterB = {
      metadata: { name: 'worker-node-01' },
      nodeName: 'worker-node-01',
      cluster: 'staging-west',
    } as any;

    mockUseList.mockReturnValue([[mockEvalClusterA, mockEvalClusterA2, mockEvalClusterB], null]);

    render(<EvaluationList />);

    await waitFor(() => {
      expect(mockGetAuthorization).toHaveBeenCalledTimes(2);
    });
    expect(mockGetAuthorization).toHaveBeenCalledWith('get', {}, 'prod-east');
    expect(mockGetAuthorization).toHaveBeenCalledWith('get', {}, 'staging-west');

    const lastCall = mockResourceListViewProps.mock.calls.at(-1)?.[0];
    const nameColumn = lastCall.columns.find((c: any) => c.id === 'name');

    expect(nameColumn.getValue(mockEvalClusterA)).toBe('worker-node-01');

    // Render row from cluster A
    const { container: containerA } = render(nameColumn.render(mockEvalClusterA));
    expect(containerA).toHaveTextContent('worker-node-01');
    expect(containerA).toHaveTextContent('View Node (worker-node-01)');

    const linksA = containerA.querySelectorAll('a');
    expect(linksA[0].getAttribute('data-routename')).toBe('nrc-evaluation-details');
    expect(linksA[0].getAttribute('data-cluster')).toBe('prod-east');
    expect(linksA[1].getAttribute('data-routename')).toBe('node');
    expect(linksA[1].getAttribute('data-params')).toBe(JSON.stringify({ name: 'worker-node-01' }));
    expect(linksA[1].getAttribute('data-cluster')).toBe('prod-east');

    // Render row from cluster B with identical node name
    const { container: containerB } = render(nameColumn.render(mockEvalClusterB));
    const linksB = containerB.querySelectorAll('a');
    expect(linksB[0].getAttribute('data-cluster')).toBe('staging-west');
    expect(linksB[1].getAttribute('data-cluster')).toBe('staging-west');

    // Assert that identically named rows produce distinct destinations
    expect(linksA[0].getAttribute('data-cluster')).not.toBe(linksB[0].getAttribute('data-cluster'));
  });

  it('hides View Node link when user lacks nodes get permission', async () => {
    mockGetAuthorization.mockResolvedValue({ status: { allowed: false } });
    const mockEval = {
      metadata: { name: 'worker-node-01' },
      nodeName: 'worker-node-01',
      cluster: 'restricted-cluster',
    } as any;
    mockUseList.mockReturnValue([[mockEval], null]);

    render(<EvaluationList />);

    const lastCall = mockResourceListViewProps.mock.calls.at(-1)?.[0];
    const nameColumn = lastCall.columns.find((c: any) => c.id === 'name');
    const { container } = render(nameColumn.render(mockEval));

    await waitFor(() => {
      expect(mockGetAuthorization).toHaveBeenCalledWith(
        'get',
        { name: 'worker-node-01' },
        'restricted-cluster'
      );
    });

    expect(container).toHaveTextContent('worker-node-01');
    expect(container).not.toHaveTextContent('View Node');
  });

  it('shows View Node link for visible nodes allowed via resourceNames RBAC while skipping off-page rows', async () => {
    mockGetAuthorization.mockImplementation((_verb: string, attrs: any) => {
      if (attrs?.name === 'worker-node-01') {
        return Promise.resolve({ status: { allowed: true } });
      }
      return Promise.resolve({ status: { allowed: false } });
    });

    const allowedEval = {
      metadata: { name: 'worker-node-01' },
      nodeName: 'worker-node-01',
      cluster: 'scoped-cluster',
    } as any;
    const deniedEval = {
      metadata: { name: 'worker-node-02' },
      nodeName: 'worker-node-02',
      cluster: 'scoped-cluster',
    } as any;
    const offPageEval = {
      metadata: { name: 'worker-node-03-offpage' },
      nodeName: 'worker-node-03-offpage',
      cluster: 'scoped-cluster',
    } as any;
    mockUseList.mockReturnValue([[allowedEval, deniedEval, offPageEval], null]);

    render(<EvaluationList />);

    // Wait for cluster-wide fast-path denial; named checks should not fire before visible rows render.
    await waitFor(() => {
      expect(mockGetAuthorization).toHaveBeenCalledWith('get', {}, 'scoped-cluster');
    });
    expect(mockGetAuthorization).toHaveBeenCalledTimes(1);

    const lastCall = mockResourceListViewProps.mock.calls.at(-1)?.[0];
    const nameColumn = lastCall.columns.find((c: any) => c.id === 'name');

    const { container: allowedContainer } = render(nameColumn.render(allowedEval));
    const { container: deniedContainer } = render(nameColumn.render(deniedEval));

    await waitFor(() => {
      expect(allowedContainer).toHaveTextContent('View Node (worker-node-01)');
    });

    expect(deniedContainer).toHaveTextContent('worker-node-02');
    expect(deniedContainer).not.toHaveTextContent('View Node');

    // Off-page row that was never rendered must not trigger an SSAR call.
    expect(mockGetAuthorization).not.toHaveBeenCalledWith(
      'get',
      { name: 'worker-node-03-offpage' },
      'scoped-cluster'
    );
  });

  it('renders CrdNotInstalled when NRE CRD returns 404 Not Found', () => {
    mockUseList.mockReturnValue([null, { status: 404, message: 'Resource not found' }]);
    render(<EvaluationList />);

    expect(screen.getByText('NodeReadinessEvaluation CRD Not Installed')).toBeInTheDocument();
    expect(
      screen.getByText(/NodeReadinessEvaluation CRDs are not installed on this cluster/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId('resource-list-view')).not.toBeInTheDocument();
  });

  it('renders CrdNotInstalled when user lacks permissions (403 Forbidden)', () => {
    mockUseList.mockReturnValue([null, { status: 403, message: 'Forbidden' }]);
    render(<EvaluationList />);

    expect(
      screen.getByText('Permission Denied: Cannot Read Node Readiness Evaluations')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('resource-list-view')).not.toBeInTheDocument();
  });

  it('forwards non-403/404 errors to ResourceListView via errors prop', () => {
    const serverError = { status: 500, message: 'Internal Server Error' };
    mockUseList.mockReturnValue([null, serverError]);
    render(<EvaluationList />);

    expect(screen.getByTestId('resource-list-view')).toBeInTheDocument();
    const lastCall = mockResourceListViewProps.mock.calls.at(-1)?.[0];
    expect(lastCall.errors).toEqual([serverError]);
    expect(lastCall.errorMessage).toBeUndefined();
  });

  it('keeps ResourceListView visible with cluster A data when cluster B returns 403/404', async () => {
    const clusterAEval = {
      metadata: { name: 'worker-a-1' },
      nodeName: 'worker-a-1',
      cluster: 'cluster-a',
      state: 'Available',
    } as any;
    const clusterBError = { status: 403, message: 'Forbidden', cluster: 'cluster-b' };

    const listResult = Object.assign([[clusterAEval], clusterBError], {
      items: [clusterAEval],
      errors: [clusterBError],
      error: clusterBError,
      isLoading: false,
      isSuccess: false,
      clusterResults: {
        'cluster-a': {
          items: [clusterAEval],
          errors: null,
          error: null,
          isLoading: false,
          isSuccess: true,
        },
      },
    });
    mockUseList.mockReturnValue(listResult);

    render(<EvaluationList />);

    await waitFor(() => {
      expect(mockGetAuthorization).toHaveBeenCalledWith('get', {}, 'cluster-a');
    });

    expect(screen.getByTestId('resource-list-view')).toBeInTheDocument();
    expect(screen.queryByText(/Permission Denied/i)).not.toBeInTheDocument();
    const lastCall = mockResourceListViewProps.mock.calls.at(-1)?.[0];
    expect(lastCall.data).toEqual([clusterAEval]);
    expect(lastCall.errors).toEqual([clusterBError]);
  });

  it('waits while another cluster is still loading before showing CrdNotInstalled', () => {
    const clusterBError = { status: 404, message: 'Not Found', cluster: 'cluster-b' };
    const listResult = Object.assign([[], clusterBError], {
      items: [],
      errors: [clusterBError],
      error: clusterBError,
      isLoading: true,
      isSuccess: false,
      clusterResults: {},
    });
    mockUseList.mockReturnValue(listResult);

    render(<EvaluationList />);

    expect(screen.getByTestId('resource-list-view')).toBeInTheDocument();
    expect(screen.queryByText(/CRD Not Installed/i)).not.toBeInTheDocument();
    const lastCall = mockResourceListViewProps.mock.calls.at(-1)?.[0];
    expect(lastCall.errors).toEqual([clusterBError]);
  });

  it('shows CrdNotInstalled only when all clusters finish and none can serve the resource', () => {
    const errA = { status: 404, message: 'Not Found', cluster: 'cluster-a' };
    const errB = { status: 404, message: 'Not Found', cluster: 'cluster-b' };
    const listResult = Object.assign([[], errA], {
      items: [],
      errors: [errA, errB],
      error: errA,
      isLoading: false,
      isSuccess: false,
      clusterResults: {},
    });
    mockUseList.mockReturnValue(listResult);

    render(<EvaluationList />);

    expect(screen.getByText('NodeReadinessEvaluation CRD Not Installed')).toBeInTheDocument();
    expect(screen.queryByTestId('resource-list-view')).not.toBeInTheDocument();
  });

  it('correctly extracts and renders state column', () => {
    render(<EvaluationList />);
    const lastCall = mockResourceListViewProps.mock.calls.at(-1)?.[0];
    const stateColumn = lastCall.columns.find((c: any) => c.id === 'state');

    const availableEval = { state: 'Available' } as any;
    expect(stateColumn.getValue(availableEval)).toBe('Available');
    const { container: availableContainer } = render(stateColumn.render(availableEval));
    expect(availableContainer).toHaveTextContent('Available');
    expect(availableContainer.querySelector('[data-testid="status-label"]')).toHaveAttribute(
      'data-status',
      'success'
    );

    cleanup();

    const blockedEval = { state: 'NotAvailable' } as any;
    expect(stateColumn.getValue(blockedEval)).toBe('NotAvailable');
    const { container: blockedContainer } = render(stateColumn.render(blockedEval));
    expect(blockedContainer).toHaveTextContent('NotAvailable');
    expect(blockedContainer.querySelector('[data-testid="status-label"]')).toHaveAttribute(
      'data-status',
      'error'
    );

    cleanup();

    const pendingEval = { state: undefined } as any;
    expect(stateColumn.getValue(pendingEval)).toBe('Pending');
    const { container: pendingContainer } = render(stateColumn.render(pendingEval));
    expect(pendingContainer).toHaveTextContent('Evaluation Pending');
  });

  it('correctly extracts and renders rulesStatus column', () => {
    render(<EvaluationList />);
    const lastCall = mockResourceListViewProps.mock.calls.at(-1)?.[0];
    const rulesStatusColumn = lastCall.columns.find((c: any) => c.id === 'rulesStatus');

    const satisfiedEval = {
      status: {
        rules: [
          { ruleName: 'rule-1', ruleStatus: 'Satisfied' },
          { ruleName: 'rule-2', ruleStatus: 'Satisfied' },
        ],
      },
      rules: [
        { ruleName: 'rule-1', ruleStatus: 'Satisfied' },
        { ruleName: 'rule-2', ruleStatus: 'Satisfied' },
      ],
    } as any;

    expect(rulesStatusColumn.getValue(satisfiedEval)).toBe('OK');
    const { container: satisfiedContainer } = render(rulesStatusColumn.render(satisfiedEval));
    expect(satisfiedContainer).toHaveTextContent('OK (2/2)');
    expect(satisfiedContainer.querySelector('[data-testid="status-label"]')).toHaveAttribute(
      'data-status',
      'success'
    );

    cleanup();

    const unsatisfiedEval = {
      status: {
        rules: [
          { ruleName: 'rule-1', ruleStatus: 'Satisfied' },
          { ruleName: 'rule-2', ruleStatus: 'Unsatisfied' },
        ],
      },
      rules: [
        { ruleName: 'rule-1', ruleStatus: 'Satisfied' },
        { ruleName: 'rule-2', ruleStatus: 'Unsatisfied' },
      ],
    } as any;

    expect(rulesStatusColumn.getValue(unsatisfiedEval)).toBe('Not Ready');
    const { container: unsatisfiedContainer } = render(rulesStatusColumn.render(unsatisfiedEval));
    expect(unsatisfiedContainer).toHaveTextContent('Not Ready (1/2)');
    expect(unsatisfiedContainer.querySelector('[data-testid="status-label"]')).toHaveAttribute(
      'data-status',
      'warning'
    );

    cleanup();

    const emptyRulesEval = {
      status: { state: 'Available', rules: [] },
      rules: [],
    } as any;
    expect(rulesStatusColumn.getValue(emptyRulesEval)).toBe('No Rules Applicable');
    const { container: emptyContainer } = render(rulesStatusColumn.render(emptyRulesEval));
    expect(emptyContainer).toHaveTextContent('No Rules Applicable');

    cleanup();

    const pendingEval = { status: undefined } as any;
    expect(rulesStatusColumn.getValue(pendingEval)).toBe('Pending');
  });

  it('correctly extracts and renders activeTaints column with deduplication and overflow truncation', () => {
    render(<EvaluationList />);
    const lastCall = mockResourceListViewProps.mock.calls.at(-1)?.[0];
    const activeTaintsColumn = lastCall.columns.find((c: any) => c.id === 'activeTaints');

    const noTaintsEval = {
      rules: [{ ruleName: 'rule-1', ruleStatus: 'Satisfied', taintStatus: 'Absent' }],
    } as any;
    expect(activeTaintsColumn.getValue(noTaintsEval)).toBe('None');
    const { container: noneContainer } = render(activeTaintsColumn.render(noTaintsEval));
    expect(noneContainer).toHaveTextContent('None');

    cleanup();

    const multiTaintsEval = {
      rules: [
        {
          ruleName: 'rule-1',
          taintStatus: 'Present',
          taintKey: 'readiness.k8s.io/gpu',
          taintEffect: 'NoSchedule',
        },
        {
          ruleName: 'rule-2',
          taintStatus: 'Present',
          taintKey: 'readiness.k8s.io/gpu',
          taintEffect: 'NoSchedule',
        },
        {
          ruleName: 'rule-3',
          taintStatus: 'Present',
          taintKey: 'readiness.k8s.io/cni',
          taintEffect: 'NoExecute',
        },
        {
          ruleName: 'rule-4',
          taintStatus: 'Present',
          taintKey: 'readiness.k8s.io/csi',
        },
      ],
    } as any;

    expect(activeTaintsColumn.getValue(multiTaintsEval)).toBe(
      'readiness.k8s.io/gpu:NoSchedule, readiness.k8s.io/cni:NoExecute, readiness.k8s.io/csi:NoSchedule'
    );
    const { container: multiContainer } = render(activeTaintsColumn.render(multiTaintsEval));
    expect(multiContainer).toHaveTextContent('readiness.k8s.io/gpu:NoSchedule');
    expect(multiContainer).toHaveTextContent('readiness.k8s.io/cni:NoExecute');
    expect(multiContainer).toHaveTextContent('+1 more');
    expect(multiContainer).not.toHaveTextContent('readiness.k8s.io/csi:NoSchedule');
    const overflowChip = multiContainer.querySelector('[aria-label*="additional active taint"]');
    expect(overflowChip).toBeInTheDocument();
    expect(overflowChip).toHaveAttribute('tabindex', '0');
  });
});
