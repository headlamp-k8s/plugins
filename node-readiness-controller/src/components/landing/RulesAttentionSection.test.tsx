/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RulesAttentionSection from './RulesAttentionSection';

describe('RulesAttentionSection', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders empty cluster message when totalRules is 0', () => {
    render(
      <RulesAttentionSection totalRules={0} rulesNeedingAttention={[]} onRuleClick={vi.fn()} />
    );

    expect(screen.getByText('No Node Readiness Rules in Cluster')).toBeInTheDocument();
  });

  it('renders All Rules Healthy message when attention list is empty', () => {
    render(
      <RulesAttentionSection totalRules={4} rulesNeedingAttention={[]} onRuleClick={vi.fn()} />
    );

    expect(screen.getByText('All Rules Healthy')).toBeInTheDocument();
  });

  it('renders attention rule cards with failure, taint, and reconciling details', () => {
    const onRuleClickMock = vi.fn();
    const mockAttentionRules = [
      {
        metadata: { name: 'failed-rule' },
        status: { failedNodes: [{ nodeName: 'node-1', reason: 'Timeout' }] },
      },
      {
        metadata: { name: 'tainted-rule' },
        spec: { dryRun: false },
        status: { nodeEvaluations: [{ nodeName: 'node-2', taintStatus: 'Present' }] },
      },
      {
        metadata: { name: 'dryrun-reconciling-rule' },
        spec: { dryRun: true },
        jsonData: { metadata: { generation: 2 } },
        status: { observedGeneration: 1 },
      },
    ];

    render(
      <RulesAttentionSection
        totalRules={5}
        rulesNeedingAttention={mockAttentionRules}
        onRuleClick={onRuleClickMock}
      />
    );

    expect(screen.getByText('failed-rule')).toBeInTheDocument();
    expect(screen.getByText('1 node evaluation error')).toBeInTheDocument();

    expect(screen.getByText('tainted-rule')).toBeInTheDocument();
    expect(screen.getByText('1 node with taint present')).toBeInTheDocument();

    expect(screen.getByText('dryrun-reconciling-rule')).toBeInTheDocument();
    expect(screen.getByText('Dry Run')).toBeInTheDocument();
    expect(screen.getByText('Spec modified (reconciling)')).toBeInTheDocument();

    fireEvent.click(screen.getByText('failed-rule'));
    expect(onRuleClickMock).toHaveBeenCalledWith('failed-rule');

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.keyDown(buttons[0], { key: 'Enter' });
    expect(onRuleClickMock).toHaveBeenCalledWith('failed-rule');
  });
  it('excludes failed nodes when calculating taintsPresent on attention cards', () => {
    const mockAttentionRules = [
      {
        metadata: { name: 'overlap-attention-rule' },
        spec: { dryRun: false },
        status: {
          failedNodes: [{ nodeName: 'node-1', reason: 'Error' }],
          nodeEvaluations: [{ nodeName: 'node-1', taintStatus: 'Present' }],
        },
      },
    ];

    render(
      <RulesAttentionSection
        totalRules={1}
        rulesNeedingAttention={mockAttentionRules}
        onRuleClick={vi.fn()}
      />
    );

    expect(screen.getByText('overlap-attention-rule')).toBeInTheDocument();
    expect(screen.getByText('1 node evaluation error')).toBeInTheDocument();
    expect(screen.queryByText(/taint present/i)).toBeNull();
  });
});
