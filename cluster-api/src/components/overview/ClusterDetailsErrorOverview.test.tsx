import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InlineSolutionPanel } from './ClusterDetailsErrorOverview';
import { ClusterPriorityError } from './clusterHealth';

vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: { icon: string }) => <span data-icon={icon} />,
}));

vi.mock('./capiUtils', async importOriginal => ({
  ...(await importOriginal<typeof import('./capiUtils')>()),
  copyToClipboard: vi.fn().mockResolvedValue(undefined),
}));

const priorityError: ClusterPriorityError = {
  errorDef: {
    id: 'test-error',
    title: 'Test error',
    description: 'A test error',
    severity: 'warning',
    matcher: {},
    solution: {
      steps: ['do a thing'],
      quickFixCommands: [
        { description: 'Fix A', command: 'kubectl apply -f a.yaml' },
        { description: 'Fix B', command: 'kubectl apply -f b.yaml' },
      ],
    },
  },
} as ClusterPriorityError;

function copyIconFor(command: string): string {
  const row = screen.getByText(command).closest('div')?.parentElement;
  return row!.querySelector('[data-icon]')!.getAttribute('data-icon')!;
}

describe('InlineSolutionPanel copy feedback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not clear a newer copy's checkmark when an older copy's timeout fires", async () => {
    render(<InlineSolutionPanel priorityError={priorityError} open />);

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // copy "Fix A"
    await vi.advanceTimersByTimeAsync(1000);
    fireEvent.click(buttons[1]); // copy "Fix B", within A's 1800ms window

    // A's original timeout fires now (1800ms after A's click); B's hasn't yet.
    await vi.advanceTimersByTimeAsync(800);

    expect(copyIconFor('kubectl apply -f a.yaml')).toBe('mdi:content-copy');
    expect(copyIconFor('kubectl apply -f b.yaml')).toBe('mdi:check');
  });
});
