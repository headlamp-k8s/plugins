import type { AgentThinkingStep } from '@headlamp-k8s/ai-common/agents/types';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import AgentThinkingSteps from './AgentThinkingSteps';
import {
  completedSteps,
  executingSteps,
  initSteps,
  planningSteps,
} from './AgentThinkingSteps.stories';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options
        ? key.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options[name] ?? ''))
        : key,
  }),
}));

vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: { icon: string }) => <span aria-hidden="true" data-icon={icon} />,
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('AgentThinkingSteps rendering and phases', () => {
  it('renders nothing without steps', () => {
    const { container } = render(<AgentThinkingSteps steps={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders running Storybook phases, translated counts, statuses, and passes axe', async () => {
    render(
      <main>
        <AgentThinkingSteps steps={[...initSteps, ...planningSteps, ...executingSteps]} isRunning />
      </main>
    );

    expect(screen.getByRole('status').textContent).toContain('Agent working…');
    expect(screen.getAllByText('2 steps')).toHaveLength(2);
    expect(screen.getByText('4 steps')).toBeTruthy();
    expect(screen.getByText('Gather network policies')).toBeTruthy();
    expect(screen.getByText('Review recent events')).toBeTruthy();
    await expect(runAxe()).resolves.toEqual([]);
  });

  it('renders completed Storybook data with completed labels', async () => {
    render(
      <main>
        <AgentThinkingSteps steps={completedSteps} isRunning={false} />
      </main>
    );

    expect(screen.getByRole('status').textContent).toContain('Done');
    expect(screen.getByRole('button', { name: /Toggle Initialized/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Toggle All tasks complete/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Toggle Execution complete/ })).toBeTruthy();
    await expect(runAxe()).resolves.toEqual([]);
  });

  it('toggles a phase with the native keyboard button behavior', () => {
    render(<AgentThinkingSteps steps={initSteps} />);
    const phase = screen.getByRole('button', { name: 'Toggle Initialized: 2 steps' });

    expect(phase.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(phase);
    expect(phase.getAttribute('aria-expanded')).toBe('false');
    fireEvent.keyDown(phase, { key: 'Enter' });
    fireEvent.click(phase);
    expect(phase.getAttribute('aria-expanded')).toBe('true');
  });

  it('auto-collapses initialization when planning starts but keeps planning expanded', async () => {
    const { rerender } = render(<AgentThinkingSteps steps={initSteps} />);
    expect(
      screen
        .getByRole('button', { name: 'Toggle Initialized: 2 steps' })
        .getAttribute('aria-expanded')
    ).toBe('true');

    rerender(<AgentThinkingSteps steps={[...initSteps, planningSteps[0]]} />);
    await waitFor(() =>
      expect(
        screen
          .getByRole('button', { name: 'Toggle Initialized: 2 steps' })
          .getAttribute('aria-expanded')
      ).toBe('false')
    );

    rerender(<AgentThinkingSteps steps={[...initSteps, ...planningSteps, executingSteps[0]]} />);
    expect(
      screen.getByRole('button', { name: /Toggle Tasks: 4 steps/ }).getAttribute('aria-expanded')
    ).toBe('true');
  });

  it('falls back to the executing phase for malformed runtime phase data', () => {
    const malformedSteps: AgentThinkingStep[] = JSON.parse(
      '[{"id":99,"label":"Unexpected phase","status":"running","phase":"unknown","timestamp":1}]'
    );

    render(<AgentThinkingSteps steps={malformedSteps} />);

    expect(screen.getByRole('button', { name: 'Toggle Executing: 1 step' })).toBeTruthy();
    expect(screen.getByText('Unexpected phase')).toBeTruthy();
  });
});

describe('AgentThinkingSteps scrolling', () => {
  function renderInScroller(steps: AgentThinkingStep[]) {
    const result = render(
      <div data-testid="scroller" style={{ overflowY: 'auto', height: 100 }}>
        <AgentThinkingSteps steps={steps} />
      </div>
    );
    const scroller = screen.getByTestId('scroller');
    const scrollTo = vi.fn();
    Object.defineProperties(scroller, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 500 },
      scrollTop: { configurable: true, writable: true, value: 400 },
      scrollTo: { configurable: true, value: scrollTo },
    });
    return { ...result, scroller, scrollTo };
  }

  it('smoothly scrolls new progress when the user remains near the bottom', () => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: false })),
    });
    const { scrollTo } = renderInScroller(initSteps);

    act(() => vi.advanceTimersByTime(350));

    expect(scrollTo).toHaveBeenCalledWith({ top: 400, behavior: 'smooth' });
  });

  it('uses non-animated scrolling for reduced motion', () => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: true })),
    });
    const { scrollTo } = renderInScroller(initSteps);

    act(() => vi.advanceTimersByTime(350));

    expect(scrollTo).toHaveBeenCalledWith({ top: 400, behavior: 'auto' });
  });

  it('does not move a user who has scrolled away from the bottom', () => {
    vi.useFakeTimers();
    const { scroller, scrollTo } = renderInScroller(initSteps);
    Object.defineProperty(scroller, 'scrollTop', { configurable: true, value: 0 });

    act(() => vi.advanceTimersByTime(350));

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
