/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LandingPage from './LandingPage';

const { mockPush, mockRuleUseList, mockDeploymentUseGet, mockCreateRouteURL } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRuleUseList: vi.fn(),
  mockDeploymentUseGet: vi.fn(),
  mockCreateRouteURL: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useHistory: () => ({
    push: mockPush,
  }),
}));

vi.mock('./resources', () => ({
  NodeReadinessRule: {
    useList: mockRuleUseList,
  },
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: {
    ResourceClasses: {
      Deployment: {
        useGet: mockDeploymentUseGet,
      },
    },
  },
  Router: {
    createRouteURL: mockCreateRouteURL,
  },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  PageGrid: ({ children }: any) => <div data-testid="page-grid">{children}</div>,
  SectionBox: ({ title, extra, children }: any) => (
    <div data-testid="section-box">
      <h1>{title}</h1>
      <div>{extra}</div>
      {children}
    </div>
  ),
  EmptyContent: ({ children }: any) => <div data-testid="empty-content">{children}</div>,
  StatusLabel: ({ children, status }: any) => <span data-status={status}>{children}</span>,
}));

vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: any) => <span data-icon={icon} />,
}));

describe('LandingPage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockRuleUseList.mockReset();
    mockDeploymentUseGet.mockReset();
    mockCreateRouteURL.mockReset();
    // Default to 403 Forbidden or absent deployment (omitted badge)
    mockDeploymentUseGet.mockReturnValue([null, { status: 403 }]);
  });

  it('renders loading state when rules are null', () => {
    mockRuleUseList.mockReturnValue([null, null]);

    render(<LandingPage />);
    expect(screen.getByText('Loading Node Readiness Rules...')).toBeInTheDocument();
  });

  it('renders CRD error state when useList returns 404 (CRD not installed)', () => {
    mockRuleUseList.mockReturnValue([
      null,
      Object.assign(new Error('CRD missing'), { status: 404 }),
    ]);

    render(<LandingPage />);
    expect(screen.getByText('API Status:')).toBeInTheDocument();
    expect(screen.getByText('Not Installed')).toBeInTheDocument();
    expect(screen.getByText('Node Readiness Controller CRDs not installed')).toBeInTheDocument();
    expect(
      screen.getByText(/Please refer to the Node Readiness Controller installation documentation/)
    ).toBeInTheDocument();
  });

  it('renders API unavailable state on unexpected network or server error', () => {
    mockRuleUseList.mockReturnValue([
      null,
      Object.assign(new Error('Internal Server Error'), { status: 500 }),
    ]);

    render(<LandingPage />);
    expect(screen.getByText('API Status:')).toBeInTheDocument();
    expect(screen.getByText('API Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Unable to load Node Readiness Rules')).toBeInTheDocument();
    expect(screen.getByText('Internal Server Error')).toBeInTheDocument();
  });

  it('renders permission denied state when useList returns 403', () => {
    mockRuleUseList.mockReturnValue([null, { status: 403 }]);

    render(<LandingPage />);
    expect(screen.getByText('API Status:')).toBeInTheDocument();
    expect(screen.getByText('Permission Denied')).toBeInTheDocument();
    expect(
      screen.getByText('Permission Denied: Cannot Read Node Readiness Rules')
    ).toBeInTheDocument();
  });

  it('renders empty cluster state when no rules are configured', () => {
    mockRuleUseList.mockReturnValue([[], null]);

    render(<LandingPage />);
    expect(screen.getByText('API Status:')).toBeInTheDocument();
    expect(screen.getByText('API Available')).toBeInTheDocument();
    expect(screen.getByText('readiness.node.x-k8s.io/v1alpha1')).toBeInTheDocument();
    expect(screen.getByText('Total Rules')).toBeInTheDocument();
    expect(screen.getByText('No Node Readiness Rules in Cluster')).toBeInTheDocument();
    expect(mockDeploymentUseGet).toHaveBeenCalledWith('nrr-controller-manager', 'nrr-system');
  });

  it('renders summary cards and CRD active status adhering to design doc', () => {
    const mockRules = [
      // Rule 1: Live rule with taint present
      {
        metadata: { name: 'rule-live-present', generation: 1 },
        spec: { dryRun: false },
        status: {
          observedGeneration: 1,
          nodeEvaluations: [{ nodeName: 'node-1', taintStatus: 'Present' }],
          failedNodes: [],
        },
        jsonData: { metadata: { generation: 1 } },
      },
      // Rule 2: Live rule with taint absent
      {
        metadata: { name: 'rule-live-absent', generation: 1 },
        spec: { dryRun: false },
        status: {
          observedGeneration: 1,
          nodeEvaluations: [{ nodeName: 'node-2', taintStatus: 'Absent' }],
          failedNodes: [],
        },
        jsonData: { metadata: { generation: 1 } },
      },
      // Rule 3: Dry-run rule with taint present in simulation (STRICTLY EXCLUDED from live taints present!)
      {
        metadata: { name: 'rule-dry-run', generation: 1 },
        spec: { dryRun: true },
        status: {
          observedGeneration: 1,
          nodeEvaluations: [{ nodeName: 'node-3', taintStatus: 'Present' }],
          failedNodes: [],
        },
        jsonData: { metadata: { generation: 1 } },
      },
      // Rule 4: Rule with failed nodes (Evaluation error)
      {
        metadata: { name: 'rule-with-errors', generation: 1 },
        spec: { dryRun: false },
        status: {
          observedGeneration: 1,
          nodeEvaluations: [],
          failedNodes: [{ nodeName: 'node-4', reason: 'Error' }],
        },
        jsonData: { metadata: { generation: 1 } },
      },
      // Rule 5: Rule currently reconciling (observedGeneration < generation)
      {
        metadata: { name: 'rule-reconciling', generation: 2 },
        spec: { dryRun: false },
        status: {
          observedGeneration: 1,
          nodeEvaluations: [],
          failedNodes: [],
        },
        jsonData: { metadata: { generation: 2 } },
      },
    ];

    mockRuleUseList.mockReturnValue([mockRules, null]);

    render(<LandingPage />);

    // Check API status header
    expect(screen.getByText('API Status:')).toBeInTheDocument();
    expect(screen.getByText('API Available')).toBeInTheDocument();

    // Total rules should be 5
    expect(screen.getByText('Total Rules').closest('div')).toHaveTextContent('5');

    // Taints Present should be 1 (only rule-live-present; dry-run rule is excluded!)
    expect(screen.getByText('Taints Present').closest('div')).toHaveTextContent('1');

    // Evaluation Errors should be 1 (rule-with-errors)
    expect(screen.getByText('Evaluation Errors').closest('div')).toHaveTextContent('1');

    // Reconciling should be 1 (rule-reconciling)
    expect(screen.getByText('Reconciling').closest('div')).toHaveTextContent('1');

    // Check rules in attention list
    expect(screen.getByText('rule-live-present')).toBeInTheDocument();
    expect(screen.getByText('rule-with-errors')).toBeInTheDocument();
    expect(screen.getByText('rule-reconciling')).toBeInTheDocument();
  });

  it('navigates to rules list on button click', () => {
    mockRuleUseList.mockReturnValue([[], null]);

    render(<LandingPage />);
    const exploreBtn = screen.getByText('Explore All Rules (0)');
    fireEvent.click(exploreBtn);

    expect(mockPush).toHaveBeenCalledWith('/nrc/rules');
  });

  it('omits controller health badge when deployment access is forbidden (403)', () => {
    mockRuleUseList.mockReturnValue([[], null]);
    mockDeploymentUseGet.mockReturnValue([null, { status: 403 }]);

    render(<LandingPage />);
    expect(screen.queryByText('Controller:')).toBeNull();
  });

  it('renders Controller: Not Detected badge when deployment is not found (404)', () => {
    mockRuleUseList.mockReturnValue([[], null]);
    mockDeploymentUseGet.mockReturnValue([null, { status: 404 }]);

    render(<LandingPage />);
    expect(screen.getByText('Controller:')).toBeInTheDocument();
    expect(screen.getByText('Not Detected')).toBeInTheDocument();
  });

  it('renders Controller: Running badge when deployment readyReplicas > 0', () => {
    mockRuleUseList.mockReturnValue([[], null]);
    mockDeploymentUseGet.mockReturnValue([{ status: { readyReplicas: 1 } }, null]);

    render(<LandingPage />);
    expect(screen.getByText('Controller:')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('renders Controller: Stopped badge when deployment readyReplicas === 0', () => {
    mockRuleUseList.mockReturnValue([[], null]);
    mockDeploymentUseGet.mockReturnValue([{ status: { readyReplicas: 0 } }, null]);

    render(<LandingPage />);
    expect(screen.getByText('Controller:')).toBeInTheDocument();
    expect(screen.getByText('Stopped')).toBeInTheDocument();
  });
  it('navigates using cluster-aware route URL when Router.createRouteURL is available', () => {
    mockRuleUseList.mockReturnValue([[], null]);
    mockCreateRouteURL.mockImplementation((routeName: string) => {
      if (routeName === 'Readiness Rules') return '/c/kind-nrc-dev/nrc/rules';
      return '';
    });

    render(<LandingPage />);
    const exploreBtn = screen.getByText('Explore All Rules (0)');
    fireEvent.click(exploreBtn);

    expect(mockCreateRouteURL).toHaveBeenCalledWith('Readiness Rules');
    expect(mockPush).toHaveBeenCalledWith('/c/kind-nrc-dev/nrc/rules');
  });

  it('navigates to rule details using cluster-aware URL when attention rule card is clicked', () => {
    const mockRules = [
      {
        metadata: { name: '02-tainted-rule' },
        jsonData: { metadata: { generation: 1 } },
        spec: { dryRun: false },
        status: {
          observedGeneration: 1,
          failedNodes: [],
          nodeEvaluations: [{ nodeName: 'node-1', taintStatus: 'Present' }],
        },
      },
    ];
    mockRuleUseList.mockReturnValue([mockRules, null]);
    mockCreateRouteURL.mockImplementation((routeName: string, params: any) => {
      if (routeName === 'nrc-rule-details') return `/c/kind-nrc-dev/nrc/rules/${params?.name}`;
      return '';
    });

    render(<LandingPage />);
    const ruleCard = screen.getByText('02-tainted-rule');
    fireEvent.click(ruleCard);

    expect(mockCreateRouteURL).toHaveBeenCalledWith('nrc-rule-details', {
      name: '02-tainted-rule',
    });
    expect(mockPush).toHaveBeenCalledWith('/c/kind-nrc-dev/nrc/rules/02-tainted-rule');
  });
  it('excludes failed nodes when counting active taints on rules with overlapping node records', () => {
    const mockRules = [
      {
        metadata: { name: 'rule-overlap' },
        spec: { dryRun: false },
        jsonData: { metadata: { generation: 1 } },
        status: {
          observedGeneration: 1,
          failedNodes: [{ nodeName: 'node-1', reason: 'Timeout' }],
          nodeEvaluations: [{ nodeName: 'node-1', taintStatus: 'Present' }],
        },
      },
    ];

    mockRuleUseList.mockReturnValue([mockRules, null]);

    render(<LandingPage />);

    expect(screen.getByText('Taints Present').closest('div')).toHaveTextContent('0');
    expect(screen.getByText('Evaluation Errors').closest('div')).toHaveTextContent('1');

    expect(screen.getByText('rule-overlap')).toBeInTheDocument();
    expect(screen.getByText('1 node evaluation error')).toBeInTheDocument();
    expect(screen.queryByText(/taint present/i)).toBeNull();
  });
});
