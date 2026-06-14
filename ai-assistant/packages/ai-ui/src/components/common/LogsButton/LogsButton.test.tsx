import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import LogsButton from './LogsButton';
import {
  defaultLogsButtonArgs,
  emptyLogsButtonArgs,
  resourceLogsButtonArgs,
} from './LogsButton.stories';

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

vi.mock('../LogsDialog/LogsDialog', () => ({
  default: ({
    open,
    onClose,
    logs,
    title,
    resourceName,
    DialogSlot,
  }: {
    open: boolean;
    onClose: () => void;
    logs: string;
    title: string;
    resourceName: string;
    DialogSlot: React.ElementType;
  }) =>
    open ? (
      <DialogSlot open={open} onClose={onClose} aria-label="Log viewer">
        <section aria-label="Log viewer">
          <h2>{title}</h2>
          <output>{resourceName}</output>
          <pre>{logs}</pre>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </section>
      </DialogSlot>
    ) : null,
}));

afterEach(cleanup);

function AccessibleDialog({ children }: PropsWithChildren): React.ReactElement {
  return (
    <section role="dialog" aria-label="Log viewer">
      {children}
    </section>
  );
}

it('renders translated fallback resource metadata, opens and closes logs, and passes axe', async () => {
  render(
    <main>
      <LogsButton {...defaultLogsButtonArgs} DialogSlot={AccessibleDialog} />
    </main>
  );

  expect(screen.getByText('Resource resource Logs')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'View in Editor' }));

  const viewer = screen.getByRole('region', { name: 'Log viewer' });
  expect(viewer.querySelector('pre')?.textContent).toBe(defaultLogsButtonArgs.logs);
  await expect(runAxe()).resolves.toEqual([]);

  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(screen.queryByRole('region', { name: 'Log viewer' })).toBeNull());
});

it('builds the complete title from the resource Storybook metadata', () => {
  render(<LogsButton {...resourceLogsButtonArgs} />);

  expect(screen.getByText('Pod nginx-pod (container: nginx) Logs')).toBeTruthy();
});

it('opens the empty logs story without losing the empty payload', () => {
  render(<LogsButton {...emptyLogsButtonArgs} />);
  fireEvent.click(screen.getByRole('button', { name: 'View in Editor' }));

  expect(screen.getByRole('region', { name: 'Log viewer' }).querySelector('pre')?.textContent).toBe(
    ''
  );
});

it('forwards a custom dialog slot', () => {
  const slotProps = vi.fn();
  function CustomDialog({
    children,
    open,
  }: PropsWithChildren<{ open?: boolean }>): React.ReactElement {
    slotProps({ open });
    return <aside data-testid="custom-dialog">{children}</aside>;
  }

  render(<LogsButton {...defaultLogsButtonArgs} DialogSlot={CustomDialog} />);
  fireEvent.click(screen.getByRole('button', { name: 'View in Editor' }));

  expect(screen.getByTestId('custom-dialog')).toBeTruthy();
  expect(slotProps).toHaveBeenCalledWith({ open: true });
});
