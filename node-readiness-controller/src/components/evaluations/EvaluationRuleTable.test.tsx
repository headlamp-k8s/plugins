/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EvaluationRuleTable from './EvaluationRuleTable';

vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: any) => <span data-testid={`icon-${icon}`} />,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Link: ({ children, routeName, params, activeCluster }: any) => (
    <a
      href={`#${routeName || 'test'}`}
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
}));

describe('EvaluationRuleTable component', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders empty message when no rules are evaluated', () => {
    render(<EvaluationRuleTable rules={[]} />);
    expect(screen.getByText('No rules evaluated for this node yet.')).toBeInTheDocument();
  });

  it('renders rule summary rows and nested per-condition breakdown for satisfied rule', () => {
    const mockRules = [
      {
        ruleName: 'rule-cni-ready',
        enforcementMode: 'continuous' as const,
        conditionPolicy: 'allOf' as const,
        ruleStatus: 'Satisfied' as const,
        taintStatus: 'Absent' as const,
        taintKey: 'readiness.k8s.io/cni-not-ready',
        taintEffect: 'NoSchedule' as const,
        reason: 'AllConditionsSatisfied',
        message: 'Calico CNI setup succeeded',
        firstEvaluatedAt: '2026-11-06T10:00:00Z',
        lastEvaluatedAt: '2026-11-06T10:02:15Z',
        taintAddedAt: '2026-11-06T10:00:05Z',
        taintRemovedAt: '2026-11-06T10:02:15Z',
        readinessConditions: [
          {
            type: 'network.kubernetes.io/CNIReady',
            requiredStatus: 'True' as const,
            currentStatus: 'True' as const,
          },
        ],
      },
    ];

    render(<EvaluationRuleTable rules={mockRules} />);

    // Top-level summary columns
    expect(screen.getByText('rule-cni-ready')).toBeInTheDocument();
    expect(screen.getByText('continuous')).toBeInTheDocument();
    expect(screen.getAllByText('Satisfied').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('1/1')).toBeInTheDocument();

    // Expand rule to verify drawer diagnostics and nested breakdown table
    const summary = screen.getByRole('button', { name: /rule-cni-ready/i });
    expect(screen.queryByText('Readiness Conditions Breakdown (1)')).not.toBeInTheDocument();
    fireEvent.click(summary);

    // Diagnostics & Unblock Duration metric
    expect(screen.getByText('Visit rule')).toBeInTheDocument();
    expect(screen.getByText('⏱️ Unblock Duration')).toBeInTheDocument();
    expect(screen.getByText('2m 10s')).toBeInTheDocument();
    expect(screen.getByText('AllConditionsSatisfied')).toBeInTheDocument();
    expect(screen.getByText('Calico CNI setup succeeded')).toBeInTheDocument();

    // Nested conditions table
    expect(screen.getByText('Readiness Conditions Breakdown (1)')).toBeInTheDocument();
    expect(screen.getByText('network.kubernetes.io/CNIReady')).toBeInTheDocument();
    expect(screen.getByText('Unknown (implicit)')).toBeInTheDocument();
  });

  it('renders active taint and currently blocked duration for unsatisfied rule', () => {
    const mockRules = [
      {
        ruleName: 'rule-gpu-driver',
        enforcementMode: 'bootstrap-only' as const,
        conditionPolicy: 'anyOf' as const,
        ruleStatus: 'Unsatisfied' as const,
        taintStatus: 'Present' as const,
        taintKey: 'readiness.k8s.io/gpu-not-ready',
        taintEffect: 'NoSchedule' as const,
        reason: 'ConditionsNotMet',
        message: 'GPU driver kernel module not found',
        firstEvaluatedAt: '2026-11-06T10:00:00Z',
        lastEvaluatedAt: '2026-11-06T10:05:00Z',
        taintAddedAt: '2026-11-06T10:00:00Z',
        readinessConditions: [
          {
            type: 'nvidia.com/GPUReady',
            requiredStatus: 'True' as const,
            currentStatus: 'False' as const,
            defaultStatus: 'False' as const,
          },
        ],
      },
    ];

    render(<EvaluationRuleTable rules={mockRules} />);

    expect(screen.getByText('rule-gpu-driver')).toBeInTheDocument();
    expect(screen.getByText('[anyOf]')).toBeInTheDocument();
    expect(screen.getByText('readiness.k8s.io/gpu-not-ready:NoSchedule')).toBeInTheDocument();
    expect(screen.getAllByText('Unsatisfied').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('0/1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /rule-gpu-driver/i }));

    // Blocked at Last Evaluation metric
    expect(screen.getByText('⏳ Blocked at Last Evaluation')).toBeInTheDocument();
    expect(screen.getByText('5m 0s')).toBeInTheDocument();
  });

  it('starts with rule evaluation accordions collapsed by default and expands on click', () => {
    const mockRules = [
      {
        ruleName: 'rule-test-collapsed',
        ruleStatus: 'Satisfied' as const,
        enforcementMode: 'continuous' as const,
        taintStatus: 'Absent' as const,
      },
    ];

    render(<EvaluationRuleTable rules={mockRules} />);

    const summary = screen.getByRole('button', { name: /rule-test-collapsed/i });
    expect(summary).toHaveAttribute('aria-expanded', 'false');

    // Click to expand
    fireEvent.click(summary);
    expect(summary).toHaveAttribute('aria-expanded', 'true');
  });

  it('correctly evaluates defaultStatus fallback and indeterminate Unknown conditions (NRC #345)', () => {
    const mockRules = [
      {
        ruleName: 'rule-fallback-default',
        enforcementMode: 'continuous' as const,
        conditionPolicy: 'allOf' as const,
        ruleStatus: 'Satisfied' as const,
        taintStatus: 'Absent' as const,
        readinessConditions: [
          {
            type: 'acme.io/DefaultTrueCondition',
            requiredStatus: 'True' as const,
            currentStatus: 'Unknown' as const,
            defaultStatus: 'True' as const,
          },
        ],
      },
      {
        ruleName: 'rule-ambiguous-unknown',
        enforcementMode: 'continuous' as const,
        conditionPolicy: 'allOf' as const,
        ruleStatus: 'Unsatisfied' as const,
        taintStatus: 'Present' as const,
        readinessConditions: [
          {
            type: 'acme.io/IndeterminateCondition',
            requiredStatus: 'True' as const,
            currentStatus: 'Unknown' as const,
          },
        ],
      },
    ];

    render(<EvaluationRuleTable rules={mockRules} />);

    // Rule 1: missing condition evaluated via defaultStatus: 'True' -> Satisfied (1/1)
    expect(screen.getByText('rule-fallback-default')).toBeInTheDocument();
    expect(screen.getByText('1/1')).toBeInTheDocument();

    // Rule 2: Unknown with omitted defaultStatus (implicit Unknown != True) -> 0/1 and error Unsatisfied badge
    expect(screen.getByText('rule-ambiguous-unknown')).toBeInTheDocument();
    expect(screen.getByText('0/1')).toBeInTheDocument();

    // Expand rule 2 and verify ARIA id matches AccordionSummary aria-controls and displays Unsatisfied badge
    const rule2Summary = screen.getByRole('button', { name: /rule-ambiguous-unknown/i });
    const controlsId = rule2Summary.getAttribute('aria-controls');
    expect(controlsId).toBe('rule-eval-rule-ambiguous-unknown-content');
    fireEvent.click(rule2Summary);
    expect(document.getElementById(controlsId!)).toBeInTheDocument();
    expect(screen.getByText('acme.io/IndeterminateCondition')).toBeInTheDocument();

    const statusLabels = screen.getAllByTestId('status-label');
    const unsatisfiedConditionLabel = statusLabels.find(
      el => el.getAttribute('data-status') === 'error' && el.textContent === 'Unsatisfied'
    );
    expect(unsatisfiedConditionLabel).toBeDefined();
  });

  it('does NOT falsely mark explicitly Unknown condition as Satisfied when rule is Unsatisfied', () => {
    const mockRules = [
      {
        ruleName: 'rule-explicit-unknown',
        enforcementMode: 'continuous' as const,
        conditionPolicy: 'allOf' as const,
        ruleStatus: 'Unsatisfied' as const,
        taintStatus: 'Present' as const,
        readinessConditions: [
          {
            type: 'acme.io/ExplicitUnknownCondition',
            requiredStatus: 'True' as const,
            currentStatus: 'Unknown' as const,
            defaultStatus: 'True' as const,
          },
        ],
      },
    ];

    render(<EvaluationRuleTable rules={mockRules} />);

    // Since rule is Unsatisfied, explicitly Unknown condition must not appear as 1/1 Satisfied
    expect(screen.getByText('rule-explicit-unknown')).toBeInTheDocument();
    expect(screen.getByText('0/1')).toBeInTheDocument();
  });

  it('displays "—" when enforcementMode is not present on rule evaluation (NRC #345)', () => {
    const mockRules = [
      {
        ruleName: 'rule-without-mode',
        ruleStatus: 'Satisfied' as const,
        taintStatus: 'Absent' as const,
      },
    ];

    render(<EvaluationRuleTable rules={mockRules} />);
    expect(screen.getByText('rule-without-mode')).toBeInTheDocument();
    expect(screen.getByText('Enforcement')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('marks conditions badge as success for anyOf policy when at least one condition is satisfied and forwards activeCluster', () => {
    const mockRules = [
      {
        ruleName: 'rule-anyof-partial',
        enforcementMode: 'continuous' as const,
        conditionPolicy: 'anyOf' as const,
        ruleStatus: 'Satisfied' as const,
        taintStatus: 'Absent' as const,
        readinessConditions: [
          {
            type: 'cni/PrimaryReady',
            requiredStatus: 'True' as const,
            currentStatus: 'True' as const,
          },
          {
            type: 'cni/BackupReady',
            requiredStatus: 'True' as const,
            currentStatus: 'False' as const,
          },
        ],
      },
    ];

    render(<EvaluationRuleTable rules={mockRules} activeCluster="prod-west" />);

    const ratioBadge = screen.getAllByTestId('status-label').find(el => el.textContent === '1/2');
    expect(ratioBadge).toBeDefined();
    expect(ratioBadge).toHaveAttribute('data-status', 'success');

    fireEvent.click(screen.getByRole('button', { name: /rule-anyof-partial/i }));
    const visitRuleLink = screen.getByText('Visit rule').closest('a');
    expect(visitRuleLink).toHaveAttribute('data-cluster', 'prod-west');
  });

  it('renders Current Status neutrally without assuming True is good and False is bad', () => {
    const mockRules = [
      {
        ruleName: 'rule-false-desired',
        enforcementMode: 'continuous' as const,
        conditionPolicy: 'allOf' as const,
        ruleStatus: 'Satisfied' as const,
        taintStatus: 'Absent' as const,
        readinessConditions: [
          {
            type: 'node.kubernetes.io/DiskPressure',
            requiredStatus: 'False' as const,
            currentStatus: 'False' as const,
          },
        ],
      },
    ];

    render(<EvaluationRuleTable rules={mockRules} />);

    // Both rule and condition are satisfied (1/1)
    expect(screen.getByText('1/1')).toBeInTheDocument();

    // No error-colored StatusLabel should be rendered for currentStatus === 'False'
    const errorLabels = screen
      .getAllByTestId('status-label')
      .filter(el => el.getAttribute('data-status') === 'error');
    expect(errorLabels).toHaveLength(0);
  });
});
