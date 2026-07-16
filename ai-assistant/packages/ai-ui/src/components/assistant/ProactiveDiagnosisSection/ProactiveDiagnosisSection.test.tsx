import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

it('renders nothing when idle and no diagnoses exist', () => {
  const { container } = render(<ProactiveDiagnosisSection {...baseDiagnosisArgs} />);
  expect(container.childElementCount).toBe(0);
});

it('renders a labeled running section, progress, pending rows, and passes axe', async () => {
  render(
    <main>
      <ProactiveDiagnosisSection {...runningCycleArgs} />
    </main>
  );
  expect(screen.getByRole('region', { name: 'Proactive Diagnosis' })).toBeTruthy();
  expect(screen.getByRole('progressbar', { name: 'Proactive diagnosis progress' })).toBeTruthy();
  expect(screen.getByText('Diagnosing…')).toBeTruthy();
  expect(screen.getByText('Queued')).toBeTruthy();
  expect(screen.getByText('0/2 events')).toBeTruthy();
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
  expect(screen.getByRole('status').textContent).toContain('Completed');
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
  fireEvent.click(screen.getByRole('button', { name: /Thinking/ }));
  expect(screen.getByText(/Diagnosing Pod\/nginx/)).toBeTruthy();
  expect(screen.getByText(/Reason: BackOff/)).toBeTruthy();
});

it('renders captured steps and diagnosis answer through the content slot', () => {
  render(
    <ProactiveDiagnosisSection {...completedDiagnosesArgs} ContentRendererSlot={ContentRenderer} />
  );
  expect(screen.getByText('Completed')).toBeTruthy();
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
  expect(screen.getByText('2 tool calls')).toBeTruthy();
  expect(screen.getByText('Final answer')).toBeTruthy();
});

it('renders failure details in an expanded section', () => {
  render(<ProactiveDiagnosisSection {...failureDiagnosisArgs} />);
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
  fireEvent.click(screen.getByRole('button', { name: 'Apply YAML' }));
  expect(onYamlAction).toHaveBeenCalledWith('kind: Pod', 'Apply Pod', 'Pod', false);
});

it('scrolls to requested events and completes even when the UID is missing', () => {
  vi.useFakeTimers();
  Element.prototype.scrollIntoView = vi.fn();
  const onScrollComplete = vi.fn();
  const { rerender } = render(
    <ProactiveDiagnosisSection
      {...baseDiagnosisArgs}
      diagnoses={[createDiagnosis()]}
      scrollToEventUid="event-1"
      onScrollComplete={onScrollComplete}
    />
  );
  vi.advanceTimersByTime(300);
  expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  rerender(
    <ProactiveDiagnosisSection
      {...baseDiagnosisArgs}
      diagnoses={[createDiagnosis()]}
      scrollToEventUid="missing"
      onScrollComplete={onScrollComplete}
    />
  );
  vi.advanceTimersByTime(300);
  expect(onScrollComplete).toHaveBeenCalledTimes(2);
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
  expect(
    container.querySelector('[data-icon="mdi:chevron-right"]')?.getAttribute('style')
  ).toContain('transition: none');
});
