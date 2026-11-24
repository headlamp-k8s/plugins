/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LandingPage from './LandingPage';

const {
  mockPush,
  mockRuleUseList,
  mockLeaseUseList,
  mockDeploymentUseList,
  mockCreateRouteURL,
  mockGetAllowedNamespaces,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRuleUseList: vi.fn(),
  mockLeaseUseList: vi.fn(),
  mockDeploymentUseList: vi.fn(),
  mockCreateRouteURL: vi.fn(),
  mockGetAllowedNamespaces: vi.fn().mockReturnValue([]),
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
    cluster: {
      getAllowedNamespaces: () => mockGetAllowedNamespaces(),
    },
    ResourceClasses: {
      Deployment: {
        useList: mockDeploymentUseList,
      },
      Lease: {
        useList: mockLeaseUseList,
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
    mockLeaseUseList.mockReset();
    mockDeploymentUseList.mockReset();
    mockCreateRouteURL.mockReset();
    mockGetAllowedNamespaces.mockReturnValue([]);
    // Default to 403 Forbidden (omitted badge)
    mockLeaseUseList.mockReturnValue([null, { status: 403 }]);
    mockDeploymentUseList.mockReturnValue([null, { status: 403 }]);
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
      },
      // Rule 2: Rule with evaluation error
      {
        metadata: { name: 'rule-with-errors', generation: 1 },
        spec: { dryRun: false },
        status: {
          observedGeneration: 1,
          failedNodes: [{ nodeName: 'node-2', reason: 'Timeout' }],
          nodeEvaluations: [],
        },
      },
      // Rule 3: Pending sync rule (observedGeneration < generation)
      {
        metadata: { name: 'rule-pending-sync', generation: 2 },
        spec: { dryRun: false },
        status: {
          observedGeneration: 1,
          failedNodes: [],
          nodeEvaluations: [],
        },
      },
      // Rule 4: Completely healthy rule
      {
        metadata: { name: 'rule-healthy', generation: 1 },
        spec: { dryRun: false },
        status: {
          observedGeneration: 1,
          failedNodes: [],
          nodeEvaluations: [{ nodeName: 'node-1', taintStatus: 'Absent' }],
        },
      },
      // Rule 5: Dry run rule with taint present (should NOT increment active taints)
      {
        metadata: { name: 'rule-dry-run', generation: 1 },
        spec: { dryRun: true },
        status: {
          observedGeneration: 1,
          failedNodes: [],
          nodeEvaluations: [{ nodeName: 'node-1', taintStatus: 'Present' }],
        },
      },
    ];

    mockRuleUseList.mockReturnValue([mockRules, null]);

    render(<LandingPage />);

    // Total Rules should be 5
    expect(screen.getByText('Total Rules').closest('div')).toHaveTextContent('5');

    // Taints Present should be 1 (only rule-live-present counts, dry-run is excluded)
    expect(screen.getByText('Taints Present').closest('div')).toHaveTextContent('1');

    // Evaluation Errors should be 1 (rule-with-errors)
    expect(screen.getByText('Evaluation Errors').closest('div')).toHaveTextContent('1');

    // Pending Rule Sync should be 1 (rule-pending-sync)
    expect(screen.getByText('Pending Rule Sync').closest('div')).toHaveTextContent('1');

    // Check rules in attention list
    expect(screen.getByText('rule-live-present')).toBeInTheDocument();
    expect(screen.getByText('rule-with-errors')).toBeInTheDocument();
    expect(screen.getByText('rule-pending-sync')).toBeInTheDocument();
  });

  it('navigates to rules list on button click', () => {
    mockRuleUseList.mockReturnValue([[], null]);

    render(<LandingPage />);
    const exploreBtn = screen.getByText('Explore All Rules (0)');
    fireEvent.click(exploreBtn);

    expect(mockPush).toHaveBeenCalledWith('/nrc/rules');
  });

  it('omits controller health badge when access is forbidden (403)', () => {
    mockRuleUseList.mockReturnValue([[], null]);
    mockLeaseUseList.mockReturnValue([null, { status: 403 }]);
    mockDeploymentUseList.mockReturnValue([null, { status: 403 }]);

    render(<LandingPage />);
    expect(screen.queryByText('Controller:')).toBeNull();
  });

  it('omits controller health badge when allowed namespaces are configured and no lease is found in them', () => {
    mockRuleUseList.mockReturnValue([[], null]);
    mockLeaseUseList.mockReturnValue([[], null]);
    mockDeploymentUseList.mockReturnValue([[], null]);
    mockGetAllowedNamespaces.mockReturnValue(['tenant-a']);

    render(<LandingPage />);
    expect(screen.queryByText('Controller:')).toBeNull();
  });

  it('renders Controller: Active (Leader) badge when lease is active', () => {
    mockRuleUseList.mockReturnValue([[], null]);
    mockLeaseUseList.mockReturnValue([
      [
        {
          metadata: { name: 'ba65f13e.readiness.node.x-k8s.io' },
          spec: {
            holderIdentity: 'nrc-controller-manager-xyz',
            renewTime: new Date().toISOString(),
          },
        },
      ],
      null,
    ]);

    render(<LandingPage />);
    expect(screen.getByText('Controller:')).toBeInTheDocument();
    expect(screen.getByText('Active (Leader)')).toBeInTheDocument();
  });

  it('renders Controller: Inactive badge when leader lease is expired', () => {
    mockRuleUseList.mockReturnValue([[], null]);
    const expiredTime = new Date(Date.now() - 60 * 1000).toISOString();
    mockLeaseUseList.mockReturnValue([
      [
        {
          metadata: { name: 'ba65f13e.readiness.node.x-k8s.io' },
          spec: {
            holderIdentity: 'nrc-controller-manager-xyz',
            renewTime: expiredTime,
          },
        },
      ],
      null,
    ]);

    render(<LandingPage />);
    expect(screen.getByText('Controller:')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('updates controller health badge when lease expires over time without new watch events', () => {
    vi.useFakeTimers();
    const startTime = new Date('2026-11-01T12:00:00Z').getTime();
    vi.setSystemTime(startTime);

    mockRuleUseList.mockReturnValue([[], null]);
    // Lease renewed 5 seconds ago with 15s lease duration (grace window = 30s)
    mockLeaseUseList.mockReturnValue([
      [
        {
          metadata: { name: 'ba65f13e.readiness.node.x-k8s.io' },
          spec: {
            holderIdentity: 'nrc-controller-manager-xyz',
            renewTime: new Date(startTime - 5 * 1000).toISOString(),
            leaseDurationSeconds: 15,
          },
        },
      ],
      null,
    ]);

    render(<LandingPage />);
    expect(screen.getByText('Active (Leader)')).toBeInTheDocument();

    // Advance time by 35 seconds (exceeding 30s lease grace window)
    act(() => {
      vi.advanceTimersByTime(35 * 1000);
    });

    // Badge should now transition to Inactive automatically via the interval timer
    expect(screen.getByText('Inactive')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('renders Controller: Active badge via deployment fallback when lease access is 403 but deployment is ready', () => {
    mockRuleUseList.mockReturnValue([[], null]);
    mockLeaseUseList.mockReturnValue([null, { status: 403 }]);
    mockDeploymentUseList.mockReturnValue([
      [
        {
          metadata: { name: 'node-readiness-controller-manager' },
          spec: {
            template: {
              spec: {
                containers: [
                  { name: 'manager', image: 'registry.k8s.io/node-readiness-controller:v0.1.0' },
                ],
              },
            },
          },
          status: { readyReplicas: 1 },
        },
      ],
      null,
    ]);

    render(<LandingPage />);
    expect(screen.getByText('Controller:')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders Controller: Not Detected badge when neither lease nor deployment is found', () => {
    mockRuleUseList.mockReturnValue([[], null]);
    mockLeaseUseList.mockReturnValue([[], null]);
    mockDeploymentUseList.mockReturnValue([[], null]);

    render(<LandingPage />);
    expect(screen.getByText('Controller:')).toBeInTheDocument();
    expect(screen.getByText('Not Detected')).toBeInTheDocument();
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
        metadata: { name: '02-tainted-rule', generation: 1 },
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
        metadata: { name: 'rule-overlap', generation: 1 },
        spec: { dryRun: false },
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
