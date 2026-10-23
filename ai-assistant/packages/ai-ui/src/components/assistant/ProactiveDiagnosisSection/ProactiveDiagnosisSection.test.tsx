import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import type { DiagnosisContentRendererProps } from './ProactiveDiagnosisSection';
import ProactiveDiagnosisSection from './ProactiveDiagnosisSection';
import {
  baseDiagnosisArgs,
  completedDiagnosesArgs,
  createDiagnosis,
  failureDiagnosisArgs,
  runningCycleArgs,
} from './ProactiveDiagnosisSection.stories';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const pluralKey =
        Number(options?.count) === 1
          ? key
          : key.replace('{{completed}}/{{total}} event', '{{completed}}/{{total}} events');
      return options
        ? pluralKey.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options[name] ?? ''))
        : pluralKey;
    },
  }),
}));
vi.mock('@iconify/react', () => ({
  Icon: ({ icon, ...props }: { icon: string; 'aria-hidden'?: boolean | 'true' | 'false' }) => (
    <span data-icon={icon} {...props} />
  ),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function ContentRenderer({ content, onYamlDetected }: DiagnosisContentRendererProps) {
  return (
    <div>
      <span>{content}</span>
      {onYamlDetected && (
        <button onClick={() => onYamlDetected('kind: Pod', 'Pod')}>Apply YAML</button>
      )}
    </div>
  );
}

function expandDiagnoses() {
  for (const button of screen.getAllByRole('button', { name: /^(Pod|Deployment|Job)\// })) {
    fireEvent.click(button);
  }
}

it('distinguishes waiting for a check from finding no warning events', () => {
  const { rerender } = render(<ProactiveDiagnosisSection {...baseDiagnosisArgs} />);
  expect(screen.getByText('Waiting for the first event check.', { selector: 'p' })).toBeTruthy();
  expect(screen.queryByText('No warning events found in this scope.')).toBeNull();
  rerender(
    <ProactiveDiagnosisSection {...baseDiagnosisArgs} lastCheckedAt={0} warningEventCount={0} />
  );
  expect(
    screen.getByText('No warning events found in this scope.', { selector: 'p' })
  ).toBeTruthy();
  rerender(
    <ProactiveDiagnosisSection {...baseDiagnosisArgs} lastCheckedAt={1} warningEventCount={3} />
  );
  expect(screen.getByText('No diagnoses to display.', { selector: 'p' })).toBeTruthy();
  expect(screen.queryByText('No warning events found in this scope.')).toBeNull();
  rerender(
    <ProactiveDiagnosisSection {...baseDiagnosisArgs} lastCheckedAt={1} checkError="Forbidden" />
  );
  expect(screen.getByRole('alert').textContent).toBe('Forbidden');
  expect(screen.queryByText('No warning events found in this scope.')).toBeNull();
});

it.each([
  { isPaused: true, isCycleRunning: false, expected: 'Background analysis paused' },
  { isPaused: true, isCycleRunning: true, expected: 'Paused. The current analysis will finish.' },
  { isPaused: false, isCycleRunning: true, expected: 'Proactive diagnosis is running' },
  { isPaused: false, isCycleRunning: false, expected: 'Waiting for the first event check.' },
  { lastCheckedAt: 0, warningEventCount: 0, expected: 'No warning events found in this scope.' },
  { lastCheckedAt: 1, warningEventCount: 3, expected: 'No diagnoses to display.' },
  { checkError: 'Forbidden', expected: 'Event check failed: Forbidden' },
  { checkError: 'Forbidden', isPaused: true, expected: 'Event check failed: Forbidden' },
])('exposes accurate empty-state status: $expected', ({ expected, ...state }) => {
  render(<ProactiveDiagnosisSection {...baseDiagnosisArgs} {...state} />);
  expect(screen.getByRole('status').textContent).toBe(expected);
});

it('renders a labeled running section, progress, pending rows, and passes axe', async () => {
  render(
    <main>
      <ProactiveDiagnosisSection {...runningCycleArgs} />
    </main>
  );
  expect(screen.getByRole('region', { name: 'AI diagnoses' })).toBeTruthy();
  expect(screen.getByRole('progressbar', { name: 'Proactive diagnosis progress' })).toBeTruthy();
  expect(screen.getByText('Diagnosing…')).toBeTruthy();
  expect(screen.getByText('Queued')).toBeTruthy();
  expect(screen.getByText('0/2 processed')).toBeTruthy();
  expect(screen.getByRole('status').textContent).toBe(
    'Diagnosis for Pod nginx-7b6c9f5d4d-rx2jm: Diagnosing…'
  );
  await expect(runAxe()).resolves.toEqual([]);
});

it('announces concise diagnosis status changes without wrapping interactive rows', () => {
  const { rerender } = render(
    <ProactiveDiagnosisSection
      {...baseDiagnosisArgs}
      diagnoses={[createDiagnosis({ loading: true })]}
      isCycleRunning
    />
  );
  expect(screen.getByRole('status').textContent).toContain('Diagnosing…');

  rerender(
    <ProactiveDiagnosisSection
      {...baseDiagnosisArgs}
      diagnoses={[createDiagnosis({ loading: false, diagnosis: 'Resolved' })]}
    />
  );
  expect(screen.getByRole('status').textContent).toContain('Analysis ready');
  expect(screen.getByRole('status').querySelector('button')).toBeNull();
});

it('expands active thinking, labels progress, and renders all step types', () => {
  const diagnosis = createDiagnosis({
    loading: true,
    thinkingSteps: [
      { id: '1', content: 'Tool start: kubernetes_api_request', type: 'tool-start', timestamp: 1 },
      { id: '2', content: 'Tool finished', type: 'tool-result', timestamp: 2 },
      { id: '3', content: 'Updating plan', type: 'todo-update', timestamp: 3 },
      { id: '4', content: 'Inspecting', type: 'intermediate-text', timestamp: 4 },
    ],
  });
  render(
    <ProactiveDiagnosisSection {...baseDiagnosisArgs} diagnoses={[diagnosis]} isCycleRunning />
  );
  expandDiagnoses();
  expect(screen.getByRole('progressbar', { name: 'Diagnosis thinking progress' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Thinking/ }));
  for (const label of ['Tool call', 'Tool result', 'Plan update', 'Intermediate']) {
    expect(screen.getByText(label)).toBeTruthy();
  }
});

it('shows event details when active diagnosis has no steps', () => {
  render(
    <ProactiveDiagnosisSection
      {...baseDiagnosisArgs}
      diagnoses={[createDiagnosis({ loading: true, thinkingSteps: [] })]}
      isCycleRunning
    />
  );
  expandDiagnoses();
  fireEvent.click(screen.getByRole('button', { name: /Thinking/ }));
  expect(screen.getByText(/Diagnosing Pod\/nginx/)).toBeTruthy();
  expect(screen.getByText(/Reason: BackOff/)).toBeTruthy();
});

it('renders captured steps and diagnosis answer through the content slot', () => {
  render(
    <ProactiveDiagnosisSection {...completedDiagnosesArgs} ContentRendererSlot={ContentRenderer} />
  );
  expect(screen.getByText('Analysis ready')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /^Diagnosis/ })).toBeNull();
  expandDiagnoses();
  expect(screen.getByRole('button', { name: /Diagnosis/ }).getAttribute('aria-expanded')).toBe(
    'true'
  );
  expect(screen.getByText(/crash looping/)).toBeTruthy();
});

it('renders parsed thinking fallback with translated tool-call count', () => {
  render(
    <ProactiveDiagnosisSection
      {...baseDiagnosisArgs}
      diagnoses={[createDiagnosis({ diagnosis: '🔧 tool one\n🔧 tool two\n\nFinal answer' })]}
      ContentRendererSlot={ContentRenderer}
    />
  );
  expandDiagnoses();
  expect(screen.getByText('2 tool calls')).toBeTruthy();
  expect(screen.getByText('Final answer')).toBeTruthy();
});

it('renders failure details in an expanded section', () => {
  render(<ProactiveDiagnosisSection {...failureDiagnosisArgs} />);
  expandDiagnoses();
  expect(
    screen.getByRole('button', { name: /Diagnosis failed/ }).getAttribute('aria-expanded')
  ).toBe('true');
  expect(screen.getByText(/timed out/)).toBeTruthy();
});

it('forwards detected YAML with a translated action title', () => {
  const onYamlAction = vi.fn();
  render(
    <ProactiveDiagnosisSection
      {...baseDiagnosisArgs}
      diagnoses={[createDiagnosis({ diagnosis: 'Answer' })]}
      ContentRendererSlot={ContentRenderer}
      onYamlAction={onYamlAction}
    />
  );
  expandDiagnoses();
  fireEvent.click(screen.getByRole('button', { name: 'Apply YAML' }));
  expect(onYamlAction).toHaveBeenCalledWith('kind: Pod', 'Apply Pod', 'Pod', false, 'demo-cluster');
});

it('keeps YAML renderer callbacks stable across host rerenders while invoking the latest action', () => {
  const callbacks: Array<DiagnosisContentRendererProps['onYamlDetected']> = [];
  function Renderer(props: DiagnosisContentRendererProps) {
    callbacks.push(props.onYamlDetected);
    return <button onClick={() => props.onYamlDetected?.('kind: Pod', 'Pod')}>Review YAML</button>;
  }
  const first = vi.fn();
  const latest = vi.fn();
  const props = {
    ...baseDiagnosisArgs,
    diagnoses: [createDiagnosis({ diagnosis: 'Answer' })],
    ContentRendererSlot: Renderer,
  };
  const { rerender } = render(<ProactiveDiagnosisSection {...props} onYamlAction={first} />);
  expandDiagnoses();
  rerender(<ProactiveDiagnosisSection {...props} onYamlAction={latest} />);
  expect(callbacks.at(-1)).toBe(callbacks[0]);
  fireEvent.click(screen.getByRole('button', { name: 'Review YAML' }));
  expect(first).not.toHaveBeenCalled();
  expect(latest).toHaveBeenCalledWith('kind: Pod', 'Apply Pod', 'Pod', false, 'demo-cluster');
});

it('shows paused state, scope, failures, and recovery actions without claiming resource health', () => {
  const onPauseToggle = vi.fn();
  const onRetry = vi.fn();
  const onDismiss = vi.fn();
  render(
    <ProactiveDiagnosisSection
      {...failureDiagnosisArgs}
      isPaused
      clusters={['cluster-a', 'cluster-b']}
      onPauseToggle={onPauseToggle}
      onRetry={onRetry}
      onDismiss={onDismiss}
    />
  );
  expect(screen.getByText('Clusters: cluster-a, cluster-b')).toBeTruthy();
  expect(screen.getByText('0 ready, 1 failed')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Resume background analysis' }));
  fireEvent.click(screen.getByRole('button', { name: 'Retry failed analyses' }));
  fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
  expect(onPauseToggle).toHaveBeenCalledOnce();
  expect(onRetry).toHaveBeenCalledWith('event-3');
  expect(onDismiss).toHaveBeenCalledWith('event-3');
  expect(screen.queryByText('Resolved')).toBeNull();
});

it('retains a missing scroll target until its card mounts, expands, and receives focus', async () => {
  Element.prototype.scrollIntoView = vi.fn();
  const onScrollComplete = vi.fn();
  const { rerender } = render(
    <ProactiveDiagnosisSection
      {...baseDiagnosisArgs}
      diagnoses={[]}
      scrollToEventUid="event-1"
      onScrollComplete={onScrollComplete}
    />
  );
  expect(onScrollComplete).not.toHaveBeenCalled();
  rerender(
    <ProactiveDiagnosisSection
      {...baseDiagnosisArgs}
      diagnoses={[createDiagnosis()]}
      scrollToEventUid="event-1"
      onScrollComplete={onScrollComplete}
    />
  );
  await waitFor(() => expect(onScrollComplete).toHaveBeenCalledOnce());
  expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  const button = screen.getByRole('button', { name: /^Pod\// });
  expect(vi.mocked(Element.prototype.scrollIntoView).mock.contexts).toEqual([button]);
  expect(button.getAttribute('aria-expanded')).toBe('true');
  expect(document.activeElement).toBe(button);
});

it('disables chevron transitions for reduced motion', () => {
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
  const { container } = render(<ProactiveDiagnosisSection {...failureDiagnosisArgs} />);
  expandDiagnoses();
  expect(
    container.querySelector('[data-icon="mdi:chevron-right"]')?.getAttribute('style')
  ).toContain('transition: none');
});
