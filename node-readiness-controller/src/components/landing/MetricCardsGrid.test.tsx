/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MetricCardsGrid from './MetricCardsGrid';

describe('MetricCardsGrid', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders all four metric cards with provided values and responds to click', () => {
    const onCardClickMock = vi.fn();
    render(
      <MetricCardsGrid
        totalRules={8}
        rulesWithTaintsPresent={2}
        rulesWithEvaluationErrors={1}
        reconcilingRules={3}
        onCardClick={onCardClickMock}
      />
    );

    expect(screen.getByText('Total Rules')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();

    expect(screen.getByText('Taints Present')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Rules actively applying taints')).toBeInTheDocument();

    expect(screen.getByText('Evaluation Errors')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    expect(screen.getByText('Reconciling')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Total Rules'));
    expect(onCardClickMock).toHaveBeenCalledTimes(1);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(4);
    // Verify describeChild preserves the accessible name of the card with a tooltip (Reconciling card)
    expect(buttons[3]).toHaveAccessibleName(/reconciling/i);

    fireEvent.keyDown(buttons[0], { key: 'Enter' });
    expect(onCardClickMock).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(buttons[1], { key: ' ' });
    expect(onCardClickMock).toHaveBeenCalledTimes(3);
  });
});
