import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import TermsDialog from './TermsDialog';
import { closedTermsArgs, openTermsArgs } from './TermsDialog.stories';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@iconify/react', () => ({
  Icon: ({ icon, ...props }: { icon: string; 'aria-hidden'?: boolean | 'true' | 'false' }) => (
    <span data-icon={icon} {...props} />
  ),
}));

afterEach(cleanup);

function DismissibleTermsDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open terms
      </button>
      <TermsDialog {...openTermsArgs} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

it('renders the open Storybook fixture with one heading and no axe violations', async () => {
  render(
    <main>
      <TermsDialog {...openTermsArgs} />
    </main>
  );
  expect(
    screen.getByRole('heading', { name: 'AI Assistant Terms & Important Information' })
  ).toBeTruthy();
  expect(screen.getAllByRole('heading')).toHaveLength(1);
  expect(screen.getByRole('note')).toBeTruthy();
  expect(
    screen.getByRole('checkbox', { name: 'I understand and accept these terms.' })
  ).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Accept & Continue' })).toHaveProperty(
    'disabled',
    true
  );
  await expect(runAxe()).resolves.toEqual([]);
});

it('renders no dialog for the closed Storybook fixture', () => {
  render(<TermsDialog {...closedTermsArgs} />);
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('requires acknowledgement before accepting and calls each action once', () => {
  const onAccept = vi.fn();
  const onClose = vi.fn();
  render(<TermsDialog {...openTermsArgs} onAccept={onAccept} onClose={onClose} />);
  const accept = screen.getByRole('button', { name: 'Accept & Continue' });
  fireEvent.click(accept);
  expect(onAccept).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('checkbox', { name: 'I understand and accept these terms.' }));
  fireEvent.click(accept);
  fireEvent.click(accept);
  expect(onAccept).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('resets acknowledgement after close and reopen', () => {
  const { rerender } = render(<TermsDialog {...openTermsArgs} />);
  fireEvent.click(screen.getByRole('checkbox', { name: 'I understand and accept these terms.' }));
  expect(screen.getByRole('button', { name: 'Accept & Continue' })).toHaveProperty(
    'disabled',
    false
  );
  rerender(<TermsDialog {...closedTermsArgs} />);
  rerender(<TermsDialog {...openTermsArgs} />);
  expect(
    screen.getByRole('checkbox', { name: 'I understand and accept these terms.' })
  ).toHaveProperty('checked', false);
  expect(screen.getByRole('button', { name: 'Accept & Continue' })).toHaveProperty(
    'disabled',
    true
  );
});

it('supports keyboard acknowledgement', async () => {
  const user = userEvent.setup();
  render(<TermsDialog {...openTermsArgs} />);
  const checkbox = screen.getByRole('checkbox', { name: 'I understand and accept these terms.' });
  checkbox.focus();
  await user.keyboard(' ');
  expect(checkbox).toHaveProperty('checked', true);
  expect(screen.getByRole('button', { name: 'Accept & Continue' })).toHaveProperty(
    'disabled',
    false
  );
});

it('closes on Escape and restores focus to the opening control', async () => {
  const user = userEvent.setup();
  render(<DismissibleTermsDialog />);
  const opener = screen.getByRole('button', { name: 'Open terms' });
  await user.click(opener);
  expect(screen.getByRole('dialog')).toBeTruthy();
  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(document.activeElement).toBe(opener);
});
