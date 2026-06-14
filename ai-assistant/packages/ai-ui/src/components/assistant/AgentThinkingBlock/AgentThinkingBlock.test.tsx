import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import AgentThinkingBlock, { type ThinkingStep } from './AgentThinkingBlock';
import {
  activeWithToolCallsArgs,
  completedWithStepsArgs,
  emptyStepsArgs,
  planUpdateArgs,
  singleStepArgs,
} from './AgentThinkingBlock.stories';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options
        ? key.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options[name] ?? ''))
        : key,
  }),
}));

vi.mock('@iconify/react', () => ({
  Icon: ({ icon, ...props }: { icon: string; 'aria-hidden'?: boolean | 'true' | 'false' }) => (
    <span data-icon={icon} {...props} />
  ),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function step(type: ThinkingStep['type'], content: string): ThinkingStep {
  return { id: `${type}-${content}`, type, content, timestamp: 1 };
}

it('renders nothing without activity steps', () => {
  const { container } = render(<AgentThinkingBlock {...emptyStepsArgs} />);
  expect(container.childElementCount).toBe(0);
});

it('uses a native expandable control and exposes active progress without axe violations', async () => {
  render(
    <main>
      <AgentThinkingBlock {...activeWithToolCallsArgs} />
    </main>
  );
  const toggle = screen.getByRole('button', { name: /Thinking/ });

  expect(toggle.tagName).toBe('BUTTON');
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  expect(screen.getByRole('progressbar', { name: 'Agent thinking progress' })).toBeTruthy();
  fireEvent.click(toggle);
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByText('Analyzing pod statuses and checking for errors...')).toBeTruthy();
  await expect(runAxe()).resolves.toEqual([]);
});

it('disables chevron animation when reduced motion is requested', () => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
  const { container } = render(<AgentThinkingBlock {...singleStepArgs} />);

  expect(
    container.querySelector('[data-icon="mdi:chevron-right"]')?.getAttribute('style')
  ).toContain('transition: none');
});

it('renders completed plural and singular summaries', () => {
  const { rerender } = render(<AgentThinkingBlock {...completedWithStepsArgs} />);
  expect(screen.getByText('Used 5 steps')).toBeTruthy();
  expect(screen.queryByRole('progressbar')).toBeNull();

  rerender(<AgentThinkingBlock {...singleStepArgs} isActive={false} />);
  expect(screen.getByText('Used 1 step')).toBeTruthy();
});

it.each([
  [step('tool-start', 'Tool start: kubernetes_api_request'), 'kubernetes_api_request…'],
  [step('tool-start', 'Starting tool'), 'Calling tool…'],
  [step('tool-result', 'Tool kubernetes_api_request completed'), 'kubernetes_api_request done'],
  [step('tool-result', 'Result received'), 'Tool done'],
  [planUpdateArgs.steps[0], 'Updating plan…'],
  [step('intermediate-text', 'Inspecting resources'), 'Thinking…'],
] as const)('summarizes the latest activity step', (latestStep, expected) => {
  render(<AgentThinkingBlock steps={[latestStep]} isActive />);
  expect(screen.getAllByText(expected).length).toBeGreaterThan(0);
});
